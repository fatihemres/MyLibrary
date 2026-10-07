# Windows release-candidate verification — 2026-10-07

Verified on Windows x64 using the actual Tauri release executable and its Rust/SQLite backend. Production application data was neither opened nor modified. Every desktop run used a fresh repository-local test library and WebView2 profile.

## Checks

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test` | 10 frontend tests passed |
| `npm run test:rust` | 15 native integrity tests passed; unit/doc-test targets passed |
| `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2` | Passed |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | Passed |
| `npm run build` | Passed; also run by the final Tauri build |
| `npm run desktop:build` | Passed; Windows x64 executable and NSIS installer produced |
| `npm run test:desktop` | All 18 workflow groups passed on the final executable |
| `git diff --check` | Passed |

Rust commands used `CARGO_HOME=.cache/cargo` and repository-local temporary directories. The MSVC linker emitted an informational import-library creation message; there were no compilation or test failures in the final runs.

## Desktop coverage

- Empty startup; hierarchical locations and custom-field creation.
- Quick Add, managed cover upload, full editor, Ctrl+S and persistent editing.
- Reading progress, notes, quotes, reading sessions, lending and preserved return history.
- Managed attachment upload/export with byte-for-byte verification.
- Author editing, series/location browsing and independent physical copies.
- Grid/table views, search, combined filters, sorting, bulk tags and context menus.
- CSV/JSON export, CSV field mapping, invalid-row preview and confirmed import.
- Confirmation initially focuses Cancel; Enter and Escape cancel safely. Cancelling deletion leaves all copies intact. Cancelling native window close preserves the draft. Explicit acceptance closes the actual window and leaves saved records intact after restart.
- ZIP backup, reversible Trash, recovery, validated restore and automatic pre-restore safety archive.
- Settings, dark appearance, database integrity, placeholder-cover wrapping and restart persistence of books, covers, entries, loans, attachments and preferences.

Final local report and screenshots: `.cache/desktop-check-1791359291082/`. The report recorded zero frontend runtime errors and zero external WebView requests during core workflows. Test artifacts are ignored by Git.

## Artifacts

- Executable: `src-tauri/target/release/mylibrary.exe`
- SHA-256: `ba34d977144e70a6981f32df970a0765ef3eb91d0c2f4099f000baadb076a00b`
- Installer: `src-tauri/target/release/bundle/nsis/MyLibrary_1.0.0_x64-setup.exe`
- Installer size: 4,010,979 bytes
- Installer SHA-256: `8a9b159687f0f9b59050666fc945deed94b7d0e32fe4db1814c16f8cd5a02e79`

## Audit and verification boundaries

The source audit found no analytics, telemetry, remote logging or backend service. Product network code is isolated to explicitly requested Open Library metadata/cover lookup. No production database, covers, attachments, backups, credentials or runtime files are tracked. Repository-local libraries were empty or contained only named verification records. Ignore rules cover runtime directories, SQLite databases/sidecars, media directories, backups, secrets, logs, caches and generated build/schema output.

The desktop harness connects to the real application's WebView2 runtime over loopback. It supplies deterministic responses only to native file pickers; file reads/writes and database operations are real. Native file-picker interaction, NSIS install/uninstall and live Open Library responses were not exercised. The installer is unsigned. Large-collection performance and crash/power-loss restoration behavior are not certified; see README for operational limits.
