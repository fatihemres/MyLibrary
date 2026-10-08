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
        "book_search",
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
    let dir = temp();
    let root = dir.path().join("v1");
    fixture(&root);
    let source = dir.path().join("v1.zip");
    let mut zip = zip::ZipWriter::new(std::fs::File::create(&source).unwrap());
    let opts = zip::write::SimpleFileOptions::default();
    zip.start_file("manifest.json", opts).unwrap();
    zip.write_all(br#"{"application":"MyLibrary","format":1,"schema":1}"#)
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
    assert_eq!(
        store
            .conn()
            .unwrap()
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        CURRENT_SCHEMA
    );
}
