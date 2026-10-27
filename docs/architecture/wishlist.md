# M3-B Real Wishlist — local implementation

This is a local schema-4 candidate stacked on M3-A, not an integrated release or PO acceptance.
The PO authorized implementation, synthetic verification and scoped documentation only.

## Identity and persistence

`WishlistItem` has its own UUID and an optional Edition foreign key. Bibliographic intent stays
on the wish; linking never writes an Edition or creates a Physical Copy. Multiple wishes can
refer to one Edition. Specific edition preference needs neither an ISBN nor an Edition link.
Library `Snapshot.books`, copy counts and `book_search` retain their inventory meaning.

`wishlist_items`, ordered `wishlist_retailers` and append-only `wishlist_status_history` are
separate tables. A single immediate transaction validates links, rereads duplicate candidates,
checks the existing update timestamp, saves retailers and status history, and updates derived
Wishlist search. Duplicate acknowledgement is bound to the exact draft and current warnings;
no title/ISBN-based merge or identity reassignment occurs. Archived wishes participate in
warnings. Exact ISBN matches are stronger than identical normalized title/author warnings;
fuzzy or inferred work matching is not implemented.

Supported states are Wishing, On Order, Pre-Order and Cancelled. Cancellation is reversible;
archiving/reopening retains the wish and status history. Purchased/Fulfilled and conversion to
inventory are reserved for M3-C. Historical Copy `ownership=Wishlist` remains valid on import,
restore and existing edits, including omitted ownership fields; new manual Copy creation cannot
introduce it. The UI offers the legacy value only when already present on that record.

## Amounts and retailer boundaries

SQLite stores non-negative signed-64-bit integer minor units; IPC uses decimal integer strings.
The shared offline `src/domain/currencies.json` table defines supported ISO currency codes and
minor-unit precision (including retained historical codes). Non-monetary codes with no defined
precision are excluded. Input is never rounded; invalid precision/overflow is rejected. Budget
sums use wider integer arithmetic and remain decimal strings through presentation. All active
Wishing/On Order/Pre-Order targets contribute once, independent of retailer count; cancelled and
archived wishes and retailer offers are excluded. Missing targets are counted separately, and
currencies are never converted or combined. Totals describe targets, not expenditure.

At most 30 retailers per wish are accepted. Native open loads the stored URL by wish/retailer ID,
validates and canonicalizes HTTPS without credentials, whitespace, control characters or
backslashes, then passes that same value to the existing native opener. No generic renderer URL
opener permission is added. There is no retailer HTTP request, verification, scraping or price
monitoring. Subsequent redirects in the external browser are outside MyLibrary's control.

## UI, metadata, search and export

The dedicated Wishlist route provides detailed list/gallery views, linked Edition covers or a
local typographic fallback, independent search/status/priority/archive controls and explicit
save/cancel. Budget labels describe all active wishes, independently of list filters. No separate
cover store, provider-image downloader or scanner-to-Wishlist integration is added.

Explicit ISBN lookup reuses `lookupMetadata` and its existing bounded Open Library/Google Books
clients. Only title, authors and ISBN fields are offered, with provider attribution and opt-in
selection. Apply changes the latest Wishlist draft; Save alone persists it. Identity changes and
unmount invalidate delayed results. Partial/offline provider failure leaves manual entry usable.
Google Books availability/quota remains a provider limitation; synthetic fixtures do not prove
live availability. No new provider endpoint, API key or background lookup is introduced.

Separate derived `wishlist_search` includes title, author and ISBN, not private notes. It uses
M3-A's Turkish-I normalizer and bounded, quoted parameterized FTS5 query builder, including NUL
rejection. It never contributes matches to inventory search or counts.

Catalogue export defaults to Library; selecting Wishlist enables versioned JSON only. Wishlist
export includes all wishes, including archived ones, and excludes notes/retailer details by
default. Explicit privacy controls include those fields. It is not a full backup or import format;
Library import rejects the Wishlist envelope. ZIP backup retains all tables, relationships and
history. CSV flattening, Wishlist catalogue import and an ambiguous All Data option are excluded.

## Migration and restore

See [migration contract](migrations.md). Schema 4 only adds Wishlist structures and ledger entry 4.
Explicit `<3` and `<4` guards prevent V3→V4 from rebuilding Copy FTS or reinserting ledger 3.
The original schema and V1 fixtures are unchanged. Populated upgrades retain the existing SQLite
snapshot including committed WAL, one transaction and foreign-key validation. Failures roll back.

Trusted restore reference schemas support versions 1–4. Archive definition/integrity/FK checks
precede business-data validation; older archives upgrade in staging only. Wishlist validation
checks identifiers, field bounds, currency amounts, retailer URLs, timestamps, current history
and derived-index consistency before live replacement. A later explicit Edition edit does not
rewrite a wish's independent intent; historical bibliographic disagreement is not repaired during
restore. Existing managed media/path and mandatory safety-backup protections remain in place.

## Review boundaries

Local automation is documented in [VERIFICATION](../../VERIFICATION.md); it is not independent
review, real scanner/camera acceptance or Windows PO acceptance. Large Wishlist performance and
supported-currency maintenance deserve review. Wishlist Studio is future **M5 discovery**: ordinary
Wishlist data can feed a later read-only presentation module, but no PDF/PNG/print/template engine,
extra persistence or rendering dependency is introduced here. M2 remains OPEN; no integration,
commit, push, PR, release or cleanup is authorized by this candidate.
