# ISBN metadata providers — M2-A

M2-A adds explicit manual ISBN lookup and source-aware preview. It does not complete M2:
duplicate intelligence, USB keyboard-wedge capture, batch scanning and webcam scanning remain deferred.
No schema, migration, edition/copy identity, backup format or updater configuration changes are required.

## Request and trust boundaries

`domain/isbn.ts` and native `isbn.rs` independently validate checksums. Presentation spaces and
hyphens are removed, terminal X is uppercased, ISBN-13 must start with 978/979. UPC and unrelated
EAN identifiers are rejected. ISBN-10 converts to its 978 equivalent; only 978 ISBN-13 converts
back. Two populated editor ISBN fields must identify the same edition before lookup. Existing
stored ISBNs are not rewritten or constrained by a migration.

One explicit editor action sends the canonical ISBN to both providers concurrently. There is no
background lookup, account, key, OAuth, backend service, analytics or remote logging. Provider
failures are isolated; manual entry remains available. Invalid ISBNs are rejected before requests
in both frontend orchestration and native commands. A request guard prevents repeated clicks.

Rust owns all requests. JSON responses are limited to **2 MiB per response**, comfortably above a
five-volume ISBN result; content length is checked early and actual streamed bytes use checked
addition before appending. Parsing occurs only after the bounded body succeeds. Each request has
a **15-second timeout**. HTTPS is required. Automatic redirects are disabled; 3xx responses do not
count as success. Library data is never written by metadata commands.

- Open Library: fixed `https://openlibrary.org/api/books` with `bibkeys=ISBN:...`, `format=json`,
  `jscmd=data`. Optional edition enrichment requests `/isbn/{canonical}.json`. The endpoint was
  observed returning a 302 to `/books/OL7353617M.json` for public ISBN 9780140328721. At most one
  explicit enrichment redirect is allowed, strictly to HTTPS `openlibrary.org/books/OL{digits}M.json`,
  with no credentials, query, fragment or non-default port. Subsequent redirects fail. Enrichment
  failure does not discard the primary result.
- Google Books: fixed `https://www.googleapis.com/books/v1/volumes`, `q=isbn:...`, `maxResults=5`,
  `printType=books`. No key is supplied. The adapter chooses only a volume with a checksum-valid
  ISBN equivalent to the request, even when a wrong result comes first. Similar titles never match.
  Availability and anonymous quotas remain provider-controlled.

API references: [Open Library Books](https://openlibrary.org/dev/docs/api/books),
[Google Books volumes list](https://developers.google.com/books/docs/v1/reference/volumes/list).

## Normalized contract and provenance

`services/metadata.ts` owns provider-specific parsing and a provider-neutral `MetadataResult`:
provider, title, subtitle, authors, contributors, publishers, publicationDate, identifiers,
languages, pages, description, subjects, covers and provenance. Malformed values are ignored,
strings trimmed, lists deduplicated, page counts restricted to nonnegative safe integers, and
identifiers checksum-validated. Each populated field (including individual identifier lists)
has runtime source provenance. Google identifiers contradictory to the requested edition are
excluded. No author/contributor roles or personal classifications are inferred.

Raw responses stay within native/provider adapters. Neither raw JSON nor hidden provenance is
persisted into editions or copies. Unsupported fields are ignored. Provider text is rendered as
React text, never HTML; HTML-like descriptions remain literal text.

## Preview and apply

`MetadataLookup` shows each current value and separate Open Library/Google Books candidates.
`metadataMerge.ts` implements deterministic per-field defaults and application. Nonempty current
values default to Keep current; empty fields may default to the first available provider. Defaults
use the latest draft at response time, preserving edits made during lookup. Nothing changes until
Apply. Selecting one source for title does not select that source for authors or other fields.

Apply changes only selected draft fields. Author replacement preserves Translator/Editor/etc.
Publisher names keep the existing semicolon-separated representation. Synopsis is applied only
when selected. Publication dates yield only a four-digit year; no month/day is invented. Subjects
are displayed but never assigned to personal genres/tags. Save remains separate; Ctrl+S is blocked
while the preview is open. Cancel/close preserves the draft and normal unsaved-change protection.
All added UI text is localized in English/Turkish; choices use labeled radio groups and native dialogs.

## Covers

Candidate URLs are normalized only for approved HTTPS provider hosts, with no credentials or ports.
They are not rendered as remote images or fetched automatically. Existing Open Library cover apply
uses the captured canonical ISBN, a fixed Covers API endpoint, a 20 MiB streamed byte cap and the
existing managed-image validation/storage command. Redirects are not followed. A failed cover
request preserves the current cover while selected text fields still apply. The tested public
cover endpoint returned HTTP 200 directly. Local cover selection remains available.

Google Books cover candidates are non-actionable in M2-A. Generalized cover download is deferred;
there is no frontend-controlled arbitrary URL downloader. Explicit cover apply can create a managed
local image before Book Save, as in V1; metadata lookup itself never creates files or records.

## Verification

Synthetic TypeScript fixtures cover ISBN rules, malformed provider payloads, exact Google matches,
provenance, independent provider failures and field-level draft application. Native tests cover
checksums/conversions, rejection before network work, response ceilings and redirect targets.
The desktop smoke harness includes synthetic provider responses in the real Windows WebView to
exercise explicit lookup, invalid ISBN/no request, conflicting candidates, manual-value defaults,
Ctrl+S separation, Apply, cancellation and partial/offline failure without provider availability.
Existing restore/schema/import security tests remain part of the full native suite.

Final Windows verification on 2026-10-10:

- `npm run typecheck`, `npm run lint`, `npm run test`: passed (50 frontend tests,
  including 26 focused ISBN/provider/merge tests).
- `npm run test:rust`: passed (49 tests: 11 unit, 24 integrity, 3 V1 migration,
  5 restore-limit and 6 schema-validation tests). Focused ISBN and metadata native tests also passed.
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check` and
  `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked`: passed.
- `npm run build` and `npm run desktop:build -- --no-bundle`: passed. Vite reports a
  non-blocking chunk-size advisory. This verifies the Windows executable, not a new installer release.
- `npm run test:desktop`: 27 workflow groups passed against the rebuilt executable with isolated
  synthetic libraries, including M2-A, copies, locations, import/export, backup/restore, restart,
  EN/TR switching and frozen V1 migration. Preview screenshots were inspected at normal/narrow
  widths; assertions cover radio sizing/overflow and saving after preview cancellation.
  Local evidence: `.cache/desktop-check-1791656620963/report.json` (ignored, not committed).
  No WebView runtime errors or external WebView requests were recorded by this fixture-driven run.

The desktop provider cases substitute deterministic IPC responses; they do not prove live Google
Books availability. A separate public-ISBN live check returned Open Library metadata, while Google
Books was unavailable. Native response/redirect boundaries are tested independently. No macOS/Linux
M2-A desktop acceptance or new CI run is claimed. M2 remains open, with scanner and duplicate work
pending; no persisted provenance, schema change or generalized remote-cover downloader was added.

## Updater boundary (unchanged)

`services/updates.ts` remains fail-closed: configured=false, automatic=false, no fetch or installation.
Activation needs an explicitly approved signed distribution endpoint, secure signing credentials,
verification and rollback/data-compatibility policy. M2-A does not enable updates or signing.
