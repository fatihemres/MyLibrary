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
                json!({"application":"MyLibrary","format":1,"schema":1,"created_at":now()})
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
                if !names.insert(name.clone()) {
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
                || manifest["schema"] != 1
            {
                return Err("Unsupported backup format or version.".into());
            }
            {
                let c = Connection::open(stage.join("library.sqlite3"))?;
                let version: i64 = c.query_row("PRAGMA user_version", [], |r| r.get(0))?;
                let check: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
                let foreign: bool = c.prepare("PRAGMA foreign_key_check")?.exists([])?;
                if version != 1 || check != "ok" || foreign {
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
