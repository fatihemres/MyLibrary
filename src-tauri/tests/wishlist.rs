use mylibrary_lib::{
    db::Store,
    migrations,
    wishlist::{minor, retailer_url, validate_database, Draft, Retailer},
};
use rusqlite::Connection;
use serde_json::{json, Value};
fn store() -> (tempfile::TempDir, Store) {
    let dir = tempfile::tempdir().unwrap();
    let s = Store::open(dir.path().to_path_buf()).unwrap();
    (dir, s)
}
fn draft() -> Draft {
    serde_json::from_value(json!({"id":"","edition_id":null,"title":"İnce Işık","author":"İhsan","isbn10":"","isbn13":"","preference":"Specific","edition_description":"Ciltli özel baskı","priority":"High","status":"Wishing","target_minor":"1234","currency":"TRY","notes":"private","archived":false,"updated_at":"","retailers":[]})).unwrap()
}
fn load(s: &Store) -> Draft {
    serde_json::from_value(s.wishlist_list("").unwrap()["items"][0]["draft"].clone()).unwrap()
}
fn save(s: &Store, d: &Draft) -> Value {
    let r = s.wishlist_save(d, None).unwrap();
    if r["saved"] == false {
        s.wishlist_save(d, r["review_token"].as_str()).unwrap()
    } else {
        r
    }
}
#[test]
fn independent_identity_and_search_do_not_create_inventory() {
    let (_dir, s) = store();
    let d = draft();
    let r = save(&s, &d);
    assert_eq!(r["saved"], true);
    let c = s.conn().unwrap();
    for table in ["editions", "copies", "book_search"] {
        assert_eq!(
            c.query_row(&format!("SELECT count(*) FROM {table}"), [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            0
        );
    }
    for q in ["ince", "IŞIK", "ihsan", "inc ihs"] {
        assert_eq!(
            s.wishlist_list(q).unwrap()["items"]
                .as_array()
                .unwrap()
                .len(),
            1,
            "{q}"
        );
    }
    assert!(s.wishlist_list("a\0b").is_err());
    assert_eq!(load(&s).title, "İnce Işık");
    let mut d = load(&s);
    d.title = "Diyarbakır".into();
    save(&s, &d);
    assert_eq!(
        s.wishlist_list("Diyarbakir").unwrap()["items"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(
        s.wishlist_list("ince").unwrap()["items"]
            .as_array()
            .unwrap()
            .len(),
        0
    );
}
#[test]
fn duplicates_are_fresh_and_no_implicit_link() {
    let (_dir, s) = store();
    let d = draft();
    save(&s, &d);
    let review = s.wishlist_save(&d, None).unwrap();
    assert_eq!(review["saved"], false);
    let mut changed = load(&s);
    changed.archived = true;
    save(&s, &changed);
    let fresh = s
        .wishlist_save(&d, review["review_token"].as_str())
        .unwrap();
    assert_eq!(fresh["saved"], false);
    assert_eq!(fresh["review"][0]["archived"], true);
    assert_eq!(
        s.wishlist_save(&d, fresh["review_token"].as_str()).unwrap()["saved"],
        true
    );
    assert_eq!(
        s.wishlist_list("").unwrap()["items"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    assert!(s.wishlist_save(&changed, None).is_err());
}
#[test]
fn edition_link_is_optional_explicit_and_mismatch_rejected() {
    let (_dir, s) = store();
    let key=s.save(&json!({"title":"Owned","isbn13":"9780306406157","contributors":[],"terms":{},"extra":{},"copy_extra":{}})).unwrap();
    let snap = s.snapshot("", false).unwrap();
    let edition = snap["books"][0]["edition_id"].as_str().unwrap();
    let mut d = draft();
    d.edition_id = Some(edition.into());
    d.isbn13 = "9791090636071".into();
    assert!(s.wishlist_save(&d, None).is_err());
    d.isbn13 = "9780306406157".into();
    save(&s, &d);
    let mut second = d.clone();
    second.title = "Another intention".into();
    save(&s, &second);
    assert_eq!(s.snapshot("", false).unwrap()["books"][0]["id"], key);
    assert_eq!(
        s.snapshot("", false).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(
        s.wishlist_list("").unwrap()["items"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    assert!(s
        .conn()
        .unwrap()
        .execute("DELETE FROM editions WHERE id=?", [edition])
        .is_err());
}
#[test]
fn money_url_and_structural_validation() {
    for (v, c) in [
        ("-1", "TRY"),
        ("1.2", "USD"),
        ("9223372036854775808", "USD"),
        ("01", "USD"),
        ("1", "XXX"),
        ("1", "usd"),
    ] {
        assert!(minor(&Some(v.into()), c).is_err());
    }
    assert_eq!(
        minor(&Some("9223372036854775807".into()), "KWD").unwrap(),
        Some(i64::MAX)
    );
    for url in [
        "http://shop.example",
        "javascript:alert(1)",
        "file:///a",
        "https://a@shop.example",
        "https://shop.example\\@evil.example",
        "https://shop.example\n",
        "https://",
        "https://shop.example a",
    ] {
        assert!(retailer_url(url).is_err(), "{url}");
    }
    assert_eq!(
        retailer_url("https://shop.example/book?a=1").unwrap(),
        "https://shop.example/book?a=1"
    );
    let (_dir, s) = store();
    let mut d = draft();
    d.title = "\0".into();
    assert!(s.wishlist_save(&d, None).is_err());
}
#[test]
fn retailer_budget_history_archive_and_atomic_rollback() {
    let (_dir, s) = store();
    let mut d = draft();
    d.retailers = (0..2)
        .map(|n| Retailer {
            id: uuid::Uuid::new_v4().to_string(),
            name: format!("Shop {n}"),
            url: "https://shop.example/book".into(),
            offer_minor: Some("999".into()),
            currency: "USD".into(),
            notes: "private retailer".into(),
        })
        .collect();
    save(&s, &d);
    assert_eq!(
        s.wishlist_list("").unwrap()["budget"],
        json!([{"currency":"TRY","minor":"1234"}])
    );
    let mut d = load(&s);
    let original = d.clone();
    d.status = "On Order".into();
    save(&s, &d);
    let mut d = load(&s);
    d.status = "Cancelled".into();
    save(&s, &d);
    assert_eq!(s.wishlist_list("").unwrap()["budget"], json!([]));
    let mut d = load(&s);
    d.status = "Pre-Order".into();
    d.target_minor = None;
    save(&s, &d);
    assert_eq!(s.wishlist_list("").unwrap()["missing_prices"], 1);
    let mut d = load(&s);
    d.archived = true;
    save(&s, &d);
    assert_eq!(s.wishlist_list("").unwrap()["missing_prices"], 0);
    let mut d = load(&s);
    d.archived = false;
    save(&s, &d);
    assert_eq!(load(&s).retailers, original.retailers);
    let before = s.wishlist_list("").unwrap();
    s.conn().unwrap().execute_batch("CREATE TRIGGER test_failure BEFORE INSERT ON wishlist_status_history BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;").unwrap();
    let mut d = load(&s);
    d.status = "Wishing".into();
    d.title = "must roll back".into();
    assert!(s.wishlist_save(&d, None).is_err());
    assert_eq!(s.wishlist_list("").unwrap(), before);
}
#[test]
fn v4_backup_roundtrip_preserves_all_wishlist_relations() {
    let (dir, s) = store();
    let mut d = draft();
    std::fs::write(
        dir.path().join("covers/wish.png"),
        b"synthetic managed cover",
    )
    .unwrap();
    s.import(&[json!({"title":"Historical copy","copy_extra":{"ownership":"Wishlist"}})])
        .unwrap();
    let mut b = s.snapshot("", false).unwrap()["books"][0].clone();
    b["cover"] = json!("covers/wish.png");
    s.save(&b).unwrap();
    d.edition_id = Some(b["edition_id"].as_str().unwrap().into());
    let inventory = s.snapshot("", false).unwrap()["books"].clone();
    d.retailers.push(Retailer {
        id: uuid::Uuid::new_v4().to_string(),
        name: "Shop".into(),
        url: "https://shop.example/".into(),
        offer_minor: Some("1234".into()),
        currency: "JPY".into(),
        notes: "memo".into(),
    });
    save(&s, &d);
    let mut d = load(&s);
    d.status = "On Order".into();
    save(&s, &d);
    let before = s.wishlist_list("").unwrap();
    let zip = dir.path().join("test.zip");
    s.backup(&zip).unwrap();
    let (_other, target) = store();
    target.restore(&zip).unwrap();
    assert_eq!(target.wishlist_list("").unwrap(), before);
    validate_database(&target.conn().unwrap()).unwrap();
    assert_eq!(target.snapshot("", false).unwrap()["books"], inventory);
    assert_eq!(
        std::fs::read(target.root.join("covers/wish.png")).unwrap(),
        b"synthetic managed cover"
    );
}
#[test]
fn v3_upgrade_preserves_copy_index_wal_and_snapshot() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("library.sqlite3");
    let mut c = Connection::open(&path).unwrap();
    c.execute_batch(include_str!("fixtures/v1-schema.sql"))
        .unwrap();
    c.execute_batch(include_str!("fixtures/v1-library.sql"))
        .unwrap();
    c.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,'v1'),(2,'v2'),(3,'v3'); PRAGMA user_version=3; PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; INSERT INTO book_search VALUES('sentinel','do not rebuild v3'); UPDATE editions SET title='İnce WAL';").unwrap();
    assert!(
        std::fs::metadata(dir.path().join("library.sqlite3-wal"))
            .unwrap()
            .len()
            > 0
    );
    migrations::migrate(&mut c, dir.path()).unwrap();
    assert_eq!(
        c.query_row(
            "SELECT count(*) FROM book_search WHERE copy_id='sentinel'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        1
    );
    assert_eq!(
        c.query_row("SELECT title FROM editions LIMIT 1", [], |r| r
            .get::<_, String>(0))
            .unwrap(),
        "İnce WAL"
    );
    assert_eq!(
        c.query_row(
            "SELECT group_concat(version) FROM schema_migrations",
            [],
            |r| r.get::<_, String>(0)
        )
        .unwrap(),
        "1,2,3,4"
    );
    let snapshots: Vec<_> = std::fs::read_dir(dir.path().join("backups"))
        .unwrap()
        .map(|e| e.unwrap().path())
        .filter(|p| {
            p.is_file()
                && p.file_name()
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .starts_with("pre-migration-v3-")
                && p.extension().is_some_and(|e| e == "sqlite3")
        })
        .collect();
    assert_eq!(snapshots.len(), 1);
    let backup = Connection::open(&snapshots[0]).unwrap();
    assert_eq!(
        backup
            .query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        3
    );
    assert_eq!(
        backup
            .query_row("SELECT title FROM editions LIMIT 1", [], |r| r
                .get::<_, String>(0))
            .unwrap(),
        "İnce WAL"
    );
    migrations::migrate(&mut c, dir.path()).unwrap();
    assert_eq!(
        c.query_row("SELECT count(*) FROM schema_migrations", [], |r| r
            .get::<_, i64>(0))
            .unwrap(),
        4
    );
}
#[test]
fn legacy_wishlist_import_and_edit_are_preserved_new_creation_is_rejected() {
    let (_dir, s) = store();
    let b = json!({"title":"Legacy","contributors":[],"terms":{},"extra":{},"copy_extra":{"ownership":"Wishlist"}});
    assert!(s.create_decided(&b, None).is_err());
    s.import(&[b]).unwrap();
    let mut existing = s.snapshot("", false).unwrap()["books"][0].clone();
    existing["title"] = json!("Legacy edited");
    s.save(&existing).unwrap();
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["copy_extra"]["ownership"],
        "Wishlist"
    );
}

#[test]
fn malicious_wishlist_values_are_rejected_before_live_restore() {
    for sql in [
        "UPDATE wishlist_retailers SET url='javascript:alert(1)'",
        "UPDATE wishlist_items SET currency='XXX'",
        "DELETE FROM wishlist_status_history",
        "UPDATE wishlist_search SET body='forged'",
        "UPDATE wishlist_items SET archived_at='invalid'",
    ] {
        let (dir, source) = store();
        let mut d = draft();
        d.retailers.push(Retailer {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Shop".into(),
            url: "https://shop.example/".into(),
            offer_minor: None,
            currency: "TRY".into(),
            notes: "".into(),
        });
        save(&source, &d);
        source.conn().unwrap().execute_batch(sql).unwrap();
        let archive = dir.path().join("invalid.zip");
        source.backup(&archive).unwrap();
        let (_target_dir, target) = store();
        let mut precious = draft();
        precious.title = "Keep me".into();
        save(&target, &precious);
        let before = target.wishlist_list("").unwrap();
        assert!(target.restore(&archive).is_err(), "{sql}");
        assert_eq!(target.wishlist_list("").unwrap(), before);
        validate_database(&target.conn().unwrap()).unwrap();
    }
}
#[test]
fn failed_v4_migration_rolls_back_without_rebuilding_v3_index() {
    let dir = tempfile::tempdir().unwrap();
    let mut c = Connection::open(dir.path().join("library.sqlite3")).unwrap();
    c.execute_batch(include_str!("fixtures/v1-schema.sql"))
        .unwrap();
    c.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);INSERT INTO schema_migrations VALUES(1,'v1'),(2,'v2'),(3,'v3'),(4,'conflict');PRAGMA user_version=3; INSERT INTO book_search VALUES('keep','original');").unwrap();
    assert!(migrations::migrate(&mut c, dir.path()).is_err());
    assert_eq!(
        c.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        3
    );
    assert!(c.prepare("SELECT * FROM wishlist_items").is_err());
    assert_eq!(
        c.query_row("SELECT body FROM book_search", [], |r| r
            .get::<_, String>(0))
            .unwrap(),
        "original"
    );
}

#[test]
fn omitted_legacy_ownership_is_not_silently_erased() {
    let (_dir, s) = store();
    s.import(&[json!({"title":"Legacy","copy_extra":{"ownership":"Wishlist"}})])
        .unwrap();
    let mut b = s.snapshot("", false).unwrap()["books"][0].clone();
    b["copy_extra"].as_object_mut().unwrap().remove("ownership");
    s.save(&b).unwrap();
    assert_eq!(
        s.snapshot("", false).unwrap()["books"][0]["copy_extra"]["ownership"],
        "Wishlist"
    );
}

#[test]
fn budget_sums_wider_than_sql_integer_without_mixing_currencies() {
    let (_dir, s) = store();
    for (title, currency, amount) in [
        ("A", "USD", "9223372036854775807"),
        ("B", "USD", "9223372036854775807"),
        ("C", "JPY", "42"),
    ] {
        let mut d = draft();
        d.title = title.into();
        d.currency = currency.into();
        d.target_minor = Some(amount.into());
        save(&s, &d);
    }
    assert_eq!(
        s.wishlist_list("").unwrap()["budget"],
        json!([{"currency":"JPY","minor":"42"},{"currency":"USD","minor":"18446744073709551614"}])
    );
}

#[test]
fn active_count_excludes_archived_and_cancelled_without_loading_relationships() {
    let (_dir, s) = store();
    assert_eq!(s.wishlist_active_count().unwrap(), 0);
    for status in ["Wishing", "On Order", "Pre-Order", "Cancelled"] {
        for archived in [false, true] {
            let mut d = draft();
            d.title = format!("{status} {archived}");
            d.status = status.into();
            d.archived = archived;
            save(&s, &d);
        }
    }
    let c = s.conn().unwrap();
    let before: i64 = c
        .query_row("SELECT count(*) FROM copies", [], |r| r.get(0))
        .unwrap();
    assert_eq!(s.wishlist_active_count().unwrap(), 3);
    let plan: Vec<String> = c
        .prepare(&format!(
            "EXPLAIN QUERY PLAN {}",
            mylibrary_lib::wishlist::ACTIVE_COUNT_SQL
        ))
        .unwrap()
        .query_map([], |r| r.get(3))
        .unwrap()
        .collect::<rusqlite::Result<_>>()
        .unwrap();
    println!("Active Wishlist count query plan: {plan:?}");
    assert!(plan.iter().all(|line| !line.contains("retailers")
        && !line.contains("history")
        && !line.contains("editions")));
    c.execute("DROP TABLE wishlist_retailers", []).unwrap();
    c.execute("DROP TABLE wishlist_status_history", []).unwrap();
    assert_eq!(s.wishlist_active_count().unwrap(), 3);
    assert_eq!(
        c.query_row("SELECT count(*) FROM copies", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        before
    );
}
