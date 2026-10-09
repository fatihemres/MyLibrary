use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
use std::{
    fs,
    path::{Path, PathBuf},
    time::Duration,
};
pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
pub fn id() -> String {
    uuid::Uuid::new_v4().to_string()
}
pub fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}
pub fn s<'a>(v: &'a Value, k: &str) -> &'a str {
    v[k].as_str().unwrap_or("")
}
fn opt(v: &Value, k: &str) -> Option<String> {
    let t = s(v, k);
    if t.is_empty() {
        None
    } else {
        Some(t.to_string())
    }
}
pub struct Store {
    pub root: PathBuf,
    _lock: fs::File,
}
impl Store {
    pub fn open(root: PathBuf) -> Result<Self> {
        fs::create_dir_all(&root)?;
        for d in [
            "covers",
            "attachments",
            "backups",
            "thumbnails",
            "cache",
            "cache/tmp",
        ] {
            fs::create_dir_all(root.join(d))?;
        }
        let lock = fs::OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(root.join(".library.lock"))?;
        lock.try_lock().map_err(|_|"This library is already open in another MyLibrary window. Close that window before opening it again.")?;
        let store = Self { root, _lock: lock };
        let mut c = store.conn()?;
        crate::migrations::migrate(&mut c, &store.root)?;
        Ok(store)
    }
    pub fn conn(&self) -> Result<Connection> {
        let c = Connection::open(self.root.join("library.sqlite3"))?;
        c.busy_timeout(Duration::from_secs(10))?;
        c.execute_batch(
            "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;",
        )?;
        Ok(c)
    }
    pub fn snapshot(&self, query: &str, trash: bool) -> Result<Value> {
        let c = self.conn()?;
        let books = list(&c, trash)?;
        let ids = if query.trim().is_empty() {
            Value::Null
        } else {
            let q = query
                .split_whitespace()
                .map(|t| format!("\"{}\"*", t.replace('"', "\"\"")))
                .collect::<Vec<_>>()
                .join(" AND ");
            let mut stmt =
                c.prepare("SELECT copy_id FROM book_search WHERE book_search MATCH ?")?;
            let rows = stmt
                .query_map([q], |r| r.get::<_, String>(0))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            json!(rows)
        };
        Ok(
            json!({"books":books,"searchIds":ids,"people":entities(&c,"people")?,"publishers":entities(&c,"publishers")?,"series":entities(&c,"series")?,"locations":entities(&c,"locations")?,"sources":entities(&c,"acquisition_sources")?,"fields":entities(&c,"custom_fields")?,"terms":entities(&c,"terms")?,"loans":rows(&c,"SELECT json_object('id',id,'copy_id',copy_id,'borrower',borrower,'contact',contact,'loan_date',loan_date,'due_date',due_date,'returned_date',returned_date,'notes',notes) FROM loans ORDER BY loan_date DESC")?,"entries":rows(&c,"SELECT json_object('id',id,'copy_id',copy_id,'kind',kind,'title',title,'content',content,'page',page,'extra',json(extra),'created_at',created_at,'updated_at',updated_at) FROM entries ORDER BY updated_at DESC")?,"attachments":rows(&c,"SELECT json_object('id',id,'copy_id',copy_id,'name',name,'path',path,'created_at',created_at) FROM attachments")?,"settings":rows(&c,"SELECT json_object('key',key,'value',value) FROM settings")?,"dataDir":self.root.to_string_lossy()}),
        )
    }
    pub fn save(&self, book: &Value) -> Result<String> {
        let mut c = self.conn()?;
        let tx = c.transaction()?;
        let key = save_book(&tx, book)?;
        reindex(&tx)?;
        tx.commit()?;
        Ok(key)
    }
    pub fn import(&self, books: &[Value]) -> Result<usize> {
        if books.len() > 50000 {
            return Err("Import is limited to 50,000 rows at a time.".into());
        }
        let mut c = self.conn()?;
        let tx = c.transaction()?;
        let mut editions: std::collections::HashMap<String, (String, Value)> =
            std::collections::HashMap::new();
        for b in books {
            if !b.is_object() {
                return Err("Expected each book to be an object.".into());
            }
            let mut b = b.clone();
            b["id"] = json!("");
            b["edition_id"] = json!("");
            b["cover"] = json!("");
            if b.get("custom").is_some() && !b["custom"].is_null() && !b["custom"].is_object() {
                return Err("Book custom values must be an object.".into());
            }
            if b.get("transfer").is_some() && !b["transfer"].is_null() && !b["transfer"].is_object()
            {
                return Err("Book transfer metadata must be an object.".into());
            }
            if b["transfer"].is_object() {
                let transfer = b["transfer"].clone();
                if !s(&transfer, "error").is_empty() {
                    return Err(s(&transfer, "error").to_owned().into());
                }
                let mut parent: Option<String> = None;
                if let Some(path) = transfer["location"].as_array() {
                    if path.len() > 50 {
                        return Err("Location hierarchy is too deep.".into());
                    }
                    for (index, name) in path.iter().enumerate() {
                        let name = name
                            .as_str()
                            .ok_or("Invalid location name in import")?
                            .trim();
                        if name.is_empty() {
                            return Err("Imported location names cannot be empty.".into());
                        }
                        let existing:Option<String>=tx.query_row("SELECT id FROM locations WHERE name=? COLLATE NOCASE AND parent_id IS ?",params![name,parent],|r|r.get(0)).optional()?;
                        let key = existing.unwrap_or_else(id);
                        if !tx.query_row(
                            "SELECT EXISTS(SELECT 1 FROM locations WHERE id=?)",
                            [&key],
                            |r| r.get::<_, bool>(0),
                        )? {
                            let kind = transfer["location_kinds"][index].as_str().unwrap_or("");
                            save_entity(
                                &tx,
                                &json!({"table":"locations","id":key,"name":name,"parent_id":parent,"extra":{"kind":kind}}),
                            )?;
                        }
                        parent = Some(key);
                    }
                }
                b["location_id"] = json!(parent.unwrap_or_default());
                let mut values = json!({});
                if transfer.get("fields").is_some() && !transfer["fields"].is_null() {
                    let fields = transfer["fields"]
                        .as_array()
                        .ok_or("Custom field definitions in import must be a list.")?;
                    for field in fields {
                        let field_obj = field
                            .as_object()
                            .ok_or("Custom field definition in import must be an object.")?;
                        let name = field_obj
                            .get("name")
                            .and_then(|v| v.as_str())
                            .map(str::trim)
                            .unwrap_or("");
                        if name.is_empty() {
                            return Err("Custom field name is required in import.".into());
                        }
                        let kind = field_obj.get("kind").and_then(|v| v.as_str()).unwrap_or("");
                        if !matches!(
                            kind,
                            "text"
                                | "multiline"
                                | "integer"
                                | "decimal"
                                | "date"
                                | "checkbox"
                                | "dropdown"
                        ) {
                            return Err(format!(
                                "Unsupported custom field kind '{kind}' in import."
                            )
                            .into());
                        }
                        if let Some(id_val) = field_obj.get("id") {
                            if !id_val.is_null() && !id_val.is_string() {
                                return Err("Custom field definition ID must be text.".into());
                            }
                        }
                        if let Some(extra_val) = field_obj.get("extra") {
                            if !extra_val.is_null() && !extra_val.is_object() {
                                return Err(
                                    "Custom field definition extra must be an object.".into()
                                );
                            }
                        }
                        let old = s(field, "id");
                        let value = b["custom"][old].clone();
                        if value.is_null() {
                            continue;
                        }
                        let existing: Option<(String, String)> = tx
                            .query_row(
                                "SELECT id,kind FROM custom_fields WHERE name=? COLLATE NOCASE",
                                [name],
                                |r| Ok((r.get(0)?, r.get(1)?)),
                            )
                            .optional()?;
                        let key = if let Some((key, existing_kind)) = existing {
                            if existing_kind != kind {
                                return Err(format!("The custom field '{name}' already exists with a different type. Rename the imported field or use a full backup restore.").into());
                            }
                            key
                        } else {
                            let mut definition = field.clone();
                            definition["id"] = json!(id());
                            definition["table"] = json!("custom_fields");
                            save_entity(&tx, &definition)?;
                            s(&definition, "id").to_owned()
                        };
                        values[key] = value;
                    }
                }
                if let Some(old) = b["custom"].as_object() {
                    let defined = transfer["fields"]
                        .as_array()
                        .map(|f| {
                            f.iter()
                                .filter_map(|f| {
                                    f.as_object()
                                        .and_then(|o| o.get("id"))
                                        .and_then(|v| v.as_str())
                                })
                                .collect::<Vec<_>>()
                        })
                        .unwrap_or_default();
                    if old.keys().any(|key| !defined.contains(&key.as_str())) {
                        return Err("The JSON catalogue is missing a custom field definition. Use a complete catalogue export or ZIP backup.".into());
                    }
                }
                b["custom"] = values;
                let edition_key = s(&transfer, "edition_key");
                if !edition_key.is_empty() {
                    let mut signature = json!({});
                    for field in [
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
                        "extra",
                        "contributors",
                        "terms",
                    ] {
                        signature[field] = b[field].clone();
                    }
                    let (key, expected) = editions
                        .entry(edition_key.into())
                        .or_insert_with(|| (id(), signature.clone()));
                    if *expected != signature {
                        return Err("Copies of the same imported edition have conflicting bibliographic data. No rows were imported.".into());
                    }
                    b["edition_id"] = json!(key);
                }
            }
            if !s(&b, "location_id").is_empty()
                && !tx.query_row(
                    "SELECT EXISTS(SELECT 1 FROM locations WHERE id=?)",
                    [s(&b, "location_id")],
                    |r| r.get::<_, bool>(0),
                )?
            {
                return Err("The imported location belongs to another library. Use a portable location_path column, or leave the legacy location_id column unmapped.".into());
            }
            save_book(&tx, &b)?;
        }
        reindex(&tx)?;
        tx.commit()?;
        Ok(books.len())
    }
    pub fn mutate(&self, action: &str, v: &Value) -> Result<Value> {
        let mut c = self.conn()?;
        let tx = c.transaction()?;
        match action {
            "save_copy" | "add_copy" => {
                crate::copies::save(&tx, v, action == "add_copy")?;
            }
            "move_copies" => {
                crate::copies::move_copies(&tx, &v["ids"], s(v, "location_id"))?;
            }
            "delete_location" => {
                let key = s(v, "id");
                let used:bool=tx.query_row("SELECT EXISTS(SELECT 1 FROM copies WHERE location_id=?) OR EXISTS(SELECT 1 FROM locations WHERE parent_id=?)",params![key,key],|r|r.get(0))?;
                if used {
                    return Err("This location contains copies (including archived copies) or child locations. Move the copies and remove or move its children first.".into());
                }
                tx.execute("DELETE FROM locations WHERE id=?", [key])?;
                tx.execute(
                    "DELETE FROM settings WHERE key='default_location' AND value=?",
                    [key],
                )?;
            }
            "trash" | "untrash" => {
                for key in v["ids"].as_array().ok_or("Select at least one book.")? {
                    let key = key.as_str().ok_or("Invalid book ID")?;
                    if action == "trash" {
                        let n: i64 = tx.query_row(
                            "SELECT count(*) FROM loans WHERE copy_id=? AND returned_date=''",
                            [key],
                            |r| r.get(0),
                        )?;
                        if n > 0 {
                            return Err("Return active loans before moving a book to Trash.".into());
                        }
                    }
                    tx.execute(
                        "UPDATE copies SET deleted_at=?,updated_at=? WHERE id=?",
                        params![
                            if action == "trash" { Some(now()) } else { None },
                            now(),
                            key
                        ],
                    )?;
                }
            }
            "copy" => {
                let books = list(&tx, false)?;
                let mut b = books
                    .into_iter()
                    .find(|b| s(b, "id") == s(v, "id"))
                    .ok_or("Book not found")?;
                b["id"] = json!("");
                b["barcode"] = json!("");
                b["status"] = json!("Unread");
                b["current_page"] = json!(0);
                b["rating"] = Value::Null;
                b["copy_extra"] = json!({});
                b["custom"] = json!({});
                crate::copies::save(&tx, &b, true)?;
            }
            "entity" => {
                save_entity(&tx, v)?;
            }
            "entry" => {
                let key = if s(v, "id").is_empty() {
                    id()
                } else {
                    s(v, "id").to_string()
                };
                if !["note", "quote", "reading"].contains(&s(v, "kind")) {
                    return Err("Invalid entry type".into());
                }
                if s(v, "content").trim().is_empty() {
                    return Err("Enter some content.".into());
                }
                tx.execute("INSERT INTO entries(id,copy_id,kind,title,content,page,extra,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,content=excluded.content,page=excluded.page,extra=excluded.extra,updated_at=excluded.updated_at",params![key,s(v,"copy_id"),s(v,"kind"),s(v,"title"),s(v,"content"),v["page"].as_i64(),v["extra"].to_string(),now(),now()])?;
            }
            "delete_entry" => {
                tx.execute("DELETE FROM entries WHERE id=?", [s(v, "id")])?;
            }
            "loan" => {
                let missing:bool=tx.query_row("SELECT EXISTS(SELECT 1 FROM copies WHERE id=? AND json_extract(extra,'$.copy_state')='Missing')",[s(v,"copy_id")],|r|r.get(0))?;
                if missing {
                    return Err("Locate this missing copy before lending it.".into());
                }
                let active_copy: bool = tx.query_row(
                    "SELECT EXISTS(SELECT 1 FROM copies WHERE id=? AND deleted_at IS NULL)",
                    [s(v, "copy_id")],
                    |r| r.get(0),
                )?;
                if !active_copy {
                    return Err("Restore this book from Trash before lending it.".into());
                }
                let date = s(v, "loan_date");
                check_date(date)?;
                for k in ["due_date", "returned_date"] {
                    if !s(v, k).is_empty() {
                        check_date(s(v, k))?;
                    }
                }
                let key = if s(v, "id").is_empty() {
                    id()
                } else {
                    s(v, "id").into()
                };
                tx.execute("INSERT INTO loans(id,copy_id,borrower,contact,loan_date,due_date,returned_date,notes) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET borrower=excluded.borrower,contact=excluded.contact,loan_date=excluded.loan_date,due_date=excluded.due_date,returned_date=excluded.returned_date,notes=excluded.notes",params![key,s(v,"copy_id"),s(v,"borrower"),s(v,"contact"),date,s(v,"due_date"),s(v,"returned_date"),s(v,"notes")])?;
            }
            "return" => {
                check_date(s(v, "date"))?;
                tx.execute(
                    "UPDATE loans SET returned_date=? WHERE id=?",
                    params![s(v, "date"), s(v, "id")],
                )?;
            }
            "settings" => {
                for (k, val) in v.as_object().ok_or("Invalid settings")? {
                    tx.execute("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",params![k,val.as_str().unwrap_or("")])?;
                }
            }
            "bulk" => {
                if s(v, "field") == "location_id" {
                    crate::copies::move_copies(&tx, &v["ids"], s(v, "value"))?;
                    reindex(&tx)?;
                    tx.commit()?;
                    return Ok(json!(true));
                }
                let books: std::collections::HashMap<String, Value> = list(&tx, false)?
                    .into_iter()
                    .map(|b| (s(&b, "id").to_owned(), b))
                    .collect();
                for key in v["ids"].as_array().ok_or("Select books")? {
                    let mut b = books
                        .get(key.as_str().ok_or("Invalid book identifier")?)
                        .ok_or("Book not found")?
                        .clone();
                    match s(v, "field") {
                        "status" | "location_id" | "favorite" => {
                            b[s(v, "field")] = v["value"].clone();
                        }
                        "add_tag" | "remove_tag" => {
                            let mut tags: Vec<String> =
                                serde_json::from_value(b["terms"]["tag"].clone())
                                    .unwrap_or_default();
                            let tag = s(v, "value").trim();
                            if s(v, "field") == "add_tag"
                                && !tags.iter().any(|t| t.eq_ignore_ascii_case(tag))
                            {
                                tags.push(tag.into());
                            } else if s(v, "field") == "remove_tag" {
                                tags.retain(|t| !t.eq_ignore_ascii_case(tag));
                            }
                            b["terms"]["tag"] = json!(tags);
                        }
                        _ => return Err("Unsupported bulk action".into()),
                    }
                    save_book(&tx, &b)?;
                }
            }
            _ => return Err("Unknown operation".into()),
        }
        reindex(&tx)?;
        tx.commit()?;
        Ok(json!(true))
    }
}
pub fn rows(c: &Connection, sql: &str) -> Result<Vec<Value>> {
    let mut stmt = c.prepare(sql)?;
    let strings = stmt
        .query_map([], |r| r.get::<_, String>(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    strings
        .into_iter()
        .map(|t| Ok(serde_json::from_str(&t)?))
        .collect()
}
fn entities(c: &Connection, table: &str) -> Result<Vec<Value>> {
    let cols = match table {
        "locations" => ",'parent_id',parent_id,'extra',json(extra)",
        "custom_fields" => ",'kind',kind,'extra',json(extra)",
        "terms" => ",'kind',kind",
        _ => ",'extra',json(extra)",
    };
    rows(c,&format!("SELECT json_object('id',id,'name',name{cols}) FROM {table} ORDER BY name COLLATE NOCASE"))
}
fn named(c: &Connection, table: &str, name: &str) -> Result<Option<String>> {
    if name.trim().is_empty() {
        return Ok(None);
    }
    let key = id();
    c.execute(
        &format!("INSERT OR IGNORE INTO {table}(id,name) VALUES(?,?)"),
        params![key, name.trim()],
    )?;
    Ok(Some(c.query_row(
        &format!("SELECT id FROM {table} WHERE name=? COLLATE NOCASE"),
        [name.trim()],
        |r| r.get(0),
    )?))
}
pub fn check_date(s: &str) -> Result<()> {
    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d")
        .map_err(|_| "Use a valid date in YYYY-MM-DD format.")?;
    Ok(())
}
fn save_entity(c: &Connection, v: &Value) -> Result<()> {
    let table = s(v, "table");
    if ![
        "people",
        "publishers",
        "series",
        "locations",
        "custom_fields",
        "acquisition_sources",
    ]
    .contains(&table)
    {
        return Err("Invalid record type".into());
    }
    let name = s(v, "name").trim();
    if name.is_empty() {
        return Err("Name is required".into());
    }
    let key = if s(v, "id").is_empty() {
        id()
    } else {
        s(v, "id").into()
    };
    let extra = if v["extra"].is_object() {
        v["extra"].clone()
    } else {
        json!({})
    };
    if table == "locations" {
        let parent = opt(v, "parent_id");
        let kind = s(&extra, "kind");
        if !["", "Location", "Home", "Room", "Bookcase", "Shelf"].contains(&kind) {
            return Err("Choose a valid location type.".into());
        }
        let parent_kind: String = if let Some(p) = &parent {
            c.query_row(
                "SELECT coalesce(json_extract(extra,'$.kind'),'') FROM locations WHERE id=?",
                [p],
                |r| r.get(0),
            )?
        } else {
            String::new()
        };
        if (kind == "Home" && parent.is_some())
            || (["Bookcase", "Shelf"].contains(&kind) && parent.is_none())
            || (!parent_kind.is_empty()
                && parent_kind != "Location"
                && !kind.is_empty()
                && kind != "Location"
                && !matches!(
                    (kind, parent_kind.as_str()),
                    ("Room", "Home") | ("Bookcase", "Room") | ("Shelf", "Bookcase")
                ))
        {
            return Err("Place rooms in a Home (or at top level), bookcases in rooms, and shelves in bookcases.".into());
        }
        let invalid_child:bool=c.query_row("SELECT EXISTS(SELECT 1 FROM locations WHERE parent_id=? AND coalesce(json_extract(extra,'$.kind'),'') NOT IN ('','Location',?))",params![key,match kind{"Home"=>"Room","Room"=>"Bookcase","Bookcase"=>"Shelf",_=>""}],|r|r.get(0))?;
        if !["", "Location"].contains(&kind) && invalid_child {
            return Err("Move child locations before changing this location type.".into());
        }
        if let Some(p) = &parent {
            let mut cursor = Some(p.clone());
            let mut seen = std::collections::HashSet::new();
            while let Some(k) = cursor {
                if k == key || !seen.insert(k.clone()) {
                    return Err(
                        "A location cannot be placed inside itself or one of its children.".into(),
                    );
                }
                cursor = c
                    .query_row("SELECT parent_id FROM locations WHERE id=?", [k], |r| {
                        r.get(0)
                    })
                    .optional()?
                    .flatten();
            }
        }
        c.execute("INSERT INTO locations(id,name,parent_id,extra) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,parent_id=excluded.parent_id,extra=excluded.extra",params![key,name,parent,extra.to_string()])?;
    } else if table == "custom_fields" {
        let old: Option<String> = c
            .query_row("SELECT kind FROM custom_fields WHERE id=?", [&key], |r| {
                r.get(0)
            })
            .optional()?;
        if old.as_deref().is_some_and(|k| k != s(v, "kind")) {
            return Err("Field types cannot be changed after creation; create a new field to preserve existing values.".into());
        }
        if s(v, "kind") == "dropdown" {
            let options: Vec<&str> = s(&extra, "options")
                .split('|')
                .map(str::trim)
                .filter(|v| !v.is_empty())
                .collect();
            if options.is_empty() {
                return Err("Add at least one dropdown option.".into());
            }
            let mut statement = c.prepare(
                "SELECT DISTINCT value FROM custom_values WHERE field_id=? AND value<>''",
            )?;
            for value in statement.query_map([&key], |row| row.get::<_, String>(0))? {
                let value = value?;
                if !options.contains(&value.as_str()) {
                    return Err(format!("The option '{value}' is used by a book. Keep it in the dropdown to preserve that book's value.").into());
                }
            }
        }
        c.execute("INSERT INTO custom_fields(id,name,kind,extra) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,extra=excluded.extra",params![key,name,s(v,"kind"),extra.to_string()])?;
    } else {
        c.execute(&format!("INSERT INTO {table}(id,name,extra) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,extra=excluded.extra"),params![key,name,extra.to_string()])?;
    }
    Ok(())
}
pub fn save_book(c: &Connection, b: &Value) -> Result<String> {
    if !b.is_object() {
        return Err("Each book must be a JSON object.".into());
    }
    for k in [
        "title",
        "subtitle",
        "isbn10",
        "isbn13",
        "barcode",
        "publisher",
        "series",
        "language",
        "cover",
        "location_id",
        "source",
        "status",
        "acquisition_date",
        "condition",
    ] {
        if !b[k].is_null() && !b[k].is_string() {
            return Err(format!("{k} must be text.").into());
        }
    }
    for k in ["pages", "publication_year", "current_page"] {
        if !b[k].is_null() && b[k].as_i64().is_none() {
            return Err(format!("{k} must be a whole number.").into());
        }
    }
    for k in ["rating", "series_order"] {
        if !b[k].is_null() && b[k].as_f64().is_none() {
            return Err(format!("{k} must be a number.").into());
        }
    }
    if !s(b, "condition").is_empty()
        && !["New", "Like New", "Very Good", "Good", "Acceptable", "Poor"]
            .contains(&s(b, "condition"))
    {
        return Err("Choose a valid physical condition.".into());
    }
    let title = s(b, "title").trim();
    if title.is_empty() {
        return Err("A book title is required.".into());
    }
    if title.len() > 2000 {
        return Err("Title is too long.".into());
    }
    let key = if s(b, "id").is_empty() {
        id()
    } else {
        s(b, "id").into()
    };
    let edition = if s(b, "edition_id").is_empty() {
        id()
    } else {
        s(b, "edition_id").into()
    };
    let timestamp = now();
    if !s(b, "id").is_empty() {
        let existing: String = c
            .query_row("SELECT edition_id FROM copies WHERE id=?", [&key], |r| {
                r.get(0)
            })
            .map_err(|_| "The book no longer exists. Refresh the library before saving.")?;
        if existing != edition {
            return Err(
                "A copy cannot be reassigned to a different edition during editing.".into(),
            );
        }
    }
    let pages = b["pages"].as_i64();
    let current = b["current_page"].as_i64().unwrap_or(0);
    if pages.is_some_and(|p| current > p) {
        return Err("Current page cannot exceed the page count.".into());
    }
    if let Some(pages) = pages {
        let exceeds: bool = c.query_row(
            "SELECT EXISTS(SELECT 1 FROM copies WHERE edition_id=? AND id<>? AND current_page>?)",
            params![edition, key, pages],
            |r| r.get(0),
        )?;
        if exceeds {
            return Err("Another copy's current page exceeds this page count. Update its reading progress first.".into());
        }
    }
    for k in ["acquisition_date"] {
        if !s(b, k).is_empty() {
            check_date(s(b, k))?;
        }
    }
    let ce = if b["copy_extra"].is_object() {
        b["copy_extra"].clone()
    } else {
        json!({})
    };
    for k in ["date_started", "date_finished"] {
        if !s(&ce, k).is_empty() {
            check_date(s(&ce, k))?;
        }
    }
    if !s(&ce, "date_started").is_empty()
        && !s(&ce, "date_finished").is_empty()
        && s(&ce, "date_finished") < s(&ce, "date_started")
    {
        return Err("Finish date must be on or after start date.".into());
    }
    let cover = s(b, "cover");
    if !cover.is_empty()
        && (!cover.starts_with("covers/") || cover.contains("..") || cover.contains('\\'))
    {
        return Err("Invalid managed cover path".into());
    }
    let publisher = named(c, "publishers", s(b, "publisher"))?;
    let series = named(c, "series", s(b, "series"))?;
    let source = named(c, "acquisition_sources", s(b, "source"))?;
    c.execute("INSERT INTO editions(id,title,subtitle,isbn10,isbn13,publisher_id,series_id,series_order,publication_year,pages,language,cover,extra,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,isbn10=excluded.isbn10,isbn13=excluded.isbn13,publisher_id=excluded.publisher_id,series_id=excluded.series_id,series_order=excluded.series_order,publication_year=excluded.publication_year,pages=excluded.pages,language=excluded.language,cover=excluded.cover,extra=excluded.extra,updated_at=excluded.updated_at",params![edition,title,s(b,"subtitle"),s(b,"isbn10"),s(b,"isbn13"),publisher,series,b["series_order"].as_f64(),b["publication_year"].as_i64(),pages,s(b,"language"),cover,if b["extra"].is_object(){b["extra"].to_string()}else{"{}".into()},timestamp,timestamp])?;
    let status = if s(b, "status").is_empty() {
        "Unread"
    } else {
        s(b, "status")
    };
    let condition = if s(b, "condition").is_empty() {
        "Good"
    } else {
        s(b, "condition")
    };
    c.execute("INSERT INTO copies(id,edition_id,barcode,location_id,source_id,status,rating,favorite,current_page,acquisition_date,condition,extra,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET barcode=excluded.barcode,location_id=excluded.location_id,source_id=excluded.source_id,status=excluded.status,rating=excluded.rating,favorite=excluded.favorite,current_page=excluded.current_page,acquisition_date=excluded.acquisition_date,condition=excluded.condition,extra=excluded.extra,updated_at=excluded.updated_at",params![key,edition,s(b,"barcode"),opt(b,"location_id"),source,status,b["rating"].as_f64(),b["favorite"].as_bool().unwrap_or(false),current,s(b,"acquisition_date"),condition,ce.to_string(),timestamp,timestamp])?;
    c.execute("DELETE FROM contributors WHERE edition_id=?", [&edition])?;
    if let Some(people) = b["contributors"].as_array() {
        for (i, p) in people.iter().enumerate() {
            if let Some(person) = named(c, "people", s(p, "name"))? {
                c.execute("INSERT OR IGNORE INTO contributors(edition_id,person_id,role,position) VALUES(?,?,?,?)",params![edition,person,s(p,"role"),i as i64])?;
            }
        }
    }
    c.execute("DELETE FROM edition_terms WHERE edition_id=?", [&edition])?;
    if let Some(terms) = b["terms"].as_object() {
        for (kind, names) in terms {
            if let Some(names) = names.as_array() {
                for name in names {
                    let name = name.as_str().ok_or("Invalid classification")?.trim();
                    if name.is_empty() {
                        continue;
                    }
                    c.execute(
                        "INSERT OR IGNORE INTO terms(id,name,kind) VALUES(?,?,?)",
                        params![id(), name, kind],
                    )?;
                    c.execute("INSERT OR IGNORE INTO edition_terms SELECT ?,id FROM terms WHERE name=? COLLATE NOCASE AND kind=?",params![edition,name,kind])?;
                }
            }
        }
    }
    c.execute("DELETE FROM custom_values WHERE copy_id=?", [&key])?;
    if let Some(values) = b["custom"].as_object() {
        for (field, value) in values {
            let text = value.as_str().ok_or("Invalid custom value")?;
            if text.is_empty() {
                continue;
            }
            let (kind, extra): (String, String) = c.query_row(
                "SELECT kind,extra FROM custom_fields WHERE id=?",
                [field],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )?;
            let ex: Value = serde_json::from_str(&extra)?;
            match kind.as_str() {
                "integer" => {
                    text.parse::<i64>()
                        .map_err(|_| "Custom field requires a whole number")?;
                }
                "decimal" => {
                    let n = text
                        .parse::<f64>()
                        .map_err(|_| "Custom field requires a number")?;
                    if !n.is_finite() {
                        return Err("Custom number must be finite".into());
                    }
                }
                "date" => check_date(text)?,
                "checkbox" => {
                    if !["true", "false"].contains(&text) {
                        return Err("Invalid checkbox value".into());
                    }
                }
                "dropdown" => {
                    if !s(&ex, "options").split('|').any(|x| x.trim() == text) {
                        return Err("Choose one of the dropdown options".into());
                    }
                }
                _ => {}
            }
            c.execute(
                "INSERT INTO custom_values(copy_id,field_id,value) VALUES(?,?,?)",
                params![key, field, text],
            )?;
        }
    }
    c.execute(
        "INSERT INTO change_history(copy_id,action,snapshot,created_at) VALUES(?,'save',?,?)",
        params![key, b.to_string(), timestamp],
    )?;
    Ok(key)
}
pub fn list(c: &Connection, trash: bool) -> Result<Vec<Value>> {
    let mut books=rows(c,&format!("SELECT json_object('id',c.id,'edition_id',e.id,'copy_number',(SELECT count(*) FROM copies numbered WHERE numbered.edition_id=c.edition_id AND numbered.rowid<=c.rowid),'title',e.title,'subtitle',e.subtitle,'isbn10',e.isbn10,'isbn13',e.isbn13,'publisher',coalesce(p.name,''),'series',coalesce(s.name,''),'series_order',e.series_order,'publication_year',e.publication_year,'pages',e.pages,'language',e.language,'cover',e.cover,'extra',json(e.extra),'barcode',c.barcode,'location_id',coalesce(c.location_id,''),'source',coalesce(a.name,''),'status',c.status,'rating',c.rating,'favorite',json(CASE c.favorite WHEN 1 THEN 'true' ELSE 'false' END),'current_page',c.current_page,'acquisition_date',c.acquisition_date,'condition',c.condition,'copy_extra',json(c.extra),'created_at',c.created_at,'updated_at',max(c.updated_at,e.updated_at),'deleted_at',c.deleted_at) FROM copies c JOIN editions e ON e.id=c.edition_id LEFT JOIN publishers p ON p.id=e.publisher_id LEFT JOIN series s ON s.id=e.series_id LEFT JOIN acquisition_sources a ON a.id=c.source_id WHERE c.deleted_at IS {}NULL ORDER BY c.created_at DESC",if trash{"NOT "}else{""}))?;
    for b in &mut books {
        let edition = s(b, "edition_id").to_owned();
        let key = s(b, "id").to_owned();
        let mut st=c.prepare("SELECT p.id,p.name,r.role FROM contributors r JOIN people p ON p.id=r.person_id WHERE edition_id=? ORDER BY position")?;
        b["contributors"]=json!(st.query_map([&edition],|r|Ok(json!({"id":r.get::<_,String>(0)?,"name":r.get::<_,String>(1)?,"role":r.get::<_,String>(2)?})))?.collect::<rusqlite::Result<Vec<_>>>()?);
        let mut terms = json!({"genre":[],"subgenre":[],"category":[],"tag":[],"collection":[]});
        let mut st=c.prepare("SELECT t.kind,t.name FROM edition_terms et JOIN terms t ON t.id=et.term_id WHERE edition_id=? ORDER BY t.name")?;
        for pair in st.query_map([edition], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
        })? {
            let (k, n) = pair?;
            terms[&k]
                .as_array_mut()
                .ok_or("Invalid term type")?
                .push(json!(n));
        }
        b["terms"] = terms;
        let mut custom = json!({});
        let mut st = c.prepare("SELECT field_id,value FROM custom_values WHERE copy_id=?")?;
        for pair in st.query_map([key], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
        })? {
            let (k, v) = pair?;
            custom[k] = json!(v)
        }
        b["custom"] = custom;
    }
    Ok(books)
}
pub fn reindex(c: &Connection) -> Result<()> {
    c.execute("DELETE FROM book_search", [])?;
    c.execute("INSERT INTO book_search(copy_id,body) SELECT c.id, e.title||' '||e.subtitle||' '||e.isbn10||' '||e.isbn13||' '||c.barcode||' '||e.extra||' '||c.extra||' '||coalesce(p.name,'')||' '||coalesce(s.name,'')||' '||coalesce((SELECT group_concat(pp.name,' ') FROM contributors cc JOIN people pp ON pp.id=cc.person_id WHERE cc.edition_id=e.id),'')||' '||coalesce((SELECT group_concat(t.name,' ') FROM edition_terms et JOIN terms t ON t.id=et.term_id WHERE et.edition_id=e.id),'')||' '||coalesce((SELECT group_concat(en.title||' '||en.content,' ') FROM entries en WHERE en.copy_id=c.id),'') FROM copies c JOIN editions e ON e.id=c.edition_id LEFT JOIN publishers p ON p.id=e.publisher_id LEFT JOIN series s ON s.id=e.series_id WHERE c.deleted_at IS NULL",[])?;
    Ok(())
}
pub fn safe_file(root: &Path, relative: &str) -> Result<PathBuf> {
    if relative.is_empty()
        || relative.contains('\\')
        || relative.contains(':')
        || Path::new(relative)
            .components()
            .any(|c| !matches!(c, std::path::Component::Normal(_)))
    {
        return Err("Invalid file path".into());
    }
    let p = root.join(relative);
    let mut ancestor = p.as_path();
    while ancestor != root {
        if std::fs::symlink_metadata(ancestor).is_ok_and(|m| m.file_type().is_symlink()) {
            return Err("Invalid file path".into());
        }
        ancestor = ancestor.parent().ok_or("Invalid file path")?;
    }
    Ok(p)
}
