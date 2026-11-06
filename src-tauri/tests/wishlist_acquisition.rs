use mylibrary_lib::{
    db::Store,
    migrations,
    wishlist::{validate_database, Draft},
    wishlist_acquisition::Request,
};
use rusqlite::{params, Connection};
use serde_json::{json, Value};

fn library() -> (tempfile::TempDir, Store, Draft) {
    let root = tempfile::tempdir().unwrap();
    let s = Store::open(root.path().to_path_buf()).unwrap();
    let wish: Draft = serde_json::from_value(json!({"id":"","edition_id":null,"title":"Acquisition wish","author":"Synthetic author","isbn10":"0306406152","isbn13":"9780306406157","preference":"Specific","edition_description":"Hardback","priority":"High","status":"On Order","target_minor":"1234","currency":"TRY","notes":"private original","archived":false,"updated_at":"","retailers":[{"id":uuid::Uuid::new_v4().to_string(),"name":"Synthetic retailer","url":"https://shop.example/book","offer_minor":"2500","currency":"TRY","notes":"retailer note"}]})).unwrap();
    s.wishlist_save(&wish, None).unwrap();
    let d = load(&s);
    (root, s, d)
}
fn load(s: &Store) -> Draft {
    serde_json::from_value(s.wishlist_list("").unwrap()["items"][0]["draft"].clone()).unwrap()
}
fn request(d: &Draft, edition: Option<&str>) -> Request {
    serde_json::from_value(json!({"item":d.id,"updated_at":d.updated_at,"edition_id":edition,"title":d.title,"author":d.author,"isbn10":d.isbn10,"isbn13":d.isbn13,"physical":{"barcode":"M3C synthetic","inventory_code":"Acquired #1","source":"Synthetic shop","acquisition_date":"2026-11-06","condition":"New","location_id":""}})).unwrap()
}
fn token(s: &Store, r: &Request) -> String {
    s.wishlist_acquisition(r, None).unwrap()["review_token"]
        .as_str()
        .unwrap()
        .into()
}
fn confirm(s: &Store, r: &Request) -> Value {
    s.wishlist_acquisition(r, Some(&token(s, r))).unwrap()
}
fn table(c: &Connection, name: &str) -> Vec<Vec<rusqlite::types::Value>> {
    let mut q = c
        .prepare(&format!("SELECT * FROM {name} ORDER BY rowid"))
        .unwrap();
    let n = q.column_count();
    let rows = q
        .query_map([], |r| (0..n).map(|i| r.get(i)).collect())
        .unwrap()
        .collect::<rusqlite::Result<_>>()
        .unwrap();
    rows
}
fn healthy(s: &Store) {
    let c = s.conn().unwrap();
    assert_eq!(
        c.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "ok"
    );
    assert!(!c
        .prepare("PRAGMA foreign_key_check")
        .unwrap()
        .exists([])
        .unwrap());
    assert_eq!(
        c.query_row("PRAGMA foreign_keys", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        1
    );
    validate_database(&c).unwrap();
}
#[test]
fn previews_cancel_without_writes_then_new_edition_acquisition_preserves_intent() {
    let (_root, s, d) = library();
    let r = request(&d, None);
    let original = s.wishlist_list("").unwrap();
    let c = s.conn().unwrap();
    let history = table(&c, "wishlist_status_history");
    let retailers = table(&c, "wishlist_retailers");
    for _ in 0..3 {
        token(&s, &r);
    }
    assert_eq!(s.wishlist_list("").unwrap(), original);
    assert!(s.snapshot("", false).unwrap()["books"]
        .as_array()
        .unwrap()
        .is_empty());
    let result = confirm(&s, &r);
    let books = s.snapshot("", false).unwrap()["books"].clone();
    assert_eq!(books.as_array().unwrap().len(), 1);
    assert_eq!(books[0]["id"], result["copy_id"]);
    assert_eq!(books[0]["title"], d.title);
    assert_eq!(books[0]["copy_extra"]["ownership"], "Owned");
    assert_eq!(books[0]["condition"], "New");
    assert_eq!(books[0]["copy_extra"]["inventory_code"], "Acquired #1");
    let mut after = load(&s);
    after.updated_at = d.updated_at.clone();
    assert_eq!(after, d);
    assert_eq!(table(&c, "wishlist_status_history"), history);
    assert_eq!(table(&c, "wishlist_retailers"), retailers);
    assert_eq!(s.wishlist_active_count().unwrap(), 0);
    let state = s.wishlist_list("Acquisition").unwrap();
    assert_eq!(state["budget"], json!([]));
    assert_eq!(state["missing_prices"], 0);
    assert_eq!(state["items"][0]["history"][1]["status"], "Purchased");
    healthy(&s);
}
#[test]
fn existing_edition_and_all_preexisting_copies_are_unchanged() {
    let (_root, s, d) = library();
    let first=s.save(&json!({"title":"Owned Edition","isbn13":"9780306406157","contributors":[{"name":"Original author","role":"Author"}],"extra":{"synopsis":"Keep"},"copy_extra":{"ownership":"Borrowed"}})).unwrap();
    let edition = s.snapshot("", false).unwrap()["books"][0]["edition_id"]
        .as_str()
        .unwrap()
        .to_owned();
    s.mutate("add_copy",&json!({"edition_id":edition,"condition":"Poor","barcode":"other","copy_extra":{"personal_notes":"Keep"}})).unwrap();
    let before = s.snapshot("", false).unwrap()["books"].clone();
    let metadata = table(&s.conn().unwrap(), "editions");
    let r = request(&d, Some(&edition));
    let result = confirm(&s, &r);
    assert_ne!(result["copy_id"], first);
    let after = s.snapshot("", false).unwrap()["books"].clone();
    assert_eq!(after.as_array().unwrap().len(), 3);
    for b in before.as_array().unwrap() {
        assert!(after.as_array().unwrap().contains(b));
    }
    assert_eq!(table(&s.conn().unwrap(), "editions"), metadata);
    healthy(&s);
}
#[test]
fn repeated_concurrent_and_old_cycle_requests_never_duplicate() {
    let (_root, s, d) = library();
    let r = request(&d, None);
    let t = token(&s, &r);
    let results = std::thread::scope(|scope| {
        let a = scope.spawn(|| s.wishlist_acquisition(&r, Some(&t)));
        let b = scope.spawn(|| s.wishlist_acquisition(&r, Some(&t)));
        [a.join().unwrap(), b.join().unwrap()]
    });
    assert_eq!(results.iter().filter(|r| r.is_ok()).count(), 1);
    assert!(s.wishlist_acquisition(&r, Some(&t)).is_err());
    let state = s.wishlist_list("").unwrap();
    let current = load(&s);
    s.wishlist_reopen_acquisition(
        &d.id,
        &current.updated_at,
        state["items"][0]["acquisition"]["id"].as_str().unwrap(),
    )
    .unwrap();
    assert!(s.wishlist_acquisition(&r, Some(&t)).is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    let next = request(&load(&s), None);
    confirm(&s, &next);
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    healthy(&s);
}
#[test]
fn stale_wish_and_tampered_or_missing_confirmation_are_rejected() {
    let (_root, s, d) = library();
    let mut r = request(&d, None);
    let t = token(&s, &r);
    r.title = "Changed after review".into();
    assert!(s.wishlist_acquisition(&r, Some(&t)).is_err());
    assert!(s.wishlist_acquisition(&r, Some("")).is_err());
    let mut changed = d.clone();
    changed.notes = "Concurrent change".into();
    s.wishlist_save(&changed, None).unwrap();
    assert!(s
        .wishlist_acquisition(&request(&d, None), Some(&t))
        .is_err());
    assert!(s.snapshot("", false).unwrap()["books"]
        .as_array()
        .unwrap()
        .is_empty());
}
#[test]
fn missing_conflicting_and_edited_editions_reject_safely() {
    let (_root, s, d) = library();
    assert!(s
        .wishlist_acquisition(&request(&d, Some("missing")), None)
        .is_err());
    let key = s
        .save(&json!({"title":"Original","isbn13":"9791090636071"}))
        .unwrap();
    let mut book = s.snapshot("", false).unwrap()["books"][0].clone();
    let edition = book["edition_id"].as_str().unwrap().to_owned();
    assert!(s
        .wishlist_acquisition(&request(&d, Some(&edition)), None)
        .is_err());
    book["isbn13"] = json!(d.isbn13);
    s.save(&book).unwrap();
    let r = request(&d, Some(&edition));
    let t = token(&s, &r);
    book["title"] = json!("Changed after review");
    s.save(&book).unwrap();
    assert!(s.wishlist_acquisition(&r, Some(&t)).is_err());
    let t = token(&s, &r);
    let c = s.conn().unwrap();
    c.execute("DELETE FROM change_history WHERE copy_id=?", [&key])
        .unwrap();
    c.execute("DELETE FROM copies WHERE id=?", [&key]).unwrap();
    c.execute("DELETE FROM editions WHERE id=?", [&edition])
        .unwrap();
    assert!(s.wishlist_acquisition(&r, Some(&t)).is_err());
    assert!(table(&c, "wishlist_acquisitions").is_empty());
}
#[test]
fn failed_relationship_write_rolls_back_edition_copy_sources_history_and_wish() {
    let (_root, s, d) = library();
    let r = request(&d, None);
    let t = token(&s, &r);
    let c = s.conn().unwrap();
    let before = s.wishlist_list("").unwrap();
    c.execute_batch("CREATE TRIGGER synthetic_failure BEFORE INSERT ON wishlist_acquisitions BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;").unwrap();
    assert!(s.wishlist_acquisition(&r, Some(&t)).is_err());
    for name in [
        "editions",
        "copies",
        "contributors",
        "people",
        "acquisition_sources",
        "change_history",
        "book_search",
        "wishlist_acquisitions",
    ] {
        assert!(table(&c, name).is_empty(), "{name}");
    }
    assert_eq!(s.wishlist_list("").unwrap(), before);
    healthy(&s);
}
#[test]
fn invalid_physical_fields_roll_back_new_edition_and_reject_legacy_ownership_payloads() {
    let (_root, s, d) = library();
    for (condition, date, location) in [
        ("Unknown", "", ""),
        ("New", "invalid", ""),
        ("Good", "", "missing"),
    ] {
        let mut r = request(&d, None);
        r.physical.condition = condition.into();
        r.physical.acquisition_date = date.into();
        r.physical.location_id = location.into();
        assert!(s.wishlist_acquisition(&r, Some(&token(&s, &r))).is_err());
        assert!(table(&s.conn().unwrap(), "editions").is_empty());
    }
    let mut raw = serde_json::to_value(request(&d, None)).unwrap();
    raw["physical"]["copy_extra"] = json!({"ownership":"Wishlist"});
    assert!(serde_json::from_value::<Request>(raw).is_err());
    healthy(&s);
}
#[test]
fn safe_reopen_keeps_inventory_and_history_then_round_trips_backup_and_reopen() {
    let (root, s, d) = library();
    let result = confirm(&s, &request(&d, None));
    let before = s.snapshot("", false).unwrap()["books"].clone();
    let mut bad = load(&s);
    bad.status = "Cancelled".into();
    assert!(s.wishlist_save(&bad, None).is_err());
    assert!(s
        .wishlist_reopen_acquisition(
            &d.id,
            &d.updated_at,
            result["acquisition"].as_str().unwrap()
        )
        .is_err());
    let active_zip = root.path().join("active.zip");
    s.backup(&active_zip).unwrap();
    let target_root = tempfile::tempdir().unwrap();
    let target = Store::open(target_root.path().to_path_buf()).unwrap();
    target.restore(&active_zip).unwrap();
    assert_eq!(
        target.wishlist_list("").unwrap(),
        s.wishlist_list("").unwrap()
    );
    assert_eq!(target.snapshot("", false).unwrap()["books"], before);
    let updated = load(&s).updated_at;
    s.wishlist_reopen_acquisition(&d.id, &updated, result["acquisition"].as_str().unwrap())
        .unwrap();
    assert!(s
        .wishlist_reopen_acquisition(&d.id, &updated, result["acquisition"].as_str().unwrap())
        .is_err());
    assert_eq!(s.snapshot("", false).unwrap()["books"], before);
    assert_eq!(load(&s).status, "Wishing");
    assert_eq!(s.wishlist_active_count().unwrap(), 1);
    assert_eq!(
        s.wishlist_list("").unwrap()["budget"],
        json!([{"currency":"TRY","minor":"1234"}])
    );
    assert!(s.wishlist_list("").unwrap()["items"][0]["history"]
        .as_array()
        .unwrap()
        .iter()
        .any(|e| e["status"] == "Reopened"));
    let zip = root.path().join("reopened.zip");
    s.backup(&zip).unwrap();
    target.restore(&zip).unwrap();
    let expected = s.wishlist_list("").unwrap();
    drop(target);
    let reopened = Store::open(target_root.path().to_path_buf()).unwrap();
    assert_eq!(reopened.wishlist_list("").unwrap(), expected);
    healthy(&reopened);
}
#[test]
fn archived_and_cancelled_wishes_are_ineligible() {
    for archived in [false, true] {
        let (_root, s, mut d) = library();
        d.archived = archived;
        if !archived {
            d.status = "Cancelled".into();
        }
        s.wishlist_save(&d, None).unwrap();
        assert!(s
            .wishlist_acquisition(&request(&load(&s), None), None)
            .is_err());
    }
}
#[test]
fn populated_v1_through_v4_upgrade_preserves_every_original_row() {
    for version in 1..=4 {
        let root = tempfile::tempdir().unwrap();
        let path = root.path().join("library.sqlite3");
        let mut c = Connection::open(&path).unwrap();
        c.execute_batch(include_str!("fixtures/v1-schema.sql"))
            .unwrap();
        c.execute_batch(include_str!("fixtures/v1-library.sql"))
            .unwrap();
        if version >= 2 {
            c.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'v1'),(2,'v2'); PRAGMA user_version=2;").unwrap();
        }
        if version >= 3 {
            c.execute_batch("INSERT INTO schema_migrations VALUES(3,'v3'); PRAGMA user_version=3;")
                .unwrap();
        }
        if version >= 4 {
            c.execute_batch(include_str!("../src/wishlist-schema.sql"))
                .unwrap();
            let wish = uuid::Uuid::new_v4().to_string();
            let time = "2026-11-06T00:00:00Z";
            c.execute("INSERT INTO wishlist_items VALUES(?,NULL,'Wish','Author','','','Any','','High','Wishing',1234,'TRY','Keep',NULL,?,?)",params![wish,time,time]).unwrap();
            c.execute(
                "INSERT INTO wishlist_status_history VALUES(?,?,'Wishing',?)",
                params![uuid::Uuid::new_v4().to_string(), wish, time],
            )
            .unwrap();
            c.execute("INSERT INTO wishlist_retailers VALUES(?,?,'Shop','https://shop.example',1234,'TRY','Keep',0)",params![uuid::Uuid::new_v4().to_string(),wish]).unwrap();
            c.execute(
                "INSERT INTO wishlist_search VALUES(?,'Wish Author  ')",
                [&wish],
            )
            .unwrap();
        }
        let names = [
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
        ];
        let before: Vec<_> = names.iter().map(|n| table(&c, n)).collect();
        let wishes: Vec<_> = if version == 4 {
            [
                "wishlist_items",
                "wishlist_retailers",
                "wishlist_status_history",
                "wishlist_search",
            ]
            .iter()
            .map(|n| table(&c, n))
            .collect()
        } else {
            vec![]
        };
        migrations::migrate(&mut c, root.path()).unwrap();
        assert_eq!(
            before,
            names.iter().map(|n| table(&c, n)).collect::<Vec<_>>()
        );
        if version == 4 {
            assert_eq!(
                wishes,
                [
                    "wishlist_items",
                    "wishlist_retailers",
                    "wishlist_status_history",
                    "wishlist_search"
                ]
                .iter()
                .map(|n| table(&c, n))
                .collect::<Vec<_>>()
            );
        }
        assert_eq!(
            c.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            5
        );
        assert!(table(&c, "wishlist_acquisitions").is_empty());
        validate_database(&c).unwrap();
        assert!(!c
            .prepare("PRAGMA foreign_key_check")
            .unwrap()
            .exists([])
            .unwrap());
        migrations::migrate(&mut c, root.path()).unwrap();
        assert_eq!(
            std::fs::read_dir(root.path().join("backups"))
                .unwrap()
                .count(),
            1
        );
    }
}
#[test]
fn failed_v5_migration_preserves_v4_and_preupgrade_snapshot() {
    let root = tempfile::tempdir().unwrap();
    let mut c = Connection::open(root.path().join("library.sqlite3")).unwrap();
    c.execute_batch(include_str!("fixtures/v1-schema.sql"))
        .unwrap();
    c.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'a'),(2,'b'),(3,'c'),(5,'conflict');").unwrap();
    c.execute_batch(include_str!("../src/wishlist-schema.sql"))
        .unwrap();
    let before = table(&c, "schema_migrations");
    assert!(migrations::migrate(&mut c, root.path()).is_err());
    assert_eq!(table(&c, "schema_migrations"), before);
    assert_eq!(
        c.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        4
    );
    assert!(c.prepare("SELECT * FROM wishlist_acquisitions").is_err());
    assert_eq!(
        std::fs::read_dir(root.path().join("backups"))
            .unwrap()
            .count(),
        1
    );
}
#[test]
fn corrupt_acquisition_history_is_rejected_before_restore_replaces_live_data() {
    for sql in ["UPDATE wishlist_acquisitions SET acquired_at='invalid'","UPDATE wishlist_acquisitions SET reopened_at='2000-01-01T00:00:00Z'","UPDATE wishlist_items SET status='Cancelled'; UPDATE wishlist_status_history SET status='Cancelled'"] {
        let (root,s,d)=library(); confirm(&s,&request(&d,None)); s.conn().unwrap().execute_batch(sql).unwrap();
        let zip=root.path().join("bad.zip"); s.backup(&zip).unwrap();
        let (_keep,target,_d)=library(); let before=target.wishlist_list("").unwrap();
        assert!(target.restore(&zip).is_err(),"{sql}"); assert_eq!(target.wishlist_list("").unwrap(),before); healthy(&target);
    }
}

#[test]
fn clock_rollback_keeps_acquire_reopen_history_restorable() {
    let (root, s, d) = library();
    s.conn()
        .unwrap()
        .execute(
            "UPDATE wishlist_items SET updated_at='2099-01-01T00:00:00Z' WHERE id=?",
            [&d.id],
        )
        .unwrap();
    let future = load(&s);
    let result = confirm(&s, &request(&future, None));
    let acquired = s.wishlist_list("").unwrap()["items"][0]["acquisition"]["acquired_at"]
        .as_str()
        .unwrap()
        .to_owned();
    assert!(
        chrono::DateTime::parse_from_rfc3339(&acquired).unwrap()
            > chrono::DateTime::parse_from_rfc3339(&future.updated_at).unwrap()
    );
    s.wishlist_reopen_acquisition(
        &d.id,
        &load(&s).updated_at,
        result["acquisition"].as_str().unwrap(),
    )
    .unwrap();
    healthy(&s);
    let zip = root.path().join("clock-rollback.zip");
    s.backup(&zip).unwrap();
    let target_root = tempfile::tempdir().unwrap();
    let target = Store::open(target_root.path().to_path_buf()).unwrap();
    target.restore(&zip).unwrap();
    assert_eq!(
        target.wishlist_list("").unwrap(),
        s.wishlist_list("").unwrap()
    );
}

#[test]
fn acquisition_history_invalidates_old_consent_even_when_wish_and_clock_match() {
    let (_root, s, mut d) = library();
    d.status = "Wishing".into();
    s.wishlist_save(&d, None).unwrap();
    let original = load(&s);
    let r = request(&original, None);
    let old_token = token(&s, &r);
    let acquired = s.wishlist_acquisition(&r, Some(&old_token)).unwrap();
    s.wishlist_reopen_acquisition(
        &d.id,
        &load(&s).updated_at,
        acquired["acquisition"].as_str().unwrap(),
    )
    .unwrap();
    s.conn()
        .unwrap()
        .execute(
            "UPDATE wishlist_items SET updated_at=? WHERE id=?",
            params![original.updated_at, d.id],
        )
        .unwrap();
    assert_eq!(load(&s), original);
    assert_ne!(token(&s, &r), old_token);
    assert!(s.wishlist_acquisition(&r, Some(&old_token)).is_err());
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    healthy(&s);
}

#[test]
fn timeline_orders_valid_mixed_offset_history_by_instant() {
    let (_root, s, d) = library();
    let c = s.conn().unwrap();
    c.execute(
        "UPDATE wishlist_status_history SET created_at='2026-11-06T03:00:00+03:00'",
        [],
    )
    .unwrap();
    c.execute(
        "INSERT INTO wishlist_status_history VALUES(?,?,'On Order','2026-11-06T01:00:00Z')",
        params![uuid::Uuid::new_v4().to_string(), d.id],
    )
    .unwrap();
    let state = s.wishlist_list("").unwrap();
    assert_eq!(
        state["items"][0]["history"][0]["created_at"],
        "2026-11-06T03:00:00+03:00"
    );
    healthy(&s);
}
