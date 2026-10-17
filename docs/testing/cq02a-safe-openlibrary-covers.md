# CQ-02-A candidate verification (remediated)

Base: 7c54e814554f3ce048f33c3e004c73fa681df767. Branch:
agent/codex-cq02a-safe-cover-download-02. No integration/release authorization.

## Decoder decision before dependency addition

Use zune-jpeg exactly 0.5.15, default features disabled, std only; its sole dependency
is zune-core (evaluated 0.5.3). MIT OR Apache-2.0 OR Zlib; Rust >=1.75. No native
library/build script, Rayon or SIMD feature. Published source and isolated Windows
probes reviewed on 2026-10-16. The upstream security page reports no published
advisories and no SECURITY.md; this is not a vulnerability-free guarantee:
https://github.com/etemesi254/zune-image/security

Threats: excessive compressed/decoded allocation, excessive scan/metadata work,
malformed parser input, unsafe redirects, unexpected persistence and disclosure of
provider errors. Full decoding is a usability/resource check, NOT strict conformance.
Prior failed strict-conformance experiments remain unchanged in ignored
.cache/decoder-review/{probe,jpeg-decoder-probe,layered}. Their empty/nonempty
truncation findings are retained in regression evidence; uniform colors are valid.

Planned bounds: streamed 20 MiB, 4096 per axis, 8 Mi pixels, 32 MiB output;
1 MiB APP/COM metadata, 4096 segments, 64 scans. Before full decode, screen sampling
and coefficient-array dimensions conservatively with checked arithmetic. This is
not a total allocator/RSS guarantee: metadata copies, row buffers, allocator overhead
and dependency defects remain risks. A single cover operation at a time prevents
request-driven multiplicative allocation. No custom entropy decoder or dependency fork.
The small framing walk is for resource screening and empty-scan rejection, not JPEG
conformance. Existing native PNG/JPEG/WebP upload semantics remain unchanged.

Source-reviewed allocations: zune-jpeg headers.rs validates axis bounds; mcu.rs and
mcu_prog.rs allocate i16 coefficient arrays from MCU geometry; components.rs allocates
upsampling rows/scratch; headers.rs copies APP metadata; decoder.rs reassembles XMP
only after contiguous-length checks. Output is allocated by the caller after checking
output_buffer_size and decoded dimensions. Allocation failures within dependency Vec
allocations are not recoverable through a total-budget API. OS memory exhaustion cannot
be ruled out. Compatibility at the chosen bounds must be tested, not inferred.

## Trailing data after JPEG EOI and format tolerance

The JPEG framing walk validates SOI (`0xFF, 0xD8`) and returns once a valid frame and
entropy scan terminate at EOI (`0xFF, 0xD9`). Decoders (including zune-jpeg) stop at EOI.
Trailing data (e.g. metadata padding, camera artifacts, or trailing whitespace) after EOI
is tolerated by both the framing walk and decoder up to the 20 MiB stream ceiling.

Security assessment:
- Downloaded cover bytes are written with a random UUID to the application-managed
  `covers/<uuid>.jpg` path and rendered strictly as an image in the Webview via the local
  asset protocol.
- The file is never executed or interpreted as script or markup, eliminating polyglot
  execution risks.
- The 20 MiB ceiling (`MAX_COVER`) prevents unbounded payload storage regardless of
  trailing bytes.
- Regression coverage (`trailing_data_after_eoi_behavior_and_stream_cap`) confirms that
  trailing bytes are tolerated without failing valid images while oversized payloads are
  promptly rejected before full decode.

## Upstream redirect grammar and multi-hop chain

Reviewed official coverstore code.py and archive.py on 2026-10-16 and confirmed
production responses via live public ISBN verification on 2026-10-17:
https://github.com/internetarchive/openlibrary/blob/master/openlibrary/coverstore/code.py
https://github.com/internetarchive/openlibrary/blob/master/openlibrary/coverstore/archive.py

Observed real-world redirect chains:
1. Direct edge hit (0 hops): `covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false`
   returns 200 OK directly when cached on the Open Library edge.
2. Direct Archive.org download (2 hops):
   `covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false`
   -> 302 to `https://archive.org/download/{item}/{zip}/{file}`
   -> 302 to `https://{ia_host}/view_archive.php?archive=/{mount}/items/{item}/{zip}&file={file}`
   -> 200 OK (Content-Type: image/jpeg).
3. Canonical ID indirection (3 hops):
   `covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false`
   -> 302 to `/b/id/{id}-L.jpg`
   -> 302 to `https://archive.org/download/{item}/{zip}/{file}`
   -> 302 to `https://{ia_host}/view_archive.php?archive=/{mount}/items/{item}/{zip}&file={file}`
   -> 200 OK.

Transition validation and parameter tying:
- Storage hosts must strictly match `^ia[0-9]{6}\.us\.archive\.org$` over HTTPS.
- Storage paths must strictly be `/view_archive.php`.
- Query parameters must strictly contain only `archive` and `file`.
- Downstream `file` must exactly match the filename from the prior verified redirect hop.
- Downstream `archive` must match `/{mount}/items/{item}/{zip}` where `{item}` and `{zip}`
  match the verified target from the prior hop, and `{mount}` is 1-4 decimal digits.
- Redirect limit: strictly at most 3 redirect transitions. Storage nodes are terminal
  and cannot redirect. Any unexpected host, extra parameter, path traversal, or backward
  transition fails closed (`metadata.coverUnsafeRedirect`).

## V1/V2 comparison

V1 normalize checked ISBN length/characters, not checksum; its client used default
Reqwest redirects. V2 validates checksums/canonical ISBN and disables automatic
redirects; its explicit JSON enrichment redirect is separate and must not change.
Both stream cover downloads with a 20 MiB cap; V2 uses checked accumulation and early
Content-Length checks. Neither baseline fully decodes cover images before returning
bytes. The existing managed cover action recognizes signatures and writes a new UUID
file; BookEditor Save remains separate. No new schema or persistence action is needed.

## Verification

Fresh local verification completed on Windows:
- `cargo test --manifest-path src-tauri/Cargo.toml`: PASS (28 unit tests, 44 integration tests)
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`: PASS
- `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked`: PASS
- `npm run test` (vitest): PASS (12 test suites, 253 tests)
- `npm run typecheck` (tsc -b): PASS
- `npm run lint` (eslint .): PASS
