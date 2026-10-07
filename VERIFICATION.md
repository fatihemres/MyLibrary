# Windows release-candidate verification — 2026-10-07

Verified on Windows x64 using the actual Tauri release executable and its Rust/SQLite backend. Production application data was neither opened nor modified. Every desktop run used a fresh repository-local test library and WebView2 profile.

## Checks

| Command                                                                            | Result                                                         |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run typecheck`                                                                | Passed                                                         |
| `npm run lint`                                                                     | Passed                                                         |
| `npm run test`                                                                     | 14 frontend tests passed                                       |
| `npm run test:rust`                                                                | 20 native integrity tests passed; unit/doc-test targets passed |
| `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2` | Passed                                                         |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check`                           | Passed                                                         |
| `npm run build`                                                                    | Passed; also run by the final Tauri build                      |
| `npm run desktop:build`                                                            | Passed; Windows x64 executable and NSIS installer produced     |
| `npm run test:desktop`                                                             | All 20 workflow groups passed on the final executable          |
| `git diff --check`                                                                 | Passed                                                         |

Rust commands used `CARGO_HOME=.cache/cargo` and repository-local temporary directories. The MSVC linker emitted an informational import-library creation message; there were no compilation or test failures in the final runs.

## Desktop coverage

- Empty startup; hierarchical locations and custom-field creation.
- Quick Add, managed cover upload, full editor, Ctrl+S and persistent editing.
- Reading progress, notes, quotes, reading sessions, lending and preserved return history.
- Managed attachment upload/export with byte-for-byte verification.
- Author editing and series/location browsing. Created rooms, bookcases and two shelves; renamed locations, blocked occupied-location removal and removed an empty location.
- Added a second physical copy of one edition; independently edited condition, acquisition date/source/price/currency, gift details and shelf assignment. Lent only Copy #2 while Copy #1 remained Owned, returned it, moved Copy #1, cancelled an archive, then archived and recovered Copy #2.
- Grid/table views, search, combined filters, sorting, bulk tags, copy-only Move Location and context menus.
- Actual JSON/CSV file exports and imports into a separate clean library. JSON retained shared-edition grouping, typed location paths, copy attributes and custom definitions. CSV retained supported catalogue fields and portable location paths. CSV field mapping, invalid-row preview and confirmed import also passed.
- Confirmation initially focuses Cancel; Enter and Escape cancel safely. Cancelling deletion leaves all copies intact. Cancelling native window close preserves the draft. Explicit acceptance closes the actual window and leaves saved records intact after restart.
- Physical-copy unsaved-change confirmation defaults to Cancel and preserves both the draft and saved data when cancelled.
- ZIP backup, reversible Trash, recovery, validated restore and automatic pre-restore safety archive. Import rejected both the ZIP and a backup manifest with Restore Backup guidance, leaving records intact.
- Settings, dark appearance, database integrity, placeholder-cover wrapping and restart persistence of books, covers, entries, loans, attachments and preferences. Copy conditions, acquisition data, shared edition, shelf position and location assignments were asserted after restore and restart.

Final local report and screenshots: `.cache/desktop-check-1791377951330/`. The report recorded zero frontend runtime errors and zero external WebView requests during core workflows. Test artifacts are ignored by Git.

The clean-library desktop test initially exposed CSV exports containing local location IDs. Exports now use portable name paths; the regression test and final real desktop round trip pass. Native tests also verify malformed manifests, unsupported schemas, unsafe archives and missing assets are rejected without changing the current library. A snapshot copy of an existing v1 database remains editable with stable records; no schema migration or reset was needed.

## Artifacts

- Executable: `src-tauri/target/release/mylibrary.exe`
- SHA-256: `76b0cbcd156c10c6005091e9f2198c2af06df2e02adca64f8453b4e24ab7147b`
- Installer: `src-tauri/target/release/bundle/nsis/MyLibrary_1.0.0_x64-setup.exe`
- Installer size: 4,032,060 bytes
- Installer SHA-256: `9fe1d9c568f8ca2ca9cad9d1cb9111b024e17ad2cca95b99f59471d0186d3026`

## Audit and verification boundaries

The source audit found no analytics, telemetry, remote logging or backend service. Product network code is isolated to explicitly requested Open Library metadata/cover lookup. No production database, covers, attachments, backups, credentials or runtime files are tracked. Repository-local libraries were empty or contained only named verification records. Ignore rules cover runtime directories, SQLite databases/sidecars, media directories, backups, secrets, logs, caches and generated build/schema output.

The desktop harness connects to the real application's WebView2 runtime over loopback. It supplies deterministic responses only to native file pickers; file reads/writes and database operations are real. Native file-picker interaction, NSIS install/uninstall and live Open Library responses were not exercised. The installer is unsigned. Large-collection performance and crash/power-loss restoration behavior are not certified; see README for operational limits.

This remains a release candidate pending the owner's manual verification of the corrected workflows. No `v1.0.0` tag was created or moved.
