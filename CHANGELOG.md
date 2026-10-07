# Changelog

## 1.0.0 release candidate — awaiting user verification

- Made Locations discoverable through a persistent labeled top-bar button, top-level sidebar entry and Dashboard shortcut, including collapsed navigation.
- Added visible Add Room/Bookcase/Shelf controls, explicit rename actions, hierarchy guidance and first-use messaging; physical-copy editors can create locations without discarding their drafts.
- Fixed Escape in nested location dialogs so it closes only that dialog and preserves the underlying unsaved copy editor.
- Separated Data Exchange from Backup & Recovery, with direct ZIP restore and helpful backup/manifest import guidance.
- Added portable JSON edition grouping and typed locations; fixed CSV location references so exports import into another library.
- Added dedicated physical-copy editing, independent acquisition/condition/state, human-readable identifiers, copy-specific loans, moves and reversible archive actions.
- Added typed location creation/editing/browsing and blocked deletion of occupied locations, including those holding archived copies.
- Restricted copy edits and bulk location moves to copy data; preserved existing v1 databases without a schema reset or migration.
- Hardened backup validation for duplicate paths and database compatibility; expanded round-trip, rollback and real desktop verification.

## Initial release candidate — 2026-10-07

- Added a local Tauri catalogue with SQLite migrations and edition/copy separation.
- Added tabbed editing, Quick Add, managed covers, contributors, classifications and hierarchical locations.
- Added FTS search, combined filters, table/grid browsing, sorting and bulk operations.
- Added reading, loans, quotations, notes, attachments and typed custom fields.
- Added validated CSV/JSON transfer and portable backups with protected restore.
- Added local settings, light/dark/system appearance, shortcuts, reversible Trash and integrity tests.
- Configured Windows NSIS packaging and repository-local development caches.
- Verified real Windows desktop workflows with isolated SQLite data and restart checks.
- Preserved used dropdown values, portable custom-field/location imports, and loan history edits.
- Replaced native confirmation calls with explicit application dialogs that safely honor cancellation.
- Fixed initial confirmation focus so Enter defaults to Cancel; expanded unsaved-window checks.
- Fixed wrapping of long placeholder-cover titles and excluded generated schemas and runtime assets from Git.
