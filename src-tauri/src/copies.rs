//! Copy-only operations deliberately never update editions or their relationships.
use crate::db::{check_date, id, now, s, Result};
use rusqlite::{params, Connection};
use serde_json::{json, Value};

pub fn save(c: &Connection, value: &Value, create: bool) -> Result<String> {
    let key = if create {
        id()
    } else {
        s(value, "id").to_owned()
    };
    let edition: String = if create {
        c.query_row(
            "SELECT id FROM editions WHERE id=?",
            [s(value, "edition_id")],
            |r| r.get(0),
        )?
    } else {
        c.query_row(
            "SELECT edition_id FROM copies WHERE id=? AND deleted_at IS NULL",
            [&key],
            |r| r.get(0),
        )?
    };
    let mut extra: Value = if create {
        json!({})
    } else {
        let text: String =
            c.query_row("SELECT extra FROM copies WHERE id=?", [&key], |r| r.get(0))?;
        serde_json::from_str(&text)?
    };
    // Merge only physical fields; reading history/custom values remain independent and intact.
    for name in [
        "inventory_code",
        "copy_state",
        "ownership",
        "seller",
        "purchase_price",
        "currency",
        "original_price",
        "gift",
        "gifted_by",
        "acquisition_notes",
        "receipt",
        "shelf_position",
        "location_note",
        "signed",
        "first_edition",
        "special_edition",
        "numbered_edition",
        "dust_jacket",
        "condition_notes",
        "personal_notes",
    ] {
        if let Some(v) = value["copy_extra"].get(name) {
            if !v.is_string() && !v.is_number() && !v.is_boolean() {
                return Err("Invalid copy field value.".into());
            }
            extra[name] = v.clone();
        }
    }
    if s(&extra, "inventory_code").trim().is_empty() {
        let number: i64 = if create {
            c.query_row(
                "SELECT count(*)+1 FROM copies WHERE edition_id=?",
                [&edition],
                |r| r.get(0),
            )?
        } else {
            c.query_row("SELECT count(*) FROM copies WHERE edition_id=? AND rowid<=(SELECT rowid FROM copies WHERE id=?)",params![edition,key],|r|r.get(0))?
        };
        extra["inventory_code"] = json!(format!("Copy #{number}"));
    }
    if !["", "Owned", "Missing"].contains(&s(&extra, "copy_state")) {
        return Err("Choose Owned or Missing; use Loans or Archive for other states.".into());
    }
    let lent: bool = c.query_row(
        "SELECT EXISTS(SELECT 1 FROM loans WHERE copy_id=? AND returned_date='')",
        [&key],
        |r| r.get(0),
    )?;
    if lent && s(&extra, "copy_state") == "Missing" {
        return Err("Return the active loan before marking this copy missing.".into());
    }
    for name in ["purchase_price", "original_price"] {
        if let Some(v) = extra.get(name) {
            if !v.as_str().is_some_and(str::is_empty) {
                let n = v
                    .as_f64()
                    .or_else(|| v.as_str().and_then(|s| s.parse::<f64>().ok()))
                    .ok_or("Prices must be numbers.")?;
                if !n.is_finite() || n < 0.0 {
                    return Err("Prices cannot be negative.".into());
                }
            }
        }
    }
    let condition = s(value, "condition");
    if !["New", "Like New", "Very Good", "Good", "Acceptable", "Poor"].contains(&condition) {
        return Err("Choose a valid condition.".into());
    }
    let date = s(value, "acquisition_date");
    if !date.is_empty() {
        check_date(date)?;
    }
    let location = s(value, "location_id");
    let source = s(value, "source").trim();
    let source_id: Option<String> = if source.is_empty() {
        None
    } else {
        c.execute(
            "INSERT OR IGNORE INTO acquisition_sources(id,name) VALUES(?,?)",
            params![id(), source],
        )?;
        Some(c.query_row(
            "SELECT id FROM acquisition_sources WHERE name=? COLLATE NOCASE",
            [source],
            |r| r.get(0),
        )?)
    };
    if create {
        c.execute("INSERT INTO copies(id,edition_id,barcode,location_id,source_id,acquisition_date,condition,extra,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)",params![key,edition,s(value,"barcode"),if location.is_empty(){None}else{Some(location)},source_id,date,condition,extra.to_string(),now(),now()])?;
    } else {
        c.execute("UPDATE copies SET barcode=?,location_id=?,source_id=?,acquisition_date=?,condition=?,extra=?,updated_at=? WHERE id=?",params![s(value,"barcode"),if location.is_empty(){None}else{Some(location)},source_id,date,condition,extra.to_string(),now(),key])?;
    }
    c.execute("INSERT INTO change_history(copy_id,action,snapshot,created_at) VALUES(?,'physical-copy',?,?)",params![key,value.to_string(),now()])?;
    Ok(key)
}

pub fn move_copies(c: &Connection, ids: &Value, location: &str) -> Result<()> {
    for key in ids.as_array().ok_or("Select copies to move.")? {
        let key = key.as_str().ok_or("Invalid copy identifier.")?;
        let count = c.execute(
            "UPDATE copies SET location_id=?,updated_at=? WHERE id=? AND deleted_at IS NULL",
            params![
                if location.is_empty() {
                    None
                } else {
                    Some(location)
                },
                now(),
                key
            ],
        )?;
        if count != 1 {
            return Err("Copy not found. Refresh the library.".into());
        }
        c.execute(
            "INSERT INTO change_history(copy_id,action,snapshot,created_at) VALUES(?,'move',?,?)",
            params![key, json!({"location_id":location}).to_string(), now()],
        )?;
    }
    Ok(())
}
