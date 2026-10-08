# V2 platform boundary

Milestone 1 keeps one source tree and the existing `com.mylibrary.desktop` identifier. `lib.rs` obtains the persistent directory with Tauri's `app.path().app_data_dir()`. `MYLIBRARY_DATA_DIR` remains an explicit development override, never an automatic fallback after a database error.

`platform.rs` exposes runtime OS, architecture, package/schema versions and paths. Cache and temporary work are application-owned `cache/` and `cache/tmp/` beneath the resolved data root; backups remain `backups/`. These paths deliberately follow the library override, so verification never writes to production. They are disposable; only the database, covers and attachments are recovery assets. There is no assumption that a path begins with a drive letter.

`services/platform.ts` owns native file pickers, data-folder opening and Command/Ctrl labels/event handling. Rust uses the Tauri opener plugin to open only the configured data root, replacing explorer.exe. Arbitrary shell commands are not exposed to the WebView. The SQLite store's exclusive `File::try_lock` guard is portable; a second instance cannot use the same library.

Managed asset references remain relative forward-slash paths. `safe_file` rejects absolute paths, parent traversal, Windows separator/drive syntax and symlink ancestors. Native Path/PathBuf performs filesystem joins. ZIP members have a separate whitelist and size/duplicate/compatibility validation.

Default data roots are platform-resolved: Windows Roaming AppData, macOS Application Support, Linux XDG data (usually ~/.local/share), each with the unchanged app identifier. Settings shows the actual root; do not hard-code examples in runtime code. Core operation makes no external requests. Existing optional ISBN lookup remains explicitly requested by the user.

Packaging uses NSIS on Windows, app/DMG on macOS, deb/AppImage on Linux. CI is build verification, not signed publishing. Windows smoke automation remains Windows-specific and does not demonstrate native macOS/Linux UX.

Reference: https://v2.tauri.app/plugin/opener/ .
