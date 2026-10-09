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
fn managed_paths_are_portable_and_reject_escape_syntax() {
    let (_dir, store) = store();
    assert_eq!(
        mylibrary_lib::db::safe_file(&store.root, "covers/example.png").unwrap(),
        store.root.join("covers").join("example.png")
    );
    for path in [
        "",
        "../outside",
        "/absolute",
        "C:/private",
        "covers\\private",
        "covers/../../outside",
    ] {
        assert!(
            mylibrary_lib::db::safe_file(&store.root, path).is_err(),
            "{path}"
        );
    }
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

#[test]
fn portable_catalogue_recreates_locations_and_custom_fields() {
    let (_d, s) = store();
    let mut b = book("Portable catalogue");
    b["location_id"] = json!("source-machine-location");
    b["custom"] = json!({"source-machine-field":"Istanbul"});
    b["transfer"] = json!({"location":["Study","Bookcase 2","Shelf 4"],"fields":[{"id":"source-machine-field","name":"Bought in city","kind":"text","extra":{}}]});
    s.import(&[b.clone(), b]).unwrap();
    let snap = s.snapshot("", false).unwrap();
    assert_eq!(snap["locations"].as_array().unwrap().len(), 3);
    assert_eq!(snap["fields"].as_array().unwrap().len(), 1);
    let field = snap["fields"][0]["id"].as_str().unwrap();
    assert_ne!(field, "source-machine-field");
    assert_eq!(snap["books"][0]["custom"][field], "Istanbul");
    assert_eq!(
        snap["books"][0]["location_id"],
        snap["books"][1]["location_id"]
    );
}

#[test]
fn exclusive_lock_and_trashed_loan_protect_library() {
    let (d, s) = store();
    assert!(Store::open(d.path().join("library")).is_err());
    let key = s.save(&book("Archived copy")).unwrap();
    s.mutate("trash", &json!({"ids":[key]})).unwrap();
    assert!(s
        .mutate(
            "loan",
            &json!({"copy_id":key,"borrower":"Test borrower","loan_date":"2026-10-06"})
        )
        .is_err());
}

#[test]
fn dropdown_definition_cannot_invalidate_saved_values() {
    let (_d, s) = store();
    s.mutate("entity", &json!({"table":"custom_fields","id":"city","name":"City","kind":"dropdown","extra":{"options":"Ankara|Istanbul"}})).unwrap();
    let mut b = book("Keep custom value");
    b["custom"] = json!({"city":"Istanbul"});
    s.save(&b).unwrap();
    assert!(s.mutate("entity", &json!({"table":"custom_fields","id":"city","name":"City","kind":"dropdown","extra":{"options":"Ankara"}})).is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["custom"]["city"],
        "Istanbul"
    );
}

#[test]
fn physical_copies_are_independent_and_cannot_edit_editions() {
    let (_dir, s) = store();
    let first = s.save(&book("Protected edition")).unwrap();
    let mut one = s.snapshot("", false).unwrap()["books"][0].clone();
    let edition = one["edition_id"].as_str().unwrap().to_owned();
    s.conn()
        .unwrap()
        .execute(
            "UPDATE editions SET updated_at='unchanged-edition' WHERE id=?",
            [&edition],
        )
        .unwrap();
    one["title"] = json!("Must not be applied");
    one["pages"] = json!(999);
    one["condition"] = json!("Very Good");
    one["copy_extra"] = json!({"inventory_code":"Copy #1","purchase_price":"12.50","currency":"TRY","shelf_position":"A"});
    s.mutate("save_copy", &one).unwrap();
    let mut two = one.clone();
    two["condition"] = json!("Poor");
    two["copy_extra"] = json!({"inventory_code":"Copy #2","purchase_price":"40","currency":"USD"});
    s.mutate("add_copy", &two).unwrap();
    let snap = s.snapshot("", false).unwrap();
    let books = snap["books"].as_array().unwrap();
    assert!(books.iter().all(|b| b["title"] == "Protected edition"
        && b["pages"] == 200
        && b["edition_id"] == edition));
    let second = books.iter().find(|b| b["id"] != first).unwrap()["id"]
        .as_str()
        .unwrap();
    s.mutate(
        "loan",
        &json!({"copy_id":second,"borrower":"Test borrower","loan_date":"2026-10-01"}),
    )
    .unwrap();
    assert_eq!(
        s.snapshot("", false).unwrap()["loans"][0]["copy_id"],
        second
    );
    assert!(s.mutate("trash", &json!({"ids":[second]})).is_err());
    s.mutate(
        "bulk",
        &json!({"ids":[first,second],"field":"location_id","value":""}),
    )
    .unwrap();
    let stamp: String = s
        .conn()
        .unwrap()
        .query_row(
            "SELECT updated_at FROM editions WHERE id=?",
            [edition],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(stamp, "unchanged-edition");
    assert_eq!(
        books.iter().find(|b| b["id"] == first).unwrap()["condition"],
        "Very Good"
    );
    assert_eq!(
        books.iter().find(|b| b["id"] == second).unwrap()["copy_extra"]["currency"],
        "USD"
    );
}

#[test]
fn typed_locations_block_occupied_archived_and_parent_deletion() {
    let (_dir, s) = store();
    for (key, name, parent, kind) in [
        ("r", "Study", "", "Room"),
        ("c", "Case", "r", "Bookcase"),
        ("s", "Shelf", "c", "Shelf"),
    ] {
        s.mutate("entity",&json!({"table":"locations","id":key,"name":name,"parent_id":parent,"extra":{"kind":kind}})).unwrap();
    }
    assert!(s.mutate("entity",&json!({"table":"locations","name":"Invalid shelf","parent_id":"r","extra":{"kind":"Shelf"}})).is_err());
    let mut b = book("Located");
    b["location_id"] = json!("s");
    let key = s.save(&b).unwrap();
    assert!(s.mutate("delete_location", &json!({"id":"r"})).is_err());
    assert!(s.mutate("delete_location", &json!({"id":"s"})).is_err());
    s.mutate("trash", &json!({"ids":[key]})).unwrap();
    assert!(s.mutate("delete_location", &json!({"id":"s"})).is_err());
    s.mutate("untrash", &json!({"ids":[key]})).unwrap();
    assert!(s
        .mutate(
            "move_copies",
            &json!({"ids":[key,"missing"],"location_id":""})
        )
        .is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["location_id"],
        "s"
    );
    s.mutate("move_copies", &json!({"ids":[key],"location_id":""}))
        .unwrap();
    s.mutate("delete_location", &json!({"id":"s"})).unwrap();
    assert_eq!(
        s.snapshot("", false).unwrap()["locations"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
}

#[test]
fn catalogue_import_preserves_edition_groups_without_merging_existing_data() {
    let (_dir, s) = store();
    let mut a = book("Shared edition");
    a["transfer"] = json!({"edition_key":"source-edition","location":["Study","Case","Shelf"],"location_kinds":["Room","Bookcase","Shelf"],"fields":[]});
    a["copy_extra"] = json!({"inventory_code":"Copy #1"});
    let mut b = a.clone();
    b["condition"] = json!("Poor");
    b["copy_extra"] = json!({"inventory_code":"Copy #2"});
    s.import(&[a.clone(), b.clone()]).unwrap();
    let before = s.snapshot("", false).unwrap();
    assert_eq!(
        before["books"][0]["edition_id"],
        before["books"][1]["edition_id"]
    );
    s.import(&[a.clone(), b.clone()]).unwrap();
    assert_eq!(
        s.conn()
            .unwrap()
            .query_row("SELECT count(*) FROM editions", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        2
    );
    b["title"] = json!("Conflicting edition");
    assert!(s.import(&[a, b]).is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        4
    );
}

#[test]
fn current_database_copy_remains_editable_without_remigration() {
    let (dir, original) = store();
    let key = original.save(&book("Legacy copy")).unwrap();
    let root = dir.path().join("compatibility-copy");
    std::fs::create_dir(&root).unwrap();
    original
        .conn()
        .unwrap()
        .backup("main", root.join("library.sqlite3"), None)
        .unwrap();
    let copy = Store::open(root).unwrap();
    let mut b = copy.snapshot("", false).unwrap()["books"][0].clone();
    assert_eq!(b["copy_number"], 1);
    b["condition"] = json!("Like New");
    copy.mutate("save_copy", &b).unwrap();
    assert_eq!(
        copy.snapshot("", false).unwrap()["books"][0]["copy_extra"]["inventory_code"],
        "Copy #1"
    );
    assert_eq!(copy.snapshot("", false).unwrap()["books"][0]["id"], key);
    assert_eq!(
        copy.conn()
            .unwrap()
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        mylibrary_lib::migrations::CURRENT_SCHEMA
    );
    assert_eq!(
        original.snapshot("", false).unwrap()["books"][0]["condition"],
        "Good"
    );
}

#[test]
fn malformed_manifest_and_missing_assets_leave_current_library_untouched() {
    use std::io::Write;
    let (dir, s) = store();
    s.save(&book("Keep current library")).unwrap();
    let before = s.snapshot("", false).unwrap();
    for (filename, manifest) in [
        (
            "wrong.zip",
            json!({"application":"Other","format":1,"schema":1}),
        ),
        (
            "future.zip",
            json!({"application":"MyLibrary","format":1,"schema":999}),
        ),
    ] {
        let path = dir.path().join(filename);
        let mut zip = zip::ZipWriter::new(std::fs::File::create(&path).unwrap());
        zip.start_file("manifest.json", zip::write::SimpleFileOptions::default())
            .unwrap();
        zip.write_all(manifest.to_string().as_bytes()).unwrap();
        zip.finish().unwrap();
        assert!(s.restore(&path).is_err());
        assert_eq!(s.snapshot("", false).unwrap(), before);
    }
    let (_other_dir, other) = store();
    let mut b = book("Missing cover");
    b["cover"] = json!("covers/missing.png");
    other.save(&b).unwrap();
    let archive = dir.path().join("missing-asset.zip");
    other.backup(&archive).unwrap();
    assert!(s.restore(&archive).is_err());
    assert_eq!(s.snapshot("", false).unwrap(), before);
}

#[test]
fn hostile_trigger_backup_fixture_fails_restore_and_protects_library() {
    use std::io::Write;
    let (dir, s) = store();
    s.save(&book("Safe Book")).unwrap();
    s.conn()
        .unwrap()
        .execute(
            "INSERT INTO settings(key, value) VALUES('app_version', '2.0.0') ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            [],
        )
        .unwrap();
    let before_snapshot = s.snapshot("", false).unwrap();

    // Create a base backup
    let base_archive = dir.path().join("base.zip");
    s.backup(&base_archive).unwrap();

    // Create a synthetic backup containing the hostile trigger fixture
    let hostile_archive = dir.path().join("hostile-trigger.zip");
    let mut zip_in = zip::ZipArchive::new(std::fs::File::open(&base_archive).unwrap()).unwrap();
    let mut zip_out = zip::ZipWriter::new(std::fs::File::create(&hostile_archive).unwrap());
    let opts = zip::write::SimpleFileOptions::default();

    for i in 0..zip_in.len() {
        let mut file = zip_in.by_index(i).unwrap();
        let name = file.name().to_string();
        zip_out.start_file(&name, opts).unwrap();
        if name == "library.sqlite3" {
            let temp_db_path = dir.path().join("temp-hostile.sqlite3");
            let mut temp_file = std::fs::File::create(&temp_db_path).unwrap();
            std::io::copy(&mut file, &mut temp_file).unwrap();
            drop(temp_file);

            // Inject the harmless malicious trigger fixture
            let c = rusqlite::Connection::open(&temp_db_path).unwrap();
            c.execute_batch(include_str!("fixtures/hostile-trigger.sql"))
                .unwrap();

            // Verify that integrity_check, foreign_key_check, and table probes pass
            let check: String = c
                .query_row("PRAGMA integrity_check", [], |r| r.get(0))
                .unwrap();
            assert_eq!(check, "ok");
            let foreign: bool = c
                .prepare("PRAGMA foreign_key_check")
                .unwrap()
                .exists([])
                .unwrap();
            assert!(!foreign);
            c.prepare("SELECT * FROM entries LIMIT 0").unwrap();

            drop(c);
            let mut injected_bytes = std::fs::read(&temp_db_path).unwrap();
            zip_out.write_all(&mut injected_bytes).unwrap();
        } else {
            std::io::copy(&mut file, &mut zip_out).unwrap();
        }
    }
    zip_out.finish().unwrap();

    // Store::restore must reject the hostile database
    let result = s.restore(&hostile_archive);
    assert!(
        result.is_err(),
        "Restore must reject database with hostile trigger"
    );
    let err_msg = result.unwrap_err().to_string();
    assert!(
        err_msg.contains("unsupported schema objects") && err_msg.contains("trigger"),
        "Error should mention unsupported schema objects and trigger, got: {err_msg}"
    );

    // Live library remains completely untouched
    assert_eq!(s.snapshot("", false).unwrap(), before_snapshot);
    let app_version: String = s
        .conn()
        .unwrap()
        .query_row(
            "SELECT value FROM settings WHERE key='app_version'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(app_version, "2.0.0");

    // Later note insert on the live library must not activate any trigger
    let book_id = before_snapshot["books"][0]["id"].as_str().unwrap();
    s.mutate(
        "entry",
        &json!({
            "copy_id": book_id,
            "kind": "note",
            "content": "A perfectly safe note"
        }),
    )
    .unwrap();
    let app_version_after: String = s
        .conn()
        .unwrap()
        .query_row(
            "SELECT value FROM settings WHERE key='app_version'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(
        app_version_after, "2.0.0",
        "Settings must not be compromised because trigger was never installed"
    );
}

#[test]
fn hostile_views_tables_and_indexes_are_rejected_on_restore() {
    use std::io::Write;
    let (dir, s) = store();
    s.save(&book("Protected Library")).unwrap();
    let base_archive = dir.path().join("base_for_views.zip");
    s.backup(&base_archive).unwrap();
    let before_snapshot = s.snapshot("", false).unwrap();

    for (case_name, sql, expected_err_part) in [
        (
            "hostile_view.zip",
            "CREATE VIEW hostile_view AS SELECT * FROM settings;",
            "view",
        ),
        (
            "hostile_table.zip",
            "CREATE TABLE hostile_table(payload TEXT);",
            "unsupported table",
        ),
        (
            "hostile_index.zip",
            "CREATE INDEX hostile_idx ON entries(title);",
            "unsupported index",
        ),
    ] {
        let bad_archive = dir.path().join(case_name);
        let mut zip_in = zip::ZipArchive::new(std::fs::File::open(&base_archive).unwrap()).unwrap();
        let mut zip_out = zip::ZipWriter::new(std::fs::File::create(&bad_archive).unwrap());
        let opts = zip::write::SimpleFileOptions::default();

        for i in 0..zip_in.len() {
            let mut file = zip_in.by_index(i).unwrap();
            let name = file.name().to_string();
            zip_out.start_file(&name, opts).unwrap();
            if name == "library.sqlite3" {
                let temp_db = dir.path().join(format!("temp-{case_name}.sqlite3"));
                let mut temp_file = std::fs::File::create(&temp_db).unwrap();
                std::io::copy(&mut file, &mut temp_file).unwrap();
                drop(temp_file);

                let c = rusqlite::Connection::open(&temp_db).unwrap();
                c.execute_batch(sql).unwrap();
                drop(c);

                let mut injected = std::fs::read(&temp_db).unwrap();
                zip_out.write_all(&mut injected).unwrap();
            } else {
                std::io::copy(&mut file, &mut zip_out).unwrap();
            }
        }
        zip_out.finish().unwrap();

        let res = s.restore(&bad_archive);
        assert!(res.is_err(), "Case {case_name} should fail restore");
        let err_str = res.unwrap_err().to_string();
        assert!(
            err_str.contains(expected_err_part),
            "Expected '{expected_err_part}' in error message, got: {err_str}"
        );
        assert_eq!(s.snapshot("", false).unwrap(), before_snapshot);
    }
}

#[test]
fn malformed_import_field_definitions_are_rejected_without_panic_and_store_usable() {
    let (_dir, s) = store();
    let initial_key = s.save(&book("Baseline")).unwrap();

    // Case 1: Boolean field entry (exact triggering input from finding F4)
    let bad_boolean = json!({
        "title": "Example",
        "custom": { "": "x" },
        "transfer": { "fields": [true] }
    });
    let err_bool = s.import(&[bad_boolean]);
    assert!(err_bool.is_err());
    // Verify Store remains usable after rejection
    let key1 = s.save(&book("After Boolean Error")).unwrap();
    assert!(!key1.is_empty());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        2
    );

    // Case 2: Null field entry
    let bad_null = json!({
        "title": "Example",
        "custom": { "k": "v" },
        "transfer": { "fields": [null] }
    });
    let err_null = s.import(&[bad_null]);
    assert!(err_null.is_err());
    // Verify Store remains usable
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        2
    );

    // Case 3: String field entry
    let bad_string = json!({
        "title": "Example",
        "custom": { "k": "v" },
        "transfer": { "fields": ["not an object"] }
    });
    let err_str = s.import(&[bad_string]);
    assert!(err_str.is_err());
    // Verify Store remains usable
    let key2 = s.save(&book("After String Error")).unwrap();
    assert!(!key2.is_empty());

    // Case 4: Malformed object: empty name
    let bad_obj_empty_name = json!({
        "title": "Example",
        "custom": { "k": "v" },
        "transfer": { "fields": [{"name": "", "kind": "text"}] }
    });
    let err_empty_name = s.import(&[bad_obj_empty_name]);
    assert!(err_empty_name.is_err());
    // Verify Store remains usable
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        3
    );

    // Case 5: Malformed object: invalid kind
    let bad_obj_invalid_kind = json!({
        "title": "Example",
        "custom": { "k": "v" },
        "transfer": { "fields": [{"name": "Rating Note", "kind": "unsupported_kind"}] }
    });
    let err_invalid_kind = s.import(&[bad_obj_invalid_kind]);
    assert!(err_invalid_kind.is_err());
    // Verify Store remains usable
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        3
    );

    // Case 6: Malformed transfer fields: not an array
    let bad_fields_scalar = json!({
        "title": "Example",
        "custom": { "k": "v" },
        "transfer": { "fields": "scalar value" }
    });
    let err_scalar = s.import(&[bad_fields_scalar]);
    assert!(err_scalar.is_err());
    // Verify Store remains usable
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        3
    );

    // Case 7: Valid field definition must succeed and create field + value
    let valid_import = json!({
        "title": "Valid Imported Book",
        "custom": { "f1": "Stored Note" },
        "transfer": {
            "fields": [
                {
                    "id": "f1",
                    "name": "Imported Note Field",
                    "kind": "text"
                }
            ]
        }
    });
    let imported_count = s.import(&[valid_import]).unwrap();
    assert_eq!(imported_count, 1);

    // Verify the custom field was created in database and value saved
    let snap = s.snapshot("Valid Imported", false).unwrap();
    let imported_book = &snap["books"][0];
    assert_eq!(imported_book["title"], "Valid Imported Book");
    let field_id = snap["fields"]
        .as_array()
        .unwrap()
        .iter()
        .find(|f| f["name"] == "Imported Note Field")
        .expect("Custom field should exist")["id"]
        .as_str()
        .unwrap();
    assert_eq!(imported_book["custom"][field_id], "Stored Note");

    // Initial book still exists
    assert!(snap["books"]
        .as_array()
        .unwrap()
        .iter()
        .any(|b| b["id"] == initial_key));
}
