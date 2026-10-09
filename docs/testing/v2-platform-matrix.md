# V2 Milestone 1 platform matrix

Version: 2.0.0-alpha.1. Milestone 1 CLOSED on 2026-10-09. Historical v1.0.0 remains immutable.

## Final verified foundation

[GitHub Actions run 37884695260, attempt 1](https://github.com/fatihemres/MyLibrary/actions/runs/37884695260/attempts/1) succeeded for commit `3856fd661943eebb93520a6783356734af6405ca`, including the official Node 24 action upgrade. All four jobs completed checkout, Node/Rust setup, npm ci, typecheck, lint, 23 frontend tests, 24 native tests (21 integrity/path + 3 migration/compatibility), rustfmt, locked all-target Cargo check, production frontend/Tauri packaging and artifact upload.

| Target              | Automated CI      | Packages uploaded      | Native desktop coverage                                                      |
| ------------------- | ----------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Windows x64         | SUCCESS           | NSIS x64 installer     | Separately verified local Windows desktop/visual workflows; 26 groups passed |
| macOS Apple Silicon | SUCCESS           | ARM64 app and DMG      | Native interactive acceptance not run                                        |
| macOS Intel         | SUCCESS           | x64 app and DMG        | Native interactive acceptance not run                                        |
| Linux x64           | SUCCESS           | amd64 deb and AppImage | Native interactive acceptance not run                                        |
| Windows ARM64       | Outside M1 matrix | None                   | Not run                                                                      |

The four non-expired final artifact archives are named `MyLibrary-<platform>-3856fd661943eebb93520a6783356734af6405ca`. Artifact presence, nonzero sizes and successful upload steps were checked through the GitHub API. CI artifacts have 30-day retention and are not permanent release assets.

## Resolved startup failures

The owner confirmed that the original startup failures were caused by a GitHub account billing lock. After that lock was resolved, [run 37821379296 attempt 2](https://github.com/fatihemres/MyLibrary/actions/runs/37821379296/attempts/2) passed with the same source/workflow. No application or workflow defect caused those original failures. The earlier unresolved-blocker notes are superseded by this evidence.

## Node runtime maintenance

The successful baseline emitted a warning that checkout@v4, setup-node@v4 and upload-artifact@v4 targeted deprecated Node 20 and were forced onto Node 24. Official stable v7 action metadata declares Node 24. Release notes were reviewed: checkout's changed fork handling concerns triggers this workflow does not use; setup-node's authentication change does not affect this unauthenticated npm install; upload-artifact's direct-file mode is opt-in and remains unused. Only the three action references were updated; matrix, commands, permissions, packages and application code are unchanged. Local actionlint and Prettier validation pass.

Verification of this maintenance update: **run 37884695260, attempt 1, SUCCESS on all four platforms**, including production bundles and artifact uploads. Final logs contain no deprecated Node 20 Actions-runtime warning. The workflow retains checkout@v7, setup-node@v7 and upload-artifact@v7; no further workflow changes are needed.

Official references: [checkout](https://github.com/actions/checkout/releases/tag/v7.0.0), [setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0), [upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.0).

## Distribution and testing boundaries

Windows distribution signing is not configured. macOS packages are unsigned for distribution and not notarized. Updater configuration remains disabled with no signed distribution endpoint. No signing credentials, user data or production database are included in CI artifacts. No Milestone 2 work has started.

Windows manual/visual and actual Tauri/WebView2 workflow evidence remains separate from automated matrix verification. Picker return paths are substituted by the Windows harness; OS picker interaction, install/uninstall and full assistive-technology certification are not covered. Passing macOS/Linux build/tests does not claim their interactive native UX has been manually accepted.

## Reproduction

`.github/workflows/v2-foundation.yml` runs the checks above on Windows, macOS ARM64/Intel and Linux x64 using Node 24 and Rust stable. Linux installs WebKitGTK 4.1, appindicator, librsvg, patchelf and FUSE packaging prerequisites; macOS uses Xcode command-line tools.

Local commands: npm run typecheck; npm run lint; npm run test; npm run test:rust; cargo fmt --manifest-path src-tauri/Cargo.toml --check; cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2; npm run build; npm run desktop:build -- -- --locked; npm run test:desktop. Use CARGO_HOME=.cache/cargo for direct Cargo commands. Windows desktop checks additionally use Python 3 and WebView2 to open the frozen synthetic V1 fixture. Production data is untouched.
