# V2 Milestone 1 verification — 2026-10-08

Branch `v2`, application 2.0.0-alpha.1, schema 2. This is an unreleased foundation, not V2 product acceptance. The historical V1 report below remains evidence for the immutable V1 tag only.

## Foundation checks

- TypeScript, ESLint and 23 frontend tests pass (16 existing domain regressions + 7 foundation tests).
- 24 native tests pass: 21 integrity/path tests, 2 V1 migration/ZIP integration tests and 1 migration rollback unit test. Rustfmt and all-target locked Cargo check pass.
- Frozen V1 SQL and synthetic fixture preserve every value in 18 domain tables. No Work table, reset or inferred relationship was introduced. Upgrade safety snapshots and V1 ZIP staged migration passed.
- Windows production frontend/Tauri/NSIS build passes. Final installer: `src-tauri/target/release/bundle/nsis/MyLibrary_2.0.0-alpha.1_x64-setup.exe`. Unsigned; no production updater configured. Vite reports a non-fatal ~511 kB chunk-size advisory; code splitting remains future performance work.
- The actual Tauri/WebView2 executable passed 26 desktop workflow groups. The final executable passed the full repeat after the wording/accessibility fixes.
- GitHub Actions is configured for Windows x64, macOS ARM64/Intel and Linux x64. Results are pending publication of the verified milestone; see `docs/testing/v2-platform-matrix.md` for final status.

## Desktop scope and safety

The suite exercises copies/edition grouping, Finished navigation, hierarchical locations and occupied deletion, nested unsaved drafts, loans, notes, quotes, attachments, covers, CSV/JSON round trips, ZIP restore/failed restore, Trash, settings, narrow/normal layout, reduced motion and restart. New checks exercise Turkish system detection, explicit English selection, Turkish/English switching, saved preference after restart, localized formatting, inactive update status, V1 fixture startup, data-folder path and native folder-open action.

Language checks compare all snapshot domain collections, including reading status, names, notes/quotes and media references. UI language is independent of the fixture's French default book language. No runtime errors or external core WebView requests were observed in the passed run. Production data was neither opened nor modified; `.cache/desktop-check-*` holds synthetic libraries, exports, screenshots and reports only and is ignored.

Test harness uses a loopback WebView2 connection and substitutes native file-picker return paths. It does not certify OS picker interaction, install/uninstall, macOS/Linux native UI or full assistive-technology support. Open-folder action checks backend/UI success, not Explorer shell internals. RTL readiness is a source/layout baseline, not a completed Arabic localization.

## Final evidence

Final local desktop report: `.cache/desktop-check-1791481281264/report.json`, 26/26 passed, errors=[], network=[]. Synthetic artifacts remain ignored.

Installer SHA-256: `65f928fc90c135f7c2b4455629b4f94352439437e7d81edd8a1f518769dc66ea`.
Executable SHA-256: `fbd12d2586b576e2d1fa60e0cb2d96f52035afe61079e92622db4a364525097f`.

Source audit: 620 English/Turkish keys with parity, no missing literal component keys. No database, personal media, runtime/build output or credential-pattern hits in the 88 audited source files. Ignore rules also exclude portable ZIP and installer formats. V1 refs retain their original release hashes. CI results remain pending the first V2 push; no non-Windows pass is claimed.

---

# MyLibrary v1.0.0 release verification — 2026-10-08

Verified on Windows x64 using the actual Tauri release executable and its Rust/SQLite backend. Production application data was neither opened nor modified. Every desktop run used a fresh repository-local test library and WebView2 profile.

## Checks

| Command                                                                            | Result                                                         |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run typecheck`                                                                | Passed                                                         |
| `npm run lint`                                                                     | Passed                                                         |
| `npm run test`                                                                     | 16 frontend tests passed                                       |
| `npm run test:rust`                                                                | 20 native integrity tests passed; unit/doc-test targets passed |
| `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2` | Passed                                                         |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check`                           | Passed                                                         |
| `npm run build`                                                                    | Passed; also run by the final Tauri build                      |
| `npm run desktop:build`                                                            | Passed; Windows x64 executable and NSIS installer produced     |
| `npm run test:desktop`                                                             | All 24 workflow groups passed on the final executable          |
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

Final local report and screenshots: `.cache/desktop-check-1791445174425/`. The report recorded zero frontend runtime errors and zero external WebView requests during core workflows. Test artifacts are ignored by Git.

The clean-library desktop test initially exposed CSV exports containing local location IDs. Exports now use portable name paths; the regression test and final real desktop round trip pass. Native tests also verify malformed manifests, unsupported schemas, unsafe archives and missing assets are rejected without changing the current library. A snapshot copy of an existing v1 database remains editable with stable records; no schema migration or reset was needed.

## Location discoverability acceptance

The previous release exposed Locations under Explore at full width, but narrow/collapsed navigation hid its text and the Copy Editor could not create missing locations. Locations now has a top-level sidebar entry. The redesign removes the duplicate top-bar and Dashboard shortcuts; navigation labels remain visible at narrow widths unless explicitly collapsed. Add Room, Add Bookcase and Add Shelf remain visible; the latter two enable when the appropriate parent is selected. The hierarchy shows indented branches and explicit types, with Rename and safe Remove actions.

Verified click path from the actual release dashboard:

1. **Locations** in the left sidebar → **Add Room** → name **Study** → **Save**.
2. Select **Study** → **Add Bookcase** → name **Bookcase 1** → **Save**.
3. Select **Bookcase 1** → **Add Shelf** → name **Shelf 1** → **Save**.
4. **Library** → open the book → **Copies** → **Edit** or **Add Copy** → **Location** → choose **Study → Bookcase 1 → Shelf 1** → **Save physical copy**.

Desktop checks also covered renaming all three levels, moving a copy, blocking occupied deletion at all three levels, and blocking deletion of a shelf referenced only by an archived copy. In a second empty verification library, Add Room/Bookcase/Shelf inside the Copy Editor preserved an unsaved inventory code, kept the editor open and refreshed the location choices after each save. The assignment survived restart and the copy could be opened from its shelf in Locations.

An additional defect was reproduced and fixed: Escape from a nested location dialog propagated to the underlying copy dialog. The modal now stops that propagation; the regression check confirms Escape closes only the nested dialog without prompting to discard the copy draft.

The actual WebView2 UI was also checked at a 900×620 viewport through CDP layout emulation with the sidebar collapsed. The sidebar Locations entry and Add Room action remained visible and usable; the pane can be explicitly expanded to reveal labels. Screenshots include `dashboard-navigation.png`, `locations-empty.png`, `locations-hierarchy.png`, `copy-location-assignment.png` and `inline-location-creation.png` in the final report directory above. Native OS window resizing itself was not automated.

## Desktop UI/UX redesign verification

Inspected the previous release in the actual Windows app before changing source, then reviewed the redesigned Dashboard, Library, Locations, Book Detail, Copies, copy-location editor, Import/Export, Backup/Restore and Settings screenshots. The implementation changes presentation and navigation only; database schema, storage, imports and restore services are unchanged.

- Single sidebar navigation, explicit accessible active-page states, native title tooltips for collapsed entries and pinned Settings. No duplicate Locations destination in the top bar.
- Coherent search/Quick add/Add book app bar and content page headings. Dashboard retains all metrics but emphasizes four primary counts, current reading and recent additions; insights remain expandable.
- Calm Segoe typography, blue accent, neutral surfaces, compact copy actions, clear location hierarchy and integrated copy-location creation. Light and dark themes verified.
- Actual WebView2 layouts captured at 900×620, the normal 1380×900 viewport and 1800×1000. Narrow labels remain visible with an expanded sidebar; no document-level horizontal overflow was detected. This tests WebView layout through CDP, not native OS window resizing.
- Short hover/press, sidebar width, heading, dialog and status-surface motion. Reduced-motion emulation verified the computed heading animation is disabled. Final screenshot capture fast-forwards finite animations to show settled surfaces.
- Full regression suite passed on the release executable, including safe confirmations, unsaved drafts, nested location creation, occupied and archived location references, move/loan/return, CSV/JSON transfer, backup/restore and restart persistence. No external WebView requests or frontend runtime errors were recorded.

Visual evidence includes `design-Dashboard.png`, `dashboard-populated-dark.png`, `design-dashboard-narrow.png`, `design-dashboard-wide.png`, `design-Library.png`, `design-Locations.png`, `design-locations-narrow.png`, `design-book-detail.png`, `physical-copies.png`, `inline-location-creation.png`, data-page captures and `design-Settings.png` in the final report directory. Subjective visual approval remains with the owner; this is a Fluent-inspired Tauri interface, not native WinUI.

## Grouped Library and status navigation acceptance

Dashboard Finished now opens Library with Reading status = Finished, including its normal empty state when no copies match. Unread uses its corresponding status; existing Reading, Want to Read and Favorites shortcuts retain their filters. Counts and the reading model are unchanged.

The actual rebuilt Windows app verified one edition with two independent copies appears once in both grid and table, with a **2 copies** card label. Copies remained independently editable with separate acquisition, location and loan state. Search and combined filters retained one edition entry. A Finished filter matched one copy and displayed **2 copies · 1 matching**. Creating a separate edition with the same title produced two entries, confirmed against their distinct edition IDs. Existing copy moves, lending, archive/recovery, bulk selection, export/import, backup/restore and restart checks also passed.

Grouping occurs after copy-level filtering, using edition IDs rather than titles. Bulk selection/export retains matching physical records, and Trash remains copy-based. No migration, production-data access or copy merging was performed. The final report contains 24 passing workflow groups, with zero runtime errors or external WebView requests. `finished-edition.png` captures the active Finished filter.

## Build artifacts

- Executable: `src-tauri/target/release/mylibrary.exe`
- SHA-256: `41d1d9b327e1aa3b5f2401425ec055bd229ff597ab580a98876c91ec6a6c7885`
- Installer: `src-tauri/target/release/bundle/nsis/MyLibrary_1.0.0_x64-setup.exe`
- Installer size: 4,031,221 bytes
- Installer SHA-256: `a00ee203fcf3bbb31c9387c62a7642ebc2e65940c371c6d6dd2aff417c6077e0`

## Audit and verification boundaries

The source audit found no analytics, telemetry, remote logging or backend service. Product network code is isolated to explicitly requested Open Library metadata/cover lookup. No production database, covers, attachments, backups, credentials or runtime files are tracked. Repository-local libraries were empty or contained only named verification records. Ignore rules cover runtime directories, SQLite databases/sidecars, media directories, backups, secrets, logs, caches and generated build/schema output.

The desktop harness connects to the real application's WebView2 runtime over loopback. It supplies deterministic responses only to native file pickers; file reads/writes and database operations are real. Native file-picker interaction, NSIS install/uninstall and live Open Library responses were not exercised. The installer is unsigned. Large-collection performance and crash/power-loss restoration behavior are not certified; see README for operational limits.

The owner approved this codebase as stable MyLibrary v1.0.0 on 2026-10-08 after manual acceptance testing. All checks above were rerun for release preparation; only release documentation changed from the approved product source. The annotated v1.0.0 tag freezes this source and evidence. See docs/testing/v1.0.0-acceptance-tests.md for stable test IDs and individual coverage limits, and docs/releases/v1.0.0.md for canonical installer details. Publication and branch refs are verified after this document is committed; no V2 product changes are included.
