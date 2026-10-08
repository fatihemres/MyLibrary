# V2 Milestone 1 platform matrix

Version: 2.0.0-alpha.1. Historical v1.0.0 remains immutable.

| Target              | Build/check coverage                                     | Native desktop coverage                                  |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Windows x64         | Local full suite and NSIS; GitHub Actions result pending | Actual Tauri/WebView2 workflow suite, isolated libraries |
| macOS Apple Silicon | macos-14 CI app/DMG configured; result pending           | Not run                                                  |
| macOS Intel         | macos-15-intel CI app/DMG configured; result pending     | Not run                                                  |
| Linux x64           | ubuntu-22.04 CI deb/AppImage configured; result pending  | Not run                                                  |
| Windows ARM64       | Not configured in M1                                     | Not run                                                  |

`.github/workflows/v2-foundation.yml` runs npm ci, typecheck, lint, frontend tests, native integrity/migration tests, rustfmt, all-target Rust check and production Tauri/frontend builds. CI artifacts expire after 30 days; these prerelease artifacts are not historical GitHub Releases. No signing or updater publishing is configured. macOS/Linux support must not be claimed verified until the jobs actually pass; packaging success alone is not native UX acceptance.

Local commands: npm run typecheck; npm run lint; npm run test; npm run test:rust; cargo fmt --manifest-path src-tauri/Cargo.toml --check; cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2; npm run build; npm run desktop:build -- -- --locked; npm run test:desktop.

Use CARGO_HOME=.cache/cargo with direct Cargo commands to share the wrapper cache. Linux requires WebKitGTK 4.1, appindicator, librsvg, patchelf and FUSE packaging dependencies; macOS requires Xcode command-line tools. CI uses Node 24 and Rust stable. Windows desktop tests additionally require Python 3 to instantiate the frozen V1 SQL fixture and WebView2. They replace only picker responses, not backend operations. Install/uninstall and native picker interaction are not covered.
