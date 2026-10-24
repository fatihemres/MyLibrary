use mylibrary_lib::{db::Store, migrations::CURRENT_SCHEMA};
use rusqlite::{types::Value, Connection};
use std::{collections::BTreeMap, io::Write, path::Path};

fn fixture(root: &Path) {
    std::fs::create_dir_all(root.join("covers")).unwrap();
    std::fs::create_dir_all(root.join("attachments")).unwrap();
    let c = Connection::open(root.join("library.sqlite3")).unwrap();
    c.execute_batch(include_str!("fixtures/v1-schema.sql"))
        .unwrap();
    c.execute_batch(include_str!("fixtures/v1-library.sql"))
        .unwrap();
    std::fs::write(root.join("covers/fixture.png"), b"synthetic cover fixture").unwrap();
    std::fs::write(root.join("attachments/fixture.txt"), b"synthetic receipt").unwrap();
}
fn content(c: &Connection) -> BTreeMap<String, Vec<Vec<Value>>> {
    let tables = [
        "editions",
        "copies",
        "people",
        "contributors",
        "publishers",
        "series",
        "acquisition_sources",
        "terms",
        "edition_terms",
        "locations",
        "loans",
        "entries",
        "attachments",
        "custom_fields",
        "custom_values",
        "settings",
        "change_history",
        // book_search is derived and intentionally rebuilt by schema 3.
    ];
    tables
        .into_iter()
        .map(|table| {
            let mut q = c
                .prepare(&format!("SELECT * FROM {table} ORDER BY rowid"))
                .unwrap();
            let count = q.column_count();
            let rows = q
                .query_map([], |r| (0..count).map(|i| r.get(i)).collect())
                .unwrap()
                .collect::<rusqlite::Result<Vec<_>>>()
                .unwrap();
            (table.to_owned(), rows)
        })
        .collect()
}
fn temp() -> tempfile::TempDir {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("target/test-data");
    std::fs::create_dir_all(&root).unwrap();
    tempfile::tempdir_in(root).unwrap()
}
#[test]
fn v1_upgrade_preserves_every_domain_table_and_media_and_is_idempotent() {
    let dir = temp();
    let root = dir.path().join("v1");
    fixture(&root);
    let before = content(&Connection::open(root.join("library.sqlite3")).unwrap());
    let store = Store::open(root.clone()).unwrap();
    assert_eq!(before, content(&store.conn().unwrap()));
    assert_eq!(
        store
            .conn()
            .unwrap()
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        CURRENT_SCHEMA
    );
    assert_eq!(std::fs::read_dir(root.join("backups")).unwrap().count(), 1);
    let safety = std::fs::read_dir(root.join("backups"))
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path();
    let original = Connection::open(safety).unwrap();
    assert_eq!(
        original
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        1
    );
    assert_eq!(before, content(&original));
    drop(store);
    let reopened = Store::open(root).unwrap();
    assert_eq!(before, content(&reopened.conn().unwrap()));
    assert_eq!(
        std::fs::read_dir(reopened.root.join("backups"))
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| entry.path().extension().is_some_and(|ext| ext == "sqlite3"))
            .count(),
        1
    );
    assert_eq!(
        std::fs::read(reopened.root.join("attachments/fixture.txt")).unwrap(),
        b"synthetic receipt"
    );
    assert!(reopened.root.join("covers/fixture.png").is_file());
}
#[test]
fn v1_archive_migrates_only_staging_and_preserves_original_archive() {
    restore_archive(false, 1);
}
#[test]
fn analyzed_v1_archive_remains_compatible() {
    restore_archive(true, 1);
}
#[test]
fn v2_archive_rebuilds_search_in_staging() {
    restore_archive(false, 2);
}
fn restore_archive(analyzed: bool, version: i64) {
    let dir = temp();
    let root = dir.path().join("v1");
    fixture(&root);
    if version == 2 {
        Connection::open(root.join("library.sqlite3")).unwrap().execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'original'),(2,'original'); PRAGMA user_version=2;").unwrap();
    }
    if analyzed {
        Connection::open(root.join("library.sqlite3"))
            .unwrap()
            .execute_batch("ANALYZE;")
            .unwrap();
    }
    let source = dir.path().join("v1.zip");
    let mut zip = zip::ZipWriter::new(std::fs::File::create(&source).unwrap());
    let opts = zip::write::SimpleFileOptions::default();
    zip.start_file("manifest.json", opts).unwrap();
    zip.write_all(
        serde_json::json!({"application":"MyLibrary","format":1,"schema":version})
            .to_string()
            .as_bytes(),
    )
    .unwrap();
    for name in [
        "library.sqlite3",
        "covers/fixture.png",
        "attachments/fixture.txt",
    ] {
        zip.start_file(name, opts).unwrap();
        zip.write_all(&std::fs::read(root.join(name)).unwrap())
            .unwrap();
    }
    zip.finish().unwrap();
    let original = std::fs::read(&source).unwrap();
    let expected = content(&Connection::open(root.join("library.sqlite3")).unwrap());
    let store = Store::open(dir.path().join("v2")).unwrap();
    let safety = store.restore(&source).unwrap();
    assert!(safety.is_file());
    assert_eq!(std::fs::read(source).unwrap(), original);
    assert_eq!(expected, content(&store.conn().unwrap()));
    assert!(!store.snapshot("preserved", false).unwrap()["searchIds"]
        .as_array()
        .unwrap()
        .is_empty());
    assert_eq!(
        store
            .conn()
            .unwrap()
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        CURRENT_SCHEMA
    );
}

#[test]
fn populated_v2_rebuilds_derived_index_and_preserves_domain_data() {
    let dir = temp();
    let root = dir.path().join("v2");
    fixture(&root);
    let c = Connection::open(root.join("library.sqlite3")).unwrap();
    c.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'original'),(2,'original'); PRAGMA user_version=2;").unwrap();
    c.execute_batch("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;")
        .unwrap();
    c.execute("UPDATE editions SET title=?", ["Işık Diyarbakır"])
        .unwrap();
    let before = content(&c);
    assert!(
        std::fs::metadata(root.join("library.sqlite3-wal"))
            .unwrap()
            .len()
            > 0
    );
    let store = Store::open(root.clone()).unwrap();
    let safety = std::fs::read_dir(root.join("backups"))
        .unwrap()
        .next()
        .unwrap()
        .unwrap()
        .path();
    let backup = Connection::open(safety).unwrap();
    assert_eq!(before, content(&backup));
    assert_eq!(
        backup
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        2
    );
    drop(c);
    assert_eq!(before, content(&store.conn().unwrap()));
    assert!(
        !store.snapshot("isik diyarbakir", false).unwrap()["searchIds"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    drop(store);
    let store = Store::open(root).unwrap();
    assert_eq!(before, content(&store.conn().unwrap()));
    assert!(!store.snapshot("IŞIK", false).unwrap()["searchIds"]
        .as_array()
        .unwrap()
        .is_empty());
}
