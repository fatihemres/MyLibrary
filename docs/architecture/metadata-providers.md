# ISBN metadata providers — M2-A foundation and integrated M2-E/M2-F

M2-A introduced explicit manual ISBN lookup and source-aware preview. M2-E integrated opt-in source-attributed series-name and conservative genre suggestions via [PR #17](https://github.com/fatihemres/MyLibrary/pull/17), and M2-F integrated user-selected scan-to-metadata via [PR #19](https://github.com/fatihemres/MyLibrary/pull/19). Earlier candidate subsections below preserve implementation/testing provenance, not current integration state. **Overall M2 remains OPEN** until a separate PO milestone decision; see [roadmap](../v2/ROADMAP.md).
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
remain informational; only the separately filtered M2-E genre suggestions below can be explicitly
added to personal genres. Tags and other term kinds are never changed by lookup. Save remains separate; Ctrl+S is blocked
while the preview is open. Cancel/close preserves the draft and normal unsaved-change protection.
All added UI text is localized in English/Turkish; choices use labeled radio groups and native dialogs.

## M2-E candidate: evidence and limitations

The PO accepted this deliberately limited behavior on 2026-10-23; draft PR preparation is
approved, integration is not. Live probes that day for `9789752444102` and `9780761936749`
returned Google HTTP 429 (`RESOURCE_EXHAUSTED / rateLimitExceeded`, daily Queries quota).
No result items reached ISBN filtering. Open Library successes remain available when Google
fails; the UI reports provider unavailability and manual entry remains possible. No key,
fallback query or relaxed matching is added. Google's [identification guidance](https://developers.google.com/books/docs/v1/using)
requires an API key or OAuth identification for public API requests; the current keyless
integration's future availability/quota policy requires a separate PO decision.

Open Library returned HTTP 200 for those two probes without bracketed series tags. PO's
separate Ince Memed, Monte Cristo and Sherlock Holmes examples lack recorded exact ISBNs;
no claim is made about their individual raw responses. Richer series discovery remains
[planned M3 scope](../v2/ROADMAP.md), not this implementation. Community labels are not facts.
For `9789752444102`, raw publisher `Panama Yay?nc?l?k` is confirmed upstream corruption.
Publisher remains manually editable; Keep current, Cancel and lookup failures preserve it.
Explicit provider selection may replace it. No speculative character repair is performed.
Distinct volume Editions must not be mistaken for physical copies merely because a set ISBN
matches; existing [explicit duplicate decisions](duplicate-decisions.md) remain unchanged.

Observed code before M2-E: `isbn_lookup` selects the requested `/api/books` record, then enriches
only language and description from the already approved ISBN edition request. The TypeScript
adapter reads subject names. Google Books passes the existing bounded volume response to an
exact-ISBN adapter, which reads categories. No additional request, host, redirect or credential is
introduced; native networking and persistence code are unchanged.

Provider documentation checked on 2026-10-22; tag interpretation corrected on 2026-10-23:

- [Open Library Books API](https://openlibrary.org/dev/docs/api/books) exposes subject objects
  with names in `jscmd=data`. The [editing guidance](https://openlibrary.org/help/faq/editing.en)
  documents `[series:series_name]` for literary-series tagging. Only that complete bracketed
  syntax in `subjects[].name` is offered. Bare `series:name`, malformed brackets, general edition
  `series`, titles/subtitles and plain subject names do not become selectable series names.
  The published [jscmd=data serializer](https://github.com/internetarchive/openlibrary/blob/master/openlibrary/plugins/books/dynlinks.py)
  routes through `DataProcessor.process_doc`: its subject helper assigns the string unchanged to
  `name`; only the URL lowercases/replaces spaces. It does not remove brackets. MyLibrary's native
  adapter also leaves subjects unchanged. Thus unbracketed text is not treated as a transformed
  documented tag. This is source-code evidence, not a guarantee about every deployed response.
  One explicit public-ISBN check (`9780671729416`) against the existing `/api/books` endpoint on
  2026-10-23 returned HTTP 200 but no series-tagged subjects; it did not verify a live bracketed
  example. No extra application endpoint or lookup was added. Edition enrichment is unchanged.
  Community editors can misuse even bracketed tags: a publisher collection may appear as a
  suggestion. The UI warns about that ambiguity and asks the user to confirm the intended literary
  series. No publisher-name blacklist or automatic semantic certification is used.
- [Google volume fields](https://developers.google.com/books/docs/v1/reference/volumes) document
  categories. The official [seriesInfo model](https://developers.google.com/resources/api-libraries/documentation/books/v1/csharp/latest/classGoogle_1_1Apis_1_1Books_1_1v1_1_1Data_1_1Volumeseriesinfo.html)
  describes `shortSeriesBookTitle` as a book title and `bookDisplayNumber` as display-only.
  Its [volumeSeries entries](https://developers.google.com/resources/api-libraries/documentation/books/v1/csharp/latest/classGoogle_1_1Apis_1_1Books_1_1v1_1_1Data_1_1Volumeseriesinfo_1_1VolumeSeriesData.html)
  supply `seriesId` and `orderNumber`, not a human-readable series name. These do not produce a
  selectable series or order, and are never joined to an Open Library name by assumption.

**Order is unsupported in this candidate.** No verified existing response field associates a usable
series name with a reliable order. Even positive numbers are rejected as suggestions; invalid,
non-finite, negative and orphan numbers cannot reach the draft. An explicit series tag without an
order can be applied independently when the current order is empty. If a manual order exists,
a different series name is disabled and rejected again at Apply using the latest draft. The user
must review/clear that order in the editor first. Matching names may retain the existing order.
No order is guessed, silently cleared, or transferred to a different series.

Fixtures are synthetic examples of documented field shapes, not evidence that a particular ISBN
currently returns a tag/category. The limited public-ISBN observation above does not establish
live series coverage or provider availability in general. Open
Library tags remain community-supplied suggestions, not certified bibliographic facts. Multiple
tagged names are presented as alternatives with provenance; none is selected automatically.

### Conservative genre policy

`metadata.ts` contains a small explicit vocabulary of 19 broad genre/form labels: fiction,
literature, poetry, drama, science fiction, fantasy, historical fiction, detective and mystery
stories, mystery, thriller, horror, romance, short stories, biography, autobiography,
biography & autobiography, comics & graphic novels, juvenile fiction and young adult fiction.
Open Library subjects must match a complete label. Google categories may match a complete label
or a slash hierarchy whose first segment matches; only that root is suggested. Empty segments
or more than four segments reject the hierarchy. This does not classify arbitrary topics, people,
places or eras. No substring guesses, translation or taxonomy service is used. Labels outside
this deliberately incomplete English vocabulary stay informational, even in the Turkish UI.

New suggestions inspect at most the first 100 entries per source, reject malformed/non-string
entries and control/format characters, normalize NFC and whitespace, and reject input over 200
code units or normalized labels over 160. Each provider yields at most five series names and ten
genres. Case-insensitive normalized duplicates within a provider collapse; the first spelling is
kept. Identical suggestions across providers remain separately attributed in preview and collapse
on application. Raw subjects retain their pre-existing informational normalization behavior.

### Draft, consent and lifecycle

`MetadataResult` adds only `seriesSuggestions` and `genreSuggestions`, each carrying its provider;
field provenance is also retained. No raw payload or provenance is saved in SQLite. Existing schema,
Edition/Physical Copy IDs, relationships, transfer format and backup semantics are unchanged.

New fields are always opt-in, including empty current fields. The original defaults for all other
metadata fields remain unchanged. Genre checkboxes are individual; Apply appends chosen values,
deduplicating by NFC, whitespace-normalized case-insensitive text, without rewriting/reordering existing manual
values in the draft. Existing storage behavior is unchanged: SQLite snapshot reads return terms
alphabetically, so draft insertion order is not a new persisted ordering guarantee. Other term kinds
and all copy fields are preserved. Unoffered selections are ignored.

Lookup never mutates the draft. Apply uses the functional state update and latest draft; it does
not save to SQLite. Save remains a separate editor action. Cancel discards selections. Unmount
invalidates pending operations and releases the preview Save guard; changed record/ISBN identity
discards late lookup results. Late cover acquisition cannot apply into an unmounted editor.
Explicit cover acquisition may still create a managed image before Save, as before; no cleanup or
cover deletion is added. Native cover policy is the integrated CQ-02-A behavior described in
[the cover verification document](../testing/cq02a-safe-openlibrary-covers.md), not the historical
M2-A single-response observation below.

Deterministic coverage: `metadataEnrichment.test.ts` covers normalized suggestions, unsupported
orders, malformed/bounded input, deduplication, partial failures, explicit selection and preservation
of manual/Edition/Copy data. The existing desktop harness adds synthetic M2-E preview, individual
selection, Apply/Save separation, latest-draft and section-dismissal assertions. Test presence is not
execution evidence; consult [VERIFICATION](../../VERIFICATION.md) for attributed commands and platform results.

## Covers (historical M2-A behavior)

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

Historical M2-A Windows verification on 2026-10-10 (not current M2 status):

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


## M2-F scan-origin lookup — local candidate

The optional [Scan Books workflow](barcode-scanning.md#m2-f-optional-scan-to-lookup--local-candidate)
can initiate the existing lookup once for a new ISBN-only editor. It requires explicit selection of
online lookup and a valid accepted ISBN. Default ISBN-only scanning remains offline; batch capture
never queries providers until the user chooses Review & add for a row. Camera capture is cleaned up
before the editor starts lookup. No manual editor, Quick Add or copy-barcode action gains automatic lookup.

The same bounded provider operation, exact ISBN checks, partial-failure handling and explicit preview
are used. One operation may call both providers; it is not two automatic lookups. Unavailable providers,
including the existing native Google Books quota-error mapping, leave manual editing and retry available.
No API key, alternate search, automatic retry or expanded network access is added. Existing M2-E series
and genre limitations remain unchanged. Apply updates only the draft and Save persists separately;
closing or changing ISBN identity prevents late results from opening a stale preview.


Draft PR preparation is PO-authorized; physical Windows USB/camera acceptance remains pending.
Integration and final PO acceptance are not implied, and M2 remains OPEN. The isolated desktop
harness uses a verified native rejection proxy as well as IPC fixtures so a broken mock cannot
fall through to upstream provider HTTP. This is test-only; deployed provider boundaries are unchanged.
