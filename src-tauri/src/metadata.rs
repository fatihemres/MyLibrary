//! Explicit ISBN-only requests. No user-controlled URL or persistence.
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
// Cover-only policy. JSON clients and edition enrichment above remain unchanged.
const COVER_TIME: std::time::Duration = std::time::Duration::from_secs(15);
const COVER_INVALID: &str = "metadata.coverInvalid";
const COVER_UNSAFE: &str = "metadata.coverUnsafeRedirect";
const COVER_LARGE: &str = "metadata.coverTooLarge";
const COVER_TIMEOUT: &str = "metadata.coverTimeout";
const COVER_NETWORK: &str = "metadata.coverNetwork";
const COVER_PIXELS: usize = 8 * 1024 * 1024;
static COVER_ACTIVE: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
struct CoverGuard;
impl Drop for CoverGuard {
    fn drop(&mut self) {
        COVER_ACTIVE.store(false, std::sync::atomic::Ordering::Release);
    }
}
fn cover_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(COVER_TIME)
        .redirect(reqwest::redirect::Policy::none())
        .https_only(true)
        .retry(reqwest::retry::never())
        .user_agent("MyLibrary/2 (optional user-requested ISBN cover)")
        .build()
        .map_err(|_| COVER_NETWORK.into())
}
fn cover_network(error: reqwest::Error) -> String {
    if error.is_timeout() {
        COVER_TIMEOUT
    } else {
        COVER_NETWORK
    }
    .into()
}
fn cover_initial(isbn: &str) -> String {
    format!("https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false")
}
fn decimal(value: &str) -> Option<u64> {
    if value.is_empty() || !value.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    value.parse().ok()
}
#[derive(Clone, Copy, PartialEq, Eq)]
struct ArchiveTarget<'a> {
    item: &'a str,
    zip: &'a str,
    file: &'a str,
    id: u64,
}
fn parse_archive_target(path: &str) -> Option<ArchiveTarget<'_>> {
    let parts: Vec<_> = path.split('/').collect();
    if parts.len() != 5 || parts[0] != "" || parts[1] != "download" {
        return None;
    }
    let id_text = parts[4].strip_suffix("-L.jpg")?;
    let id = decimal(id_text).filter(|n| *n > 0)?;
    let item = parts[2];
    let zip = parts[3];
    let file = parts[4];
    if let Some(batch) = item.strip_prefix("olcovers") {
        if decimal(batch) == Some(id / 10_000)
            && batch == (id / 10_000).to_string()
            && id_text == id.to_string()
            && zip == format!("olcovers{batch}-L.zip")
        {
            return Some(ArchiveTarget {
                item,
                zip,
                file,
                id,
            });
        }
    }
    if let Some(batch) = item.strip_prefix("l_covers_") {
        if batch.len() == 4
            && id_text.len() == 10
            && decimal(batch) == Some(id / 1_000_000)
            && zip == format!("l_covers_{batch}_{:02}.zip", (id % 1_000_000) / 10_000)
        {
            return Some(ArchiveTarget {
                item,
                zip,
                file,
                id,
            });
        }
    }
    None
}
fn is_ia_storage_host(host: &str) -> bool {
    let Some(rest) = host.strip_prefix("ia") else {
        return false;
    };
    let Some(digits) = rest.strip_suffix(".us.archive.org") else {
        return false;
    };
    digits.len() == 6 && digits.bytes().all(|b| b.is_ascii_digit())
}
fn validate_storage_query(query: &str, target: ArchiveTarget<'_>) -> bool {
    let mut archive_val: Option<&str> = None;
    let mut file_val: Option<&str> = None;
    for pair in query.split('&') {
        let Some((k, v)) = pair.split_once('=') else {
            return false;
        };
        match k {
            "archive" if archive_val.is_none() => archive_val = Some(v),
            "file" if file_val.is_none() => file_val = Some(v),
            _ => return false,
        }
    }
    let Some(archive_val) = archive_val else {
        return false;
    };
    let Some(file_val) = file_val else {
        return false;
    };
    if file_val != target.file {
        return false;
    }
    let parts: Vec<_> = archive_val.split('/').collect();
    if parts.len() != 5 || parts[0] != "" || parts[2] != "items" {
        return false;
    }
    let Some(mount) = decimal(parts[1]) else {
        return false;
    };
    if mount == 0 || parts[1].len() > 4 {
        return false;
    }
    parts[3] == target.item && parts[4] == target.zip
}
fn cover_redirect(current: &str, raw: &str, isbn: &str) -> Option<String> {
    // Reject before URL normalization can hide authority, controls or encoded traversal.
    if raw.is_empty()
        || raw.len() > 256
        || !raw.is_ascii()
        || raw.bytes().any(|b| b <= b' ' || b == 127)
        || raw.contains(['\\', '%', '#', '@'])
    {
        return None;
    }
    let current_url = reqwest::Url::parse(current).ok()?;
    let (host, path_and_query) = if let Some(rest) = raw.strip_prefix("https://") {
        rest.split_once('/').map(|(h, p)| (h, format!("/{p}")))?
    } else if raw.starts_with('/') && !raw.starts_with("//") {
        (current_url.host_str()?, raw.to_owned())
    } else {
        return None;
    };
    let (path, query) = match path_and_query.split_once('?') {
        Some((p, q)) => (p, Some(q)),
        None => (path_and_query.as_str(), None),
    };

    let current_host = current_url.host_str()?;
    let current_path = current_url.path();
    let initial_url = cover_initial(isbn);

    if current == initial_url {
        // Hop 1: From initial ISBN request
        if host == "covers.openlibrary.org" {
            if path_and_query == format!("/b/isbn/{isbn}-L.jpg?default=false") {
                return Some(format!("https://{host}{path_and_query}"));
            }
            if query.is_some() {
                return None;
            }
            let id = path.strip_prefix("/b/id/")?.strip_suffix("-L.jpg")?;
            decimal(id).filter(|n| *n > 0)?;
            Some(format!("https://{host}{path}"))
        } else if host == "archive.org" {
            if query.is_some() {
                return None;
            }
            parse_archive_target(path)?;
            Some(format!("https://{host}{path}"))
        } else {
            None
        }
    } else if current_host == "covers.openlibrary.org" && current_path.starts_with("/b/id/") {
        // Hop 2: From Open Library ID request -> archive.org download with matching ID
        let curr_id = current_path
            .strip_prefix("/b/id/")?
            .strip_suffix("-L.jpg")?;
        let curr_id = decimal(curr_id).filter(|n| *n > 0)?;
        if host != "archive.org" || query.is_some() {
            return None;
        }
        let target = parse_archive_target(path)?;
        if target.id != curr_id {
            return None;
        }
        Some(format!("https://{host}{path}"))
    } else if current_host == "archive.org" && current_path.starts_with("/download/") {
        // Hop 3: From archive.org download -> confirmed storage node with matching target
        let target = parse_archive_target(current_path)?;
        if !is_ia_storage_host(host) || path != "/view_archive.php" {
            return None;
        }
        let query = query?;
        if !validate_storage_query(query, target) {
            return None;
        }
        Some(format!("https://{host}{path}?{query}"))
    } else {
        None
    }
}
fn is_jpeg_content_type(value: &str) -> bool {
    let mut parts = value.split(';');
    let Some(media_type) = parts.next() else {
        return false;
    };
    if !media_type.trim().eq_ignore_ascii_case("image/jpeg") {
        return false;
    }
    for param in parts {
        let trimmed = param.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Some((attr, val)) = trimmed.split_once('=') else {
            return false;
        };
        let attr = attr.trim();
        let val = val.trim();
        if attr.is_empty() || val.is_empty() {
            return false;
        }
        if !attr
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        {
            return false;
        }
        let unquoted = if val.starts_with('"') && val.ends_with('"') && val.len() >= 2 {
            &val[1..val.len() - 1]
        } else {
            val
        };
        if !unquoted.is_ascii() || unquoted.chars().any(|c| c.is_ascii_control()) {
            return false;
        }
    }
    true
}
struct CoverHead {
    status: u16,
    location: Option<String>,
    jpeg: bool,
    length: Option<u64>,
}
trait CoverBody {
    fn head(&self) -> CoverHead;
    async fn chunk(&mut self) -> Result<Option<Vec<u8>>, String>;
}
trait CoverTransport {
    type Body: CoverBody;
    fn elapsed(&self) -> std::time::Duration;
    async fn get(&mut self, url: &str, timeout: std::time::Duration) -> Result<Self::Body, String>;
}
struct NativeCover {
    client: reqwest::Client,
    started: std::time::Instant,
}
impl CoverTransport for NativeCover {
    type Body = reqwest::Response;
    fn elapsed(&self) -> std::time::Duration {
        self.started.elapsed()
    }
    async fn get(&mut self, url: &str, timeout: std::time::Duration) -> Result<Self::Body, String> {
        self.client
            .get(url)
            .timeout(timeout)
            .send()
            .await
            .map_err(cover_network)
    }
}
impl CoverBody for reqwest::Response {
    fn head(&self) -> CoverHead {
        use reqwest::header::{CONTENT_ENCODING, CONTENT_TYPE, LOCATION};
        let one = |name: reqwest::header::HeaderName| {
            let mut values = self.headers().get_all(name).iter();
            let value = values.next()?.to_str().ok()?;
            if values.next().is_some() {
                None
            } else {
                Some(value.to_owned())
            }
        };
        CoverHead {
            status: self.status().as_u16(),
            location: one(LOCATION),
            jpeg: one(CONTENT_TYPE)
                .as_deref()
                .is_some_and(is_jpeg_content_type)
                && !self.headers().contains_key(CONTENT_ENCODING),
            length: self.content_length(),
        }
    }
    async fn chunk(&mut self) -> Result<Option<Vec<u8>>, String> {
        reqwest::Response::chunk(self)
            .await
            .map(|v| v.map(|b| b.to_vec()))
            .map_err(cover_network)
    }
}
fn remaining(elapsed: std::time::Duration) -> Result<std::time::Duration, String> {
    COVER_TIME
        .checked_sub(elapsed)
        .filter(|d| !d.is_zero())
        .ok_or_else(|| COVER_TIMEOUT.into())
}
async fn fetch_cover<T: CoverTransport>(input: &str, transport: &mut T) -> Result<Vec<u8>, String> {
    let isbn = isbn::parse(input)?.isbn13;
    let mut url = cover_initial(&isbn);
    let mut seen = vec![url.clone()];
    let mut transitions = 0usize;
    loop {
        let mut response = transport.get(&url, remaining(transport.elapsed())?).await?;
        remaining(transport.elapsed())?;
        let head = response.head();
        match head.status {
            301 | 302 | 303 | 307 | 308 => {
                transitions += 1;
                if transitions > 3 {
                    return Err(COVER_UNSAFE.into());
                }
                let next = head
                    .location
                    .as_deref()
                    .and_then(|r| cover_redirect(&url, r, &isbn))
                    .ok_or(COVER_UNSAFE)?;
                if seen.contains(&next) {
                    return Err(COVER_UNSAFE.into());
                }
                seen.push(next.clone());
                url = next;
                continue;
            }
            300..=399 => return Err(COVER_UNSAFE.into()),
            403 => return Err("metadata.coverRefused".into()),
            404 => return Err("metadata.coverMissing".into()),
            429 => return Err("metadata.coverRateLimited".into()),
            500..=599 => return Err("metadata.coverServer".into()),
            200..=299 => {}
            _ => return Err("metadata.coverFailed".into()),
        }
        if !head.jpeg {
            return Err(COVER_INVALID.into());
        }
        if head.length.is_some_and(|n| n > MAX_COVER as u64) {
            return Err(COVER_LARGE.into());
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await? {
            remaining(transport.elapsed())?;
            append_bounded(&mut bytes, &chunk, MAX_COVER).map_err(|_| COVER_LARGE)?;
        }
        remaining(transport.elapsed())?;
        if head.length.is_some_and(|n| n != bytes.len() as u64) {
            return Err(COVER_INVALID.into());
        }
        validate_cover(&bytes)?;
        return Ok(bytes);
    }
}
// A resource/framing walk, not an entropy validator. The decoder remains responsible
// for decoding. Known nonempty truncated-stream tolerance is documented and retained.
fn cover_frame(bytes: &[u8]) -> Result<(), String> {
    let bad = || COVER_INVALID.to_string();
    if bytes.len() > MAX_COVER {
        return Err(COVER_LARGE.into());
    }
    if !bytes.starts_with(&[255, 216]) {
        return Err(bad());
    }
    let mut p = 2;
    let mut segments = 0;
    let mut scans = 0;
    let mut metadata = 0usize;
    let mut frame = false;
    while p < bytes.len() {
        if bytes[p] != 255 {
            return Err(bad());
        }
        while bytes.get(p) == Some(&255) {
            p += 1;
        }
        let marker = *bytes.get(p).ok_or_else(bad)?;
        p += 1;
        if marker == 217 {
            return if frame && scans > 0 {
                Ok(())
            } else {
                Err(bad())
            };
        }
        if marker == 0 || marker == 216 || marker == 1 || (208..=215).contains(&marker) {
            return Err(bad());
        }
        let len = bytes.get(p..p + 2).ok_or_else(bad)?;
        let len = usize::from(u16::from_be_bytes([len[0], len[1]]));
        if len < 2 {
            return Err(bad());
        }
        let end = p.checked_add(len).ok_or_else(bad)?;
        let data = bytes.get(p + 2..end).ok_or_else(bad)?;
        p = end;
        segments += 1;
        if segments > 4096 {
            return Err(COVER_LARGE.into());
        }
        if (224..=239).contains(&marker) || marker == 254 {
            metadata = metadata.checked_add(data.len()).ok_or(COVER_LARGE)?;
            if metadata > 1024 * 1024 {
                return Err(COVER_LARGE.into());
            }
        }
        if (192..=194).contains(&marker) {
            if frame || data.len() < 6 || data[0] != 8 {
                return Err(bad());
            }
            let h = usize::from(u16::from_be_bytes([data[1], data[2]]));
            let w = usize::from(u16::from_be_bytes([data[3], data[4]]));
            let n = usize::from(data[5]);
            if w == 0 || h == 0 || ![1, 3, 4].contains(&n) || data.len() != 6 + 3 * n {
                return Err(bad());
            }
            if w > 4096 || h > 4096 || w.checked_mul(h).ok_or(COVER_LARGE)? > COVER_PIXELS {
                return Err(COVER_LARGE.into());
            }
            let mut samples = 0usize;
            for c in data[6..].chunks_exact(3) {
                let hs = usize::from(c[1] >> 4);
                let vs = usize::from(c[1] & 15);
                if !(1..=4).contains(&hs) || !(1..=4).contains(&vs) {
                    return Err(bad());
                }
                samples += hs * vs;
            }
            // Upper bound for full-image i16 coefficient arrays, including padding.
            let coeff = w
                .div_ceil(8)
                .checked_mul(h.div_ceil(8))
                .and_then(|v| v.checked_mul(128))
                .and_then(|v| v.checked_mul(samples))
                .ok_or(COVER_LARGE)?;
            if samples > 10 || coeff > 128 * 1024 * 1024 {
                return Err(COVER_LARGE.into());
            }
            frame = true;
        }
        if marker == 218 {
            if !frame {
                return Err(bad());
            }
            scans += 1;
            if scans > 64 {
                return Err(COVER_LARGE.into());
            }
            let mut entropy = false;
            while p < bytes.len() {
                if bytes[p] != 255 {
                    entropy = true;
                    p += 1;
                    continue;
                }
                let start = p;
                p += 1;
                while bytes.get(p) == Some(&255) {
                    p += 1;
                }
                let m = *bytes.get(p).ok_or_else(bad)?;
                p += 1;
                if m == 0 {
                    if p != start + 2 {
                        return Err(bad());
                    }
                    entropy = true;
                } else if !(208..=215).contains(&m) {
                    p = start;
                    break;
                }
            }
            if !entropy {
                return Err(bad());
            }
        }
    }
    Err(bad())
}
fn validate_cover(bytes: &[u8]) -> Result<(), String> {
    use zune_jpeg::{
        zune_core::{bytestream::ZCursor, options::DecoderOptions},
        JpegDecoder,
    };
    cover_frame(bytes)?;
    let options = DecoderOptions::default()
        .set_strict_mode(true)
        .set_max_width(4096)
        .set_max_height(4096)
        .jpeg_set_max_scans(64)
        .set_use_unsafe(false);
    let mut decoder = JpegDecoder::new_with_options(ZCursor::new(bytes), options);
    decoder.decode_headers().map_err(|_| COVER_INVALID)?;
    let (w, h) = decoder.dimensions().ok_or(COVER_INVALID)?;
    if w.checked_mul(h).ok_or(COVER_LARGE)? > COVER_PIXELS {
        return Err(COVER_LARGE.into());
    }
    let size = decoder.output_buffer_size().ok_or(COVER_INVALID)?;
    if size == 0 || size > 4 * COVER_PIXELS {
        return Err(COVER_LARGE.into());
    }
    let mut pixels = Vec::new();
    pixels.try_reserve_exact(size).map_err(|_| COVER_LARGE)?;
    pixels.resize(size, 0);
    decoder
        .decode_into(&mut pixels)
        .map_err(|_| COVER_INVALID.into())
}
#[tauri::command]
pub async fn isbn_cover(isbn: String) -> Result<Vec<u8>, String> {
    let isbn = isbn::parse(&isbn)?.isbn13;
    if COVER_ACTIVE
        .compare_exchange(
            false,
            true,
            std::sync::atomic::Ordering::AcqRel,
            std::sync::atomic::Ordering::Acquire,
        )
        .is_err()
    {
        return Err("metadata.coverBusy".into());
    }
    let _guard = CoverGuard;
    let mut transport = NativeCover {
        client: cover_client()?,
        started: std::time::Instant::now(),
    };
    fetch_cover(&isbn, &mut transport).await
}
#[cfg(test)]
#[path = "metadata_cover_tests.rs"]
mod cover_tests;

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
