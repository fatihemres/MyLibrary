pub mod backup;
mod copies;
pub mod db;
mod metadata;
pub mod migrations;
mod platform;
use db::{Result, Store};
use serde_json::{json, Value};
use std::{path::PathBuf, sync::Mutex};
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;
struct State {
    store: Mutex<Option<Store>>,
    startup_error: Option<String>,
}
#[tauri::command]
async fn database(
    app: tauri::AppHandle,
    state: tauri::State<'_, State>,
    action: String,
    payload: Value,
) -> std::result::Result<Value, String> {
    let work = || -> Result<Value> {
        let guard = state
            .store
            .lock()
            .map_err(|_| "The library is busy. Restart the application.")?;
        let store = guard.as_ref().ok_or_else(|| {
            state
                .startup_error
                .as_deref()
                .unwrap_or("The library could not be opened. Restart the application.")
        })?;
        match action.as_str() {
            "platform" => Ok(platform::info(&store.root)),
            "snapshot" => store.snapshot(
                db::s(&payload, "query"),
                payload["trash"].as_bool().unwrap_or(false),
            ),
            "save" => Ok(json!(store.save(&payload)?)),
            "import" => Ok(json!(
                store.import(payload.as_array().ok_or("Expected a list of books")?)?
            )),
            "backup" => {
                store.backup(&PathBuf::from(db::s(&payload, "path")))?;
                Ok(json!(true))
            }
            "restore" => Ok(json!(store
                .restore(&PathBuf::from(db::s(&payload, "path")))?
                .to_string_lossy())),
            "auto_backup" => Ok(json!(store.automatic_backup()?)),
            "integrity" => {
                let c = store.conn()?;
                let check: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
                let foreign = c.prepare("PRAGMA foreign_key_check")?.exists([])?;
                if check != "ok" || foreign {
                    return Err("The database integrity check found a problem. Preserve your backups and contact support.".into());
                }
                Ok(json!("Database integrity and relationships are healthy."))
            }
            "cover" | "attachment" => {
                let bytes: Vec<u8> = serde_json::from_value(payload["bytes"].clone())?;
                let is_cover = action == "cover";
                let limit = if is_cover {
                    20 * 1024 * 1024
                } else {
                    100 * 1024 * 1024
                };
                if bytes.len() > limit {
                    return Err(
                        "File exceeds the size limit (covers 20 MB; attachments 100 MB).".into(),
                    );
                }
                let name = db::s(&payload, "name");
                let ext = if is_cover {
                    if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
                        "png"
                    } else if bytes.starts_with(b"\xff\xd8\xff") {
                        "jpg"
                    } else if bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP") {
                        "webp"
                    } else {
                        return Err("Choose a PNG, JPEG or WebP image.".into());
                    }
                } else {
                    std::path::Path::new(name)
                        .extension()
                        .and_then(|x| x.to_str())
                        .filter(|s| s.chars().all(|c| c.is_ascii_alphanumeric()))
                        .unwrap_or("bin")
                };
                let relative = format!(
                    "{}/{}.{}",
                    if is_cover { "covers" } else { "attachments" },
                    db::id(),
                    ext
                );
                std::fs::write(store.root.join(&relative), bytes)?;
                if !is_cover {
                    store.conn()?.execute("INSERT INTO attachments(id,copy_id,name,path,created_at) VALUES(?,?,?,?,?)",rusqlite::params![db::id(),db::s(&payload,"copy_id"),name,relative,db::now()])?;
                }
                Ok(json!(relative))
            }
            "read_cover" => {
                let relative = db::s(&payload, "path");
                if !relative.starts_with("covers/") {
                    return Err("Invalid cover path".into());
                }
                Ok(json!(backup::read_limited(
                    &db::safe_file(&store.root, relative)?,
                    20 * 1024 * 1024
                )?))
            }
            "export_attachment" => {
                let c = store.conn()?;
                let relative: String = c.query_row(
                    "SELECT path FROM attachments WHERE id=?",
                    [db::s(&payload, "id")],
                    |r| r.get(0),
                )?;
                let destination = PathBuf::from(db::s(&payload, "path"));
                let mut out = std::fs::OpenOptions::new()
                    .create_new(true)
                    .write(true)
                    .open(destination)?;
                std::io::copy(
                    &mut std::fs::File::open(db::safe_file(&store.root, &relative)?)?,
                    &mut out,
                )?;
                Ok(json!(true))
            }
            "read_text" => {
                let bytes = backup::read_limited(
                    &PathBuf::from(db::s(&payload, "path")),
                    50 * 1024 * 1024,
                )?;
                if bytes.starts_with(b"PK\x03\x04") {
                    return Err(
                        "This appears to be a MyLibrary backup. Use Restore Backup instead.".into(),
                    );
                }
                Ok(json!(String::from_utf8(bytes)?))
            }
            "write_text" => {
                use std::io::Write;
                let path = PathBuf::from(db::s(&payload, "path"));
                let mut f = std::fs::OpenOptions::new()
                    .write(true)
                    .create_new(true)
                    .open(path)?;
                f.write_all(db::s(&payload, "text").as_bytes())?;
                f.sync_all()?;
                Ok(json!(true))
            }
            "open_folder" => {
                app.opener()
                    .open_path(&store.root.to_string_lossy().to_string(), None::<&str>)?;
                Ok(json!(true))
            }
            _ => store.mutate(&action, &payload),
        }
    };
    work().map_err(|e| e.to_string())
}
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let root = std::env::var_os("MYLIBRARY_DATA_DIR")
                .map(PathBuf::from)
                .unwrap_or(app.path().app_data_dir()?);
            let (store, startup_error) = match Store::open(root) {
                Ok(store) => (Some(store), None),
                Err(error) => (None, Some(error.to_string())),
            };
            app.manage(State {
                store: Mutex::new(store),
                startup_error,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            database,
            metadata::isbn_lookup,
            metadata::isbn_cover
        ])
        .run(tauri::generate_context!())
        .expect("MyLibrary could not start");
}
