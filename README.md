# MyLibrary

This branch is **V2 Milestone 1 / 2.0.0-alpha.1**, an unreleased foundation. The stable V1 source and installer remain at immutable tag/release [v1.0.0](https://github.com/fatihemres/MyLibrary/releases/tag/v1.0.0). Do not use prerelease builds on your only library copy.

A private Windows desktop catalogue for physical books, built with Tauri 2, React 19, TypeScript, Vite and embedded SQLite. No server, account, Docker, telemetry or cloud database. Production starts with an empty library.

## Features

- Edition and independently editable physical-copy records; tabbed editor and Quick Add; managed PNG/JPEG/WebP covers (file selection or drop).
- Contributors, publication data, classification, acquisition, condition, reading, reviews and precise hierarchical locations.
- Grid/table browsing, configurable columns, search, combined filters, sorting, selection and bulk operations.
- People, series, genres, tags, locations, reading sessions, notes, quotes, lending history, attachments and typed custom fields.
- CSV mapping and validated import preview; CSV/JSON catalogue exports; complete ZIP backup/restore and scheduled backups.
- Light, dark and system appearance; reversible book Trash; keyboard shortcuts and unsaved-edit warnings.

## Requirements

Windows 10/11 x64, WebView2 Runtime, Node.js 22.12+ with npm, Rust stable with the MSVC target, Visual Studio C++ desktop build tools and a Windows SDK. Development used Node 24 and Rust 1.98. SQLite is compiled into the application; it needs no separate installation or service.

Internet is needed to initially download development dependencies and packaging tools. Installed core functionality works offline. Optional, user-requested ISBN lookup is the only product network feature.

## Run

From PowerShell:

```powershell
cd C:\Dev\MyLibrary
npm ci
npm run desktop
```

`npm run desktop` starts Vite and the real Tauri window. `npm run dev` starts only Vite; a normal browser lacks the Rust database bridge.

To use separate repository-local verification data and a separate WebView2 profile:

```powershell
npm run desktop:verify
```

This uses `.cache/verification-library`, leaving the production library untouched.

## Test and format

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:rust
npm run build
npm run test:desktop
npm run format
cargo fmt --manifest-path src-tauri/Cargo.toml
```

Frontend tests cover filtering, sorting, progress, duplicate handling, CSV mapping, validation and formula-safe exports. Rust integration tests use real SQLite and cover persistence, relationships, independent copies, rollback, loans, search, custom fields, hierarchy, atomic imports, portable restore and rejected unsafe archives. Temporary test libraries live under `src-tauri/target/test-data`.

See [VERIFICATION.md](VERIFICATION.md) for the verified Windows release, exact results, artifact hashes and testing boundaries. Permanent V1 cases are in [acceptance tests](docs/testing/v1.0.0-acceptance-tests.md) and the [release checklist](docs/testing/v1.0.0-release-checklist.md).

Build the release executable before `npm run test:desktop`. This Windows workflow suite launches that actual executable with a fresh `.cache/desktop-check-<timestamp>/library` and a separate WebView2 profile. It operates the real UI and Rust/SQLite backend over a loopback-only WebView2 debugging connection, checks restart persistence, and saves screenshots and a JSON report in that folder. Only native file-picker responses are supplied by the harness; actual imports, exports, backups and restoration run normally. It does not test the Windows file-picker interaction or install/uninstall the NSIS package. Debugging is enabled only in the test process environment.

## Build Windows

```powershell
npm run desktop:build
```

Executable: `src-tauri/target/release/mylibrary.exe`.

NSIS installer: `src-tauri/target/release/bundle/nsis/MyLibrary_2.0.0-alpha.1_x64-setup.exe`.

The installer is unsigned; no signing certificate is configured. WebView2 must be available on the destination; installer bootstrapping may need an internet connection if it is missing. Build wrappers use `.cache/cargo`, `.cache/tmp`, `.cache/npm` and Tauri's `useLocalToolsDir`, avoiding global package installations. Existing rustup/MSVC installations are used. Initial native builds are considerably slower than incremental builds.

## Local data

The persistent root is Tauri's application-data directory for `com.mylibrary.desktop`, normally:

```text
%APPDATA%\com.mylibrary.desktop\
  library.sqlite3          Database
  library.sqlite3-wal      Write-ahead log, when present
  library.sqlite3-shm      SQLite coordination file, when present
  covers\                  Managed cover images
  attachments\             Managed attachments
  backups\                 Automatic and safety archives
  .library.lock            Exclusive application-instance lock
```

Settings displays the exact path and opens it in the platform file manager. `MYLIBRARY_DATA_DIR` can override the root for controlled development/portable use. Only one instance may open a particular library. Images are files, not SQLite blobs. Removing/replacing covers retains old files for safety. Book deletion moves a copy to Trash and retains relationships and files; active loans must be returned first. No automatic purge removes user data or archives.

Do not copy only a live `.sqlite3` file: current writes may be in its WAL. Use the Backup screen.

## Backup and restore

1. Under **Backup & Recovery**, select **Create Backup → Create Backup…** and choose a new ZIP filename, preferably on another drive.
2. SQLite's online backup API creates a consistent snapshot; the archive also contains managed covers, attachments and a versioned manifest. All database-held settings and relationships are included.
3. Select **Restore Backup → Choose Backup ZIP…**, select the original archive directly and type `RESTORE`. Do not extract it or select `manifest.json`. Restore replaces the current library state. Extraction happens in staging. Unsafe or duplicate paths, unsupported versions, invalid manifests, incompatible database structures, integrity/foreign-key failures and missing referenced files are rejected before replacement.
4. A mandatory `backups/before-restore-<uuid>.zip` preserves the current library before replacement. Failure to make that archive aborts restore.
5. Validated files are swapped into place with rollback on ordinary filesystem errors. The previous directories are also retained as `.previous-<uuid>` recovery data.

Scheduled backups are checked at startup and hourly while the app is open, or manually with **Check scheduled backup now**. Choose daily, weekly or every 30 days. This is not an OS background task; it does not run while the app is closed. Old archives are never automatically pruned.

Archives are not encrypted. Restore limits are 100,000 files and 20 GB expanded. An OS crash/disk failure during a multi-file restore can require recovery from the safety archive or retained previous directory; the app does not claim filesystem-wide crash atomicity. Keep a backup on another disk and periodically test restoration.

## Import/export

**Data Exchange → Import CSV/JSON / Export CSV/JSON** exchanges catalogue records. A backup ZIP and its internal manifest are not catalogue imports; selecting either displays guidance to use **Restore Backup**. Exports can include the entire library, filtered results or selected copies.

CSV requires UTF-8 and a header row. Use semicolons between multiple authors/genres/tags. Map unfamiliar headers, validate, review problems/duplicates and explicitly confirm which rows to accept. Dates use `YYYY-MM-DD`; ratings use half-star steps from 0 to 5. Accepted rows are written in one transaction. Existing records are never overwritten or silently merged.

JSON exports use `{ "format": "MyLibrary catalogue", "version": 1, "books": [...] }`. Each record contains edition fields, contributor/classification names, physical-copy fields, nested `extra`, `copy_extra` and custom values. Its `transfer` object contains an `edition_key`, a location-name path, location kinds and custom-field definitions. Import assigns fresh record IDs while preserving shared-edition groups within that import; it never merges into existing editions. Older arrays of book objects and objects with a `books` array remain accepted. This is a catalogue exchange format, not a complete backup: use ZIP backup/restore for managed images, attachments, loans, individual notes, quotes, reading sessions and settings.

CSV contains common catalogue columns, with `location_path` encoded as a JSON array of location names so it works in another library. It does not preserve edition grouping or all copy attributes. Legacy CSV `location_id` values from another library must be left unmapped or replaced with a portable path. Existing export files are not silently overwritten. Formula-like spreadsheet text is escaped in CSV.

## Physical copies and locations

Library grid and table show one entry per edition, with a total active-copy label such as **2 copies**. Different editions with the same title stay separate. Search and filters operate on physical copies first, then group matching editions; all selected criteria must match the same copy. A filtered card may show **2 copies · 1 matching**. Mixed reading states are labeled explicitly. Opening an entry still exposes all its individual copies in **Copies**. No copy records are merged.

Selecting an edition selects its matching copies for bulk operations and export; the selection bar reports the copy count. Filtered-out copies are unaffected. Trash remains copy-based for individual recovery. Dashboard **Finished**, **Unread**, **Currently Reading**, **Want to Read** and **Favorites** open the corresponding filtered view without changing their existing counts.

Open a book's **Copies** tab to add, view, edit, move, lend, return or archive each copy. Copy identifiers default to readable **Copy #1**, **Copy #2**, etc.; you can enter your own inventory code. Each copy independently stores barcode, condition, acquisition source/date/price/currency, gift details, shelf position, location notes and personal notes. Owned and Missing states are editable; Lent is derived from the active loan. Archiving requires confirmation and is reversible in Trash. Copy attachments are managed through **View copy → Attachments**.

**Locations** supports Home/Library → Room → Bookcase → Shelf, with rooms also allowed at the root. Create and rename locations, browse their copies and move selected library copies using **Move Location**. Copies may remain unassigned. Locations containing children or copies (including archived copies) cannot be deleted; move the copies and remove empty children first. Existing untyped locations remain usable and editable.

From the default dashboard, click **Locations** in the left sidebar (expand it with **Navigation** if collapsed). Click **Add Room**, enter **Study**, and **Save**. Select **Study**, click **Add Bookcase**, enter **Bookcase 1**, and **Save**. Select **Bookcase 1**, click **Add Shelf**, enter **Shelf 1**, and **Save**. Select any location to use its **Rename Room/Bookcase/Shelf** or **Remove location** action. The sidebar is the only global navigation surface; Settings stays at its bottom.

To assign a copy, open **Library → book → Copies → Edit** (or **Add Copy**) → **Location**. Choose **Study → Bookcase 1 → Shelf 1** under **Room → Bookcase → Shelf**, then **Save physical copy**. The same tab provides **Add Room**, **Add Bookcase** and **Add Shelf** if locations have not been created yet; nested creation preserves the unsaved copy draft and immediately refreshes the choices.

## Architecture and database

The Rust layer is the only database writer; typed frontend services invoke desktop commands. Foreign keys, WAL, a busy timeout and full synchronization are enabled. Multi-step changes use transactions. Versioned migrations use `PRAGMA user_version`, reject newer schemas, and preserve an existing database before migration.

**Edition/copy separation:** editions contain shared bibliographic information and contributor/classification relationships. Each physical copy has an internal UUID and independent barcode, location, acquisition, condition, reading state, notes, quotes and loans. **Add Physical Copy** shares an edition; its dedicated editor and bulk location moves cannot modify bibliographic data. The full book editor warns when bibliographic edits affect multiple copies. Ordinary duplicate additions remain separate editions; portable JSON imports retain explicit edition groups using fresh IDs. There is no additional work-level table: the current book detail represents an edition, avoiding inferred merges between different publications.

The copy/location correction retains schema version 1. New optional copy attributes and location kinds use the existing owning JSON columns; no destructive migration or data reset is necessary. Compatibility tests reopen and edit a copy of an existing v1 database.

People are first-class records joined through contributor roles. Publishers, series, acquisition sources, typed terms, hierarchical locations, loans, entries, attachments and custom fields have relational tables. A unique partial loan index permits only one active loan per copy. Infrequently queried descriptive attributes live in JSON objects on their owning edition, copy or person; the design is not a single unstructured books table.

FTS5 searches important identity fields, contributors, publisher, series, classifications, descriptive text, notes and quotes. Index updates are transactional. Filtering/sorting uses a frontend snapshot; larger institutional collections would benefit from database-side pagination and incremental FTS updates.

```text
src/components/       Editor, dialogs, covers and form safety
src/domain/           Types, field metadata, filters and tests
src/pages/            Dashboard, library, detail, explore, personal and data screens
src/services/         Desktop bridge and catalogue transfer
src/App.tsx           Navigation/application coordination
src/styles.css        Local desktop design system and themes
src-tauri/src/db.rs    Transactional repository and migrations
src-tauri/src/copies.rs   Copy-only validation, edits and moves
src-tauri/src/schema.sql  Relational schema and FTS
src-tauri/src/backup.rs   Snapshot/archive/restore services
src-tauri/src/lib.rs      Desktop commands and managed files
src-tauri/src/metadata.rs Optional, explicit Open Library lookup
src-tauri/tests/      Native integrity tests
scripts/              Local development/build/test wrappers
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the original implementation plan.

## Desktop interface

The interface uses a calm Windows/Fluent-inspired surface system: Segoe typography, restrained blue accent, consistent focus rings, compact command bars and a single sidebar for navigation. Search and book creation occupy the top app bar; page titles belong to the content area. Settings remains pinned to the sidebar footer. Navigation labels stay visible in narrow windows unless explicitly collapsed; collapsed entries retain accessible names and native tooltips.

Dashboard separates four primary metrics from secondary counts and gives reading and recent additions the main space. All prior statistics and charts remain available, with collection insights grouped in an expandable section. Locations uses a hierarchy browser and a contents pane. Copy location creation stays in the existing draft with clear contextual guidance.

Hover/press, sidebar width, page-heading entrance and dialog entrance transitions last 100–180 ms. The operating system's reduced-motion preference disables these transitions and animations. These are web-rendered desktop controls, not native WinUI controls. Design references: [Microsoft NavigationView](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview) and [Motion in Windows](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/motion).

## Keyboard shortcuts

`Ctrl+N`: full editor. `Ctrl+F`: search. `Ctrl+S`: save the book editor. `Esc`: close a dialog, with unsaved-change protection.

## Limits and future work

- The interface is English; default book language is configurable.
- Open Library metadata is optional and can be incomplete. Only selected fields replace form values; failure never blocks manual entry.
- Reading-session entries preserve multiple reading events; the times-read counter and current state are editable per copy.
- No permanent Trash purge, encryption, sync, barcode-scanner integration, PDF/HTML export or signed installer is included.
- This release targets personal collections and is not benchmarked as an institutional catalogue. It loads a snapshot and refreshes FTS after mutations.

Development/build scripts never push code or library data. Publishing a verified code milestone to the configured GitHub origin requires the owner's explicit request. Runtime libraries, caches, backups and build outputs are excluded from Git.

## Stable releases and future development

**MyLibrary v1.0.0** was approved by the owner on 2026-10-08. [Release notes](docs/releases/v1.0.0.md) document the stable baseline. Download the historical installer and SHA256SUMS.txt from the [GitHub Release](https://github.com/fatihemres/MyLibrary/releases/tag/v1.0.0).

The annotated v1.0.0 tag permanently identifies the release source. main holds the stable baseline, v1-maintenance receives compatible V1 fixes, and v2 holds the foundation for future development. All three initially pointed to the V1 release commit; V1 refs remain unchanged. No source folders are duplicated. See [versioning policy](docs/versioning.md) for Semantic Versioning, maintenance, forward-porting and V2 promotion procedures. Never move published tags or replace historical release assets.

## V2 foundation

The canonical [shared agent contract](AGENTS.md) and [V2 roadmap](docs/v2/ROADMAP.md) govern future work. M2 — Barcode & Metadata is next; this documentation does not start its implementation.

Milestone 1 is **CLOSED** as of 2026-10-09. [Final CI run 37884695260](https://github.com/fatihemres/MyLibrary/actions/runs/37884695260) passed on Windows x64, macOS Apple Silicon, macOS Intel and Linux x64. Windows signing and macOS signing/notarization remain unconfigured. The repository is public by owner choice; MyLibrary remains local-first and production user data must never be committed.

English/Turkish UI is selected in Settings → Language & region and persists independently of book language. Schema 2 adds a migration ledger without changing editions/copies. V1 upgrades create a SQLite safety snapshot; V1 ZIP restores migrate staging before replacing live data. Keep a complete V1 ZIP for downgrade. Updates remain unconfigured/inactive and make no background requests.

See [assessment](docs/v2/foundation-assessment.md), [platform](docs/architecture/platform-abstraction.md), [localization](docs/architecture/i18n.md), [migrations](docs/architecture/migrations.md), [provider/update boundaries](docs/architecture/metadata-providers.md), [acceptance cases](docs/testing/v2-acceptance-tests.md) and [platform matrix](docs/testing/v2-platform-matrix.md). Windows, macOS Apple Silicon, macOS Intel and Linux automated checks and packaging now pass; this remains separate from native desktop acceptance. No Milestone 2 feature work is included.
