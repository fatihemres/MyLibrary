//! Explicit ISBN-only requests. No user-controlled URL, redirects, or persistence.
use crate::isbn;
use serde_json::Value;
const MAX_JSON: usize = 2 * 1024 * 1024;
const MAX_COVER: usize = 20 * 1024 * 1024;
const OPEN_LIBRARY: &str = "https://openlibrary.org/api/books";
const GOOGLE_BOOKS: &str = "https://www.googleapis.com/books/v1/volumes";
fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .https_only(true)
        .user_agent("MyLibrary/2 (optional user-requested ISBN lookup)")
        .build()
        .map_err(|_| "metadata.unavailable".into())
}
fn append_bounded(bytes: &mut Vec<u8>, chunk: &[u8], max: usize) -> Result<(), String> {
    let next = bytes
        .len()
        .checked_add(chunk.len())
        .ok_or("metadata.tooLarge")?;
    if next > max {
        return Err("metadata.tooLarge".into());
    }
    bytes.extend_from_slice(chunk);
    Ok(())
}
async fn bounded(mut response: reqwest::Response, max: usize) -> Result<Vec<u8>, String> {
    // error_for_status does not reject redirects, so require 2xx explicitly.
    if !response.status().is_success() {
        return Err("metadata.unavailable".into());
    }
    if response.content_length().is_some_and(|n| n > max as u64) {
        return Err("metadata.tooLarge".into());
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "metadata.unavailable")? {
        append_bounded(&mut bytes, &chunk, max)?;
    }
    Ok(bytes)
}
async fn json_response(request: reqwest::RequestBuilder) -> Result<Value, String> {
    let response = request.send().await.map_err(|_| "metadata.unavailable")?;
    let bytes = bounded(response, MAX_JSON).await?;
    serde_json::from_slice(&bytes).map_err(|_| "metadata.malformed".into())
}
#[tauri::command]
pub async fn isbn_lookup(isbn: String) -> Result<Value, String> {
    let isbn = isbn::parse(&isbn)?.isbn13; // Validate before constructing any request.
    let client = client()?;
    let data = json_response(client.get(OPEN_LIBRARY).query(&[
        ("bibkeys", format!("ISBN:{isbn}")),
        ("format", "json".into()),
        ("jscmd", "data".into()),
    ]))
    .await?;
    let mut record = data
        .get(format!("ISBN:{isbn}"))
        .filter(|r| r.is_object())
        .cloned()
        .unwrap_or(Value::Null);
    if record.is_null() {
        return Ok(record);
    }
    // This ISBN alias can redirect. Follow only its documented /books/OL...M.json
    // target on the SAME fixed HTTPS host, never arbitrary provider-supplied URLs.
    let response = client
        .get(format!("https://openlibrary.org/isbn/{isbn}.json"))
        .send()
        .await;
    if let Ok(response) = response {
        let detail = if response.status().is_redirection() {
            let target = response
                .headers()
                .get(reqwest::header::LOCATION)
                .and_then(|v| v.to_str().ok())
                .and_then(edition_redirect);
            if let Some(url) = target {
                json_response(client.get(url)).await.ok()
            } else {
                None
            }
        } else {
            match bounded(response, MAX_JSON).await {
                Ok(bytes) => serde_json::from_slice::<Value>(&bytes).ok(),
                Err(_) => None,
            }
        };
        if let Some(edition) = detail {
            if let Some(languages) = edition["languages"].as_array() {
                record["language"] = Value::String(
                    languages
                        .iter()
                        .filter_map(|l| l["key"].as_str())
                        .filter_map(|l| l.strip_prefix("/languages/"))
                        .filter(|l| !l.is_empty() && l.chars().all(|c| c.is_ascii_alphabetic()))
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
    Ok(record)
}
fn edition_redirect(location: &str) -> Option<String> {
    let base = reqwest::Url::parse("https://openlibrary.org/").ok()?;
    let url = base.join(location).ok()?;
    if url.scheme() != "https"
        || url.host_str() != Some("openlibrary.org")
        || url.port().is_some()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return None;
    }
    let id = url
        .path()
        .strip_prefix("/books/OL")?
        .strip_suffix("M.json")?;
    if id.is_empty() || !id.bytes().all(|c| c.is_ascii_digit()) {
        return None;
    }
    Some(url.into())
}
#[tauri::command]
pub async fn google_books_lookup(isbn: String) -> Result<Value, String> {
    let isbn = isbn::parse(&isbn)?.isbn13;
    json_response(client()?.get(GOOGLE_BOOKS).query(&[
        ("q", format!("isbn:{isbn}")),
        ("maxResults", "5".into()),
        ("printType", "books".into()),
    ]))
    .await
}
#[tauri::command]
pub async fn isbn_cover(isbn: String) -> Result<Vec<u8>, String> {
    let isbn = isbn::parse(&isbn)?.isbn13;
    let response = client()?
        .get(format!(
            "https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
        ))
        .send()
        .await
        .map_err(|_| "metadata.coverFailed")?;
    let bytes = bounded(response, MAX_COVER).await?;
    if bytes.is_empty() {
        return Err("metadata.coverFailed".into());
    }
    Ok(bytes)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn response_limit_checks_actual_chunks() {
        let mut bytes = vec![];
        append_bounded(&mut bytes, b"abc", 4).unwrap();
        assert!(append_bounded(&mut bytes, b"de", 4).is_err());
        assert_eq!(bytes, b"abc");
        append_bounded(&mut bytes, b"d", 4).unwrap();
        assert!(append_bounded(&mut bytes, b"e", 4).is_err());
        let mut large = vec![];
        assert!(append_bounded(&mut large, &vec![0; MAX_JSON + 1], MAX_JSON).is_err());
        assert!(large.is_empty());
    }
    #[test]
    fn only_fixed_edition_redirects() {
        assert_eq!(
            edition_redirect("/books/OL123M.json").as_deref(),
            Some("https://openlibrary.org/books/OL123M.json")
        );
        for value in [
            "https://evil.test/books/OL1M.json",
            "http://openlibrary.org/books/OL1M.json",
            "//evil.test/",
            "/works/OL1W.json",
            "/books/OLxM.json",
            "/books/OL1M.json?x=1",
            "https://user@openlibrary.org/books/OL1M.json",
        ] {
            assert!(edition_redirect(value).is_none());
        }
        let request = client().unwrap().get(GOOGLE_BOOKS).build().unwrap();
        assert_eq!(request.url().scheme(), "https");
    }
    #[test]
    fn invalid_isbn_fails_before_request_future() {
        // Poll once without a runtime: invalid input must return before network/client use.
        use std::{
            future::Future,
            sync::Arc,
            task::{Context, Poll, Wake, Waker},
        };
        struct Noop;
        impl Wake for Noop {
            fn wake(self: Arc<Self>) {}
        }
        let waker = Waker::from(Arc::new(Noop));
        let mut cx = Context::from_waker(&waker);
        assert!(matches!(
            Box::pin(isbn_lookup("4006381333931".into()))
                .as_mut()
                .poll(&mut cx),
            Poll::Ready(Err(_))
        ));
        assert!(matches!(
            Box::pin(google_books_lookup("bad".into()))
                .as_mut()
                .poll(&mut cx),
            Poll::Ready(Err(_))
        ));
        assert!(matches!(
            Box::pin(isbn_cover("bad".into())).as_mut().poll(&mut cx),
            Poll::Ready(Err(_))
        ));
    }
}
