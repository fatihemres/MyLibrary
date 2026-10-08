# V2 Milestone 1 platform matrix

Version: 2.0.0-alpha.1. Historical v1.0.0 remains immutable.

| Target              | Build/check coverage                                            | Native desktop coverage                                  |
| ------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Windows x64         | Local full suite and NSIS; CI not run: workflow startup failure | Actual Tauri/WebView2 workflow suite, isolated libraries |
| macOS Apple Silicon | macos-14 app/DMG configured; CI startup failure                 | Not run                                                  |
| macOS Intel         | macos-15-intel app/DMG configured; CI startup failure           | Not run                                                  |
| Linux x64           | ubuntu-22.04 deb/AppImage configured; CI startup failure        | Not run                                                  |
| Windows ARM64       | Not configured in M1                                            | Not run                                                  |

`.github/workflows/v2-foundation.yml` runs npm ci, typecheck, lint, frontend tests, native integrity/migration tests, rustfmt, all-target Rust check and production Tauri/frontend builds. CI artifacts expire after 30 days; these prerelease artifacts are not historical GitHub Releases. No signing or updater publishing is configured. macOS/Linux support must not be claimed verified until the jobs actually pass; packaging success alone is not native UX acceptance.

Local commands: npm run typecheck; npm run lint; npm run test; npm run test:rust; cargo fmt --manifest-path src-tauri/Cargo.toml --check; cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2; npm run build; npm run desktop:build -- -- --locked; npm run test:desktop.

Use CARGO_HOME=.cache/cargo with direct Cargo commands to share the wrapper cache. Linux requires WebKitGTK 4.1, appindicator, librsvg, patchelf and FUSE packaging dependencies; macOS requires Xcode command-line tools. CI uses Node 24 and Rust stable. Windows desktop tests additionally require Python 3 to instantiate the frozen V1 SQL fixture and WebView2. They replace only picker responses, not backend operations. Install/uninstall and native picker interaction are not covered.

## Actual GitHub result

The verified source commit `b2d58178534eb3cacab2e89b1ab8d35970415aec` was pushed normally to origin/v2. [Run 37818719436](https://github.com/fatihemres/MyLibrary/actions/runs/37818719436) ended immediately with `startup_failure`, before any jobs were created. GitHub returned no check-run annotations or job logs and rejected the rerun request as non-retryable. Actions is enabled; the exact workflow file exists on v2. Official actionlint 1.7.12 (checksum-verified, repository-local tool) reported no errors. The cause is unresolved; this is **not** a Windows/macOS/Linux CI pass or evidence of a target compilation failure. A documentation push provides a fresh trigger. Owner-visible GitHub validation diagnostics may be needed if it fails again. Do not modify main merely to work around this.
