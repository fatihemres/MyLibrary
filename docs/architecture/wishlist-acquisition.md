# M3-C explicit Wishlist acquisition — candidate

Authority: the PO's 6 November 2026 task instruction for [Issue #32](https://github.com/fatihemres/MyLibrary/issues/32)
authorizes this bounded implementation, synthetic verification, commit/push and a Draft PR
against `v2`. It does not authorize integration, product acceptance, milestone closure or release.
Base: `f54472b962505ded0c27f4e2d837aaf10e93d56a` (integrated PR #55).

## Candidate behavior

An eligible, saved, non-archived and non-cancelled wish offers **Add to My Library**.
The user explicitly chooses an existing Edition (including deliberately reviewing its existing
link), or reviews the title, author text and ISBN fields for a new Edition. No title/author/ISBN
match selects an Edition automatically. Existing Edition metadata is never written by this flow.
The review shows the selected Edition's current title, author and ISBN, and the new Copy's
condition, inventory code, barcode, location, acquisition source and date. Missing inventory
codes use the existing automatic Copy numbering. New Copies have ownership and copy state Owned,
and start Unread. Existing validated Copy controls/values and writers are reused; ordinary
Copy/Edition editors remain available after acquisition.

**Review acquisition** is read-only. Cancel, Escape and unsaved-draft discard never persist an
Edition, Copy or acquisition. Only **Confirm and add Physical Copy** commits. The successful
result names the newly generated Copy ID and offers navigation to that Copy, including in Trash
if the user later archives it. Duplicate clicks are blocked locally and stale/repeated requests
are rejected in the backend. A transport error after commit requires refreshing Wishlist to
inspect its persisted fulfillment link; retrying stale consent cannot create another Copy.

New Editions deliberately contain only the reviewed bibliographic fields. Author text becomes
one Author contributor without parsing or inferring individual people. No cover upload/download,
retailer automation, prices-as-expenditure, metadata enrichment, new location creation or broader
editor redesign is included. Existing Editions retain their stored media. A new Edition starts
without a cover; the original wish's optional Edition link and independent bibliographic intent
are preserved.

## Schema 5 and state

The additive `wishlist_acquisitions` table has its own UUID, the original Wishlist UUID, a unique
new Copy FK, acquisition time and optional reopen time. A partial unique index permits at most
one active acquisition per wish. No existing table or CHECK constraint is rebuilt; schema-1
bootstrap and schema-4 SQL remain frozen. There is no Work table or fake Copy.

**PROPOSED candidate representation:** an active acquisition is the persisted Purchased/Fulfilled
state. The underlying pre-acquisition status stays on the original wish. Display, status filter,
catalogue export and active count/budget all use the effective fulfillment state; fulfilled
targets and missing-price counts are excluded from active budgets. Catalogue exports reveal the
effective status without exposing Copy/acquisition IDs or private lifecycle history. They remain
partial catalogue exports, not backups or an import format. Completed wishes remain searchable
and visible in Wishlist; they are not automatically archived or deleted.

The append-preserved lifecycle rows contribute Purchased and Reopened events to the visible
status timeline alongside every original status-history row. Timeline ordering compares actual
RFC3339 instants. Event times advance past prior wish/acquisition times even after clock rollback.
Retailer rows, notes, original IDs, archived records and legacy Copy ownership are preserved.
Generic wish editing cannot change the underlying status of an active acquisition.

**PROPOSED safe reversal:** **Unlink acquisition and reopen wish** explicitly explains that the
Copy and Edition stay in My Library. It closes the acquisition event, changes intent to Wishing
and appends status history in one transaction. It never deletes or edits either inventory
record. An archived wish remains archived until explicitly reopened through the existing editor.
After unlinking, another explicit acquisition creates another independent Copy; old confirmation
tokens remain invalid. Product acceptance of these candidate semantics belongs to the PO.

## Transaction, migration and restore boundary

Final confirmation uses an immediate SQLite transaction. It rereads the saved wish, acquisition
history and deliberately chosen Edition. Consent is bound to the exact request, current wish,
all prior acquisition cycles and reviewed Edition details. A changed/deleted/conflicting Edition,
stale wish, stale review or existing fulfillment rejects the operation. Existing V1 Edition IDs
remain opaque text and are validated through authoritative membership rather than rewritten as
UUIDs. New Copy and acquisition IDs are generated internally; the request cannot supply either.

The existing shared Copy writer validates condition, dates, locations, source and Copy fields.
New Edition/Copy writes, fulfillment relationship, wish timestamp and inventory search update
commit together. Any failure rolls them all back. Reopen has the same immediate lock and stale
wish/active-acquisition checks. Local UI guards supplement these database guarantees.

V1–V4 populated migrations use the existing committed-WAL pre-migration snapshot and single
transaction. Failure preserves the old schema/data; no empty-database fallback or downgrade.
Trusted restore schemas now include version 5; versions 1–4 still validate before upgrading in
staging. New lifecycle IDs, timestamps and state are validated before live replacement. Existing
integrity, FKs, ZIP/path/media limits, safety backup, pending marker, recovery generations and
no-clobber publication are unchanged. See [migration contract](migrations.md),
[Wishlist](wishlist.md) and [Issue #54 recovery contract](restore-recovery.md).

## Acceptance boundary

Actual commands/results and independent source-review attribution belong in
[VERIFICATION](../../VERIFICATION.md) and the Draft PR. Synthetic native WebView2 automation is
separate from real PO acceptance and physical Windows DPI. The PO checklist covers explicit
new/existing Edition choices, both Cancel boundaries, independent Copies, success navigation,
Purchased count/budget/history, safe unlink/reacquire, EN/TR keyboard/focus, narrow windows,
save/close/reopen and a synthetic backup/restore round-trip. No real personal library is used.
