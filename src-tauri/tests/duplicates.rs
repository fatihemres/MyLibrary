use mylibrary_lib::{
    db::Store,
    duplicates::{report, Decision, PlanItem},
};
use serde_json::{json, Value};
fn store() -> (tempfile::TempDir, Store) {
    let base = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("target/test-data");
    std::fs::create_dir_all(&base).unwrap();
    let dir = tempfile::tempdir_in(base).unwrap();
    let s = Store::open(dir.path().join("library")).unwrap();
    (dir, s)
}
fn book(isbn: &str) -> Value {
    json!({"title":"Synthetic edition","isbn13":isbn,"pages":300,"status":"Unread","extra":{"synopsis":"Original"},"copy_extra":{},"custom":{},"contributors":[{"name":"Author","role":"Author"},{"name":"Translator","role":"Translator"}],"terms":{"tag":["preserve"]}})
}
fn decision(action: &str, target: &str, fields: Vec<&str>) -> Decision {
    Decision {
        action: action.into(),
        target: target.into(),
        fields: fields.into_iter().map(String::from).collect(),
        reviewed: true,
    }
}
fn books(s: &Store) -> Vec<Value> {
    s.snapshot("", false).unwrap()["books"]
        .as_array()
        .unwrap()
        .clone()
}
fn plan(rows: &[Value], action: &str, target: &str) -> Vec<PlanItem> {
    mylibrary_lib::duplicates::groups(rows)
        .unwrap()
        .into_iter()
        .map(|(group, _)| PlanItem {
            group,
            decision: decision(action, target, vec![]),
        })
        .collect()
}

#[test]
fn canonical_signals_group_editions_and_never_link_by_title_or_barcode() {
    let (_d, s) = store();
    s.save(&book("9780306406157")).unwrap();
    let first = books(&s)[0].clone();
    let mut ten = book("");
    ten["isbn10"] = json!("0-306-40615-2");
    assert_eq!(
        s.duplicate_report(&ten).unwrap()["strong"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    s.create_decided(
        &ten,
        Some(&decision(
            "existing",
            first["edition_id"].as_str().unwrap(),
            vec![],
        )),
    )
    .unwrap();
    assert_eq!(s.duplicate_report(&ten).unwrap()["strong"][0]["count"], 2);
    s.create_decided(&ten, Some(&decision("separate", "", vec![])))
        .unwrap();
    assert_eq!(
        s.duplicate_report(&ten).unwrap()["strong"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    for invalid in [
        "9780306406158",
        "036000291452",
        "4006381333931",
        "9780306406157\n",
        "",
    ] {
        let b = book(invalid);
        let r = s.duplicate_report(&b).unwrap();
        assert_eq!(r["strong"], json!([]));
        assert!(!r["weak"].as_array().unwrap().is_empty());
        assert!(s
            .create_decided(
                &b,
                Some(&decision(
                    "existing",
                    first["edition_id"].as_str().unwrap(),
                    vec![]
                ))
            )
            .is_err());
    }
    let mut b = book("");
    b["contributors"] = json!([]);
    assert_eq!(s.duplicate_report(&b).unwrap()["weak"], json!([]));
    b["barcode"] = json!("barcode");
    s.save(&b).unwrap();
    let r = s.duplicate_report(&b).unwrap();
    assert_eq!(r["strong"], json!([]));
    assert_eq!(r["collisions"].as_array().unwrap().len(), 1);
    assert!(s.create_decided(&b, None).is_err());
    s.create_decided(&b, Some(&decision("separate", "", vec![])))
        .unwrap();
}
#[test]
fn reverse_978_979_invalid_legacy_and_self_exclusion() {
    let mut legacy = book("");
    legacy["isbn10"] = json!("0306406152");
    legacy["id"] = json!("copy");
    legacy["edition_id"] = json!("edition");
    assert_eq!(
        report(&book("9780306406157"), &[legacy.clone()])["strong"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(report(&legacy, &[legacy.clone()])["strong"], json!([]));
    legacy["isbn10"] = json!("bad");
    assert_eq!(
        report(&book("9780306406157"), &[legacy])["strong"],
        json!([])
    );
    let b = book("9791090636071");
    assert_eq!(
        report(&b, &[b.clone()])["strong"].as_array().unwrap().len(),
        1
    );
    assert_eq!(report(&book("9780306406157"), &[b])["strong"], json!([]));
}
#[test]
fn archived_only_target_is_visible_and_new_copy_does_not_restore_old() {
    let (_d, s) = store();
    let key = s.save(&book("9780306406157")).unwrap();
    let original = books(&s)[0].clone();
    s.mutate("trash", &json!({"ids":[key]})).unwrap();
    let r = s.duplicate_report(&book("9780306406157")).unwrap();
    assert_eq!(r["strong"][0]["archived"], 1);
    s.create_decided(
        &book("9780306406157"),
        Some(&decision(
            "existing",
            original["edition_id"].as_str().unwrap(),
            vec![],
        )),
    )
    .unwrap();
    assert_eq!(books(&s).len(), 1);
    assert_eq!(
        s.snapshot("", true).unwrap()["books"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
}
#[test]
fn full_draft_copy_values_survive_without_changing_shared_edition() {
    let (_d, s) = store();
    s.save(&book("9780306406157")).unwrap();
    let original = books(&s)[0].clone();
    s.mutate(
        "entity",
        &json!({"table":"custom_fields","id":"field","name":"Synthetic","kind":"text"}),
    )
    .unwrap();
    s.mutate(
        "entity",
        &json!({"table":"locations","id":"location","name":"Room","extra":{"kind":"Room"}}),
    )
    .unwrap();
    let mut incoming = book("9780306406157");
    incoming["title"] = json!("Incoming title");
    for (k, v) in [
        ("barcode", json!("independent")),
        ("source", json!("Gift store")),
        ("location_id", json!("location")),
        ("status", json!("Reading")),
        ("rating", json!(4.5)),
        ("favorite", json!(true)),
        ("current_page", json!(75)),
        ("condition", json!("Poor")),
        ("acquisition_date", json!("2026-01-01")),
        (
            "copy_extra",
            json!({"inventory_code":"Mine","date_started":"2026-01-02","purchase_price":25,"review":"Mine","personal_notes":"Independent"}),
        ),
        ("custom", json!({"field":"mine"})),
    ] {
        incoming[k] = v;
    }
    let key = s
        .create_decided(
            &incoming,
            Some(&decision(
                "existing",
                original["edition_id"].as_str().unwrap(),
                vec![],
            )),
        )
        .unwrap();
    let all = books(&s);
    let saved = all.iter().find(|b| b["id"] == key).unwrap();
    for field in [
        "barcode",
        "source",
        "location_id",
        "status",
        "rating",
        "favorite",
        "current_page",
        "condition",
        "acquisition_date",
        "copy_extra",
        "custom",
    ] {
        assert_eq!(saved[field], incoming[field], "{field}");
    }
    for field in ["title", "extra", "contributors", "terms", "edition_id"] {
        assert_eq!(saved[field], original[field], "{field}");
    }
    assert_eq!(
        all.iter().find(|b| b["id"] == original["id"]).unwrap(),
        &original
    );
    assert!(s.snapshot("Independent", false).unwrap()["searchIds"]
        .as_array()
        .unwrap()
        .contains(&json!(key)));
}
#[test]
fn explicit_reconciliation_changes_only_selected_fields_and_is_atomic() {
    let (_d, s) = store();
    s.save(&book("9780306406157")).unwrap();
    let old = books(&s)[0].clone();
    let target = old["edition_id"].as_str().unwrap();
    let mut b = book("9780306406157");
    b["title"] = json!("Chosen");
    b["publisher"] = json!("Not chosen");
    let d = decision("existing", target, vec!["title"]);
    s.create_decided(&b, Some(&d)).unwrap();
    for v in books(&s) {
        assert_eq!(v["title"], "Chosen");
        assert_eq!(v["publisher"], old["publisher"]);
        assert_eq!(v["contributors"], old["contributors"]);
    }
    let before = s.snapshot("", false).unwrap();
    b["custom"] = json!({"nonexistent":"rollback"});
    b["title"] = json!("Must roll back");
    assert!(s.create_decided(&b, Some(&d)).is_err());
    assert_eq!(s.snapshot("", false).unwrap(), before);
    for field in [
        "id",
        "edition_id",
        "cover",
        "copy_extra",
        "terms",
        "attachments",
    ] {
        assert!(s
            .create_decided(
                &book("9780306406157"),
                Some(&decision("existing", target, vec![field]))
            )
            .is_err());
    }
    s.save(&book("9791090636071")).unwrap();
}
#[test]
fn authors_reconciliation_preserves_other_contributors_and_new_history() {
    let (_d, s) = store();
    s.save(&book("9780306406157")).unwrap();
    let old = books(&s)[0].clone();
    let mut b = book("9780306406157");
    b["contributors"] =
        json!([{"name":"New","role":"Author"},{"name":"Unwanted","role":"Translator"}]);
    s.create_decided(
        &b,
        Some(&decision(
            "existing",
            old["edition_id"].as_str().unwrap(),
            vec!["authors"],
        )),
    )
    .unwrap();
    let snap = s.snapshot("", false).unwrap();
    assert_eq!(snap["entries"], json!([]));
    assert_eq!(snap["loans"], json!([]));
    assert_eq!(snap["attachments"], json!([]));
    let p = &snap["books"][0]["contributors"];
    assert!(p
        .as_array()
        .unwrap()
        .iter()
        .any(|p| p["name"] == "Translator"));
    assert!(!p
        .as_array()
        .unwrap()
        .iter()
        .any(|p| p["name"] == "Unwanted"));
}
#[test]
fn separate_and_edit_never_reassign_existing_copy() {
    let (_d, s) = store();
    s.create_decided(&book("9780306406157"), None).unwrap();
    let old = books(&s)[0].clone();
    assert!(s.create_decided(&book("9780306406157"), None).is_err());
    assert_eq!(books(&s), vec![old.clone()]);
    let id = s
        .create_decided(
            &book("9780306406157"),
            Some(&decision("separate", "", vec![])),
        )
        .unwrap();
    let other = books(&s).into_iter().find(|b| b["id"] == id).unwrap();
    assert_ne!(other["edition_id"], old["edition_id"]);
    let mut modified = old.clone();
    modified["edition_id"] = other["edition_id"].clone();
    assert!(s.save(&modified).is_err());
}
#[test]
fn import_explicit_groups_attach_independent_copies_without_overwrite() {
    let (_d, s) = store();
    s.save(&book("9780306406157")).unwrap();
    let old = books(&s)[0].clone();
    let mut a = book("9780306406157");
    a["title"] = json!("Foreign title");
    a["transfer"] = json!({"edition_key":"portable"});
    a["rating"] = json!(1.5);
    let mut b = a.clone();
    b["rating"] = json!(5);
    b["status"] = json!("Finished");
    let rows = vec![a, b];
    let preview = s.import_preview(&rows).unwrap();
    assert_eq!(preview.as_array().unwrap().len(), 1);
    assert_eq!(preview[0]["rows"], json!([0, 1]));
    let p = plan(&rows, "existing", old["edition_id"].as_str().unwrap());
    assert_eq!(s.import_decided(&rows, Some(&p)).unwrap(), 2);
    let result = books(&s);
    assert_eq!(result.len(), 3);
    assert!(result
        .iter()
        .all(|v| v["title"] == old["title"] && v["edition_id"] == old["edition_id"]));
    assert!(result.iter().any(|v| v["rating"] == 1.5));
    assert!(result
        .iter()
        .any(|v| v["rating"] == 5.0 && v["status"] == "Finished"));
}
#[test]
fn import_requires_explicit_incoming_conflict_and_preserves_separate_groups() {
    let (_d, s) = store();
    let rows = vec![book("9780306406157"), book("9780306406157")];
    let preview = s.import_preview(&rows).unwrap();
    assert_eq!(preview[0]["incoming"], json!([2]));
    assert_eq!(preview[1]["incoming"], json!([1]));
    let mut p = plan(&rows, "separate", "");
    p[0].decision.reviewed = false;
    assert!(s.import_decided(&rows, Some(&p)).is_err());
    assert!(books(&s).is_empty());
    p[0].decision.reviewed = true;
    s.import_decided(&rows, Some(&p)).unwrap();
    let all = books(&s);
    assert_ne!(all[0]["edition_id"], all[1]["edition_id"]);
    let before = s.snapshot("", false).unwrap();
    let skip = plan(&rows, "skip", "");
    assert_eq!(s.import_decided(&rows, Some(&skip)).unwrap(), 0);
    assert_eq!(s.snapshot("", false).unwrap(), before);
}
#[test]
fn hostile_missing_stale_and_inconsistent_plans_roll_back() {
    let (_d, s) = store();
    s.save(&book("9780306406157")).unwrap();
    let old = books(&s)[0].clone();
    let before = s.snapshot("", false).unwrap();
    let rows = vec![book("9791090636071"), book("9780306406157")];
    for target in [
        "bad",
        "00000000-0000-0000-0000-000000000000",
        old["edition_id"].as_str().unwrap(),
    ] {
        assert!(s
            .import_decided(&rows, Some(&plan(&rows, "existing", target)))
            .is_err());
        assert_eq!(s.snapshot("", false).unwrap(), before);
    }
    assert!(s.import_decided(&rows, Some(&[])).is_err());
    let mut hostile = book("9780306406157");
    hostile["id"] = old["id"].clone();
    hostile["edition_id"] = old["edition_id"].clone();
    let rows = vec![hostile];
    let mut p = plan(&rows, "separate", "");
    p[0].decision.reviewed = false;
    assert!(s.import_decided(&rows, Some(&p)).is_err());
    p[0].decision.reviewed = true;
    s.import_decided(&rows, Some(&p)).unwrap();
    assert_eq!(books(&s).len(), 2);
    assert_ne!(books(&s)[0]["edition_id"], books(&s)[1]["edition_id"]);
}
#[test]
fn weak_imports_never_group_and_conflicting_portable_groups_fail() {
    let (_d, s) = store();
    let rows = vec![book(""), book("")];
    s.import_decided(&rows, Some(&plan(&rows, "separate", "")))
        .unwrap();
    let b = books(&s);
    assert_ne!(b[0]["edition_id"], b[1]["edition_id"]);
    let mut a = book("9780306406157");
    a["transfer"] = json!({"edition_key":"same"});
    let mut b = a.clone();
    b["title"] = json!("Conflicting");
    assert!(s.import_preview(&[a, b]).is_err());
}
#[test]
fn incoming_copy_identifier_collision_does_not_supply_edition_target() {
    let (_d, s) = store();
    let mut a = book("");
    a["barcode"] = json!("same");
    let rows = vec![a.clone(), a];
    let preview = s.import_preview(&rows).unwrap();
    assert_eq!(preview[0]["incomingCollision"], true);
    assert_eq!(preview[0]["report"]["strong"], json!([]));
    let mut p = plan(&rows, "separate", "");
    p[1].decision.reviewed = false;
    assert!(s.import_decided(&rows, Some(&p)).is_err());
    assert!(books(&s).is_empty());
}

#[test]
fn multiple_targets_are_explicit_and_stale_isbn_is_rechecked() {
    let (_d, s) = store();
    let b = book("9780306406157");
    s.save(&b).unwrap();
    s.save(&b).unwrap();
    let all = books(&s);
    let target = all[1]["edition_id"].as_str().unwrap();
    assert_eq!(
        s.duplicate_report(&b).unwrap()["strong"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    let id = s
        .create_decided(&b, Some(&decision("existing", target, vec![])))
        .unwrap();
    assert_eq!(
        books(&s).iter().find(|b| b["id"] == id).unwrap()["edition_id"],
        target
    );
    let mut old = all[1].clone();
    old["isbn13"] = json!("9791090636071");
    s.save(&old).unwrap();
    let before = s.snapshot("", false).unwrap();
    let rows = vec![b];
    assert!(s
        .import_decided(&rows, Some(&plan(&rows, "existing", target)))
        .is_err());
    assert_eq!(s.snapshot("", false).unwrap(), before);
}

#[test]
fn planned_import_rejects_hostile_transfer_without_poisoning_store() {
    let (_d, s) = store();
    for field in [
        json!(true),
        Value::Null,
        json!("string"),
        json!({"name":"x","kind":"not-valid"}),
    ] {
        let mut b = book("");
        b["custom"] = json!({"":"x"});
        b["transfer"] = json!({"fields":[field]});
        let rows = vec![b];
        assert!(s
            .import_decided(&rows, Some(&plan(&rows, "separate", "")))
            .is_err());
        assert!(books(&s).is_empty());
        s.mutate("settings", &json!({"test":"works"})).unwrap();
    }
}

#[test]
fn planned_import_custom_and_portable_location_preserve_v1_contract() {
    let (_d, s) = store();
    let mut b = book("");
    b["custom"] = json!({"foreign":"kept"});
    b["transfer"] = json!({"edition_key":"v1","location":["Study","Bookcase 1","Shelf 1"],"location_kinds":["Room","Bookcase","Shelf"],"fields":[{"id":"foreign","name":"Synthetic","kind":"text","extra":{}}]});
    let rows = vec![b.clone(), b];
    s.import_decided(&rows, Some(&plan(&rows, "separate", "")))
        .unwrap();
    let result = s.snapshot("", false).unwrap();
    let all = result["books"].as_array().unwrap();
    assert_eq!(all[0]["edition_id"], all[1]["edition_id"]);
    assert_eq!(result["locations"].as_array().unwrap().len(), 3);
    assert!(all.iter().all(|b| b["custom"]
        .as_object()
        .unwrap()
        .values()
        .any(|v| v == "kept")));
}

#[test]
fn incoming_collisions_inside_portable_group_need_review_and_weak_is_informational() {
    let (_d, s) = store();
    let mut a = book("");
    a["transfer"] = json!({"edition_key":"group"});
    a["barcode"] = json!("shared");
    let rows = vec![a.clone(), a];
    let preview = s.import_preview(&rows).unwrap();
    assert_eq!(preview[0]["incomingCollision"], true);
    let mut p = plan(&rows, "separate", "");
    p[0].decision.reviewed = false;
    assert!(s.import_decided(&rows, Some(&p)).is_err());
    assert!(books(&s).is_empty());
    p[0].decision.reviewed = true;
    s.import_decided(&rows, Some(&p)).unwrap();
    assert_eq!(books(&s)[0]["edition_id"], books(&s)[1]["edition_id"]);
    let rows = vec![book(""), book("")];
    let preview = s.import_preview(&rows).unwrap();
    assert_eq!(preview[0]["incomingWeak"], json!([2]));
    assert_eq!(preview[0]["incoming"], json!([]));
}

#[test]
fn legacy_opaque_edition_ids_remain_valid_targets() {
    let (_d, s) = store();
    let mut b = book("9780306406157");
    b["edition_id"] = json!("edition1");
    s.save(&b).unwrap();
    s.create_decided(
        &book("9780306406157"),
        Some(&decision("existing", "edition1", vec![])),
    )
    .unwrap();
    assert!(books(&s).iter().all(|b| b["edition_id"] == "edition1"));
}

#[test]
fn rejected_late_planned_import_rolls_back_prior_rows_and_related_entities() {
    let (_d, s) = store();
    let before = s.snapshot("", false).unwrap();
    let a = book("9780306406157");
    let mut b = book("9791090636071");
    b["custom"] = json!({"missing":"invalid"});
    let rows = vec![a, b];
    assert!(s
        .import_decided(&rows, Some(&plan(&rows, "separate", "")))
        .is_err());
    assert_eq!(s.snapshot("", false).unwrap(), before);
    s.create_decided(&book("9780306406157"), None).unwrap();
    assert_eq!(books(&s).len(), 1);
}

#[test]
fn new_copy_does_not_clone_existing_loans_entries_attachments_or_archive_state() {
    let (_d, s) = store();
    let id = s.save(&book("9780306406157")).unwrap();
    let old = books(&s)[0].clone();
    s.mutate(
        "entry",
        &json!({"copy_id":id,"kind":"note","content":"Old private note","extra":{}}),
    )
    .unwrap();
    s.mutate(
        "loan",
        &json!({"copy_id":id,"borrower":"Synthetic Borrower","loan_date":"2026-01-01"}),
    )
    .unwrap();
    s.conn().unwrap().execute("INSERT INTO attachments(id,copy_id,name,path,created_at) VALUES('synthetic',?,'receipt','attachments/test.txt','2026-01-01')",[&id]).unwrap();
    let mut b = book("9780306406157");
    b["deleted_at"] = json!("2026-01-01");
    let new = s
        .create_decided(
            &b,
            Some(&decision(
                "existing",
                old["edition_id"].as_str().unwrap(),
                vec![],
            )),
        )
        .unwrap();
    let snap = s.snapshot("", false).unwrap();
    assert_eq!(snap["books"].as_array().unwrap().len(), 2);
    for field in ["loans", "entries", "attachments"] {
        let records = snap[field].as_array().unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0]["copy_id"], id);
        assert_ne!(records[0]["copy_id"], new);
    }
}

#[test]
fn legacy_renderer_import_cannot_bypass_duplicate_consent() {
    let (_d, s) = store();
    let rows = vec![book("9780306406157")];
    s.import_unresolved(&rows).unwrap();
    let before = s.snapshot("", false).unwrap();
    assert!(s.import_unresolved(&rows).is_err());
    assert_eq!(s.snapshot("", false).unwrap(), before);
}
