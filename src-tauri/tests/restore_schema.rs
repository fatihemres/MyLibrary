use mylibrary_lib::db::Store;
use serde_json::{json, Value};

fn book(title: &str) -> Value {
    json!({"title":title,"status":"Unread","extra":{},"copy_extra":{},"custom":{}})
}

// Exercise archive creation, validation and the real restore boundary, not only
// the comparison helper. Every input here is a disposable synthetic library.
fn rejected_restore(sql: &str) {
    let base = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("target/test-data");
    std::fs::create_dir_all(&base).unwrap();
    let dir = tempfile::tempdir_in(base).unwrap();
    let source = Store::open(dir.path().join("source")).unwrap();
    source.save(&book("Synthetic archive")).unwrap();
    source.conn().unwrap().execute_batch(sql).unwrap();
    let archive = dir.path().join("untrusted.zip");
    source.backup(&archive).unwrap();

    let live = Store::open(dir.path().join("live")).unwrap();
    let copy = live.save(&book("Keep this book")).unwrap();
    let before = live.snapshot("", false).unwrap();
    let result = live.restore(&archive);
    assert!(result.is_err(), "unsupported schema must fail restore");
    assert!(result.unwrap_err().to_string().contains("unsupported"));
    assert_eq!(before, live.snapshot("", false).unwrap());
    // Rejection is before even a safety backup/live swap, not a later rollback.
    assert_eq!(
        std::fs::read_dir(live.root.join("backups"))
            .unwrap()
            .count(),
        0
    );
    for content in ["First synthetic note", "Second synthetic note"] {
        live.mutate(
            "entry",
            &json!({"copy_id":copy,"kind":"note","title":"Same title","content":content}),
        )
        .unwrap();
    }
    let after = live.snapshot("", false).unwrap();
    let contents: Vec<_> = after["entries"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| e["content"].as_str().unwrap())
        .collect();
    assert_eq!(contents.len(), 2);
    assert!(contents.contains(&"First synthetic note"));
    assert!(contents.contains(&"Second synthetic note"));
}

#[test]
fn supported_table_with_replace_constraint_and_extra_autoindex_is_rejected() {
    let entries = include_str!("../src/schema.sql")
        .lines()
        .find(|line| line.starts_with("CREATE TABLE entries("))
        .unwrap();
    let hostile = entries.replace(
        "title TEXT NOT NULL DEFAULT ''",
        "title TEXT NOT NULL DEFAULT '' UNIQUE ON CONFLICT REPLACE",
    );
    assert_ne!(entries, hostile);
    // The archive is integrity-valid despite the unsupported conflict policy.
    let probe = rusqlite::Connection::open_in_memory().unwrap();
    probe
        .execute_batch(include_str!("../src/schema.sql"))
        .unwrap();
    probe
        .execute_batch(&format!("DROP TABLE entries; {hostile}"))
        .unwrap();
    assert_eq!(
        probe
            .query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "ok"
    );
    assert!(!probe
        .prepare("PRAGMA foreign_key_check")
        .unwrap()
        .exists([])
        .unwrap());
    rejected_restore(&format!(
        "DROP TABLE entries; {hostile} CREATE INDEX entries_copy ON entries(copy_id,kind);"
    ));
}

#[test]
fn supported_index_name_with_changed_uniqueness_or_predicate_is_rejected() {
    rejected_restore(
        "DROP INDEX entries_copy; CREATE UNIQUE INDEX entries_copy ON entries(title);",
    );
    rejected_restore("DROP INDEX one_active_loan; CREATE UNIQUE INDEX one_active_loan ON loans(copy_id) WHERE returned_date<>'';");
}

#[test]
fn altered_fts_configuration_shadow_table_and_migration_ledger_are_rejected() {
    rejected_restore("DROP TABLE book_search; CREATE VIRTUAL TABLE book_search USING fts5(copy_id UNINDEXED,body,tokenize='porter');");
    rejected_restore("ALTER TABLE book_search_config ADD COLUMN unexpected TEXT;");
    rejected_restore("DROP TABLE schema_migrations; CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY ON CONFLICT REPLACE,applied_at TEXT NOT NULL);");
}

#[test]
fn canonical_analyzed_backup_restores_with_statistics_and_search() {
    let dir = tempfile::tempdir().unwrap();
    let source = Store::open(dir.path().join("source")).unwrap();
    let copy = source.save(&book("Analyzed synthetic book")).unwrap();
    source.conn().unwrap().execute_batch("ANALYZE;").unwrap();
    assert!(source
        .conn()
        .unwrap()
        .prepare("SELECT * FROM sqlite_stat1")
        .is_ok());
    let archive = dir.path().join("analyzed.zip");
    source.backup(&archive).unwrap();
    let live = Store::open(dir.path().join("live")).unwrap();
    assert!(live.restore(&archive).unwrap().is_file());
    assert_eq!(
        live.snapshot("Analyzed", false).unwrap()["searchIds"],
        json!([copy])
    );
    assert!(live
        .conn()
        .unwrap()
        .prepare("SELECT * FROM sqlite_stat1")
        .is_ok());
    live.save(&book("After valid restore")).unwrap();
}

#[test]
fn altered_statistics_definition_is_not_trusted_by_name() {
    rejected_restore("ANALYZE; PRAGMA writable_schema=ON; UPDATE sqlite_schema SET sql='CREATE TABLE sqlite_stat1(tbl,idx,stat TEXT UNIQUE ON CONFLICT REPLACE)' WHERE name='sqlite_stat1'; PRAGMA writable_schema=OFF;");
}

#[test]
fn equivalent_sql_layout_preserves_literals_and_restores() {
    let dir = tempfile::tempdir().unwrap();
    let source = Store::open(dir.path().join("source")).unwrap();
    source.save(&book("Formatting control")).unwrap();
    source.conn().unwrap().execute_batch("DROP INDEX entries_copy; create index entries_copy on entries ( copy_id /* same semantics */ , kind );").unwrap();
    let archive = dir.path().join("formatting.zip");
    source.backup(&archive).unwrap();
    let live = Store::open(dir.path().join("live")).unwrap();
    live.restore(&archive).unwrap();
    assert_eq!(
        live.snapshot("", false).unwrap()["books"][0]["title"],
        "Formatting control"
    );
}
