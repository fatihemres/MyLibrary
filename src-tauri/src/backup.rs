use crate::db::{id, now, Result, Store};
use rusqlite::Connection;
use serde_json::json;
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};

const MAX_RESTORE_BYTES: u64 = 20 * 1024 * 1024 * 1024;
// V1/V2 manifests contain only fixed metadata, not a per-book/file inventory.
// 64 KiB leaves ample room beyond their few hundred bytes without allowing
// multi-megabyte manifest allocations. Apply at extraction AND parsing.
const MAX_MANIFEST_BYTES: u64 = 64 * 1024;
const MAX_ARCHIVE_FILES: usize = 100000;

fn extract_member(
    input: &mut impl Read,
    output: &mut impl Write,
    declared: u64,
    member_limit: u64,
    total: &mut u64,
    aggregate_limit: u64,
) -> Result<()> {
    let remaining = aggregate_limit
        .checked_sub(*total)
        .ok_or("Backup exceeds the expanded restore limit.")?;
    let budget = declared.min(member_limit).min(remaining);
    let mut actual = 0_u64;
    let mut buffer = [0_u8; 8192];
    loop {
        // At most one byte beyond the tightest remaining budget is decoded
        // to detect overflow. No over-budget bytes are ever written.
        let left = budget - actual;
        let request = if left >= buffer.len() as u64 {
            buffer.len()
        } else {
            left as usize + 1
        };
        let count = match input.read(&mut buffer[..request]) {
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            result => result?,
        };
        if count == 0 {
            if actual != declared {
                return Err("Backup member uncompressed size mismatch.".into());
            }
            // Reaching the ZIP reader's EOF also preserves its CRC check.
            return Ok(());
        }
        let next = actual.checked_add(count as u64).ok_or("Backup too large")?;
        let next_total = total.checked_add(count as u64).ok_or("Backup too large")?;
        if next > declared {
            return Err("Backup member uncompressed size mismatch.".into());
        }
        if next > member_limit {
            return Err("Backup member exceeds its extraction limit.".into());
        }
        if next_total > aggregate_limit {
            return Err("Backup exceeds the expanded restore limit.".into());
        }
        output.write_all(&buffer[..count])?;
        actual = next;
        *total = next_total;
    }
}

impl Store {
    pub fn backup(&self, destination: &Path) -> Result<()> {
        ensure_no_pending_restore(&self.root)?;
        if destination.exists() {
            return Err(
                "Choose a new backup filename; existing backups are never overwritten.".into(),
            );
        }
        let temp = self.root.join(format!(".snapshot-{}", id()));
        fs::create_dir(&temp)?;
        let result = (|| {
            let db = temp.join("library.sqlite3");
            self.conn()?.backup("main", &db, None)?;
            let snapshot =
                Connection::open_with_flags(&db, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
            snapshot.execute_batch("PRAGMA trusted_schema=OFF;")?;
            validate_media(&snapshot, &self.root).map_err(|e| format!("Source library is incomplete or has unsupported media paths; backup was not published: {e}"))?;
            drop(snapshot);
            let archive = temp.join("backup.zip");
            let mut zip = ZipWriter::new(File::create(&archive)?);
            let opts =
                SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
            let manifest = json!({"application":"MyLibrary","format":1,"schema":crate::migrations::CURRENT_SCHEMA,"app_version":env!("CARGO_PKG_VERSION"),"included_assets":["covers","attachments"],"created_at":now()}).to_string();
            let mut total = 0;
            let mut names = std::collections::HashSet::from([
                "manifest.json".to_string(),
                "library.sqlite3".to_string(),
            ]);
            zip.start_file("manifest.json", opts)?;
            write_backup_member(manifest.as_bytes(), &mut zip, &mut total)?;
            zip.start_file("library.sqlite3", opts)?;
            write_backup_member(File::open(db)?, &mut zip, &mut total)?;
            for folder in ["covers", "attachments"] {
                for entry in fs::read_dir(self.root.join(folder))? {
                    let entry = entry?;
                    let relative = format!(
                        "{folder}/{}",
                        entry.file_name().to_str().ok_or("Invalid media filename")?
                    );
                    let p = crate::db::safe_file(&self.root, &relative)?;
                    if p.is_file() {
                        if !names.insert(relative.to_lowercase()) || names.len() > MAX_ARCHIVE_FILES
                        {
                            return Err(
                                "Backup contains duplicate paths or too many files for restore."
                                    .into(),
                            );
                        }
                        zip.start_file(relative, opts)?;
                        write_backup_member(File::open(p)?, &mut zip, &mut total)?;
                    }
                }
            }
            zip.finish()?.sync_all()?;
            publish_backup(&mut File::open(archive)?, destination)
        })();
        let _ = fs::remove_dir_all(temp);
        result
    }
    pub fn restore(&self, source: &Path) -> Result<PathBuf> {
        ensure_no_pending_restore(&self.root)?;
        let stage = self.root.join(format!(".restore-{}", id()));
        fs::create_dir(&stage)?;
        let mut pending_created = false;
        let result = (|| {
            prepare_restore(source, &stage)?;
            let safety = self
                .root
                .join(format!("backups/before-restore-{}.zip", id()));
            self.backup(&safety)?;
            let safety_stage = self.root.join(format!(".restore-check-{}", id()));
            fs::create_dir(&safety_stage)?;
            let validation = prepare_restore(&safety, &safety_stage);
            let cleanup = fs::remove_dir_all(&safety_stage);
            validation.map_err(|e| {
                format!("The safety backup failed staged validation; live data is unchanged: {e}")
            })?;
            cleanup?;
            checkpoint(&self.conn()?)?;
            for folder in ["covers", "attachments"] {
                fs::create_dir_all(stage.join(folder))?;
                sync_directory(&stage.join(folder))?;
            }
            sync_directory(&stage)?;
            let previous = self.root.join(format!(".previous-{}", id()));
            fs::create_dir(&previous)?;
            let mut marker = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(self.root.join(PENDING_RESTORE))?;
            pending_created = true;
            marker.write_all(json!({"version":1,"stage":stage.file_name(),"previous":previous.file_name(),"safety":safety.strip_prefix(&self.root)?}).to_string().as_bytes())?;
            #[cfg(test)]
            recovery_tests::point("journal-sync")?;
            marker.sync_all()?;
            drop(marker);
            sync_directory(&self.root)?;
            let mut moved = Vec::new();
            let mut installed = Vec::new();
            let swap: Result<()> = (|| {
                #[cfg(test)]
                recovery_tests::point("before-move")?;
                for name in [
                    "library.sqlite3",
                    "library.sqlite3-wal",
                    "library.sqlite3-shm",
                    "covers",
                    "attachments",
                ] {
                    let path = self.root.join(name);
                    if path_present(&path)? {
                        #[cfg(test)]
                        recovery_tests::point(&format!("move:{name}"))?;
                        rename_unoccupied(&path, &previous.join(name))?;
                        moved.push(name);
                        #[cfg(test)]
                        recovery_tests::point(&format!("moved:{name}"))?;
                    }
                }
                sync_directory(&previous)?;
                sync_directory(&self.root)?;
                for name in ["library.sqlite3", "covers", "attachments"] {
                    #[cfg(test)]
                    recovery_tests::point(&format!("install:{name}"))?;
                    rename_unoccupied(&stage.join(name), &self.root.join(name))?;
                    installed.push(name);
                    #[cfg(test)]
                    recovery_tests::point(&format!("installed:{name}"))?;
                }
                sync_directory(&stage)?;
                sync_directory(&self.root)?;
                Ok(())
            })();
            if let Err(error) = swap {
                let mut errors = vec![format!("Restore failed: {error}")];
                for name in installed.into_iter().rev() {
                    #[cfg(test)]
                    let undo = recovery_tests::point(&format!("undo-install:{name}"))
                        .and_then(|()| rename_unoccupied(&self.root.join(name), &stage.join(name)));
                    #[cfg(not(test))]
                    let undo = rename_unoccupied(&self.root.join(name), &stage.join(name));
                    if let Err(e) = undo {
                        errors.push(format!("Rollback installed {name}: {e}"));
                    }
                }
                for name in moved {
                    let undo: Result<()> = (|| {
                        // Never pair old sidecars with an installed DB that could not be evacuated.
                        if name != "library.sqlite3"
                            && name.starts_with("library.sqlite3")
                            && path_present(&previous.join("library.sqlite3"))?
                        {
                            return Err("Original DB is still in previous generation; sidecar retained beside it.".into());
                        }
                        #[cfg(test)]
                        recovery_tests::point(&format!("undo-move:{name}"))?;
                        rename_unoccupied(&previous.join(name), &self.root.join(name))
                    })();
                    if let Err(e) = undo {
                        errors.push(format!("Rollback previous {name}: {e}"));
                    }
                }
                errors.push("Restore recovery is pending. Preserve .restore-pending, staging, previous generation and safety backup for inspection; rollback is not certified complete.".into());
                return Err(errors.join("\n").into());
            }
            #[cfg(test)]
            recovery_tests::point("marker-remove")?;
            fs::remove_file(self.root.join(PENDING_RESTORE))?;
            sync_directory(&self.root)?;
            #[cfg(test)]
            recovery_tests::point("completed")?;
            // Keep the previous generation and safety ZIP; never purge automatically.
            Ok(safety)
        })();
        if result.is_ok() || !pending_created {
            let _ = fs::remove_dir_all(stage);
        }
        result.map_err(|e| {
            if pending_created {
                format!("{e}\nIf restore recovery remains pending, preserve all recovery artifacts and stop using this library.").into()
            } else { e }
        })
    }
    pub fn automatic_backup(&self) -> Result<Option<String>> {
        let c = self.conn()?;
        let get = |key: &str| -> String {
            c.query_row("SELECT value FROM settings WHERE key=?", [key], |r| {
                r.get(0)
            })
            .unwrap_or_default()
        };
        let days = get("backup_days").parse::<i64>().unwrap_or(0);
        if days <= 0 {
            return Ok(None);
        }
        let last = get("last_backup");
        if let Ok(t) = chrono::DateTime::parse_from_rfc3339(&last) {
            if chrono::Utc::now().signed_duration_since(t).num_days() < days {
                return Ok(None);
            }
        }
        let path = self.root.join(format!(
            "backups/automatic-{}-{}.zip",
            chrono::Local::now().format("%Y-%m-%d"),
            id()
        ));
        self.backup(&path)?;
        c.execute("INSERT INTO settings(key,value) VALUES('last_backup',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[now()])?;
        Ok(Some(path.to_string_lossy().into()))
    }
}
pub fn read_limited(path: &Path, max: u64) -> Result<Vec<u8>> {
    if fs::metadata(path)?.len() > max {
        return Err("File is too large.".into());
    }
    let mut bytes = Vec::new();
    File::open(path)?.take(max + 1).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max {
        return Err("File is too large.".into());
    }
    Ok(bytes)
}

// Compare schemas constructed by the same SQLite engine from the real supported
// DDL. This covers constraints/conflict policies, named/automatic indexes and
// the virtual table plus its shadow tables, not just an object-name allowlist.
#[derive(Debug, PartialEq, Eq)]
struct SchemaObject {
    kind: String,
    name: String,
    table: String,
    sql: Option<Vec<String>>,
}
fn schema_objects(c: &Connection) -> Result<Vec<SchemaObject>> {
    let mut stmt =
        c.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?,
        ))
    })?;
    rows.map(|row| {
        let (kind, name, table, sql) = row?;
        Ok(SchemaObject {
            kind,
            name,
            table,
            sql: sql.as_deref().map(sql_tokens).transpose()?,
        })
    })
    .collect()
}

/// A deliberately conservative lexical equivalence check, not a SQL rewriter.
/// Ignore only SQL whitespace/comments and bare-token ASCII case. Keep token
/// boundaries, operators and quoted text (including literal whitespace/case)
/// intact. The supported V1 DDL is frozen in tests; V2 uses that same baseline.
/// Hand-edited, semantically "equivalent" rewrites are not implicitly trusted.
fn sql_tokens(sql: &str) -> Result<Vec<String>> {
    let chars: Vec<char> = sql.chars().collect();
    let mut tokens = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        let start = i;
        let ch = chars[i];
        if matches!(ch, ' ' | '\t' | '\r' | '\n' | '\u{000c}') {
            i += 1;
        } else if ch == '-' && chars.get(i + 1) == Some(&'-') {
            i += 2;
            while i < chars.len() && chars[i] != '\n' {
                i += 1;
            }
        } else if ch == '/' && chars.get(i + 1) == Some(&'*') {
            i += 2;
            while i + 1 < chars.len() && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 >= chars.len() {
                return Err("Unterminated comment in backup schema.".into());
            }
            i += 2;
        } else if matches!(ch, '\'' | '"' | '`' | '[') {
            let close = if ch == '[' { ']' } else { ch };
            i += 1;
            loop {
                if i == chars.len() {
                    return Err("Unterminated quoted token in backup schema.".into());
                }
                if chars[i] == close {
                    i += 1;
                    if ch != '[' && chars.get(i) == Some(&close) {
                        i += 1;
                    } else {
                        break;
                    }
                } else {
                    i += 1;
                }
            }
            tokens.push(chars[start..i].iter().collect());
        } else if ch.is_ascii_alphanumeric() || ch == '_' || ch == '$' || !ch.is_ascii() {
            i += 1;
            while i < chars.len()
                && (chars[i].is_ascii_alphanumeric()
                    || chars[i] == '_'
                    || chars[i] == '$'
                    || !chars[i].is_ascii())
            {
                i += 1;
            }
            tokens.push(
                chars[start..i]
                    .iter()
                    .collect::<String>()
                    .to_ascii_lowercase(),
            );
        } else {
            i += 1;
            if i < chars.len() {
                let pair: String = chars[start..=i].iter().collect();
                if ["<=", ">=", "==", "!=", "<>", "||", "<<", ">>", "->"].contains(&pair.as_str()) {
                    i += 1;
                    if pair == "->" && chars.get(i) == Some(&'>') {
                        i += 1;
                    }
                }
            }
            tokens.push(chars[start..i].iter().collect());
        }
    }
    Ok(tokens)
}

pub fn validate_restore_schema(c: &Connection, schema_version: i64) -> Result<()> {
    let version: i64 = c.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if version != schema_version {
        return Err("Backup database schema version does not match.".into());
    }
    let reference = crate::migrations::restore_reference(schema_version)?;
    let mut required = schema_objects(&reference)?;
    // SQLite owns statistics DDL. Generate it on a TRUSTED database using the
    // bundled engine; only its exact additional definitions are optional.
    // This includes stat4 only if this engine actually creates it.
    reference.execute_batch("ANALYZE;")?;
    let statistics: Vec<_> = schema_objects(&reference)?
        .into_iter()
        .filter(|object| !required.contains(object))
        .collect();
    for object in schema_objects(c)? {
        if let Some(index) = required.iter().position(|expected| expected == &object) {
            required.remove(index);
        } else if !statistics.contains(&object) {
            if matches!(object.kind.as_str(), "trigger" | "view") {
                return Err(format!(
                    "Backup database contains unsupported schema objects ({} '{}' is not permitted).",
                    object.kind, object.name
                ).into());
            }
            return Err(format!(
                "Backup database contains unsupported {} '{}' or an altered definition.",
                object.kind, object.name
            )
            .into());
        }
    }
    if let Some(missing) = required.first() {
        return Err(format!(
            "Backup database is missing required schema object '{}'.",
            missing.name
        )
        .into());
    }
    Ok(())
}

#[cfg(test)]
mod extraction_tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn understated_member_decodes_only_one_detection_byte() {
        let mut input = Cursor::new(vec![0; 65536]);
        let mut output = Vec::new();
        let mut total = 0;
        assert!(
            extract_member(&mut input, &mut output, 1, 100000, &mut total, 100000)
                .unwrap_err()
                .to_string()
                .contains("size mismatch")
        );
        assert_eq!(input.position(), 2);
        assert!(output.len() <= 1);
        assert_eq!(total, output.len() as u64);
    }

    #[test]
    fn actual_aggregate_and_member_budgets_stop_before_excess_writes() {
        let mut total = 0;
        let mut output = Vec::new();
        extract_member(&mut Cursor::new(b"abc"), &mut output, 3, 10, &mut total, 5).unwrap();
        assert_eq!(total, 3);
        let mut second = Cursor::new(b"defg");
        let error = extract_member(&mut second, &mut output, 4, 10, &mut total, 5).unwrap_err();
        assert!(error.to_string().contains("expanded restore limit"));
        assert_eq!(second.position(), 3); // remaining aggregate + one probe
        assert!(output.len() <= 5);
        assert_eq!(total, output.len() as u64);

        let mut input = Cursor::new(b"abcdef");
        let mut output = Vec::new();
        assert!(extract_member(&mut input, &mut output, 6, 2, &mut 0, 100)
            .unwrap_err()
            .to_string()
            .contains("extraction limit"));
        assert_eq!(input.position(), 3);
        assert!(output.len() <= 2);
    }

    #[test]
    fn exact_budgets_empty_members_and_short_reads() {
        let mut total = 0;
        extract_member(
            &mut Cursor::new(b"abc"),
            &mut Vec::new(),
            3,
            3,
            &mut total,
            3,
        )
        .unwrap();
        extract_member(&mut Cursor::new(b""), &mut Vec::new(), 0, 3, &mut total, 3).unwrap();
        assert_eq!(total, 3);
        assert!(
            extract_member(&mut Cursor::new(b"ab"), &mut Vec::new(), 3, 3, &mut 0, 3)
                .unwrap_err()
                .to_string()
                .contains("size mismatch")
        );
    }

    #[test]
    fn manifest_read_is_bounded_independently_of_extraction() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        file.write_all(&vec![b' '; MAX_MANIFEST_BYTES as usize])
            .unwrap();
        assert_eq!(
            read_limited(file.path(), MAX_MANIFEST_BYTES).unwrap().len(),
            MAX_MANIFEST_BYTES as usize
        );
        file.write_all(b" ").unwrap();
        assert!(read_limited(file.path(), MAX_MANIFEST_BYTES).is_err());
    }
}

#[cfg(test)]
mod schema_token_tests {
    use super::sql_tokens;
    #[test]
    fn lexical_comparison_preserves_sql_meaning() {
        assert_eq!(
            sql_tokens("CREATE TABLE t(a TEXT /*comment*/ DEFAULT 'a B')").unwrap(),
            sql_tokens("create\n table t ( a text default 'a B' )").unwrap()
        );
        for (left, right) in [
            ("DEFAULT 'A'", "DEFAULT 'a'"),
            ("DEFAULT 'a b'", "DEFAULT 'ab'"),
            ("DEFAULT 'it''s'", "DEFAULT 'its'"),
            ("CHECK(a>=1)", "CHECK(a> =1)"),
            ("NOT NULL", "NOTNULL"),
            ("TEXT", "TEXT UNIQUE ON CONFLICT REPLACE"),
            ("DEFAULT '--x'", "DEFAULT ''"),
        ] {
            assert_ne!(sql_tokens(left).unwrap(), sql_tokens(right).unwrap());
        }
        assert!(sql_tokens("/* unfinished").is_err());
        assert!(sql_tokens("'unfinished").is_err());
    }
}

fn write_backup_member(input: impl Read, output: &mut impl Write, total: &mut u64) -> Result<()> {
    let remaining = MAX_RESTORE_BYTES
        .checked_sub(*total)
        .ok_or("Backup exceeds the 20 GB restore limit.")?;
    *total += std::io::copy(&mut input.take(remaining + 1), output)?;
    if *total > MAX_RESTORE_BYTES {
        return Err("Backup exceeds the 20 GB restore limit.".into());
    }
    Ok(())
}

fn publish_backup(input: &mut impl Read, destination: &Path) -> Result<()> {
    let parent = destination
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    let temp = parent.join(format!(".mylibrary-backup-{}.tmp", id()));
    let target = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temp)?;
    #[cfg(test)]
    let target = recovery_tests::DestinationWriter::new(target);
    let mut target = target;
    let result = (|| {
        std::io::copy(input, &mut target)?;
        target.sync_all()?;
        drop(target);
        #[cfg(test)]
        recovery_tests::point("publish")?;
        // Same-directory hard link is atomic and refuses an existing final name.
        fs::hard_link(&temp, destination).map_err(|e| format!("Could not publish backup without overwriting a file. Choose a destination filesystem supporting hard links: {e}"))?;
        sync_directory(parent)?;
        Ok(())
    })();
    let _ = fs::remove_file(&temp);
    result
}

const PENDING_RESTORE: &str = ".restore-pending";

fn path_present(path: &Path) -> Result<bool> {
    match fs::symlink_metadata(path) {
        Ok(_) => Ok(true),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(e) => Err(e.into()),
    }
}

pub(crate) fn ensure_no_pending_restore(root: &Path) -> Result<()> {
    let check = || -> Result<bool> {
        if path_present(&root.join(PENDING_RESTORE))? {
            return Ok(true);
        }
        if ["library.sqlite3", "covers", "attachments"]
            .iter()
            .all(|name| root.join(name).exists())
        {
            return Ok(false);
        }
        let entries = match fs::read_dir(root) {
            Ok(entries) => entries,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(false),
            Err(e) => return Err(e.into()),
        };
        for entry in entries {
            let name = entry?.file_name();
            let name = name.to_string_lossy();
            if name.starts_with(".previous-")
                || name.starts_with(".restore-")
                || (!path_present(&root.join("library.sqlite3"))?
                    && ["library.sqlite3-wal", "library.sqlite3-shm"].contains(&name.as_ref()))
            {
                return Ok(true);
            }
        }
        Ok(false)
    };
    if check().map_err(|e| format!("Cannot inspect restore recovery state: {e}"))? {
        return Err("Restore recovery is pending or uncertain. Preserve this library directory, .restore-pending, .previous-* and .restore-* files and safety backups for inspection. No new database will be created.".into());
    }
    Ok(())
}

fn rename_unoccupied(from: &Path, to: &Path) -> Result<()> {
    if path_present(to)? {
        return Err(format!("Recovery destination already exists: {}", to.display()).into());
    }
    fs::rename(from, to)?;
    Ok(())
}

fn sync_directory(path: &Path) -> Result<()> {
    #[cfg(unix)]
    File::open(path)?.sync_all()?;
    // Windows sync_all flushes file handles; portable directory fsync is unavailable.
    #[cfg(not(unix))]
    let _ = path;
    Ok(())
}

fn checkpoint(c: &Connection) -> Result<()> {
    let busy: i64 = c.query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |r| r.get(0))?;
    if busy != 0 {
        return Err("Restore stopped: WAL checkpoint is busy; close other database readers and retry. Live data is unchanged.".into());
    }
    Ok(())
}

fn validate_media(c: &Connection, root: &Path) -> Result<()> {
    for (sql, folder, message) in [
        (
            "SELECT cover FROM editions WHERE cover<>''",
            "covers",
            "Backup is missing a referenced cover image or has an unsupported cover path.",
        ),
        (
            "SELECT path FROM attachments",
            "attachments",
            "Backup is missing an attachment or has an unsupported attachment path.",
        ),
    ] {
        let mut st = c.prepare(sql)?;
        for row in st.query_map([], |r| r.get::<_, String>(0))? {
            let path = row?;
            let parts: Vec<_> = path.split('/').collect();
            if parts.len() != 2
                || parts[0] != folder
                || parts[1].is_empty()
                || !crate::db::safe_file(root, &path)?.is_file()
            {
                return Err(message.into());
            }
        }
    }
    Ok(())
}

fn prepare_restore(source: &Path, stage: &Path) -> Result<()> {
    let mut zip = ZipArchive::new(File::open(source)?)?;
    if zip.len() > MAX_ARCHIVE_FILES {
        return Err("Backup contains too many files.".into());
    }
    let mut declared_total = 0_u64;
    let mut actual_total = 0_u64;
    let mut names = std::collections::HashSet::new();
    for i in 0..zip.len() {
        let mut f = zip.by_index(i)?;
        let name = f.name().to_string();
        if !names.insert(name.to_lowercase()) {
            return Err("Backup contains duplicate paths.".into());
        }
        let declared = f.size();
        declared_total = declared_total
            .checked_add(declared)
            .ok_or("Backup too large")?;
        if declared_total > MAX_RESTORE_BYTES {
            return Err("Backup exceeds the 20 GB restore limit.".into());
        }
        let member_limit = if name == "manifest.json" {
            if declared > MAX_MANIFEST_BYTES {
                return Err("Backup manifest exceeds the 64 KiB limit.".into());
            }
            MAX_MANIFEST_BYTES
        } else {
            MAX_RESTORE_BYTES
        };
        let path = crate::db::safe_file(stage, &name)?;
        let parts: Vec<_> = name.split('/').collect();
        if !(name == "manifest.json"
            || name == "library.sqlite3"
            || (parts.len() == 2 && ["covers", "attachments"].contains(&parts[0])))
        {
            return Err("Backup contains an unexpected file.".into());
        }
        if f.is_dir() {
            continue;
        }
        fs::create_dir_all(path.parent().ok_or("Invalid archive")?)?;
        let mut out = File::create(path)?;
        extract_member(
            &mut f,
            &mut out,
            declared,
            member_limit,
            &mut actual_total,
            MAX_RESTORE_BYTES,
        )?;
        out.sync_all()?;
    }
    let manifest: serde_json::Value = serde_json::from_slice(&read_limited(
        &stage.join("manifest.json"),
        MAX_MANIFEST_BYTES,
    )?)?;
    if manifest["application"] != "MyLibrary"
        || manifest["format"] != 1
        || !manifest["schema"]
            .as_i64()
            .is_some_and(|v| (1..=crate::migrations::CURRENT_SCHEMA).contains(&v))
    {
        return Err("Unsupported backup format or version.".into());
    }
    {
        let c = Connection::open_with_flags(
            stage.join("library.sqlite3"),
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
        )?;
        c.execute_batch("PRAGMA trusted_schema=OFF;")?;
        let version: i64 = c.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if Some(version) != manifest["schema"].as_i64() {
            return Err("Backup database failed integrity validation.".into());
        }
        // Validate definitions before integrity probes, application queries,
        // or migrations can evaluate expressions from the supplied schema.
        validate_restore_schema(&c, version)?;
        let check: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
        let foreign: bool = c.prepare("PRAGMA foreign_key_check")?.exists([])?;
        if Some(version) != manifest["schema"].as_i64() || check != "ok" || foreign {
            return Err("Backup database failed integrity validation.".into());
        }
        if version >= 4 {
            crate::wishlist::validate_database(&c)?;
        }
        validate_media(&c, stage)?;
        for table in [
            "entries",
            "settings",
            "custom_fields",
            "custom_values",
            "loans",
            "change_history",
            "book_search",
        ] {
            c.prepare(&format!("SELECT * FROM {table} LIMIT 0"))?;
        }
    }
    // Exercise the full supported schema before touching the live library.
    {
        let staged = Store::open(stage.to_path_buf())?;
        validate_restore_schema(&staged.conn()?, crate::migrations::CURRENT_SCHEMA)?;
        staged.snapshot("schema validation", false)?;
        crate::wishlist::validate_database(&staged.conn()?)?;
    }
    Ok(())
}

#[cfg(test)]
#[path = "backup_recovery_tests.rs"]
mod recovery_tests;
