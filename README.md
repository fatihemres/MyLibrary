# MyLibrary

A private Windows desktop catalogue for physical books, built with Tauri 2, React 19, TypeScript, Vite and embedded SQLite. No server, account, Docker, telemetry or cloud database. Production starts with an empty library.

## Features

- Edition and physical-copy records; tabbed editor and Quick Add; managed PNG/JPEG/WebP covers (file selection or drop).
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

See [VERIFICATION.md](VERIFICATION.md) for the verified Windows release, exact results, artifact hashes and testing boundaries.

Build the release executable before `npm run test:desktop`. This Windows workflow suite launches that actual executable with a fresh `.cache/desktop-check-<timestamp>/library` and a separate WebView2 profile. It operates the real UI and Rust/SQLite backend over a loopback-only WebView2 debugging connection, checks restart persistence, and saves screenshots and a JSON report in that folder. Only native file-picker responses are supplied by the harness; actual imports, exports, backups and restoration run normally. It does not test the Windows file-picker interaction or install/uninstall the NSIS package. Debugging is enabled only in the test process environment.

## Build Windows

```powershell
npm run desktop:build
```

Executable: `src-tauri/target/release/mylibrary.exe`.

NSIS installer: `src-tauri/target/release/bundle/nsis/MyLibrary_1.0.0_x64-setup.exe`.

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

Settings displays the exact path and opens it in Explorer. `MYLIBRARY_DATA_DIR` can override the root for controlled development/portable use. Only one instance may open a particular library. Images are files, not SQLite blobs. Removing/replacing covers retains old files for safety. Book deletion moves a copy to Trash and retains relationships and files; active loans must be returned first. No automatic purge removes user data or archives.

Do not copy only a live `.sqlite3` file: current writes may be in its WAL. Use the Backup screen.

## Backup and restore

1. Select **Backup → Save backup archive** and choose a new ZIP filename, preferably on another drive.
2. SQLite's online backup API creates a consistent snapshot; the archive also contains managed covers, attachments and a versioned manifest. All database-held settings and relationships are included.
3. To restore, choose an archive and type `RESTORE`. Extraction happens in staging. Unsafe paths, unsupported versions, integrity/foreign-key failures and missing referenced files are rejected.
4. A mandatory `backups/before-restore-<uuid>.zip` preserves the current library before replacement. Failure to make that archive aborts restore.
5. Validated files are swapped into place with rollback on ordinary filesystem errors. The previous directories are also retained as `.previous-<uuid>` recovery data.

Scheduled backups are checked at startup and hourly while the app is open, or manually with **Check scheduled backup now**. Choose daily, weekly or every 30 days. This is not an OS background task; it does not run while the app is closed. Old archives are never automatically pruned.

Archives are not encrypted. Restore limits are 100,000 files and 20 GB expanded. An OS crash/disk failure during a multi-file restore can require recovery from the safety archive or retained previous directory; the app does not claim filesystem-wide crash atomicity. Keep a backup on another disk and periodically test restoration.

## Import/export

CSV requires UTF-8 and a header row. Use semicolons between multiple authors/genres/tags. Map unfamiliar headers, validate, review problems/duplicates and explicitly confirm which rows to accept. Dates use `YYYY-MM-DD`; ratings use half-star steps from 0 to 5. Accepted rows are written in one transaction. Existing records are never overwritten or silently merged.

JSON accepts an array of book objects or a MyLibrary object with a `books` array. It preserves nested book fields but is a catalogue export, not a complete backup. Transfer images, loans, individual notes, quotes and reading sessions with ZIP backup/restore. CSV contains common catalogue columns. Existing export files are not silently overwritten. Formula-like spreadsheet text is escaped in CSV.

## Architecture and database

The Rust layer is the only database writer; typed frontend services invoke desktop commands. Foreign keys, WAL, a busy timeout and full synchronization are enabled. Multi-step changes use transactions. Versioned migrations use `PRAGMA user_version`, reject newer schemas, and preserve an existing database before migration.

**Edition/copy separation:** editions contain shared bibliographic information and contributor/classification relationships. Each physical copy has a UUID Library ID and independent barcode, location, acquisition, condition, reading state, notes, quotes and loans. **Add another copy** deliberately shares an edition. Ordinary duplicate additions/imports remain separate editions to avoid incorrectly merging publications. The editor warns when bibliographic edits affect multiple copies.

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
src-tauri/src/schema.sql  Relational schema and FTS
src-tauri/src/backup.rs   Snapshot/archive/restore services
src-tauri/src/lib.rs      Desktop commands and managed files
src-tauri/src/metadata.rs Optional, explicit Open Library lookup
src-tauri/tests/      Native integrity tests
scripts/              Local development/build/test wrappers
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the original implementation plan.

## Shortcuts

`Ctrl+N`: full editor. `Ctrl+F`: search. `Ctrl+S`: save the book editor. `Esc`: close a dialog, with unsaved-change protection.

## Limits and future work

- The interface is English; default book language is configurable.
- Open Library metadata is optional and can be incomplete. Only selected fields replace form values; failure never blocks manual entry.
- Reading-session entries preserve multiple reading events; the times-read counter and current state are editable per copy.
- No permanent Trash purge, encryption, sync, barcode-scanner integration, PDF/HTML export or signed installer is included.
- This release targets personal collections and is not benchmarked as an institutional catalogue. It loads a snapshot and refreshes FTS after mutations.

Development/build scripts never push code or library data. Publishing a verified code milestone to the configured private GitHub origin requires the owner's explicit request. Runtime libraries, caches, backups and build outputs are excluded from Git.
