use crate::db::{id, now, Result, Store};
use rusqlite::Connection;
use serde_json::json;
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
};
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};
impl Store {
    pub fn backup(&self, destination: &Path) -> Result<()> {
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
            let archive = temp.join("backup.zip");
            let mut zip = ZipWriter::new(File::create(&archive)?);
            let opts =
                SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
            zip.start_file("manifest.json", opts)?;
            zip.write_all(
                json!({"application":"MyLibrary","format":1,"schema":crate::migrations::CURRENT_SCHEMA,"app_version":env!("CARGO_PKG_VERSION"),"included_assets":["covers","attachments"],"created_at":now()})
                    .to_string()
                    .as_bytes(),
            )?;
            zip.start_file("library.sqlite3", opts)?;
            std::io::copy(&mut File::open(db)?, &mut zip)?;
            for folder in ["covers", "attachments"] {
                for entry in fs::read_dir(self.root.join(folder))? {
                    let p = entry?.path();
                    if p.is_file() {
                        zip.start_file(
                            format!(
                                "{folder}/{}",
                                p.file_name().ok_or("Invalid asset")?.to_string_lossy()
                            ),
                            opts,
                        )?;
                        std::io::copy(&mut File::open(p)?, &mut zip)?;
                    }
                }
            }
            zip.finish()?.sync_all()?;
            let mut target = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(destination)?;
            std::io::copy(&mut File::open(archive)?, &mut target)?;
            target.sync_all()?;
            Ok(())
        })();
        fs::remove_dir_all(temp)?;
        result
    }
    pub fn restore(&self, source: &Path) -> Result<PathBuf> {
        let stage = self.root.join(format!(".restore-{}", id()));
        fs::create_dir(&stage)?;
        let result = (|| {
            let mut zip = ZipArchive::new(File::open(source)?)?;
            if zip.len() > 100000 {
                return Err("Backup contains too many files.".into());
            }
            let mut total = 0_u64;
            let mut names = std::collections::HashSet::new();
            for i in 0..zip.len() {
                let mut f = zip.by_index(i)?;
                let name = f.name().to_string();
                if !names.insert(name.to_lowercase()) {
                    return Err("Backup contains duplicate paths.".into());
                }
                total = total.checked_add(f.size()).ok_or("Backup too large")?;
                if total > 20 * 1024 * 1024 * 1024 {
                    return Err("Backup exceeds the 20 GB restore limit.".into());
                }
                let path = crate::db::safe_file(&stage, &name)?;
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
                std::io::copy(&mut f, &mut out)?;
            }
            let manifest: serde_json::Value =
                serde_json::from_slice(&fs::read(stage.join("manifest.json"))?)?;
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
                let mut books = crate::db::list(&c, false)?;
                books.extend(crate::db::list(&c, true)?);
                for b in books {
                    let cover = crate::db::s(&b, "cover");
                    if !cover.is_empty()
                        && (!cover.starts_with("covers/")
                            || !crate::db::safe_file(&stage, cover)?.is_file())
                    {
                        return Err("Backup is missing a referenced cover image.".into());
                    }
                }
                let mut st = c.prepare("SELECT path FROM attachments")?;
                for p in st.query_map([], |r| r.get::<_, String>(0))? {
                    let path = p?;
                    if !path.starts_with("attachments/")
                        || !crate::db::safe_file(&stage, &path)?.is_file()
                    {
                        return Err("Backup is missing an attachment.".into());
                    }
                }
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
                let staged = Store::open(stage.clone())?;
                validate_restore_schema(&staged.conn()?, crate::migrations::CURRENT_SCHEMA)?;
                staged.snapshot("schema validation", false)?;
            }
            let safety = self
                .root
                .join(format!("backups/before-restore-{}.zip", id()));
            self.backup(&safety)?;
            self.conn()?
                .execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;
            let previous = self.root.join(format!(".previous-{}", id()));
            fs::create_dir(&previous)?;
            let mut moved = Vec::new();
            let mut installed = Vec::new();
            let swap: Result<()> = (|| {
                for name in [
                    "library.sqlite3",
                    "library.sqlite3-wal",
                    "library.sqlite3-shm",
                    "covers",
                    "attachments",
                ] {
                    let path = self.root.join(name);
                    if path.exists() {
                        fs::rename(path, previous.join(name))?;
                        moved.push(name);
                    }
                }
                for name in ["library.sqlite3", "covers", "attachments"] {
                    if !stage.join(name).exists() && name != "library.sqlite3" {
                        fs::create_dir(stage.join(name))?;
                    }
                    fs::rename(stage.join(name), self.root.join(name))?;
                    installed.push(name);
                }
                Ok(())
            })();
            if let Err(error) = swap {
                for name in installed {
                    fs::rename(self.root.join(name), stage.join(name))?;
                }
                for name in moved {
                    fs::rename(previous.join(name), self.root.join(name))?;
                }
                return Err(error);
            }
            // Keep the original directory as an additional recovery copy. Never purge automatically.
            Ok(safety)
        })();
        let _ = fs::remove_dir_all(stage);
        result
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
