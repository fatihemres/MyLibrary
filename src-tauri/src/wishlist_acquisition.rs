//! Explicit fulfillment overlay; the original wish, retailers and status rows stay intact.
use crate::db::{id, Result, Store};
use crate::wishlist::{edition_check, rows, uuid, validate};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Physical {
    pub barcode: String,
    pub inventory_code: String,
    pub location_id: String,
    pub source: String,
    pub acquisition_date: String,
    pub condition: String,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub item: String,
    pub updated_at: String,
    pub edition_id: Option<String>,
    pub title: String,
    pub author: String,
    pub isbn10: String,
    pub isbn13: String,
    pub physical: Physical,
}

fn event_time(previous: &[&str]) -> Result<String> {
    let mut time = chrono::Utc::now().fixed_offset();
    for value in previous {
        let value = chrono::DateTime::parse_from_rfc3339(value)?;
        if time <= value {
            time = value
                .checked_add_signed(chrono::Duration::nanoseconds(1))
                .ok_or("wishlist.invalidHistory")?;
        }
    }
    Ok(time.to_rfc3339())
}

pub(crate) fn history(c: &Connection, item: &str) -> Result<Vec<Value>> {
    let mut q = c.prepare("SELECT id,copy_id,acquired_at,reopened_at FROM wishlist_acquisitions WHERE wishlist_id=? ORDER BY rowid")?;
    let rows = q.query_map([item], |r| Ok(json!({"id":r.get::<_,String>(0)?,"copy_id":r.get::<_,String>(1)?,"acquired_at":r.get::<_,String>(2)?,"reopened_at":r.get::<_,Option<String>>(3)?})))?.collect::<rusqlite::Result<_>>()?;
    Ok(rows)
}
pub(crate) fn active(c: &Connection, item: &str) -> Result<Option<String>> {
    Ok(c.query_row(
        "SELECT id FROM wishlist_acquisitions WHERE wishlist_id=? AND reopened_at IS NULL",
        [item],
        |r| r.get(0),
    )
    .optional()?)
}

fn review(c: &Connection, request: &Request) -> Result<Value> {
    uuid(&request.item)?;
    let wish = rows(c)?
        .into_iter()
        .find(|d| d.id == request.item)
        .ok_or("wishlist.missing")?;
    if wish.updated_at != request.updated_at || active(c, &wish.id)?.is_some() {
        return Err("wishlist.changed".into());
    }
    if wish.archived || wish.status == "Cancelled" {
        return Err("acquisition.ineligible".into());
    }
    for value in [
        &request.physical.barcode,
        &request.physical.inventory_code,
        &request.physical.location_id,
        &request.physical.source,
    ] {
        if value.contains('\0') || value.chars().count() > 500 {
            return Err("wishlist.invalidText".into());
        }
    }
    let mut bibliographic = wish.clone();
    bibliographic.edition_id = request.edition_id.clone();
    let edition = if let Some(edition) = &request.edition_id {
        if edition.is_empty() || edition.len() > 200 || edition.contains('\0') {
            return Err("wishlist.invalidId".into());
        }
        edition_check(c, &bibliographic)?;
        let text: String = c.query_row("SELECT json_object('id',e.id,'title',e.title,'subtitle',e.subtitle,'isbn10',e.isbn10,'isbn13',e.isbn13,'cover',e.cover,'updated_at',e.updated_at,'authors',coalesce((SELECT group_concat(p.name,'; ') FROM contributors x JOIN people p ON p.id=x.person_id WHERE x.edition_id=e.id AND x.role='Author' ORDER BY x.position),'')) FROM editions e WHERE e.id=?", [edition], |r| r.get(0))?;
        serde_json::from_str::<Value>(&text)?
    } else {
        bibliographic.title = request.title.clone();
        bibliographic.author = request.author.clone();
        bibliographic.isbn10 = request.isbn10.clone();
        bibliographic.isbn13 = request.isbn13.clone();
        validate(&bibliographic)?;
        json!({"title":request.title,"authors":request.author,"isbn10":request.isbn10,"isbn13":request.isbn13})
    };
    // History binds consent across acquire/reopen cycles even if a clock repeats a timestamp.
    let token = serde_json::to_string(&(request, &wish, history(c, &wish.id)?, &edition))?;
    Ok(json!({"edition":edition,"review_token":token}))
}

impl Store {
    /// None previews without writes. Some(token) rechecks the exact preview under the write lock.
    pub fn wishlist_acquisition(&self, request: &Request, token: Option<&str>) -> Result<Value> {
        let mut c = self.conn()?;
        let tx = c.transaction_with_behavior(if token.is_some() {
            TransactionBehavior::Immediate
        } else {
            TransactionBehavior::Deferred
        })?;
        let preview = review(&tx, request)?;
        let Some(token) = token else {
            return Ok(preview);
        };
        if preview["review_token"].as_str() != Some(token) {
            return Err("wishlist.changed".into());
        }
        let mut physical = serde_json::to_value(&request.physical)?;
        physical["copy_extra"] = json!({"inventory_code":request.physical.inventory_code,"copy_state":"Owned","ownership":"Owned"});
        let copy = if let Some(edition) = &request.edition_id {
            physical["edition_id"] = json!(edition);
            crate::copies::save(&tx, &physical, true)?
        } else {
            let copy = crate::db::save_book(
                &tx,
                &json!({"title":request.title,"isbn10":request.isbn10,"isbn13":request.isbn13,"contributors":[{"name":request.author,"role":"Author"}],"extra":{},"terms":{},"copy_extra":{"copy_state":"Owned","ownership":"Owned"}}),
            )?;
            physical["id"] = json!(copy);
            crate::copies::save(&tx, &physical, false)?;
            copy
        };
        let time = event_time(&[&request.updated_at])?;
        let acquisition = id();
        tx.execute(
            "INSERT INTO wishlist_acquisitions(id,wishlist_id,copy_id,acquired_at) VALUES(?,?,?,?)",
            params![acquisition, request.item, copy, time],
        )?;
        tx.execute(
            "UPDATE wishlist_items SET updated_at=? WHERE id=?",
            params![time, request.item],
        )?;
        crate::db::reindex(&tx)?;
        tx.commit()?;
        Ok(json!({"copy_id":copy,"acquisition":acquisition}))
    }
    pub fn wishlist_reopen_acquisition(
        &self,
        item: &str,
        updated: &str,
        acquisition: &str,
    ) -> Result<Value> {
        uuid(item)?;
        uuid(acquisition)?;
        let mut c = self.conn()?;
        let tx = c.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current: String = tx
            .query_row(
                "SELECT updated_at FROM wishlist_items WHERE id=?",
                [item],
                |r| r.get(0),
            )
            .optional()?
            .ok_or("wishlist.missing")?;
        if current != updated || active(&tx, item)?.as_deref() != Some(acquisition) {
            return Err("wishlist.changed".into());
        }
        let acquired: String = tx.query_row(
            "SELECT acquired_at FROM wishlist_acquisitions WHERE id=?",
            [acquisition],
            |r| r.get(0),
        )?;
        let time = event_time(&[&current, &acquired])?;
        tx.execute(
            "UPDATE wishlist_acquisitions SET reopened_at=? WHERE id=?",
            params![time, acquisition],
        )?;
        // Reopen intent only; the acquired Copy and Edition are never edited or deleted.
        tx.execute(
            "UPDATE wishlist_items SET status='Wishing',updated_at=? WHERE id=?",
            params![time, item],
        )?;
        tx.execute(
            "INSERT INTO wishlist_status_history VALUES(?,?,'Wishing',?)",
            params![id(), item, time],
        )?;
        tx.commit()?;
        Ok(json!(true))
    }
}

pub fn validate_database(c: &Connection) -> Result<()> {
    let mut q = c.prepare("SELECT id,wishlist_id,copy_id,acquired_at,reopened_at FROM wishlist_acquisitions ORDER BY rowid")?;
    for row in q.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, String>(2)?,
            r.get::<_, String>(3)?,
            r.get::<_, Option<String>>(4)?,
        ))
    })? {
        let (id, item, copy, acquired, reopened) = row?;
        uuid(&id)?;
        uuid(&item)?;
        uuid(&copy)?;
        let acquired = chrono::DateTime::parse_from_rfc3339(&acquired)?;
        if reopened
            .as_ref()
            .map(|r| chrono::DateTime::parse_from_rfc3339(r))
            .transpose()?
            .is_some_and(|r| r < acquired)
        {
            return Err("wishlist.invalidHistory".into());
        }
        if reopened.is_none()
            && c.query_row(
                "SELECT status FROM wishlist_items WHERE id=?",
                [&item],
                |r| r.get::<_, String>(0),
            )? == "Cancelled"
        {
            return Err("wishlist.invalidHistory".into());
        }
    }
    Ok(())
}
