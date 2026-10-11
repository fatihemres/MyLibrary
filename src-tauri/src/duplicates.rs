//! Local, explicit edition decisions. No title-based identity and no schema changes.
use crate::db::{self, s, Result, Store};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeMap;

const EDITION_FIELDS: &[&str] = &[
    "title",
    "subtitle",
    "isbn10",
    "isbn13",
    "publisher",
    "series",
    "series_order",
    "publication_year",
    "pages",
    "language",
    "cover",
    "extra",
    "contributors",
    "terms",
];
const SELECTABLE: &[&str] = &[
    "title",
    "subtitle",
    "authors",
    "publisher",
    "publication_year",
    "pages",
    "language",
    "isbn10",
    "isbn13",
    "synopsis",
];

pub fn canonical(b: &Value) -> Option<String> {
    let mut result = None;
    for field in ["isbn10", "isbn13"] {
        let value = s(b, field);
        if value.trim().is_empty() {
            continue;
        }
        let parsed = crate::isbn::parse(value).ok()?.isbn13;
        if result.as_ref().is_some_and(|v| *v != parsed) {
            return None;
        }
        result = Some(parsed);
    }
    result
}
fn normalize(text: &str) -> String {
    text.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}
fn authors(b: &Value) -> Vec<String> {
    let mut names: Vec<_> = b["contributors"]
        .as_array()
        .into_iter()
        .flatten()
        .filter(|v| s(v, "role") == "Author")
        .map(|v| normalize(s(v, "name")))
        .filter(|v| !v.is_empty())
        .collect();
    names.sort();
    names.dedup();
    names
}
pub fn all_books(c: &Connection) -> Result<Vec<Value>> {
    let mut books = db::list(c, false)?;
    books.extend(db::list(c, true)?);
    Ok(books)
}
pub fn report(draft: &Value, books: &[Value]) -> Value {
    let isbn = canonical(draft);
    let names = authors(draft);
    let mut editions: BTreeMap<String, Vec<&Value>> = BTreeMap::new();
    let mut collisions = vec![];
    for b in books {
        if !s(draft, "id").is_empty() && s(draft, "id") == s(b, "id") {
            continue;
        }
        let barcode = !s(draft, "barcode").is_empty() && s(draft, "barcode") == s(b, "barcode");
        let code = s(&draft["copy_extra"], "inventory_code");
        let inventory = !code.is_empty() && code == s(&b["copy_extra"], "inventory_code");
        if barcode || inventory {
            collisions.push(json!({"book":b,"barcode":barcode,"inventory":inventory}));
        }
        if !s(draft, "edition_id").is_empty() && s(draft, "edition_id") == s(b, "edition_id") {
            continue;
        }
        editions
            .entry(s(b, "edition_id").to_owned())
            .or_default()
            .push(b);
    }
    let mut strong = vec![];
    let mut weak = vec![];
    for copies in editions.values() {
        let b = copies[0];
        let candidate = json!({"book":b,"count":copies.len(),"archived":copies.iter().filter(|b| !b["deleted_at"].is_null() && !s(b,"deleted_at").is_empty()).count()});
        if isbn.is_some() && isbn == canonical(b) {
            strong.push(candidate);
        } else if !names.is_empty()
            && names == authors(b)
            && !s(draft, "title").trim().is_empty()
            && normalize(s(draft, "title")) == normalize(s(b, "title"))
        {
            weak.push(candidate);
        }
    }
    json!({"strong":strong,"weak":weak,"collisions":collisions})
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Decision {
    pub action: String,
    #[serde(default)]
    pub target: String,
    #[serde(default)]
    pub fields: Vec<String>,
    #[serde(default)]
    pub reviewed: bool,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlanItem {
    pub group: String,
    pub decision: Decision,
}
pub fn group_key(b: &Value, index: usize) -> Result<String> {
    let v = &b["transfer"]["edition_key"];
    if !v.is_null() && !v.is_string() {
        return Err("duplicate.invalidPlan".into());
    }
    Ok(if s(&b["transfer"], "edition_key").is_empty() {
        format!("row:{index}")
    } else {
        format!("edition:{}", s(&b["transfer"], "edition_key"))
    })
}
pub fn groups(books: &[Value]) -> Result<Vec<(String, Vec<usize>)>> {
    let mut out: Vec<(String, Vec<usize>)> = vec![];
    for (i, b) in books.iter().enumerate() {
        if !b.is_object() {
            return Err("duplicate.invalidPlan".into());
        }
        let key = group_key(b, i)?;
        if let Some((_, rows)) = out.iter_mut().find(|(k, _)| *k == key) {
            rows.push(i);
        } else {
            out.push((key, vec![i]));
        }
    }
    // Explicit portable groups must agree on ALL shared data, even when linking/skipping.
    for (_, rows) in &out {
        for &i in rows {
            for &f in EDITION_FIELDS.iter().filter(|f| **f != "cover") {
                if books[i][f] != books[rows[0]][f] {
                    return Err("duplicate.conflictingGroup".into());
                }
            }
        }
    }
    Ok(out)
}
/// Shared preview/commit interpretation of incoming conflicts. Explicit edition keys
/// alone group rows; even identifiers reused WITHIN a group require copy-level review.
pub fn incoming_signals(
    books: &[Value],
    grouped: &[(String, Vec<usize>)],
    index: usize,
) -> (Vec<usize>, Vec<usize>, bool) {
    let rows = &grouped[index].1;
    let first = &books[rows[0]];
    let isbn = canonical(first);
    let names = authors(first);
    let mut strong = vec![];
    let mut weak = vec![];
    for (other, (_, r)) in grouped.iter().enumerate() {
        if other == index {
            continue;
        }
        let b = &books[r[0]];
        if isbn.is_some() && isbn == canonical(b) {
            strong.push(r[0] + 1);
        } else if !names.is_empty()
            && names == authors(b)
            && !s(first, "title").trim().is_empty()
            && normalize(s(first, "title")) == normalize(s(b, "title"))
        {
            weak.push(r[0] + 1);
        }
    }
    let collision = rows.iter().any(|&r| {
        books.iter().enumerate().any(|(i, b)| {
            i != r
                && ((!s(&books[r], "barcode").is_empty()
                    && s(&books[r], "barcode") == s(b, "barcode"))
                    || (!s(&books[r]["copy_extra"], "inventory_code").is_empty()
                        && s(&books[r]["copy_extra"], "inventory_code")
                            == s(&b["copy_extra"], "inventory_code")))
        })
    });
    (strong, weak, collision)
}
pub fn validate(
    draft: &Value,
    decision: Option<&Decision>,
    books: &[Value],
    incoming: bool,
) -> Result<()> {
    let report = report(draft, books);
    let needs = incoming
        || ["strong", "collisions"]
            .iter()
            .any(|k| !report[k].as_array().unwrap().is_empty());
    let Some(d) = decision else {
        return if needs {
            Err("duplicate.required".into())
        } else {
            Ok(())
        };
    };
    if !["separate", "existing", "skip"].contains(&d.action.as_str())
        || d.fields.iter().any(|f| !SELECTABLE.contains(&f.as_str()))
    {
        return Err("duplicate.invalidPlan".into());
    }
    if d.action == "skip" {
        return Ok(());
    }
    if needs && !d.reviewed {
        return Err("duplicate.required".into());
    }
    if d.action != "existing" {
        if !d.target.is_empty() || !d.fields.is_empty() {
            return Err("duplicate.invalidPlan".into());
        }
    } else {
        // V1 identifiers are opaque text, not necessarily UUIDs. Membership in the
        // authoritative ISBN candidate set validates identity without rewriting old IDs.
        if d.target.is_empty() {
            return Err("duplicate.invalidTarget".into());
        }
        if !report["strong"]
            .as_array()
            .unwrap()
            .iter()
            .any(|v| s(&v["book"], "edition_id") == d.target)
        {
            return Err("duplicate.invalidTarget".into());
        }
    }
    Ok(())
}
pub fn create(c: &Connection, draft: &Value, decision: Option<&Decision>) -> Result<String> {
    if !draft.is_object() {
        return Err("duplicate.invalidPlan".into());
    }
    let mut value = draft.clone();
    value["id"] = json!("");
    value["edition_id"] = json!("");
    // Identity/history/attachments are never imported into a new copy.
    value.as_object_mut().unwrap().remove("deleted_at");
    if let Some(d) = decision.filter(|d| d.action == "existing") {
        let existing = all_books(c)?
            .into_iter()
            .find(|b| s(b, "edition_id") == d.target)
            .ok_or("duplicate.invalidTarget")?;
        for &field in EDITION_FIELDS {
            value[field] = existing[field].clone();
        }
        value["edition_id"] = json!(d.target);
        for field in &d.fields {
            match field.as_str() {
                "authors" => {
                    let mut people: Vec<Value> = existing["contributors"]
                        .as_array()
                        .into_iter()
                        .flatten()
                        .filter(|p| s(p, "role") != "Author")
                        .cloned()
                        .collect();
                    people.extend(
                        draft["contributors"]
                            .as_array()
                            .into_iter()
                            .flatten()
                            .filter(|p| s(p, "role") == "Author")
                            .cloned(),
                    );
                    value["contributors"] = json!(people);
                }
                "synopsis" => {
                    if !value["extra"].is_object() {
                        return Err("duplicate.invalidPlan".into());
                    }
                    value["extra"]["synopsis"] =
                        draft["extra"].get("synopsis").cloned().unwrap_or(json!(""));
                }
                _ => value[field] = draft[field].clone(),
            }
        }
        if d.fields.iter().any(|f| f == "isbn10" || f == "isbn13") && canonical(&value).is_none() {
            return Err("metadata.mismatchedIsbn".into());
        }
        return db::save_book_inner(c, &value, !d.fields.is_empty());
    }
    db::save_book(c, &value)
}
impl Store {
    /// Legacy renderer imports get safe defaults, never implicit duplicate consent.
    pub fn import_unresolved(&self, books: &[Value]) -> Result<usize> {
        if books.len() > 50000 {
            return Err("duplicate.invalidPlan".into());
        }
        let plan: Vec<PlanItem> = groups(books)?
            .into_iter()
            .map(|(group, _)| PlanItem {
                group,
                decision: Decision {
                    action: "separate".into(),
                    target: String::new(),
                    fields: vec![],
                    reviewed: false,
                },
            })
            .collect();
        self.import_decided(books, Some(&plan))
    }
    pub fn duplicate_report(&self, draft: &Value) -> Result<Value> {
        Ok(report(draft, &all_books(&self.conn()?)?))
    }
    pub fn create_decided(&self, draft: &Value, decision: Option<&Decision>) -> Result<String> {
        let mut c = self.conn()?;
        let tx = c.transaction()?;
        if !s(draft, "id").is_empty()
            || !s(draft, "edition_id").is_empty()
            || decision.is_some_and(|d| d.action == "skip")
        {
            return Err("duplicate.invalidPlan".into());
        }
        validate(draft, decision, &all_books(&tx)?, false)?;
        let key = create(&tx, draft, decision)?;
        db::reindex(&tx)?;
        tx.commit()?;
        Ok(key)
    }
    pub fn import_preview(&self, books: &[Value]) -> Result<Value> {
        if books.len() > 50000 {
            return Err("duplicate.invalidPlan".into());
        }
        let clean: Vec<Value> = books
            .iter()
            .map(|b| {
                let mut b = b.clone();
                if b.is_object() {
                    b["id"] = json!("");
                    b["edition_id"] = json!("");
                }
                b
            })
            .collect();
        let books = clean.as_slice();
        let existing = all_books(&self.conn()?)?;
        let grouped = groups(books)?;
        let mut out = vec![];
        for (index, (key, rows)) in grouped.iter().enumerate() {
            let first = &books[rows[0]];
            let mut result = report(first, &existing);
            // Copy collisions must include every member, not just the representative.
            result["collisions"] = json!(rows
                .iter()
                .flat_map(|&i| report(&books[i], &existing)["collisions"]
                    .as_array()
                    .unwrap()
                    .clone())
                .collect::<Vec<_>>());
            let (incoming, incoming_weak, incoming_collision) =
                incoming_signals(books, &grouped, index);
            out.push(json!({"group":key,"rows":rows,"book":first,"report":result,"incoming":incoming,"incomingWeak":incoming_weak,"incomingCollision":incoming_collision}));
        }
        Ok(json!(out))
    }
}
