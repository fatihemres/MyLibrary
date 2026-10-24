use mylibrary_lib::db::Store;
use serde_json::{json, Value};
fn book(title: &str) -> Value {
    json!({"title":title,"extra":{},"copy_extra":{},"contributors":[],"terms":{},"custom":{}})
}
fn matches(store: &Store, query: &str) -> usize {
    store.snapshot(query, false).unwrap()["searchIds"]
        .as_array()
        .unwrap()
        .len()
}
#[test]
fn turkish_equivalence_is_symmetric_and_preserves_originals() {
    let dir = tempfile::tempdir().unwrap();
    let store = Store::open(dir.path().join("library")).unwrap();
    for variants in [
        vec!["İhsan", "ihsan"],
        vec!["İnce", "İNCE"],
        vec!["Işık", "ışık", "isik", "IŞIK"],
        vec!["Diyarbakır", "Diyarbakir"],
        vec!["café", "CAFE"],
    ] {
        for title in &variants {
            store.save(&book(title)).unwrap();
        }
        for query in &variants {
            assert_eq!(matches(&store, query), variants.len(), "{query}");
        }
    }
    assert_eq!(matches(&store, "Ishak"), 0);
    assert_eq!(matches(&store, "inceleme"), 0);
    let snap = store.snapshot("", false).unwrap();
    assert!(snap["books"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["title"] == "Işık"));
}
#[test]
fn prefix_multiword_punctuation_and_hostile_queries_are_literal() {
    let dir = tempfile::tempdir().unwrap();
    let store = Store::open(dir.path().join("library")).unwrap();
    store
        .save(&book("İhsan Işık O'Neil bilim-kurgu 9789752444102"))
        .unwrap();
    for q in [
        "ihs isi",
        "ISIK İHSAN",
        "O'Neil",
        "bilim-kurgu",
        "9789752444102",
    ] {
        assert_eq!(matches(&store, q), 1, "{q}");
    }
    for q in [
        "*",
        "\"",
        "()",
        "title:missing",
        "' OR 1=1 --",
        "İhsan NOT Işık",
        "NEAR(ihsan isik)",
    ] {
        assert_eq!(matches(&store, q), 0, "{q}");
    }
    assert!(store.snapshot("   ", false).unwrap()["searchIds"].is_null());
    assert!(store.snapshot(&"a".repeat(1025), false).is_err());
    assert!(store.snapshot(&" ".repeat(1025), false).is_err());
    assert!(store.snapshot(&"a ".repeat(33), false).is_err());
    assert_eq!(
        store.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
}
#[test]
fn updates_reopen_and_backup_restore_keep_normalized_search() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path().join("library");
    let store = Store::open(root.clone()).unwrap();
    store.save(&book("Before")).unwrap();
    let mut b = store.snapshot("", false).unwrap()["books"][0].clone();
    b["title"] = json!("Diyarbakır");
    b["contributors"] = json!([{"name":"Işık","role":"Author"}]);
    store.save(&b).unwrap();
    assert_eq!(matches(&store, "before"), 0);
    assert_eq!(matches(&store, "isik diyarbakir"), 1);
    let backup = dir.path().join("portable.zip");
    store.backup(&backup).unwrap();
    drop(store);
    let store = Store::open(root).unwrap();
    assert_eq!(matches(&store, "ISIK"), 1);
    store.restore(&backup).unwrap();
    assert_eq!(matches(&store, "diyarbakir"), 1);
    assert_eq!(
        store.snapshot("", false).unwrap()["books"][0]["title"],
        "Diyarbakır"
    );
}

#[test]
fn nul_is_rejected_explicitly_and_other_controls_remain_literal() {
    let dir = tempfile::tempdir().unwrap();
    let store = Store::open(dir.path().join("library")).unwrap();
    store
        .save(&book("İhsan Işık Diyarbakır O'Neil bilim-kurgu"))
        .unwrap();
    let before = store.snapshot("", false).unwrap();
    let index = || {
        let c = store.conn().unwrap();
        let mut stmt = c
            .prepare("SELECT copy_id, body FROM book_search ORDER BY rowid")
            .unwrap();
        stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .unwrap()
            .collect::<rusqlite::Result<Vec<_>>>()
            .unwrap()
    };
    let before_index = index();
    for q in ["\0", "İhsan\0missing", "\0IŞIK", "isik\0"] {
        let error = store.snapshot(q, false).unwrap_err().to_string();
        assert_eq!(error, "Search cannot contain NUL characters.", "{q:?}");
    }
    assert_eq!(store.snapshot("", false).unwrap(), before);
    assert_eq!(index(), before_index);
    for q in ["İHSAN\tışık", "İhsan\nIŞIK", "İhsan\r\nDiyarbakir"] {
        assert_eq!(matches(&store, q), 1, "{q:?}");
    }
    for q in [
        "\u{1}",
        "\u{7}",
        "\u{1b}",
        "\u{7f}",
        "\u{85}",
        "\"İhsan\"",
        "İhsan*",
        "İhsan OR missing",
        "{title}:isik",
        "[isik]",
        "İhsan + IŞIK",
        "İhsan\\IŞIK",
        "İhsan\u{1}IŞIK",
    ] {
        assert!(store.snapshot(q, false).is_ok(), "{q:?}");
    }
    assert_eq!(matches(&store, "ihs isi"), 1);
    assert_eq!(
        store.snapshot("", false).unwrap()["books"][0]["title"],
        "İhsan Işık Diyarbakır O'Neil bilim-kurgu"
    );
}
