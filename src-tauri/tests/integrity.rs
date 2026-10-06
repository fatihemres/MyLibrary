use mylibrary_lib::db::Store;
use serde_json::{json, Value};
fn store() -> (tempfile::TempDir, Store) {
    let base = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("target/test-data");
    std::fs::create_dir_all(&base).unwrap();
    let dir = tempfile::tempdir_in(base).unwrap();
    let store = Store::open(dir.path().join("library")).unwrap();
    (dir, store)
}
fn book(title: &str) -> Value {
    json!({"title":title,"status":"Unread","pages":200,"current_page":0,"extra":{},"copy_extra":{},"contributors":[{"name":"Ursula Le Guin","role":"Author"},{"name":"Translator Person","role":"Translator"}],"terms":{"genre":["Fantasy"],"tag":["Keep"]},"custom":{}})
}
#[test]
fn create_edit_restart_relationships_and_search() {
    let (dir, s) = store();
    let key = s.save(&book("Earthsea")).unwrap();
    let snap = s.snapshot("", false).unwrap();
    assert_eq!(snap["books"].as_array().unwrap().len(), 1);
    assert_eq!(snap["people"].as_array().unwrap().len(), 2);
    let mut b = snap["books"][0].clone();
    b["title"] = json!("A Wizard of Earthsea");
    b["rating"] = json!(4.5);
    s.save(&b).unwrap();
    drop(s);
    let s = Store::open(dir.path().join("library")).unwrap();
    assert_eq!(
        s.snapshot("Wizard", false).unwrap()["searchIds"],
        json!([key])
    );
    assert_eq!(
        s.snapshot("Translator", false).unwrap()["searchIds"],
        json!([key])
    );
    assert_eq!(
        s.snapshot("Fantasy", false).unwrap()["searchIds"],
        json!([key])
    );
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["rating"],
        json!(4.5)
    );
}
#[test]
fn copies_share_editions_but_keep_reading_independent() {
    let (_d, s) = store();
    let key = s.save(&book("One")).unwrap();
    s.mutate("copy", &json!({"id":key})).unwrap();
    let snap = s.snapshot("", false).unwrap();
    let books = snap["books"].as_array().unwrap();
    assert_eq!(books.len(), 2);
    assert_eq!(books[0]["edition_id"], books[1]["edition_id"]);
    let mut b = books[0].clone();
    b["status"] = json!("Reading");
    b["title"] = json!("Shared title");
    s.save(&b).unwrap();
    let snap = s.snapshot("", false).unwrap();
    let books = snap["books"].as_array().unwrap();
    assert!(books.iter().all(|b| b["title"] == "Shared title"));
    assert_eq!(books.iter().filter(|b| b["status"] == "Reading").count(), 1);
}
#[test]
fn intentional_duplicates_are_allowed() {
    let (_d, s) = store();
    let mut b = book("Duplicate");
    b["isbn13"] = json!("9781234567890");
    s.save(&b).unwrap();
    s.save(&b).unwrap();
    let v = s.snapshot("", false).unwrap();
    assert_eq!(v["books"].as_array().unwrap().len(), 2);
    assert_ne!(v["books"][0]["edition_id"], v["books"][1]["edition_id"]);
}
#[test]
fn invalid_multistep_save_rolls_back_everything() {
    let (_d, s) = store();
    let mut b = book("Invalid");
    b["rating"] = json!(7);
    assert!(s.save(&b).is_err());
    let c = s.conn().unwrap();
    let editions: i64 = c
        .query_row("SELECT count(*) FROM editions", [], |r| r.get(0))
        .unwrap();
    assert_eq!(editions, 0);
    assert!(s.snapshot("", false).unwrap()["books"]
        .as_array()
        .unwrap()
        .is_empty());
}
#[test]
fn loan_return_history_and_reversible_deletion() {
    let (_d, s) = store();
    let key = s.save(&book("Loaned")).unwrap();
    let loan = json!({"copy_id":key,"borrower":"A friend","loan_date":"2026-01-01","due_date":"2026-02-01"});
    s.mutate("loan", &loan).unwrap();
    assert!(s.mutate("loan", &loan).is_err());
    assert!(s.mutate("trash", &json!({"ids":[key]})).is_err());
    let snap = s.snapshot("", false).unwrap();
    let loan_id = &snap["loans"][0]["id"];
    assert!(s
        .mutate("return", &json!({"id":loan_id,"date":"2025-01-01"}))
        .is_err());
    s.mutate("return", &json!({"id":loan_id,"date":"2026-02-02"}))
        .unwrap();
    s.mutate("trash", &json!({"ids":[key]})).unwrap();
    assert_eq!(
        s.snapshot("", true).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(
        s.snapshot("", false).unwrap()["loans"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    s.mutate("untrash", &json!({"ids":[key]})).unwrap();
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
}
#[test]
fn notes_quotes_indexed_and_custom_values_validated() {
    let (_d, s) = store();
    let key = s.save(&book("Book")).unwrap();
    s.mutate("entry",&json!({"copy_id":key,"kind":"quote","content":"Archipelago of imagination","extra":{"favorite":true}})).unwrap();
    assert_eq!(
        s.snapshot("archipelago", false).unwrap()["searchIds"],
        json!([key])
    );
    s.mutate("entity",&json!({"table":"custom_fields","name":"City","kind":"dropdown","extra":{"options":"Ankara|Istanbul"}})).unwrap();
    let snap = s.snapshot("", false).unwrap();
    let field = snap["fields"][0]["id"].as_str().unwrap();
    let mut b = snap["books"][0].clone();
    b["custom"][field] = json!("Istanbul");
    s.save(&b).unwrap();
    b["custom"][field] = json!("Invalid");
    assert!(s.save(&b).is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["custom"][field],
        "Istanbul"
    );
}
#[test]
fn location_cycles_and_orphans_rejected() {
    let (_d, s) = store();
    s.mutate(
        "entity",
        &json!({"table":"locations","id":"room","name":"Study"}),
    )
    .unwrap();
    s.mutate(
        "entity",
        &json!({"table":"locations","id":"shelf","name":"Shelf","parent_id":"room"}),
    )
    .unwrap();
    assert!(s
        .mutate(
            "entity",
            &json!({"table":"locations","id":"room","name":"Study","parent_id":"shelf"})
        )
        .is_err());
    let mut b = book("Book");
    b["location_id"] = json!("missing");
    assert!(s.save(&b).is_err());
}
#[test]
fn import_is_atomic_and_preserves_existing_data() {
    let (_d, s) = store();
    s.save(&book("Existing")).unwrap();
    assert!(s.import(&[book("Valid"), book("")]).is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(s.import(&[book("A"), book("B")]).unwrap(), 2);
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
}
#[test]
fn backup_restore_preserves_files_and_makes_safety_archive() {
    let (d, s) = store();
    let mut b = book("Original");
    b["cover"] = json!("covers/test.png");
    std::fs::write(
        s.root.join("covers/test.png"),
        b"fake image for archive test",
    )
    .unwrap();
    std::fs::write(s.root.join("attachments/receipt.txt"), b"receipt").unwrap();
    let key = s.save(&b).unwrap();
    s.conn().unwrap().execute("INSERT INTO attachments VALUES('a',?,'Receipt','attachments/receipt.txt','2026-01-01')",[key]).unwrap();
    let path = d.path().join("backup.zip");
    s.backup(&path).unwrap();
    assert!(s.backup(&path).is_err());
    s.save(&book("Later")).unwrap();
    let safety = s.restore(&path).unwrap();
    assert!(safety.is_file());
    let snap = s.snapshot("", false).unwrap();
    assert_eq!(snap["books"].as_array().unwrap().len(), 1);
    assert_eq!(snap["books"][0]["title"], "Original");
    assert_eq!(
        std::fs::read(s.root.join("attachments/receipt.txt")).unwrap(),
        b"receipt"
    );
    assert!(
        s.snapshot("Original", false).unwrap()["searchIds"]
            .as_array()
            .unwrap()
            .len()
            == 1
    );
}
#[test]
fn corrupt_and_traversal_backups_do_not_modify_library() {
    use std::io::Write;
    let (d, s) = store();
    s.save(&book("Precious")).unwrap();
    let invalid = d.path().join("invalid.zip");
    std::fs::write(&invalid, b"not a zip").unwrap();
    assert!(s.restore(&invalid).is_err());
    let path = d.path().join("traversal.zip");
    let mut z = zip::ZipWriter::new(std::fs::File::create(&path).unwrap());
    z.start_file("../escape.txt", zip::write::SimpleFileOptions::default())
        .unwrap();
    z.write_all(b"bad").unwrap();
    z.finish().unwrap();
    assert!(s.restore(&path).is_err());
    assert!(!d.path().join("escape.txt").exists());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["title"],
        "Precious"
    );
}
#[test]
fn future_schema_is_never_modified() {
    let (d, s) = store();
    s.save(&book("Keep")).unwrap();
    s.conn()
        .unwrap()
        .execute_batch("PRAGMA user_version=999")
        .unwrap();
    drop(s);
    assert!(Store::open(d.path().join("library")).is_err());
}
#[test]
fn automatic_backup_due_only_and_bulk_transaction() {
    let (_d, s) = store();
    let a = s.save(&book("A")).unwrap();
    let b = s.save(&book("B")).unwrap();
    s.mutate(
        "bulk",
        &json!({"ids":[a,b],"field":"add_tag","value":"Together"}),
    )
    .unwrap();
    assert_eq!(
        s.snapshot("Together", false).unwrap()["searchIds"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    s.mutate("settings", &json!({"backup_days":"1"})).unwrap();
    assert!(s.automatic_backup().unwrap().is_some());
    assert!(s.automatic_backup().unwrap().is_none());
}
