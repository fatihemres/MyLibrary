# Changelog

## 2.0.0-alpha.1 — V2 foundation (unreleased)

- Added forward transactional schema versioning, pre-migration snapshots and staged V1 archive upgrades; preserved edition/copy data without a Work table.
- Added English/Turkish UI preferences, plural/Intl formatting, logical layout and accessibility baseline.
- Centralized native paths, folder opening, pickers and OS shortcut labels; added macOS/Linux package configuration and CI matrix.
- Introduced normalized metadata-provider and inactive, fail-closed updater boundaries.
- Added frozen synthetic V1 compatibility tests and desktop language/migration checks. V1 release/tag remain unchanged; no Milestone 2 features.

## 1.0.0

Released 2026-10-08 following owner acceptance. Stable baseline for V1 maintenance and future V2 development; no V2 features included.

- Fixed Dashboard Finished/Unread navigation to apply the matching reading-status filter while preserving counts.
- Grouped Library grid/table entries by edition after copy-level filtering, with concise copy counts, explicit mixed reading states and matching-copy bulk/export selection. Different editions remain separate; no data migration or reading-model change.
- Refined desktop typography, light/dark surfaces, focus treatment, command bars and restrained motion, with reduced-motion support.
- Consolidated global navigation into the sidebar, pinned Settings, removed duplicate Locations controls and retained labels at narrow widths.
- Rebalanced Dashboard into primary/secondary metrics, featured reading, compact recent additions and expandable insights; polished location and physical-copy surfaces without changing persistence behavior.
- Made Locations discoverable through a labeled top-level sidebar entry with explicit expand/collapse navigation.
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
