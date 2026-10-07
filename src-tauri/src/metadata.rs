//! The only network-enabled product feature. All requests are explicit and ISBN-only.
use serde_json::Value;
fn normalize(isbn: &str) -> Result<String, String> {
    let isbn: String = isbn
        .chars()
        .filter(|c| *c != '-' && !c.is_whitespace())
        .collect();
    if ![10, 13].contains(&isbn.len()) || !isbn.chars().all(|c| c.is_ascii_digit() || c == 'X') {
        return Err("Enter an ISBN-10 or ISBN-13.".into());
    }
    Ok(isbn)
}
fn client() -> Result<reqwest::Client, reqwest::Error> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("MyLibrary/1.0 (optional user-requested ISBN lookup)")
        .build()
}
#[tauri::command]
pub async fn isbn_lookup(isbn: String) -> Result<Value, String> {
    let isbn = normalize(&isbn)?;
    let work = async {
        let client = client()?;
        let data: Value = client
            .get("https://openlibrary.org/api/books")
            .query(&[
                ("bibkeys", format!("ISBN:{isbn}")),
                ("format", "json".into()),
                ("jscmd", "data".into()),
            ])
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;
        let mut record = data[format!("ISBN:{isbn}")].clone();
        // Edition details add language and description when available. A secondary failure is harmless.
        if !record.is_null() {
            if let Ok(response) = client
                .get(format!("https://openlibrary.org/isbn/{isbn}.json"))
                .send()
                .await
            {
                if response.status().is_success() {
                    if let Ok(edition) = response.json::<Value>().await {
                        if let Some(languages) = edition["languages"].as_array() {
                            record["language"] = Value::String(
                                languages
                                    .iter()
                                    .filter_map(|l| l["key"].as_str())
                                    .map(|l| l.rsplit('/').next().unwrap_or(l))
                                    .collect::<Vec<_>>()
                                    .join(", "),
                            );
                        }
                        if let Some(description) = edition["description"]
                            .as_str()
                            .or(edition["description"]["value"].as_str())
                        {
                            record["description"] = Value::String(description.into());
                        }
                    }
                }
            }
        }
        Ok::<_, reqwest::Error>(record)
    }
    .await
    .map_err(|_| {
        "Metadata lookup is unavailable. Your book can still be entered manually.".to_string()
    })?;
    if work.is_null() {
        return Err("No metadata was found for this ISBN. Continue with manual entry.".into());
    }
    Ok(work)
}
#[tauri::command]
pub async fn isbn_cover(isbn: String) -> Result<Vec<u8>, String> {
    let isbn = normalize(&isbn)?;
    let work = async {
        let mut response = client()?
            .get(format!(
                "https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
            ))
            .send()
            .await?
            .error_for_status()?;
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await? {
            if bytes.len() + chunk.len() > 20 * 1024 * 1024 {
                return Ok::<_, reqwest::Error>(Vec::new());
            }
            bytes.extend_from_slice(&chunk);
        }
        Ok(bytes)
    }
    .await
    .map_err(|_| {
        "The cover could not be retrieved. You can choose a local cover instead.".to_string()
    })?;
    if work.is_empty() {
        return Err("No usable cover was returned.".into());
    }
    Ok(work)
}
