# M3-A search foundation (integrated V2)

**28 October 2026 status:** Integrated in [PR #41](https://github.com/fatihemres/MyLibrary/pull/41) at exact `ec742660f9c2e2bb33df9f4434b8dcf9efd0fab8`. Candidate-era implementation and review notes below preserve historical provenance; remaining M3 work requires independent PO authorization. This document-only update does not change search behavior.

## Migration assessment before implementation

The existing FTS5 book_search table is a derived copy-ID/body index. Turkish I normalization needs no new table, shadow-data model, ICU, or binary dependency. SQLite unicode61 remove_diacritics 2 remains responsible for accent and case folding; both indexed bodies and query terms additionally fold I, İ and ı to i. Original bibliographic values and notes remain untouched. This intentionally makes dotless and dotted I equivalent for discovery, not for record identity.

Existing index contents must be rebuilt. Forward schema 3 records this rebuild in the existing migration ledger. The frozen V1 bootstrap and schema-2 migration remain unchanged. All pending upgrades and index rebuilding run inside the existing transaction, after a SQLite pre-migration snapshot; failure rolls back data, index and version together. Restore uses trusted schema references for versions 1–3 and upgrades only isolated staging before replacement. No destructive reconstruction is required.

Queries retain quoted multiword AND/prefix behavior and bound parameters, with a limit of 1,024 characters and 32 whitespace-delimited terms. Oversized queries are rejected, never silently truncated. Punctuation is interpreted by the existing FTS tokenizer, not as user-supplied SQL or FTS operators.

Filters remain an in-memory conjunction applied to individual Physical Copies before grouping by stored Edition ID. No saved rules or collections are introduced. Concise presentation keeps active detailed fields visible; reset is explicit. Counts report matching copies and editions. The combined search body cannot reliably attribute matches to individual fields, so no match snippets or private-note excerpts are displayed. All search/filter operations remain offline.

## Filter contract and presentation

SearchCriteria combines a bounded query with a flat conjunction of allowlisted string criteria. Unsupported fields, oversized values, malformed numbers and reversed publication-year ranges fail closed with visible feedback. Common concise fields are author, genre, reading status and location (including descendants). Detailed fields retain publisher, tag, language, series, condition, publication-year bounds, acquisition year, minimum rating, lending and copy flags; acquisition source is also selectable from existing data. No new user-data fields are introduced. Null years/ratings do not match numeric bounds. Empty criteria remain inactive. Equal/null sort values use copy ID as the stable tie-breaker.

Active detailed controls remain rendered in concise view, and active criteria remain summarized when the panel is closed. Switching presentation never resets criteria. User-authored labels are displayed verbatim; only built-in status/flag labels are translated. Counts distinguish matching Physical Copies from grouped Editions, and show an updating message while query results are pending.

## Verification boundaries

The focused browser fixture uses synthetic records and blocks all nonlocal requests. On the development machine, Kaspersky can inject its own script request; the harness keeps it blocked and attributes it separately only when the same exact script endpoint is independently observed on a script-free control page, with Chromium parser-initiator evidence and a matching injected script element. Request timing and initiators are retained in the local test report. Any other external request fails the check. This is not an antivirus exclusion or a provider-availability test. Native smoke uses the existing isolated library/profile and test-only rejection proxy. Physical Windows USB/camera acceptance and independent review remain pending.

## Review checkpoint

The verified local candidate is being prepared as a stacked DRAFT PR against M2-F [PR #19](https://github.com/fatihemres/MyLibrary/pull/19), based on `4ca8bf7811751fbb4345db817c307aab509e43b6`. See [verification evidence](../../VERIFICATION.md). Commit/push and draft preparation are PO-authorized; integration and final acceptance are not. M2 remains OPEN. Schema 3 is not integrated into `v2`. Large-library reindex performance remains unbenchmarked.
