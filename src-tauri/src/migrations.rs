//! Forward-only schema upgrades. No migration may silently reset a library.
use crate::db::{id, Result};
use rusqlite::Connection;
use std::path::Path;

pub const CURRENT_SCHEMA: i64 = 2;
const FOUNDATION: &str = "CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now')); INSERT INTO schema_migrations VALUES(2,strftime('%Y-%m-%dT%H:%M:%fZ','now')); PRAGMA user_version=2;";

/// Trusted schema reference for restore. schema.sql is the unchanged V1 baseline;
/// V2 adds only FOUNDATION. Never execute SQL read from a backup to build this.
pub(crate) fn restore_reference(version: i64) -> Result<Connection> {
    let c = Connection::open_in_memory()?;
    c.execute_batch(include_str!("schema.sql"))?;
    match version {
        1 => {}
        2 => c.execute_batch(FOUNDATION)?,
        _ => return Err("Unsupported backup schema version.".into()),
    }
    Ok(c)
}

pub fn migrate(c: &mut Connection, root: &Path) -> Result<()> {
    apply(c, root, FOUNDATION)
}

fn apply(c: &mut Connection, root: &Path, foundation: &str) -> Result<()> {
    let version: i64 = c.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if version > CURRENT_SCHEMA {
        return Err(
            "This library was created by a newer version of MyLibrary. Please update the app."
                .into(),
        );
    }
    if version == CURRENT_SCHEMA {
        return Ok(());
    }
    let populated: bool = c.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table')",
        [],
        |r| r.get(0),
    )?;
    if populated {
        std::fs::create_dir_all(root.join("backups"))?;
        c.backup(
            "main",
            root.join(format!("backups/pre-migration-v{version}-{}.sqlite3", id())),
            None,
        )?;
    }
    let tx = c.transaction()?;
    if version == 0 {
        tx.execute_batch(include_str!("schema.sql"))?;
    }
    tx.execute_batch(foundation)?;
    if tx.prepare("PRAGMA foreign_key_check")?.exists([])? {
        return Err(
            "Migration found invalid relationships. The original library is unchanged.".into(),
        );
    }
    tx.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn failed_migration_rolls_back_schema_and_data() {
        let dir = tempfile::tempdir().unwrap();
        let mut c = Connection::open(dir.path().join("library.sqlite3")).unwrap();
        c.execute_batch("CREATE TABLE precious(value TEXT); INSERT INTO precious VALUES('keep'); PRAGMA user_version=1;").unwrap();
        assert!(apply(&mut c, dir.path(), "CREATE TABLE partial(id INTEGER); UPDATE precious SET value='lost'; SELECT * FROM nonexistent;").is_err());
        assert_eq!(
            c.query_row("SELECT value FROM precious", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "keep"
        );
        assert_eq!(
            c.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert!(c.prepare("SELECT * FROM partial").is_err());
        assert_eq!(
            std::fs::read_dir(dir.path().join("backups"))
                .unwrap()
                .count(),
            1
        );
    }
}
