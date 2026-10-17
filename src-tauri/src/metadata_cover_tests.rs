use super::*;
use std::{
    collections::VecDeque,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::Duration,
};

fn segment(b: &mut Vec<u8>, m: u8, p: &[u8]) {
    b.extend([255, m]);
    b.extend(((p.len() + 2) as u16).to_be_bytes());
    b.extend(p);
}

fn fixture(entropy: &[u8], progressive: bool) -> Vec<u8> {
    let mut b = vec![255, 216];
    let mut q = vec![0];
    q.extend([1; 64]);
    segment(&mut b, 219, &q);
    segment(
        &mut b,
        if progressive { 194 } else { 192 },
        &[8, 0, 16, 0, 16, 1, 1, 17, 0],
    );
    let mut d = vec![0, 1];
    d.extend([0; 15]);
    d.push(0);
    segment(&mut b, 196, &d);
    d[0] = 16;
    segment(&mut b, 196, &d);
    if progressive {
        segment(&mut b, 218, &[1, 1, 0, 0, 0, 0]);
        b.push(15);
        segment(&mut b, 218, &[1, 1, 0, 1, 63, 0]);
        b.push(15);
    } else {
        segment(&mut b, 218, &[1, 1, 0, 0, 63, 0]);
        b.extend(entropy);
    }
    b.extend([255, 217]);
    b
}

struct Body {
    head: CoverHead,
    chunks: VecDeque<Result<Vec<u8>, String>>,
    clock: Arc<AtomicU64>,
    delay: u64,
}

impl CoverBody for Body {
    fn head(&self) -> CoverHead {
        CoverHead {
            status: self.head.status,
            location: self.head.location.clone(),
            jpeg: self.head.jpeg,
            length: self.head.length,
        }
    }
    async fn chunk(&mut self) -> Result<Option<Vec<u8>>, String> {
        self.clock.fetch_add(self.delay, Ordering::SeqCst);
        self.chunks.pop_front().transpose()
    }
}

fn body(status: u16, loc: Option<&str>, data: Vec<u8>) -> Body {
    Body {
        head: CoverHead {
            status,
            location: loc.map(str::to_owned),
            jpeg: true,
            length: Some(data.len() as u64),
        },
        chunks: VecDeque::from([Ok(data)]),
        clock: Arc::new(AtomicU64::new(0)),
        delay: 0,
    }
}

struct Mock {
    replies: VecDeque<Result<Body, String>>,
    requests: Vec<(String, Duration)>,
    clock: Arc<AtomicU64>,
    delay: u64,
}

impl Mock {
    fn new(replies: Vec<Result<Body, String>>) -> Self {
        Self {
            replies: replies.into(),
            requests: vec![],
            clock: Arc::new(AtomicU64::new(0)),
            delay: 0,
        }
    }
}

impl CoverTransport for Mock {
    type Body = Body;
    fn elapsed(&self) -> Duration {
        Duration::from_millis(self.clock.load(Ordering::SeqCst))
    }
    async fn get(&mut self, url: &str, timeout: Duration) -> Result<Body, String> {
        self.requests.push((url.into(), timeout));
        self.clock.fetch_add(self.delay, Ordering::SeqCst);
        let mut b = self.replies.pop_front().expect("unexpected request")?;
        b.clock = self.clock.clone();
        Ok(b)
    }
}

fn run(m: &mut Mock) -> Result<Vec<u8>, String> {
    tauri::async_runtime::block_on(fetch_cover("0306406152", m))
}

#[test]
fn canonical_and_invalid_before_transport() {
    let data = fixture(&[0], false);
    let mut m = Mock::new(vec![Ok(body(200, None, data.clone()))]);
    assert_eq!(run(&mut m).unwrap(), data);
    assert_eq!(m.requests[0].0, cover_initial("9780306406157"));
    assert_eq!(m.requests.len(), 1);
    for invalid in ["bad", "9780306406158", "4006381333931"] {
        let mut m = Mock::new(vec![]);
        assert!(tauri::async_runtime::block_on(fetch_cover(invalid, &mut m)).is_err());
        assert!(m.requests.is_empty());
    }
}

#[test]
fn redirect_policy_and_transition_grammar() {
    let initial = cover_initial("9780306406157");

    // Valid transitions from initial ISBN URL
    for good in [
        "/b/id/123-L.jpg",
        "https://covers.openlibrary.org/b/id/123-L.jpg",
        "https://archive.org/download/olcovers0/olcovers0-L.zip/1-L.jpg",
        "https://archive.org/download/olcovers12/olcovers12-L.zip/123456-L.jpg",
        "https://archive.org/download/l_covers_0008/l_covers_0008_01.zip/0008012345-L.jpg",
    ] {
        assert!(
            cover_redirect(&initial, good, "9780306406157").is_some(),
            "{good}"
        );
    }

    // Invalid transitions from initial ISBN URL
    for bad in [
        "http://covers.openlibrary.org/b/id/1-L.jpg",
        "https://evil.test/b/id/1-L.jpg",
        "//evil.test/b/id/1-L.jpg",
        "https://user@covers.openlibrary.org/b/id/1-L.jpg",
        "https://covers.openlibrary.org:443/b/id/1-L.jpg",
        "https://covers.openlibrary.org./b/id/1-L.jpg",
        "/b/id/../id/1-L.jpg",
        "/b/id/%31-L.jpg",
        "/b/id/1-L.jpg?x=1",
        "/b/id/1-L.jpg#x",
        "/b/id/1-L.jpg\n",
        "/b/id/1\\-L.jpg",
        "https://archive.org/download/olcovers1/olcovers1-L.zip/1-L.jpg",
        "https://archive.org/download/olcovers0/olcovers0-L.zip/0-L.jpg",
        "https://archive.org/download/l_covers_0008/l_covers_0008_02.zip/0008012345-L.jpg",
        "https://archive.org/download/l_covers_0009/l_covers_0009_01.zip/0008012345-L.jpg",
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://archive.org/download/a/b.jpg",
        "https://127.0.0.1/b/id/1-L.jpg",
        "/b/id/18446744073709551616-L.jpg",
        "/b/isbn/9780804429573-L.jpg?default=false",
    ] {
        assert!(
            cover_redirect(&initial, bad, "9780306406157").is_none(),
            "{bad}"
        );
    }

    // Transitions from Open Library ID URL
    let current_id = "https://covers.openlibrary.org/b/id/123456-L.jpg";
    assert!(cover_redirect(
        current_id,
        "https://archive.org/download/olcovers12/olcovers12-L.zip/123456-L.jpg",
        "9780306406157"
    )
    .is_some());
    // Mismatched cover ID rejected
    assert!(cover_redirect(
        current_id,
        "https://archive.org/download/olcovers12/olcovers12-L.zip/654321-L.jpg",
        "9780306406157"
    )
    .is_none());
    // Backward redirect rejected
    assert!(cover_redirect(
        current_id,
        "https://covers.openlibrary.org/b/isbn/9780306406157-L.jpg?default=false",
        "9780306406157"
    )
    .is_none());
    // Cannot skip directly to storage node from ID URL
    assert!(cover_redirect(
        current_id,
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "9780306406157"
    )
    .is_none());

    // Transitions from Archive.org Download URL
    let current_archive = "https://archive.org/download/olcovers12/olcovers12-L.zip/123456-L.jpg";
    // Valid storage targets (legacy olcovers, multiple mounts, reversed params)
    for good_storage in [
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia800407.us.archive.org/view_archive.php?archive=/3/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia802809.us.archive.org/view_archive.php?file=123456-L.jpg&archive=/18/items/olcovers12/olcovers12-L.zip",
    ] {
        assert!(
            cover_redirect(current_archive, good_storage, "9780306406157").is_some(),
            "{good_storage}"
        );
    }
    // Invalid storage targets
    for bad_storage in [
        // Malformed host (not ia[0-9]{6}.us.archive.org)
        "https://ia60080.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia6008000.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia600800.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia600800.us.archive.org.attacker.com/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://evil.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://127.0.0.1/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "http://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        // Bad path
        "https://ia600800.us.archive.org/view_archive.php/extra?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia600800.us.archive.org/download.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        // Malicious/mismatched query parameters
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg&evil=1",
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip",
        "https://ia600800.us.archive.org/view_archive.php?file=123456-L.jpg",
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=wrong.jpg",
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/other/other-L.zip&file=123456-L.jpg",
        "https://ia600800.us.archive.org/view_archive.php?archive=/0/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia600800.us.archive.org/view_archive.php?archive=/bad/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg",
        "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/../../evil&file=123456-L.jpg",
        // Backward redirects
        "https://archive.org/download/olcovers12/olcovers12-L.zip/123456-L.jpg",
        "https://covers.openlibrary.org/b/id/123456-L.jpg",
    ] {
        assert!(
            cover_redirect(current_archive, bad_storage, "9780306406157").is_none(),
            "{bad_storage}"
        );
    }

    // Terminal node: Storage node cannot redirect
    let current_storage = "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers12/olcovers12-L.zip&file=123456-L.jpg";
    assert!(cover_redirect(
        current_storage,
        "https://ia600800.us.archive.org/other.jpg",
        "9780306406157"
    )
    .is_none());
    assert!(cover_redirect(
        current_storage,
        "https://archive.org/download/olcovers12/olcovers12-L.zip/123456-L.jpg",
        "9780306406157"
    )
    .is_none());
}

#[test]
fn all_supported_redirect_statuses_and_confirmed_three_hops() {
    for status in [301, 302, 303, 307, 308] {
        let mut m = Mock::new(vec![
            Ok(body(status, Some("/b/id/1162784-L.jpg"), vec![])),
            Ok(body(
                status,
                Some("https://archive.org/download/olcovers116/olcovers116-L.zip/1162784-L.jpg"),
                vec![],
            )),
            Ok(body(
                status,
                Some("https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers116/olcovers116-L.zip&file=1162784-L.jpg"),
                vec![],
            )),
            Ok(body(200, None, fixture(&[0], false))),
        ]);
        assert_eq!(run(&mut m).unwrap(), fixture(&[0], false));
        assert_eq!(m.requests.len(), 4);
        assert_eq!(m.requests[0].0, cover_initial("9780306406157"));
        assert_eq!(
            m.requests[1].0,
            "https://covers.openlibrary.org/b/id/1162784-L.jpg"
        );
        assert_eq!(
            m.requests[2].0,
            "https://archive.org/download/olcovers116/olcovers116-L.zip/1162784-L.jpg"
        );
        assert_eq!(m.requests[3].0, "https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers116/olcovers116-L.zip&file=1162784-L.jpg");
    }
}

#[test]
fn confirmed_direct_archive_redirect_chain_two_hops() {
    let mut m = Mock::new(vec![
        Ok(body(
            302,
            Some("https://archive.org/download/olcovers116/olcovers116-L.zip/1162784-L.jpg"),
            vec![],
        )),
        Ok(body(
            302,
            Some("https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers116/olcovers116-L.zip&file=1162784-L.jpg"),
            vec![],
        )),
        Ok(body(200, None, fixture(&[0], false))),
    ]);
    assert_eq!(run(&mut m).unwrap(), fixture(&[0], false));
    assert_eq!(m.requests.len(), 3);
}

#[test]
fn confirmed_l_covers_ten_digit_redirect_chain() {
    let mut m = Mock::new(vec![
        Ok(body(
            302,
            Some("/b/id/8234567-L.jpg"),
            vec![],
        )),
        Ok(body(
            302,
            Some("https://archive.org/download/l_covers_0008/l_covers_0008_23.zip/0008234567-L.jpg"),
            vec![],
        )),
        Ok(body(
            302,
            Some("https://ia802809.us.archive.org/view_archive.php?archive=/18/items/l_covers_0008/l_covers_0008_23.zip&file=0008234567-L.jpg"),
            vec![],
        )),
        Ok(body(200, None, fixture(&[0], false))),
    ]);
    assert_eq!(run(&mut m).unwrap(), fixture(&[0], false));
    assert_eq!(m.requests.len(), 4);
}

#[test]
fn direct_cache_hit_zero_redirects() {
    let mut m = Mock::new(vec![Ok(body(200, None, fixture(&[0], false)))]);
    assert_eq!(run(&mut m).unwrap(), fixture(&[0], false));
    assert_eq!(m.requests.len(), 1);
}

#[test]
fn unsafe_loop_missing_and_excess_redirect_never_fetch_target() {
    for loc in [
        None,
        Some("https://evil.test/a"),
        Some("https://archive.org/anything"),
        Some("/b/isbn/9780306406157-L.jpg?default=false"),
    ] {
        let mut m = Mock::new(vec![Ok(body(302, loc, vec![]))]);
        assert_eq!(run(&mut m).unwrap_err(), COVER_UNSAFE);
        assert_eq!(m.requests.len(), 1);
    }
    // Storage node trying to redirect (4th transition) fails closed
    let mut m = Mock::new(vec![
        Ok(body(302, Some("/b/id/1162784-L.jpg"), vec![])),
        Ok(body(
            302,
            Some("https://archive.org/download/olcovers116/olcovers116-L.zip/1162784-L.jpg"),
            vec![],
        )),
        Ok(body(
            302,
            Some("https://ia600800.us.archive.org/view_archive.php?archive=/18/items/olcovers116/olcovers116-L.zip&file=1162784-L.jpg"),
            vec![],
        )),
        Ok(body(302, Some("https://evil.test/next"), vec![])),
    ]);
    assert_eq!(run(&mut m).unwrap_err(), COVER_UNSAFE);
    assert_eq!(m.requests.len(), 4);
}

#[test]
fn controlled_status_and_network_outcomes_no_retry() {
    for (status, key) in [
        (403, "metadata.coverRefused"),
        (404, "metadata.coverMissing"),
        (429, "metadata.coverRateLimited"),
        (500, "metadata.coverServer"),
        (503, "metadata.coverServer"),
        (304, COVER_UNSAFE),
        (305, COVER_UNSAFE),
    ] {
        let mut m = Mock::new(vec![Ok(body(status, None, vec![]))]);
        assert_eq!(run(&mut m).unwrap_err(), key);
        assert_eq!(m.requests.len(), 1);
    }
    for key in [COVER_NETWORK, COVER_TIMEOUT] {
        let mut m = Mock::new(vec![Err(key.into())]);
        assert_eq!(run(&mut m).unwrap_err(), key);
        assert_eq!(m.requests.len(), 1);
    }
}

#[test]
fn total_deadline_shrinks_across_hops_and_body() {
    let mut m = Mock::new(vec![
        Ok(body(302, Some("/b/id/1-L.jpg"), vec![])),
        Ok(body(200, None, fixture(&[0], false))),
    ]);
    m.delay = 8000;
    assert_eq!(run(&mut m).unwrap_err(), COVER_TIMEOUT);
    assert_eq!(m.requests[1].1, Duration::from_secs(7));
    let mut b = body(200, None, fixture(&[0], false));
    b.delay = 15000;
    let mut m = Mock::new(vec![Ok(b)]);
    assert_eq!(run(&mut m).unwrap_err(), COVER_TIMEOUT);
}

#[test]
fn response_type_length_and_stream_caps() {
    let mut b = body(200, None, fixture(&[0], false));
    b.head.jpeg = false;
    assert_eq!(run(&mut Mock::new(vec![Ok(b)])).unwrap_err(), COVER_INVALID);
    let mut b = body(200, None, vec![]);
    b.head.length = Some(MAX_COVER as u64 + 1);
    assert_eq!(run(&mut Mock::new(vec![Ok(b)])).unwrap_err(), COVER_LARGE);
    let mut b = body(200, None, vec![]);
    b.head.length = None;
    b.chunks = VecDeque::from([Ok(vec![0; MAX_COVER]), Ok(vec![0])]);
    assert_eq!(run(&mut Mock::new(vec![Ok(b)])).unwrap_err(), COVER_LARGE);
    let mut b = body(200, None, fixture(&[0], false));
    b.head.length = Some(1);
    assert_eq!(run(&mut Mock::new(vec![Ok(b)])).unwrap_err(), COVER_INVALID);
    let mut bytes = vec![];
    append_bounded(&mut bytes, &vec![0; MAX_COVER], MAX_COVER).unwrap();
    assert!(append_bounded(&mut bytes, &[0], MAX_COVER).is_err());
}

#[test]
fn content_type_media_type_and_parameters() {
    assert!(is_jpeg_content_type("image/jpeg"));
    assert!(is_jpeg_content_type("image/jpeg; charset=utf-8"));
    assert!(is_jpeg_content_type("image/jpeg; charset=\"binary\""));
    assert!(is_jpeg_content_type("IMAGE/JPEG; charset=utf-8"));
    assert!(is_jpeg_content_type("image/jpeg; foo=bar; baz=123"));

    // Negative media types and malformed parameters
    assert!(!is_jpeg_content_type("image/png"));
    assert!(!is_jpeg_content_type("image/webp"));
    assert!(!is_jpeg_content_type("text/html; charset=utf-8"));
    assert!(!is_jpeg_content_type("application/octet-stream"));
    assert!(!is_jpeg_content_type("image/jpeg-foo"));
    assert!(!is_jpeg_content_type("image/jpeg; no_equals"));
    assert!(!is_jpeg_content_type("image/jpeg; =missing_key"));
    assert!(!is_jpeg_content_type("image/jpeg; empty_val="));
    assert!(!is_jpeg_content_type("image/jpeg; bad_key@=1"));
    assert!(!is_jpeg_content_type("image/jpeg; key=\x00"));
    assert!(!is_jpeg_content_type(""));
}

#[test]
fn valid_jpeg_controls_and_invalid_content() {
    for b in [fixture(&[0], false), fixture(&[], true)] {
        assert!(validate_cover(&b).is_ok());
    }
    let base = fixture(&[0], false);
    let mut metadata = vec![255, 216];
    segment(&mut metadata, 225, b"Exif\0\0II*\0\x08\0\0\0\0\0\0\0\0\0");
    metadata.extend(&base[2..]);
    assert!(validate_cover(&metadata).is_ok());
    for b in [
        vec![],
        b"<html>error</html>".to_vec(),
        b"{}".to_vec(),
        b"\x89PNG\r\n\x1a\n".to_vec(),
        b"RIFFxxxxWEBP".to_vec(),
        vec![255, 216, 255],
        fixture(&[], false),
        fixture(&[63], false),
        base[..base.len() - 2].to_vec(),
    ] {
        assert!(validate_cover(&b).is_err());
    }
}

#[test]
fn trailing_data_after_eoi_behavior_and_stream_cap() {
    let base = fixture(&[0], false);
    assert_eq!(&base[base.len() - 2..], &[255, 217]);

    // Format-tolerance: decoder stops at EOI (FF D9); trailing bytes are tolerated
    let mut with_trailing = base.clone();
    with_trailing.extend(b"trailing-comment-or-padding\0\r\n");
    assert!(cover_frame(&with_trailing).is_ok());
    assert!(validate_cover(&with_trailing).is_ok());

    // Stream ceiling is still strictly enforced regardless of trailing data
    let mut oversized = base.clone();
    oversized.resize(MAX_COVER + 1, 0);
    assert_eq!(cover_frame(&oversized).unwrap_err(), COVER_LARGE);
    assert_eq!(validate_cover(&oversized).unwrap_err(), COVER_LARGE);
}

#[test]
fn retained_research_nonempty_truncation_is_not_strict_conformance() {
    // Original FAILED strict-conformance expectation, retained visibly under the
    // revised product contract. Decoder success is deliberately NOT called conformance.
    let mut b = fixture(&[0], false);
    b[77] = 32;
    b[79] = 32;
    assert!(
        validate_cover(&b).is_ok(),
        "known zune tolerance changed: reassess research evidence"
    );
}

#[test]
fn resource_abusive_headers_fail_before_decode() {
    for (h, w) in [(0u16, 16u16), (65535, 65535), (4096, 4096)] {
        let mut b = fixture(&[0], false);
        b[76..78].copy_from_slice(&h.to_be_bytes());
        b[78..80].copy_from_slice(&w.to_be_bytes());
        assert!(cover_frame(&b).is_err());
    }
    let mut b = vec![255, 216];
    for _ in 0..17 {
        segment(&mut b, 254, &vec![0; 65533]);
    }
    b.extend(&fixture(&[0], false)[2..]);
    assert_eq!(cover_frame(&b).unwrap_err(), COVER_LARGE);
}
