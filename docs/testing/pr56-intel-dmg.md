# PR #56 Intel DMG investigation

Status: **ROOT CAUSE NOT YET VERIFIED**. The 6 November 2026 PO instruction authorizes
scoped diagnostics and repair on the existing feature branch, not product changes or integration.

## Compared evidence

| Job                                                                                                           | Result | Checkout                                   | DMG script boundary (UTC)             |
| ------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------ | ------------------------------------- |
| [Attempt 1](https://github.com/fatihemres/MyLibrary/actions/runs/42269531474/job/128070169312)                | FAIL   | `7bc15c2d4d6d36a1ce21a135b6694370f102b524` | 18:43:16.630 → 18:43:45.760 (29.13 s) |
| [Attempt 2](https://github.com/fatihemres/MyLibrary/actions/runs/42269531474/job/128083767547)                | FAIL   | same                                       | 19:11:45.576 → 19:12:13.121 (27.54 s) |
| [Last successful v2 Intel](https://github.com/fatihemres/MyLibrary/actions/runs/42254408922/job/128017656165) | PASS   | `f54472b962505ded0c27f4e2d837aaf10e93d56a` | 17:04:16.282 → 17:04:46.144 (29.86 s) |

Both failures report `failed to bundle project: error running bundle_dmg.sh` after
successful tests/release compilation and `.app` bundling. The parent exits 1; child exit
status, hdiutil stderr, mount/detach and Finder/AppleScript diagnostics are absent.
Similar elapsed times, including the successful build, do not establish a timeout cause.

All three jobs use `macos-15-intel`, macOS 15.7.9 / 24G830, runner image
`20260824.0482.1`, provisioner `20260819.586`, x86_64 Rust target,
Node 24.19.0 / npm 11.17.0 and Rust 1.99.1. Locked npm CLI/native Darwin x64
package is 2.12.1; app Tauri crate is 2.12.1. The embedded bundler's exact version
is not separately printed by these logs and is not the app Cargo.lock's dependency.
No image/version change is demonstrated. Different ephemeral runner instances were used.

The failing test-merge has tree `c49e9127f3329dd09b2c1a88f1c28ccc91a32213`, identical
to candidate `7da6c5ec96480d7028b8ec03cc5b63b7d570213f`; base tree is
`d7679dd063f0e9b318ed90340785b4607ade8fae`. Workflow, package/Cargo locks, icons,
tauri.conf.json and desktop launcher have no candidate-vs-base difference.
Command is `npm run desktop:build -- --bundles app,dmg -- --locked` in all three.
No signing/notarization configuration or declared secret environment change is present.
This rules out those source changes; it does not prove application size/resource effects
or unreported host state irrelevant. Categories A–E remain unverified.

## Minimal next observation

The installed CLI's `build --help` explicitly supports `--verbose` for detailed logging.
Enable it only in the Intel packaging step, without changing runner, app/dmg requirements,
locks, signing or test/security gates. Print only allowlisted platform/tool versions.
Do not dump environment variables or enable shell tracing. GitHub masks registered secrets;
the output stream additionally replaces workspace and runner-home prefixes. Bash pipefail
preserves failure through the path-redaction filter. Other platform commands remain identical.
No retry, delay, mount workaround, dependency upgrade or alternate artifact is introduced.

Full original logs are retained locally under ignored `.cache/pr56-dmg/`; canonical evidence
remains the three job links above. Windows can verify CLI option/workflow structure, not DMG
creation. A green diagnostic run alone will not prove the original root cause fixed.
