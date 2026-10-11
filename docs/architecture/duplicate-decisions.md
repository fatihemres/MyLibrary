# M2-B: local edition and physical-copy decisions

Status: implementation candidate; M2 remains open. No schema, migration, Work entity,
provider/network, dependency, updater or signing changes are required.

## Signals and identity

`src-tauri/src/duplicates.rs` is the authoritative engine. It reads active **and archived**
copies and groups candidates by stored edition ID, never by title. The UI consumes typed
reports from `src/domain/duplicates.ts`.

- **Strong:** equivalent checksum-valid canonical ISBN, using M2-A's Rust parser. ISBN-10
  converts to 978; 979 matches only its canonical 979 value. Invalid, contradictory pairs,
  UPCs and unrelated EANs supply no strong identity evidence.
- **Copy collision:** exact nonempty barcode or inventory-code reuse. This is a separate
  warning, never edition identity. Reuse remains permitted after explicit review.
- **Weak:** normalized title and nonempty author-set equality. Informational only; no
  attach action, inferred relationship or automatic selection follows from it.

An edition with three copies appears once with a copy count and archived count. Two
distinct editions with the same ISBN remain two targets. An archived-only edition can
receive a new active copy without restoring any old copy. Existing opaque V1 IDs are
validated against actual database records, not a new UUID-format constraint.

## Manual creation

BookEditor validates the draft, requests `duplicate_report`, and opens DuplicateResolver
before persistence when signals exist. No target is initially selected. Explicit choices
are: add a new copy to a strong target, create a separate edition, or cancel. Cancel/Escape
returns to the unchanged editor draft. With no duplicate signal, ordinary creation proceeds.

`create_decided` independently rechecks the target and ISBN inside the write transaction.
The new copy has a new ID and independent barcode, location, acquisition source/date,
condition, status, rating, favorite, current page, complete copy extra data and custom values.
It does not clone another copy's loans, entries, attachments, archive state or history.
The physical-only CopyEditor workflow is unchanged.

Existing edition data is kept by default. Manual reconciliation offers title, subtitle,
authors, publisher, publication year, pages, language, ISBN-10, ISBN-13 and synopsis.
Each incoming field is opt-in, with existing/incoming values and a warning that edition
changes affect all copies. Author selection preserves existing non-Author contributors.
ISBN reconciliation must leave a valid equivalent pair. Other edition fields, IDs, covers,
paths, terms, series, relationships and copy controls cannot be patched by this decision.

`save_book_inner` separates shared-edition writes from complete copy persistence. With no
selected fields it skips edition/relationship writes entirely. With selected fields it uses
the current stored edition plus only the explicitly allowed incoming fields. Validation,
edition patch, copy/custom/history writes and search indexing commit together or roll back.
Existing-book editing still rejects reassignment to another edition.

## Import plans

`import_preview` creates groups from explicit `transfer.edition_key`; rows with no key are
independent groups. Conflicting shared metadata within a portable group is rejected, never
silently split or resolved by row order. IDs from the file are ignored for target identity.

DataPage shows a decision per incoming group: add every member to one existing ISBN target,
create one separate edition with the group's copies, or skip the group. Strong existing
matches, incoming ISBN conflicts and identifier collisions require explicit review. Clean
and weak-only groups may default to separate. Invalid rows cause their entire group to be
skipped, as disclosed in the final import confirmation.

Incoming-versus-incoming ISBN and copy-identifier conflicts are surfaced, including reused
copy identifiers inside a portable group. Incoming title/author similarity is informational.
This slice does not attach to another incoming group: explicitly keep separate or skip.

`import_decided` accepts a typed, complete group plan. Rust rejects unknown/duplicate/missing
plan keys, unsupported actions/fields, absent targets and targets whose current ISBN does
not match. Every decision is checked before writes; all imported rows, portable locations,
custom definitions/values and search indexing share one transaction. Import attachment
never patches edition metadata. No partially imported library remains after failure.

The pre-existing `Store::import` compatibility operation still creates separate editions
(respecting portable group keys) without linking existing editions; it cannot accept a
target or edition patch. It is not exposed directly to the renderer: legacy IPC import calls use unreviewed default plans and reject duplicate-sensitive input; legacy IPC save routes new drafts through the decision validator. The desktop import UI uses the explicit-plan operation. Existing
F4 transfer validation and V1 portable custom/location semantics remain in the write path.

## UX and verification

EN/TR keys cover the new flow. Native modal semantics, Cancel/Escape, restored focus,
named radio groups, labeled field choices, logical spacing and existing reduced-motion
behavior are retained. No full accessibility certification is implied.

Deterministic coverage lives in `src-tauri/tests/duplicates.rs` and
`src/domain/duplicates.test.tsx`; Windows workflow coverage is in
`scripts/desktop-smoke.mjs`. See the current M2-B entry in `VERIFICATION.md` for actual
results. All libraries and media used for verification are synthetic and ignored by Git.

Deferred: destructive merging, incoming-group linking, persisted provenance, scanners,
camera capture and batch scanning. These decisions do not expand M2-B scope.
