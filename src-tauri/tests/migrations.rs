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
fn pre_migration_snapshot(root: &Path, version: i64) -> std::path::PathBuf {
    let prefix = format!("pre-migration-v{version}-");
    let snapshots: Vec<_> = std::fs::read_dir(root.join("backups"))
        .unwrap()
        .map(|entry| entry.unwrap())
        .filter(|entry| entry.file_type().unwrap().is_file())
        .filter(|entry| {
            entry
                .file_name()
                .to_str()
                .and_then(|name| name.strip_prefix(&prefix)?.strip_suffix(".sqlite3"))
                .is_some_and(|id| uuid::Uuid::parse_str(id).is_ok())
        })
        .map(|entry| entry.path())
        .collect();
    assert_eq!(
        snapshots.len(),
        1,
        "Expected exactly one schema-{version} snapshot"
    );
    snapshots.into_iter().next().unwrap()
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
    let safety = pre_migration_snapshot(&root, 1);
    let original = Connection::open(&safety).unwrap();
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
    assert_eq!(pre_migration_snapshot(&reopened.root, 1), safety);
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
    let safety = pre_migration_snapshot(&root, 2);
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

/// Explicit opt-in benchmark: retains only synthetic data under the ignored .cache directory.
#[test]
#[ignore = "synthetic performance measurement; run explicitly with --ignored --nocapture"]
fn synthetic_schema2_migration_benchmark() {
    use std::time::{Instant, SystemTime, UNIX_EPOCH};
    let run = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let output =
        Path::new(env!("CARGO_MANIFEST_DIR")).join(format!("../.cache/m3a-benchmark-{run}"));
    std::fs::create_dir_all(&output).unwrap();
    let mut reports = Vec::new();
    for copies in [1000, 10000] {
        let root = output.join(format!("copies-{copies}"));
        fixture(&root);
        let mut c = Connection::open(root.join("library.sqlite3")).unwrap();
        c.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'original'),(2,'original'); PRAGMA user_version=2; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;").unwrap();
        let tx = c.transaction().unwrap();
        for i in 1..copies / 2 {
            let edition = format!("edition-{i}");
            tx.execute("INSERT INTO editions SELECT ?1,?2,subtitle,isbn10,isbn13,publisher_id,series_id,series_order,publication_year,pages,language,cover,extra,created_at,updated_at FROM editions WHERE id='edition'", rusqlite::params![edition, format!("İhsan Işık Diyarbakır bilim-kurgu {i}")]).unwrap();
            tx.execute("INSERT INTO contributors SELECT ?1,person_id,role,position FROM contributors WHERE edition_id='edition'", [&edition]).unwrap();
            tx.execute("INSERT INTO edition_terms SELECT ?1,term_id FROM edition_terms WHERE edition_id='edition'", [&edition]).unwrap();
            for j in 0..2 {
                let copy = format!("copy-{i}-{j}");
                tx.execute("INSERT INTO copies SELECT ?1,?2,barcode,location_id,source_id,status,rating,favorite,current_page,acquisition_date,condition,extra,deleted_at,created_at,updated_at FROM copies WHERE id='copy1'", rusqlite::params![copy, edition]).unwrap();
                tx.execute("INSERT INTO entries SELECT ?1,?2,kind,title,content,page,extra,created_at,updated_at FROM entries WHERE id='note'", rusqlite::params![format!("note-{i}-{j}"), copy]).unwrap();
                tx.execute("INSERT INTO attachments SELECT ?1,?2,name,path,created_at FROM attachments WHERE id='attachment'", rusqlite::params![format!("asset-{i}-{j}"), copy]).unwrap();
            }
        }
        tx.execute_batch("DELETE FROM book_search; INSERT INTO book_search(copy_id,body) SELECT c.id, e.title||' '||e.subtitle||' '||e.isbn10||' '||e.isbn13||' '||c.barcode||' '||e.extra||' '||c.extra||' '||coalesce(p.name,'')||' '||coalesce(s.name,'')||' '||coalesce((SELECT group_concat(pp.name,' ') FROM contributors cc JOIN people pp ON pp.id=cc.person_id WHERE cc.edition_id=e.id),'')||' '||coalesce((SELECT group_concat(t.name,' ') FROM edition_terms et JOIN terms t ON t.id=et.term_id WHERE et.edition_id=e.id),'')||' '||coalesce((SELECT group_concat(en.title||' '||en.content,' ') FROM entries en WHERE en.copy_id=c.id),'') FROM copies c JOIN editions e ON e.id=c.edition_id LEFT JOIN publishers p ON p.id=e.publisher_id LEFT JOIN series s ON s.id=e.series_id WHERE c.deleted_at IS NULL;").unwrap();
        tx.commit().unwrap();
        c.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").unwrap();
        c.execute(
            "UPDATE editions SET title=? WHERE id='edition'",
            ["İhsan Işık Diyarbakır committed WAL"],
        )
        .unwrap();
        let before = content(&c);
        let page_bytes = |db: &Connection| -> i64 {
            db.query_row(
                "SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size()",
                [],
                |r| r.get(0),
            )
            .unwrap()
        };
        // Payload bytes, not total allocated FTS pages (dbstat is not assumed available).
        let index_bytes = |db: &Connection| -> i64 {
            db.query_row(
                "SELECT COALESCE(SUM(length(block)),0) FROM book_search_data",
                [],
                |r| r.get(0),
            )
            .unwrap()
        };
        let before_size = page_bytes(&c);
        let before_index = index_bytes(&c);
        let wal_bytes = std::fs::metadata(root.join("library.sqlite3-wal"))
            .unwrap()
            .len();
        assert!(wal_bytes > 0);
        let start = Instant::now();
        let store = Store::open(root.clone()).unwrap();
        let migration_ms = start.elapsed().as_secs_f64() * 1000.0;
        let after = store.conn().unwrap();
        assert_eq!(before, content(&after));
        assert_eq!(
            after
                .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            3
        );
        assert_eq!(after.query_row("SELECT group_concat(version) FROM (SELECT version FROM schema_migrations ORDER BY version)", [], |r| r.get::<_, String>(0)).unwrap(), "1,2,3");
        assert_eq!(
            after
                .query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
        assert!(!after
            .prepare("PRAGMA foreign_key_check")
            .unwrap()
            .exists([])
            .unwrap());
        let safety = pre_migration_snapshot(&root, 2);
        let backup = Connection::open(&safety).unwrap();
        assert_eq!(
            backup
                .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        assert_eq!(before, content(&backup));
        assert_eq!(
            store.snapshot("isik diyarbakir", false).unwrap()["searchIds"]
                .as_array()
                .unwrap()
                .len(),
            copies as usize
        );
        assert_eq!(
            store.snapshot("ihs isi", false).unwrap()["searchIds"]
                .as_array()
                .unwrap()
                .len(),
            copies as usize
        );
        assert_eq!(
            std::fs::read(root.join("covers/fixture.png")).unwrap(),
            b"synthetic cover fixture"
        );
        assert_eq!(
            std::fs::read(root.join("attachments/fixture.txt")).unwrap(),
            b"synthetic receipt"
        );
        let after_size = page_bytes(&after);
        let after_index = index_bytes(&after);
        drop(after);
        drop(c);
        drop(store);
        let start = Instant::now();
        let reopened = Store::open(root.clone()).unwrap();
        let reopen_ms = start.elapsed().as_secs_f64() * 1000.0;
        assert_eq!(before, content(&reopened.conn().unwrap()));
        assert_eq!(pre_migration_snapshot(&root, 2), safety);
        assert_eq!(
            reopened.snapshot("IŞIK", false).unwrap()["searchIds"]
                .as_array()
                .unwrap()
                .len(),
            copies as usize
        );
        reports.push(serde_json::json!({"copies":copies,"editions":copies/2,"migration_open_ms":migration_ms,"reopen_ms":reopen_ms,"database_logical_bytes_before":before_size,"database_logical_bytes_after":after_size,"fts_data_payload_bytes_before":before_index,"fts_data_payload_bytes_after":after_index,"committed_wal_bytes":wal_bytes,"backup_bytes":std::fs::metadata(&safety).unwrap().len(),"domain_values_identical":true,"asset_bytes_identical":true,"schema":3,"passed":true}));
    }
    let report = output.join("report.json");
    std::fs::write(&report, serde_json::to_string_pretty(&reports).unwrap()).unwrap();
    println!("BENCHMARK_REPORT={}", report.display());
    println!("{}", serde_json::to_string_pretty(&reports).unwrap());
}
