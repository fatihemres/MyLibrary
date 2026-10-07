# Changelog

## 1.0.0 — 2026-10-07

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
