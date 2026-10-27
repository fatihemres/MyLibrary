//! Independent acquisition intentions. Never creates or updates Editions or Copies.
use crate::db::{id, now, Result, Store};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashSet};

pub const STATUSES: [&str; 4] = ["Wishing", "On Order", "Pre-Order", "Cancelled"];

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Retailer {
    pub id: String,
    pub name: String,
    pub url: String,
    pub offer_minor: Option<String>,
    pub currency: String,
    pub notes: String,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Draft {
    pub id: String,
    pub edition_id: Option<String>,
    pub title: String,
    pub author: String,
    pub isbn10: String,
    pub isbn13: String,
    pub preference: String,
    pub edition_description: String,
    pub priority: String,
    pub status: String,
    pub target_minor: Option<String>,
    pub currency: String,
    pub notes: String,
    pub archived: bool,
    pub updated_at: String,
    pub retailers: Vec<Retailer>,
}
// Offline ISO 4217 currencies with a defined minor unit. Non-monetary X codes,
// precious metals and currencies without a defined minor unit are not accepted.
pub fn precision(code: &str) -> Result<u32> {
    let table: BTreeMap<String, u32> =
        serde_json::from_str(include_str!("../../src/domain/currencies.json"))?;
    table
        .get(code)
        .copied()
        .ok_or_else(|| "wishlist.invalidCurrency".into())
}
pub fn minor(value: &Option<String>, currency: &str) -> Result<Option<i64>> {
    precision(currency)?;
    value
        .as_ref()
        .map(|s| {
            if s.is_empty()
                || s.len() > 19
                || !s.bytes().all(|b| b.is_ascii_digit())
                || (s.len() > 1 && s.starts_with('0'))
            {
                return Err("wishlist.invalidAmount".into());
            }
            s.parse::<i64>()
                .map_err(|_| "wishlist.invalidAmount".into())
        })
        .transpose()
}
fn text(s: &str, max: usize) -> Result<()> {
    if s.contains('\0') || s.chars().count() > max {
        return Err("wishlist.invalidText".into());
    }
    Ok(())
}
fn uuid(s: &str) -> Result<()> {
    uuid::Uuid::parse_str(s)
        .map(|_| ())
        .map_err(|_| "wishlist.invalidId".into())
}
/// Validate once and pass this exact canonical URL to the native opener. No request here.
pub fn retailer_url(input: &str) -> Result<String> {
    if input.len() > 2048
        || input.chars().any(|c| c.is_control() || c.is_whitespace())
        || input.contains('\\')
        || !input.starts_with("https://")
    {
        return Err("wishlist.invalidUrl".into());
    }
    let url = reqwest::Url::parse(input).map_err(|_| "wishlist.invalidUrl")?;
    if url.scheme() != "https"
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
    {
        return Err("wishlist.invalidUrl".into());
    }
    Ok(url.to_string())
}
pub fn validate(d: &Draft) -> Result<()> {
    if !d.id.is_empty() {
        uuid(&d.id)?;
    }
    if let Some(e) = &d.edition_id {
        text(e, 200)?;
        if e.is_empty() {
            return Err("wishlist.invalidId".into());
        }
    }
    text(&d.title, 500)?;
    text(&d.author, 1000)?;
    text(&d.edition_description, 2000)?;
    text(&d.notes, 20000)?;
    if d.title.trim().is_empty() {
        return Err("wishlist.titleRequired".into());
    }
    if !["Any", "Specific"].contains(&d.preference.as_str())
        || !["Low", "Medium", "High", "Urgent"].contains(&d.priority.as_str())
        || !STATUSES.contains(&d.status.as_str())
    {
        return Err("wishlist.invalidChoice".into());
    }
    let ten = if d.isbn10.is_empty() {
        None
    } else {
        Some(crate::isbn::parse(&d.isbn10)?)
    };
    let thirteen = if d.isbn13.is_empty() {
        None
    } else {
        Some(crate::isbn::parse(&d.isbn13)?)
    };
    if ten
        .as_ref()
        .is_some_and(|i| i.isbn10.as_deref() != Some(d.isbn10.as_str()))
        || thirteen.as_ref().is_some_and(|i| i.isbn13 != d.isbn13)
        || ten
            .as_ref()
            .zip(thirteen.as_ref())
            .is_some_and(|(a, b)| a.isbn13 != b.isbn13)
    {
        return Err("metadata.invalidIsbn".into());
    }
    minor(&d.target_minor, &d.currency)?;
    if d.retailers.len() > 30 {
        return Err("wishlist.retailerLimit".into());
    }
    let mut ids = HashSet::new();
    for r in &d.retailers {
        uuid(&r.id)?;
        if !ids.insert(&r.id) || r.name.trim().is_empty() {
            return Err("wishlist.invalidRetailer".into());
        }
        text(&r.name, 200)?;
        text(&r.notes, 2000)?;
        retailer_url(&r.url)?;
        minor(&r.offer_minor, &r.currency)?;
    }
    Ok(())
}
fn canonical(d: &Draft) -> String {
    crate::isbn::parse(if d.isbn13.is_empty() {
        &d.isbn10
    } else {
        &d.isbn13
    })
    .map(|v| v.isbn13)
    .unwrap_or_default()
}
fn rows(c: &Connection) -> Result<Vec<Draft>> {
    let mut st=c.prepare("SELECT id,edition_id,title,author,isbn10,isbn13,preference,edition_description,priority,status,target_minor,currency,notes,archived_at,updated_at FROM wishlist_items ORDER BY created_at DESC,id")?;
    let mut items = st
        .query_map([], |r| {
            Ok(Draft {
                id: r.get(0)?,
                edition_id: r.get(1)?,
                title: r.get(2)?,
                author: r.get(3)?,
                isbn10: r.get(4)?,
                isbn13: r.get(5)?,
                preference: r.get(6)?,
                edition_description: r.get(7)?,
                priority: r.get(8)?,
                status: r.get(9)?,
                target_minor: r.get::<_, Option<i64>>(10)?.map(|n| n.to_string()),
                currency: r.get(11)?,
                notes: r.get(12)?,
                archived: r.get::<_, Option<String>>(13)?.is_some(),
                updated_at: r.get(14)?,
                retailers: vec![],
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    let mut retailers=c.prepare("SELECT id,name,url,offer_minor,currency,notes FROM wishlist_retailers WHERE wishlist_id=? ORDER BY position,id")?;
    for d in &mut items {
        d.retailers = retailers
            .query_map([&d.id], |r| {
                Ok(Retailer {
                    id: r.get(0)?,
                    name: r.get(1)?,
                    url: r.get(2)?,
                    offer_minor: r.get::<_, Option<i64>>(3)?.map(|v| v.to_string()),
                    currency: r.get(4)?,
                    notes: r.get(5)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;
    }
    Ok(items)
}
fn edition_check(c: &Connection, d: &Draft) -> Result<()> {
    if let Some(e) = &d.edition_id {
        let (ten, thirteen): (String, String) = c
            .query_row("SELECT isbn10,isbn13 FROM editions WHERE id=?", [e], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .optional()?
            .ok_or("wishlist.editionMissing")?;
        let wished = canonical(d);
        if !wished.is_empty()
            && [ten, thirteen].iter().filter(|v| !v.is_empty()).any(|v| {
                crate::isbn::parse(v)
                    .map(|i| i.isbn13 != wished)
                    .unwrap_or(true)
            })
        {
            return Err("wishlist.editionMismatch".into());
        }
    }
    Ok(())
}
fn duplicate_report(c: &Connection, d: &Draft) -> Result<Value> {
    let isbn = canonical(d);
    let title = crate::search::normalize(d.title.trim()).to_lowercase();
    let author = crate::search::normalize(d.author.trim()).to_lowercase();
    let mut found = vec![];
    for other in rows(c)? {
        if other.id == d.id {
            continue;
        }
        let exact = !isbn.is_empty() && canonical(&other) == isbn;
        let similar = crate::search::normalize(other.title.trim()).to_lowercase() == title
            && crate::search::normalize(other.author.trim()).to_lowercase() == author;
        if exact || similar {
            found.push(json!({"kind":"wishlist","id":other.id,"title":other.title,"archived":other.archived,"exact":exact,"updated_at":other.updated_at}));
        }
    }
    let mut st=c.prepare("SELECT e.id,e.title,e.isbn10,e.isbn13,coalesce((SELECT group_concat(p.name,'; ') FROM contributors x JOIN people p ON p.id=x.person_id WHERE x.edition_id=e.id AND x.role='Author'),'') FROM editions e ORDER BY e.id")?;
    for row in st.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, String>(2)?,
            r.get::<_, String>(3)?,
            r.get::<_, String>(4)?,
        ))
    })? {
        let (id, title_value, ten, thirteen, author_value) = row?;
        let exact = !isbn.is_empty()
            && [ten, thirteen].iter().any(|s| {
                crate::isbn::parse(s)
                    .map(|i| i.isbn13 == isbn)
                    .unwrap_or(false)
            });
        let similar = crate::search::normalize(title_value.trim()).to_lowercase() == title
            && crate::search::normalize(author_value.trim()).to_lowercase() == author;
        if exact || similar {
            found.push(json!({"kind":"edition","id":id,"title":title_value,"exact":exact}));
        }
    }
    Ok(json!(found))
}
pub fn validate_database(c: &Connection) -> Result<()> {
    for d in rows(c)? {
        validate(&d)?;
        let latest: Option<String> = c.query_row("SELECT status FROM wishlist_status_history WHERE wishlist_id=? ORDER BY rowid DESC LIMIT 1", [&d.id], |r| r.get(0)).optional()?;
        if latest.as_deref() != Some(d.status.as_str()) {
            return Err("wishlist.invalidHistory".into());
        }
        let (created, archived): (String, Option<String>) = c.query_row(
            "SELECT created_at,archived_at FROM wishlist_items WHERE id=?",
            [&d.id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )?;
        if chrono::DateTime::parse_from_rfc3339(&created).is_err()
            || archived
                .as_ref()
                .is_some_and(|v| chrono::DateTime::parse_from_rfc3339(v).is_err())
        {
            return Err("wishlist.invalidHistory".into());
        }
        let mut index = c.prepare("SELECT body FROM wishlist_search WHERE wishlist_id=?")?;
        let bodies = index
            .query_map([&d.id], |r| r.get::<_, String>(0))?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        if bodies
            != vec![crate::search::normalize(&format!(
                "{} {} {} {}",
                d.title, d.author, d.isbn10, d.isbn13
            ))]
        {
            return Err("wishlist.invalidIndex".into());
        }
        // Linked Edition bibliographic fields may have been explicitly edited later.
        // FK integrity is checked by restore; never rewrite either independent identity.
        if chrono::DateTime::parse_from_rfc3339(&d.updated_at).is_err() {
            return Err("wishlist.invalidHistory".into());
        }
    }
    if c.prepare("SELECT 1 FROM wishlist_search s LEFT JOIN wishlist_items i ON i.id=s.wishlist_id WHERE i.id IS NULL LIMIT 1")?.exists([])? { return Err("wishlist.invalidIndex".into()); }
    let mut st =
        c.prepare("SELECT id,wishlist_id,status,created_at FROM wishlist_status_history")?;
    for r in st.query_map([], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, String>(2)?,
            r.get::<_, String>(3)?,
        ))
    })? {
        let (id, item, status, time) = r?;
        uuid(&id)?;
        uuid(&item)?;
        if !STATUSES.contains(&status.as_str())
            || chrono::DateTime::parse_from_rfc3339(&time).is_err()
        {
            return Err("wishlist.invalidHistory".into());
        }
    }
    Ok(())
}
impl Store {
    pub fn wishlist_list(&self, query: &str) -> Result<Value> {
        let q = crate::search::query(query)?;
        let c = self.conn()?;
        let all = rows(&c)?;
        let mut totals: BTreeMap<String, i128> = BTreeMap::new();
        let mut missing = 0;
        for d in &all {
            if !d.archived && d.status != "Cancelled" {
                if let Some(amount) = minor(&d.target_minor, &d.currency)? {
                    *totals.entry(d.currency.clone()).or_default() += i128::from(amount);
                } else {
                    missing += 1;
                }
            }
        }
        let ids: Option<HashSet<String>> = if q.is_empty() {
            None
        } else {
            let mut st =
                c.prepare("SELECT wishlist_id FROM wishlist_search WHERE wishlist_search MATCH ?")?;
            let values = st
                .query_map([q], |r| r.get(0))?
                .collect::<rusqlite::Result<HashSet<_>>>()?;
            Some(values)
        };
        let mut items = vec![];
        for d in all
            .into_iter()
            .filter(|d| ids.as_ref().is_none_or(|s| s.contains(&d.id)))
        {
            let cover: String = if let Some(e) = &d.edition_id {
                c.query_row("SELECT cover FROM editions WHERE id=?", [e], |r| r.get(0))?
            } else {
                String::new()
            };
            let mut history=c.prepare("SELECT status,created_at FROM wishlist_status_history WHERE wishlist_id=? ORDER BY rowid")?;
            let history = history
                .query_map([&d.id], |r| {
                    Ok(json!({"status":r.get::<_,String>(0)?,"created_at":r.get::<_,String>(1)?}))
                })?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            items.push(json!({"draft":d,"cover":cover,"history":history}));
        }
        Ok(
            json!({"items":items,"budget":totals.into_iter().map(|(currency,minor)| json!({"currency":currency,"minor":minor.to_string()})).collect::<Vec<_>>(),"missing_prices":missing}),
        )
    }
    pub fn wishlist_save(&self, draft: &Draft, review_token: Option<&str>) -> Result<Value> {
        validate(draft)?;
        let mut c = self.conn()?;
        let tx = c.transaction_with_behavior(TransactionBehavior::Immediate)?;
        edition_check(&tx, draft)?;
        let previous: Option<(String, String, Option<String>)> = if draft.id.is_empty() {
            None
        } else {
            Some(
                tx.query_row(
                    "SELECT status,updated_at,archived_at FROM wishlist_items WHERE id=?",
                    [&draft.id],
                    |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
                )
                .optional()?
                .ok_or("wishlist.missing")?,
            )
        };
        if previous.as_ref().is_some_and(|p| p.1 != draft.updated_at) {
            return Err("wishlist.changed".into());
        }
        let report = duplicate_report(&tx, draft)?;
        // Bind acknowledgement to the exact draft and fresh database warnings.
        let token = serde_json::to_string(&(draft, &report))?;
        if !report.as_array().unwrap().is_empty() && review_token != Some(token.as_str()) {
            return Ok(json!({"saved":false,"review":report,"review_token":token}));
        }
        let mut d = draft.clone();
        if d.id.is_empty() {
            d.id = id();
        }
        let time = now();
        let archived = if d.archived {
            Some(
                previous
                    .as_ref()
                    .and_then(|p| p.2.clone())
                    .unwrap_or_else(|| time.clone()),
            )
        } else {
            None
        };
        tx.execute("INSERT INTO wishlist_items(id,edition_id,title,author,isbn10,isbn13,preference,edition_description,priority,status,target_minor,currency,notes,archived_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET edition_id=excluded.edition_id,title=excluded.title,author=excluded.author,isbn10=excluded.isbn10,isbn13=excluded.isbn13,preference=excluded.preference,edition_description=excluded.edition_description,priority=excluded.priority,status=excluded.status,target_minor=excluded.target_minor,currency=excluded.currency,notes=excluded.notes,archived_at=excluded.archived_at,updated_at=excluded.updated_at",params![d.id,d.edition_id,d.title,d.author,d.isbn10,d.isbn13,d.preference,d.edition_description,d.priority,d.status,minor(&d.target_minor,&d.currency)?,d.currency,d.notes,archived,time,time])?;
        tx.execute(
            "DELETE FROM wishlist_retailers WHERE wishlist_id=?",
            [&d.id],
        )?;
        for (position, r) in d.retailers.iter().enumerate() {
            tx.execute("INSERT INTO wishlist_retailers(id,wishlist_id,name,url,offer_minor,currency,notes,position) VALUES(?,?,?,?,?,?,?,?)",params![r.id,d.id,r.name,retailer_url(&r.url)?,minor(&r.offer_minor,&r.currency)?,r.currency,r.notes,position as i64])?;
        }
        if previous.as_ref().is_none_or(|p| p.0 != d.status) {
            tx.execute(
                "INSERT INTO wishlist_status_history VALUES(?,?,?,?)",
                params![id(), d.id, d.status, time],
            )?;
        }
        tx.execute("DELETE FROM wishlist_search WHERE wishlist_id=?", [&d.id])?;
        tx.execute(
            "INSERT INTO wishlist_search VALUES(?,?)",
            params![
                d.id,
                crate::search::normalize(&format!(
                    "{} {} {} {}",
                    d.title, d.author, d.isbn10, d.isbn13
                ))
            ],
        )?;
        tx.commit()?;
        Ok(json!({"saved":true,"id":d.id}))
    }
    pub fn wishlist_retailer_url(&self, item: &str, retailer: &str) -> Result<String> {
        uuid(item)?;
        uuid(retailer)?;
        let url: String = self.conn()?.query_row(
            "SELECT url FROM wishlist_retailers WHERE wishlist_id=? AND id=?",
            params![item, retailer],
            |r| r.get(0),
        )?;
        retailer_url(&url)
    }
    pub fn wishlist_editions(&self, query: &str) -> Result<Value> {
        crate::search::query(query)?;
        if query.trim().is_empty() {
            return Ok(json!([]));
        }
        // Explicit choice list, bounded; no relationship inference.
        let mut st = self.conn()?;
        let tx = st.transaction()?;
        let mut q = tx.prepare("SELECT id,title,isbn10,isbn13 FROM editions ORDER BY title,id")?;
        let needle = crate::search::normalize(query).to_lowercase();
        let mut result = vec![];
        for r in q.query_map([],|r| Ok(json!({"id":r.get::<_,String>(0)?,"title":r.get::<_,String>(1)?,"isbn10":r.get::<_,String>(2)?,"isbn13":r.get::<_,String>(3)?})))? {
            let r=r?;
            if crate::search::normalize(&format!("{} {} {}",r["title"],r["isbn10"],r["isbn13"])).to_lowercase().contains(&needle) { result.push(r); if result.len()==50 { break; } }
        }
        Ok(json!(result))
    }
}
