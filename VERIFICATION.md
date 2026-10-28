# M3-A/M3-B archival verification and additional historical remote cleanup — 2026-10-28

**PO-provided local preflight and archive:** `C:\Dev\ML-M3A` (original `0afab459...`) and `C:\Dev\ML-M3B` (original `0b0ce136...`) were reported Git-clean in tracked/untracked files, with ignored `.cache` historical test/benchmark/UX records and generated build artifacts. A non-destructive PowerShell archiver copied 13 M3-A and 26 M3-B selected evidence entries (323,499,333 bytes excluding Git bundles) and created two complete original-branch Git bundles under `C:\Dev\MyLibrary-Evidence-Archives\M3AB-Historical-20261028-163151`. A separate read-only verification run reported **3,503 SHA-256 files PASS**, **M3A bundle PASS**, **M3B bundle PASS**, `ARCHIVE VERIFICATION PASS`, and no local deletions. These results are taken from user-provided Windows output; this assistant did not directly read the archived file bytes or rerun their hashes. Excluded `cargo`, `npm` and `tmp` contents remain on disk.

**Separate PO-authorized remote-ref cleanup:** After archiving, Windows `git push` output showed exact-SHA lease guarded deletion of original `codex/m3a-search-foundation` (PR #20), `codex/m3b-real-wishlist` (PR #22), and `docs/issue-review-governance-20261026` (PR #39). Live GitHub recheck verified their absence and exactly **5 surviving remote branches**, including new Draft PR #46's docs branch; protected `main`, `v1-maintenance`, `v2` and old closed-unmerged PR #16's branch were retained. Across both cleanup phases **10 earlier remote refs were deleted** from the pre-cleanup set of 14. The 5th surviving ref was newly created for PR #46; this does not imply an arithmetic discrepancy.

**No silent integration or worktree deletion:** Original #20/#22/#39 PRs remain closed unmerged; feature/governance successors #41/#42/#43 were integrated independently on `v2`. Two original-branch Git bundles have PO-reported verification; remote deletion does not delete the local M3-A/M3-B worktrees, their ignored caches, or any other worktree, especially unrelated Codex-owned directories. M2 milestone and Issue #31 remain OPEN, and nothing here authorizes a release, tag, or subsequent cleanup.

---

# PR #45 exact-SHA integration, final push CI and remote-cleanup evidence — 2026-10-28

**GitHub-observed integration:** [PR #45](https://github.com/fatihemres/MyLibrary/pull/45) is MERGED/CLOSED. Canonical `v2` and PR `merge_commit_sha` are `19affab7743ab0d96faf1195d02f6936cf3c9833`, direct fast-forward from `42f963e450186d81da3922a209eaffae11e843c6`. The parent chain is linear and the PR is **11 Markdown files**, without app code, schema, workflow or license changes.

| Evidence trigger on exact `19affab...` | Workflow | Result |
| --- | --- | --- |
| PR candidate | [V2 Foundation #40671321982](https://github.com/fatihemres/MyLibrary/actions/runs/40671321982) | **4/4 SUCCESS**, Windows, Linux, macOS Intel and Apple Silicon |
| PR candidate | [CodeQL #40671321994](https://github.com/fatihemres/MyLibrary/actions/runs/40671321994) | **3/3 SUCCESS**, JS/TS, Rust, Actions |
| Final `push` after integration | [V2 Foundation #40674452979](https://github.com/fatihemres/MyLibrary/actions/runs/40674452979) | **4/4 SUCCESS**, all four platforms |
| Final `push` after integration | [CodeQL #40674453015](https://github.com/fatihemres/MyLibrary/actions/runs/40674453015) | **3/3 SUCCESS**, all three analyses |

**Review provenance:** PO-supplied independent Antigravity read-only report classified PR #45 **PASS WITH FINDINGS**: one Medium for outdated top-level PR description, corrected before integration without a Git commit, and one informational CI dependency that cleared when the exact-head checks completed. This is an external agent report, **not** an eligible GitHub user's submitted `Approve`. All actual CI classifications above are separately GitHub-verified; CI does not establish real device/GUI acceptance.

**Remote cleanup evidence:** PO-shared Windows terminal output reported seven successful exact-SHA guarded remote-ref deletions. Separate GitHub branch listings confirmed 14 remote branches before cleanup and **7 after**, before this documentation branch existed: protected `main`, `v1-maintenance`, `v2`, plus closed/unmerged historical candidates [#20](https://github.com/fatihemres/MyLibrary/pull/20), [#22](https://github.com/fatihemres/MyLibrary/pull/22), [#39](https://github.com/fatihemres/MyLibrary/pull/39), [#16](https://github.com/fatihemres/MyLibrary/pull/16). No local worktree or folder deletion is claimed. Any later new documentation branch/PR changes live branch count and must be interpreted separately.

**Superseded source and local-state limits:** Original M3-A/M3-B branches are **not ancestors of `v2`**. GitHub tree/blob comparison against merged successors #41/#42 found only the already-integrated scanner focus source and native smoke-test differences; no unreviewed code transfer is authorized. PO terminal evidence showed `ML-M2E` clean with ignored test caches, `ML-M2F` dirty with two historically integrated source/test corrections and ignored test caches, and separate M3-A/M3-B worktrees still registered. Local ignored contents and other agent worktrees have **not** been certified disposable. No production/personal library data was accessed, no Windows filesystem cleanup was executed, and no new local test suite was run during this GitHub review.

**PO decision boundaries:** M2 and [#31](https://github.com/fatihemres/MyLibrary/issues/31) remain OPEN; [#26](https://github.com/fatihemres/MyLibrary/issues/26), [#21](https://github.com/fatihemres/MyLibrary/issues/21), [#29](https://github.com/fatihemres/MyLibrary/issues/29) and [#30](https://github.com/fatihemres/MyLibrary/issues/30) retain their existing independent dispositions. No milestone acceptance, release or separate cleanup action follows from this evidence.

---

# M2 milestone closeout evidence and physical Scan-to-Lookup acceptance — 2026-10-28 (OPEN)

**Purpose and source boundary.** This is a 28 October evidence addendum, **not** a declaration that M2 or Issue #31 is CLOSED. The PO provided an independent Antigravity M2 audit Revision 2 (read-only source review and GitHub evidence assessment) reporting **PASS WITH FINDINGS**, zero Critical/High findings and the 39-criterion reviewer classification **33 VERIFIED / 5 PARTIALLY VERIFIED / 1 ACCEPTED DEFERMENT** (camera optimization D-014). It was **not** a GitHub PR Review/Approve, newly executed desktop test suite, or an explicit decision to close M2. The partial classifications were assigned before the new physical-device observations and are not silently rewritten.

**Canonical source / automated CI:** GitHub `v2` at `42f963e450186d81da3922a209eaffae11e843c6`; [Foundation push #40651855231](https://github.com/fatihemres/MyLibrary/actions/runs/40651855231) 4/4 SUCCESS and [CodeQL push #40651857486](https://github.com/fatihemres/MyLibrary/actions/runs/40651857486) 3/3 SUCCESS. These are remote automated checks, **not** device or manual GUI results.

**Local Windows candidate provenance (PO-provided terminal output):** `C:\Dev\MyLibrary` `v2` was first behind at `3d63d441...`; a checked scoped `Sync` performed a fast-forward to `42f963e...` and subsequent Audit reported `Source status: CLEAN` / `AUDIT PASS`. The PO ran a fresh `npm run desktop:build -- --no-bundle` through the approved local verification launcher; terminal reported `BUILD PASS` and the release EXE at `C:\Dev\MyLibrary\src-tauri\target\release\mylibrary.exe` with SHA-256 `DA38FCF47BD49DAD72F406CF2D0BE9F5A0D05A5B525E0C95EE282BA1ED48C85E`. Launcher configuration separates synthetic data under `.cache/m2f-physical-acceptance` and a distinct WebView2 user-data profile. The PO reported successful subsequent launch, but no `LAUNCH PASS` terminal log or runtime environment inspection was supplied; do **not** upgrade configuration and PO reporting to direct independent process observation. No real personal library test was requested.

| ID | Expected new M2-F transition | Observed evidence / classification |
| --- | --- | --- |
| **M2F-PHY-01** | Explicit `Scan and look up book details` + Single, **physical USB HID** ISBN capture opens automatic metadata/editor preview; user may cancel without implicit Save | **PO-reported PASS, Windows 2026-10-28.** PO answered “çalışıyor kanka sorun yok” after receiving full bounded USB acceptance steps. This confirms overall reported success of the scenario, but the PO did **not** supply item-by-item screenshots, network trace or independent DB-state verification. |
| **M2F-PHY-02** | Same opt-in single scan using a **physical camera** opens metadata/editor preview after scan; no implicit persistence | **PO-reported PASS, Windows 2026-10-28.** PO answered “tamam test 2'de tamamlandı.” Windows 10 default camera selection initially favored Iriun; there is no in-app `deviceId` chooser. Which final camera device was active, actual `MediaStreamTrack` teardown and separate database state were **not independently measured or itemized**. |

**Earlier, distinct Windows evidence:** [M2-F acceptance Issue #24](https://github.com/fatihemres/MyLibrary/issues/24) records M2F-PO-01 default ISBN-only queued without automatic preview; M2F-PO-02 manual ISBN + Enter opt-in automatic preview followed by Cancel/no book; M2F-PO-03 Apply changed an unsaved draft, with Cancel/no Save leaving no book. This is **not** new physical USB/camera evidence and the issue was CLOSED before the 28 October physical handoff tests. A 26 October agent-reproduced single Save focus defect was fixed in integrated [PR #19](https://github.com/fatihemres/MyLibrary/pull/19); agent-run synthetic focus 4/4 and desktop 40/40 were earlier attributed results, not rerun by this assistant. Original 22 October physical scanner/camera recognition reports were on a prior local candidate.

**Product and governance boundaries:** The Windows hardware-to-preview handoff evidence gap was narrowed by PO reports; no assertion of full manual keyboard-only focus, device release instrumentation, live provider success, native macOS/Linux desktop acceptance, network isolation measurement or entire M2 milestone PO closure follows. Google Books quota/availability [#29](https://github.com/fatihemres/MyLibrary/issues/29) and shared/multi-volume ISBN guidance [#30](https://github.com/fatihemres/MyLibrary/issues/30) remain tracked rather than auto-accepted or implemented. [Issue #31](https://github.com/fatihemres/MyLibrary/issues/31) stays OPEN; [Draft PR #45](https://github.com/fatihemres/MyLibrary/pull/45) is a separate unmerged docs candidate requiring independent review, own-SHA CI and explicit fast-forward integration permission. No code, release, signing, updater, protected ref or personal-library changes are implied.

---

# Issue #40 — macOS runner exact-SHA integration verification (2026-10-28)

**Kanonik `v2` SHA:** `42f963e450186d81da3922a209eaffae11e843c6`. Separately PO-authorized [PR #44](https://github.com/fatihemres/MyLibrary/pull/44) merged via exact-SHA fast-forward from previous `3d63d441eefcf6d332ea72182a6a23c2233a6daa` with `force=false`; no merge commit, squash or rebase. Other protected V1 refs unchanged. Single changed workflow line: Apple Silicon `macos-14` → ARM64 `macos-15`; other matrices and app/release unchanged. [Issue #40](https://github.com/fatihemres/MyLibrary/issues/40) **CLOSED** only after final push checks.

**PR-triggered candidate CI on exact head:** [Foundation #40645844495](https://github.com/fatihemres/MyLibrary/actions/runs/40645844495) 4/4 SUCCESS and [CodeQL #40645844491](https://github.com/fatihemres/MyLibrary/actions/runs/40645844491) 3/3 SUCCESS. **Independent attributed Antigravity report:** PASS, no findings; **not** a submitted GitHub Approve. Artifact SHA `4cfea291...` is GitHub's temporary PR testing merge commit, with parents `3d63...` and `42f963...`; not a canonical merge.

**Separate final `push` event after integration, exact `v2` SHA:**

| Run | Verified jobs | Conclusion |
| --- | --- | --- |
| [V2 Foundation #40651855231](https://github.com/fatihemres/MyLibrary/actions/runs/40651855231) | Windows x64, Linux x64, macOS Apple Silicon, macOS Intel | **4/4 SUCCESS** |
| [CodeQL #40651857486](https://github.com/fatihemres/MyLibrary/actions/runs/40651857486) | JS/TS, Rust, Actions | **3/3 SUCCESS** |

**Evidence limits:** CI package builds are not macOS/Linux native GUI/hardware acceptance. No new local Windows PO acceptance, personal-library test, signing or release was performed for this runner-only change. [M2 closeout Issue #31](https://github.com/fatihemres/MyLibrary/issues/31) and [M3-B acceptance Issue #26](https://github.com/fatihemres/MyLibrary/issues/26) have separate evidence audits and remain OPEN pending PO decisions. Earlier sections below are historical records.

---

# M3-B final canonical push validation — 2026-10-27 (COMPLETED)

**Live GitHub ref check:** `v2` HEAD `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa`; [PR #42](https://github.com/fatihemres/MyLibrary/pull/42) reports MERGED/CLOSED and identical `merge_commit_sha`. No merge commit/squash/rebase/force. **Push-triggered** (not PR-triggered) [V2 Foundation #40498417989](https://github.com/fatihemres/MyLibrary/actions/runs/40498417989) **COMPLETED / SUCCESS 4/4** for Windows x64, Linux x64, macOS Intel, macOS Apple Silicon, and [CodeQL #40498418115](https://github.com/fatihemres/MyLibrary/actions/runs/40498418115) **COMPLETED / SUCCESS 3/3** for JS/TS, Rust, Actions. All seven individual jobs were verified successful. Prior #42 candidate PR CI was separately 7/7 PASS at the same SHA. Only after this final push verification was old stacked [PR #22](https://github.com/fatihemres/MyLibrary/pull/22) explicitly closed as **UNMERGED / SUPERSEDED**; that original PR was not the feature integration. The review attribution, historical PO 38/38 and 6/6, visual 4/6 and other limitations are in the dated section below. Packaging is not real native acceptance on those platforms. M2 milestone is still OPEN; no release or cleanup of unrelated worktrees.

---

# M3-B PR #42 exact-SHA integration verification — 2026-10-27

**Source distinction:** This section records GitHub-observed refs/workflow results, independently *attributed* Antigravity review, historical local agent tests, and actual PO Windows acceptance separately. It does **not** claim new native tests on the new #42 SHA, GitHub-submitted Approve or macOS/Linux real desktop acceptance.

- **Canonical integration:** [PR #42](https://github.com/fatihemres/MyLibrary/pull/42) MERGED/CLOSED with merge SHA and `v2` HEAD both `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa`, linear 2-commit FF after M3-A `ec742660f9c2e2bb33df9f4434b8dcf9efd0fab8`. 39 scoped files versus base. Original stacked PR #22 was not merged.
- **PR-triggered CI exact SHA:** [V2 Foundation #40482774114](https://github.com/fatihemres/MyLibrary/actions/runs/40482774114) Windows x64, Linux x64, macOS Intel, macOS Apple Silicon **4/4 SUCCESS**; [CodeQL #40482773994](https://github.com/fatihemres/MyLibrary/actions/runs/40482773994) JS/TS, Rust, Actions **3/3 SUCCESS**.
- **Canonical `v2` push-triggered CI:** [CodeQL #40498418115](https://github.com/fatihemres/MyLibrary/actions/runs/40498418115) **3/3 SUCCESS**; [V2 Foundation #40498417989](https://github.com/fatihemres/MyLibrary/actions/runs/40498417989) **IN PROGRESS as of this checkpoint**, with Windows x64, Linux x64, macOS Apple Silicon already successful and macOS Intel still running. Follow the link for the outcome; 4/4 completion must be separately verified before closing superseded PR #22.
- **Independent review (user-supplied Antigravity report, 27 Oct):** exact SHA `889ae3e...`, PASS WITH FINDINGS, 0 Critical/High/Medium and 4 LOW. Reviewer independently checked 38/39 file blob identity with corrected reviewed M3-B `0b0ce13...`, byte-identical `ScanBooks.tsx` with integrated M2-F, one added 4-scenario focus regression block in `desktop-smoke.mjs`, migrations/SQLite/WAL/backup/restore, ownership, HTTPS retailer URL/native opener, wishlist privacy/export/import guards and keyboard focus. No comprehensive native suites rerun on #42, no submitted GitHub Approve. Four LOWs as listed by the final reviewer: large Wishlist retrieval without pagination, unmeasured ignored migration benchmark, Vite bundle advisory, and offline currency-table maintenance; separately preserve prior #28 performance hypotheses without claiming measured latency.
- **PO Windows observations (earlier isolated candidate):** functional Wishlist **38/38 PASS**, narrow-gallery **6/6 PASS**. Final appearance **4/6 checked**, two cosmetic hover/outline criteria deferred by explicit PO direction to [#27](https://github.com/fatihemres/MyLibrary/issues/27); never label this as 6/6. Independent review must still distinguish genuine inaccessible controls from non-blocking cosmetics. Physical Windows DPI 125%/150%, external retailer-site reachability and macOS/Linux native GUI acceptance are unverified.
- **Historical native/automated results:** earlier local candidate frontend 336 PASS, Rust 107 PASS, native desktop 45/45 and supplemental focus/layout evidence were Codex-reported and selectively independently rerun/inspected; do not represent these as new tests executed on #42. Data fixtures were synthetic and isolated with a separate WebView2 profile; never use the real personal library. See [#26](https://github.com/fatihemres/MyLibrary/issues/26).
- **Related integrations:** [#19 M2-F](https://github.com/fatihemres/MyLibrary/pull/19) at `6b62eb8c9dbc87df351e4d1a4b87f3ca3b7e6eaf` and [#41 M3-A](https://github.com/fatihemres/MyLibrary/pull/41) at `ec742660f9c2e2bb33df9f4434b8dcf9efd0fab8` merged with separate prior CI and PO acceptance; read their original PR/Issue evidence. These successes are not tests rerun on #42.

---

# M3-B local implementation verification — 2026-10-25

Local uncommitted candidate on `codex/m3b-real-wishlist`, based on exact M3-A commit
`0afab459cf050f82c4479b1a387f643b0b910069`. These are Codex-run synthetic Windows checks,
not independent review, GitHub CI or physical Windows PO acceptance. M2 remains OPEN.

| Command | Observed result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0, no lint warnings |
| `npm run test` | PASS, 333/333, exit 0 |
| `npm run test:rust` | PASS, 106 tests; one opt-in synthetic performance benchmark ignored; exit 0 |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | PASS, exit 0 |
| `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked --jobs 2` | PASS, exit 0 |
| `npm run build` (native build's beforeBuildCommand) | PASS, exit 0; large-chunk advisory remains |
| `npm run desktop:build -- --no-bundle` | PASS, exit 0; local executable only |
| `node scripts/test-m3b-components.mjs` | PASS, 8/8 |
| `node scripts/test-m3a-components.mjs` | PASS, 4/4 |
| `node scripts/test-m2f-components.mjs` | PASS, 8/8 |
| `npm run test:desktop` | PASS, 44/44, exit 0 |

Frontend adds 18 Wishlist tests. Rust adds 12 Wishlist tests plus a V3 archive regression.
Existing ownership select tests still iterate every historical value, verify EN/TR display and
unchanged save payloads, and additionally assert that Wishlist is absent for non-legacy records.
Backend tests preserve imported/edited/omitted legacy ownership and round-trip it with a linked
Wishlist, managed cover, retailers and history. Coverage was not removed to obtain a pass.

Migration/restore checks cover populated V1/V2/V3 upgrades, committed WAL snapshots, original
IDs/domain values/media, no V3 Copy-FTS rebuild, V4 rollback, V1–V4 archives, trusted schema checks,
malformed Wishlist values/history/index rejection before live replacement, and idempotent reopen.
Budgets test distinct currencies, a total exceeding SQLite's signed-64-bit range, excluded
cancelled/archived items and one-target-per-item semantics. No new performance threshold is claimed.

Final ignored local evidence:

- `.cache/m3b-verification/` contains command logs, exit-code records and review checks.
- `.cache/m3b-verification/rust-complete.log`: 106 PASS; historical interrupted/earlier runs retained.
- `.cache/m3b-browser-1792940298272/report.json`: M3-B 8/8.
- `.cache/m3a-browser-1792939903507/report.json`: M3-A 4/4.
- `.cache/desktop-check-1792940511723/report.json`: final native 44/44, with synthetic screenshots.
- Final executable SHA-256: `46F47EF21C112E7D18E09A62B5B7DBA2D2BD18A7B84203A276B7FEB08C4E800C`.
- Windows toolchain: Node v24.21.0, Rust 1.98.1. EN/TR parity: 869 keys.

The first extended native run (`.cache/desktop-check-1792940064125/report.json`) passed 43 checks
and failed locating the Wishlist status selector. Explicit accessible names and dialog-scoped
assertions fixed it; the rebuilt full run passed. Focused browser iterations also caught preview
label ambiguity and a premature post-Save list assertion. Failed evidence is retained.

All desktop data and WebView2 profiles were isolated synthetic directories. The test-only native
rejection proxy remained active: exactly two deliberate provider bypass probes were blocked and
no fixture leaked into native HTTP. Final report has zero frontend errors/unexpected network calls.
Browser control pages independently identified three blocked Kaspersky script injections; those
are reported separately from application requests. No antivirus detection, exclusion or disabling
was performed/reported by these commands. Deterministic metadata fixtures do not establish live
Google Books availability.

NOT RUN: new GitHub CI, physical USB/camera or real Windows PO acceptance, macOS/Linux native
manual acceptance, and the opt-in migration performance benchmark. Large Wishlist performance,
offline currency-table maintenance, independent data-integrity/security review and later PO
acceptance remain review boundaries. No commit, push, PR or integration is authorized.

---

# M3-A stacked draft preparation — 2026-10-24

M3-A is stacked on M2-F [PR #19](https://github.com/fatihemres/MyLibrary/pull/19), parent
`4ca8bf7811751fbb4345db817c307aab509e43b6`. The PO authorized commit, push and a DRAFT PR
against `codex/m2f-scan-lookup`; independent review and physical Windows PO acceptance are
pending. M2 remains OPEN; no integration or milestone closure is authorized.

**Codex-run local verification, not independent PO acceptance or GitHub CI:**

- `npm run test`: 315/315; `npm run test:rust`: 92/92.
- `node scripts/test-m3a-components.mjs`: 4/4;
  `node scripts/test-m2f-components.mjs`: 8/8.
- `npm run test:desktop`: 41/41 with fresh synthetic libraries, isolated WebView2 profile,
  deterministic provider fixtures and the native rejection guard. Zero frontend errors and
  unexpected external requests; exactly two deliberate native guard self-test requests blocked.
- `npm run typecheck`, `npm run lint`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`,
  `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked`, `npm run build` and
  `npm run desktop:build -- --no-bundle`: PASS, exit 0. EN/TR parity: 770 keys.
- Migration/restore tests cover populated V1/V2 upgrades, committed WAL preservation, safety
  snapshots, unchanged domain values/IDs/media references, rollback, idempotent reopen,
  current and V1/V2 archives, trusted restore schemas and future-version rejection.
- Executable SHA-256: `A8AFF15ED8617E9A315B1995C8585C7C9DD406761582D47C7AA1B4DC728D9311`.
  Local ignored evidence: `.cache/m3a-verification/summary.json`,
  `.cache/m3a-verification/rust-tests-final.log`,
  `.cache/desktop-check-1792822847454/report.json` and
  `.cache/m3a-browser-1792822694644/report.json`. Reports/binaries are not committed.
- Kaspersky script injection was independently observed on a script-free control page using
  parser initiators and timing; three requests remained blocked. Only that exact independently
  observed script is attributed separately. Unexpected application requests still fail the test.
  This was not a quarantine detection, antivirus exclusion or networking permission change.
- Commit preflight revalidated all 17 candidate file hashes and the executable/report identity.
  Only scoped documentation changed afterward; native builds and test suites were not needlessly
  rerun. Documentation links, localization parity and Git whitespace/staging checks were repeated.

Large-library reindex performance is unbenchmarked. Real USB/camera and Windows PO acceptance,
macOS/Linux native manual acceptance and independent migration review remain outstanding.
The V2 foundation and CodeQL workflows filter PRs to `v2`; this stacked base does not automatically
run their seven jobs. Absent checks are NOT RUN, not PASS. No workflow changes or dispatch are authorized.

---

# M2-F draft checkpoint — 2026-10-23

M2-F is a local candidate based on `441d5481ae21525c42207060cc3d8dd2b9ff97d8`.
The PO authorized commit, feature-branch push and a DRAFT PR, while deferring physical Windows
USB/camera acceptance. This is not final PO acceptance, integration or M2 closure; M2 remains OPEN.
Independent review and separate PO integration authorization are still required.

- **Earlier Codex-run local automation:** `npm run test` 302 PASS; `npm run test:rust` 86 PASS;
  `node scripts/test-m2f-components.mjs` 8/8 PASS (development React StrictMode). Typecheck,
  lint, Rust formatting/all-targets check, frontend build and Windows native build passed.
  These are agent-run results, not independent PO acceptance or candidate GitHub CI.
- **Preflight correction:** native Tauri `invoke` is non-writable. The first desktop attempt's
  ineffective mock displayed live data and failed; it is not deterministic test evidence.
  Fetch-level IPC interception corrected that attempt, producing 38/38 PASS in local
  `.cache/desktop-check-1792769309474/report.json`. Preflight additionally added a test-only
  child-process rejection proxy because Tauri can fall back to native IPC on fetch failure.
- **New preflight execution:** `npm run lint` PASS; `npm run test:desktop` **39/39 PASS** with
  isolated synthetic libraries and a separate WebView2 profile. Two deliberate native provider
  calls were blocked locally to verify the guard; zero later native HTTP attempts, zero recorded
  external WebView requests and zero frontend runtime errors. Report:
  `.cache/desktop-check-1792770423563/report.json` (local ignored evidence, not a committed artifact).
- **Executable:** `2FD16D64BEBA075AA184614363DEF7D8A5639A5AF419AA12E776855657943820`
  (SHA-256). The saved report and binary match the earlier verified executable. Preflight changed
  only the test harness and documentation; application source and binary are unchanged. The expensive
  native build, Rust suite, frontend suite and component browser suite were not rerun in preflight.
- **Boundaries:** physical USB, physical camera and Windows UI PO acceptance remain pending;
  native macOS/Linux manual acceptance is not established. Synthetic provider fixtures do not prove
  Google Books availability; its known quota limitation remains separate work. No real personal library
  was accessed. No schema/provider changes, integration, release or milestone closure are authorized.

See [scanner architecture](docs/architecture/barcode-scanning.md) and
[metadata boundaries](docs/architecture/metadata-providers.md). Historical evidence follows unchanged.

---

# M2-E integrated verification — 2026-10-23

This is the **integration checkpoint**, verified against GitHub on 2026-10-23,
not a claim of Windows/macOS/Linux native manual acceptance.

- **Integrated candidate:** [PR #17](https://github.com/fatihemres/MyLibrary/pull/17),
  exact `v2` SHA `7c3430eacc47b1c5cf7996e9fbf71a4b25f636ef`; its single commit directly follows
  `11f7a767bb24d14139b489ab153b564e9e8a7d48`. GitHub reports
  `merged: true` and `merge_commit_sha=7c3430eacc47b1c5cf7996e9fbf71a4b25f636ef`.
- **Candidate PR CI (same SHA):** V2 foundation run
  [39940590129](https://github.com/fatihemres/MyLibrary/actions/runs/39940590129)
  Windows/Linux/macOS Apple Silicon/macOS Intel **4/4 PASS**; CodeQL run
  [39940590301](https://github.com/fatihemres/MyLibrary/actions/runs/39940590301)
  JavaScript-TypeScript/Rust/Actions **3/3 PASS**.
- **Final post-integration `v2` push CI (same SHA):** V2 foundation
  [39946788500](https://github.com/fatihemres/MyLibrary/actions/runs/39946788500)
  **4/4 PASS**; CodeQL
  [39946788497](https://github.com/fatihemres/MyLibrary/actions/runs/39946788497)
  **3/3 PASS**. Both workflows completed successfully.
- **Local and PO evidence:** independent static review PASS; Codex-reported 295 frontend
  and 86 Rust tests PASS; PO-executed isolated Windows build and 35/35 native desktop
  smoke PASS; PO manually accepted real Open Library lookup, opt-in genres, draft versus
  Save, persistence, Cancel and keyboard operation on 2026-10-23. Local report and
  EXE checksum are preserved in the historical candidate section below; metadata smoke
  fixtures do not validate provider availability.
- **Boundaries / deferred:** no macOS/Linux native manual acceptance. Two Google Books
  live probes received HTTP 429 quota exhaustion; neither supports a claim about every
  user request. Series suggestions depend on fallible, sparse bracketed Open Library
  community tags and do not infer volume order. Existing duplicate decisions preserve
  separate Editions versus Physical Copies; set-level ISBN messaging is a future UX
  discovery concern, not a confirmed unsafe automatic merge. Source-provided corrupted
  publisher text is not an established MyLibrary UTF-8 defect.
- **Authority:** PO accepted the limited M2-E behavior and authorized its integration.
  This does **not** close overall M2, authorize M2-F or M3, or authorize release/tag,
  cleanup or further external provider integration.

See [project status](PROJECT_STATUS.md), [D-012](docs/DECISIONS.md),
[roadmap](docs/v2/ROADMAP.md), and [metadata architecture](docs/architecture/metadata-providers.md).

---

# M2-E accepted local candidate — 2026-10-23 (historical pre-integration evidence)

This is candidate evidence, not integration evidence. The PO accepted the limited M2-E scope
and authorized commit, feature-branch push and draft PR preparation targeting `v2`.
Integration and overall M2 closure require separate PO authorization. Live base is
`11f7a767bb24d14139b489ab153b564e9e8a7d48`; base CI does not validate candidate code.

- **Independent static review (PO-reported): PASS**, with the earlier MAJOR finding resolved.
- **Codex-run local automated evidence:** `npm run test` passed **295 tests** (13 files,
  including 42 M2-E enrichment cases); `npm run test:rust` passed **86 tests**.
  `npm run typecheck`, `npm run lint`,
  `cargo fmt --manifest-path src-tauri/Cargo.toml --check`,
  `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked` and
  `npm run build` passed. Vite's existing chunk-size advisory is non-blocking.
  Application/test files were compared with the preserved review index before final preparation:
  unchanged. Expensive native checks are not repeated for the documentation-only acceptance update.
- **PO-executed final native Windows build: PASS; desktop smoke: 35/35 PASS.**
  Local report `C:\Dev\ML-M2E\.cache\desktop-check-1792744658352\report.json` was read back:
  `passed: true`, 35 checks, no errors. Its executable SHA-256 matches the actual executable:
  `F7826CBD587EEF6E3D0D53160DB8F7070339F870EB12DE433A034D180A835A86`.
  The report, executable, synthetic library and isolated WebView2 profile are local evidence,
  not committed artifacts. Metadata smoke fixtures do not prove live provider availability.
- **PO manual Windows acceptance**, isolated on 2026-10-23: real Open Library ISBN lookup,
  individual genre selection, existing-information preservation, separate Apply/Save,
  persistence after reopening, Cancel preservation and keyboard operation confirmed.
- **Live diagnostics (Codex, 2026-10-23):** existing Google Books ISBN requests for
  `9789752444102` and `9780761936749` both returned HTTP **429**,
  `RESOURCE_EXHAUSTED / rateLimitExceeded`, daily Queries quota exhausted. Neither response
  contained `items` or `totalItems`; this is upstream rejection before exact-ISBN filtering.
  No causal link to the reported Google Issue #569300353 regression was established.
  Open Library returned HTTP 200 for both. The first reproduced `Panama Yay?nc?l?k`, also
  independently confirmed upstream by PO; manual publisher correction remains supported.
- **Accepted limitations:** community series coverage is sparse and labels may be wrong.
  PO found no useful suggestions for tested Ince Memed, Monte Cristo and Sherlock Holmes books;
  exact ISBNs were not recorded, so their individual raw records were not verified. No order is
  inferred. Distinct volumes may require separate Editions despite a set-ISBN duplicate warning;
  the resolver requires an explicit decision. No unsafe automatic merge was confirmed.
- **Evidence boundaries:** no personal-library access; no macOS/Linux native manual acceptance
  is claimed. PR CI is separate from local/PO evidence and must be reported for its exact head.
  Google availability and richer series organization remain separate future scope decisions.

See [provider behavior](docs/architecture/metadata-providers.md), [D-012](docs/DECISIONS.md)
and [roadmap](docs/v2/ROADMAP.md). M2 remains OPEN.

---

# Historical integrated verification checkpoint — 2026-10-19 (reviewed 2026-10-20)

> **Integration evidence was rechecked on GitHub on 2026-10-20.** PO manual observations
> and separate integration authorizations are attributed to the PO handoff and confirmation;
> they were not independently repeated during this documentation review. The detailed
> records below are earlier snapshots, preserved verbatim; their "candidate / OPEN"
> statements should not be interpreted as the present state of integrated work.

- `v2` HEAD `f4e0d6ecf946bcb23310dc926656b65908c1d3cb` after two PO-authorized
  exact-SHA fast-forwards: [PR #11](https://github.com/fatihemres/MyLibrary/pull/11)
  (`625ea3dff84ac138c455e17a24eea0983268999f`) and
  [PR #12](https://github.com/fatihemres/MyLibrary/pull/12)
  (`f4e0d6ecf946bcb23310dc926656b65908c1d3cb`).
- Both PRs passed 4/4 platform jobs and 3/3 CodeQL jobs. Final **push-triggered**
  [V2 foundation run 39306773531](https://github.com/fatihemres/MyLibrary/actions/runs/39306773531)
  passed **4/4**; [CodeQL run 39306773510](https://github.com/fatihemres/MyLibrary/actions/runs/39306773510)
  passed **3/3** (GitHub evidence rechecked 2026-10-20).
- [M2-D PR #7](https://github.com/fatihemres/MyLibrary/pull/7) integrated; [Issue #6](https://github.com/fatihemres/MyLibrary/issues/6)
  closed. PO observed real Windows webcam ISBN scanning. **Overall M2 milestone OPEN**;
  no automatic milestone closure or macOS/Linux native camera certification.
- **PO manual Windows acceptance (isolated synthetic library):** PR #11 Open Library ISBN
  metadata/managed-cover save, display and persistence after restart observed PASS;
  PR #12 was verified by the PO in a manually launched isolated Windows test app:
  the data-folder action opened the correct synthetic folder in Windows Explorer without
  visible UI freeze or global overlay. Existing-cover preservation on failed
  acquisition is **automated native test evidence**, not a separate PO manual test.
  PR #12 duplicate-click disabled state was not separately timed by PO.
- **Security context (PO-reported):** The PO reported that Kaspersky assessed the earlier
  Cargo unsigned build-script detection as a false positive. The original vendor
  correspondence was not independently reviewed. Per the PO, antivirus remained active
  and no exclusions were made.
- Native test isolation requires synthetic `MYLIBRARY_DATA_DIR` data and a separate
  `WEBVIEW2_USER_DATA_FOLDER`; no personal library is used.
- Package CI is not native macOS/Linux desktop acceptance. No V2 release/tag, signing,
  updater enablement, Google Books permanent cover download or automatic orphan cleanup.

See [Project Status](PROJECT_STATUS.md), [M2 roadmap](docs/v2/ROADMAP.md) and
[CQ-02-A test boundaries](docs/testing/cq02a-safe-openlibrary-covers.md).

---

# M2-D webcam ISBN scanning — local implementation candidate

Local Windows evidence recorded on 2026-10-14 for `agent/codex-m2d-webcam-scan`,
based on `950bdcd330ac5aea67dcd878a1701f62620f87d5`. M2-D and M2 remain OPEN;
Issue #6 remains OPEN. No integration or candidate CI success is claimed.
See [requirements audit](docs/testing/m2d-requirements-audit.md).

## M2-D URL-control normalization follow-up — 2026-10-15

Targeted security review of `fc756c023b4d2ceb3cadc112fcd0635700bc9b15` found that
TAB/LF/CR inside protocol-relative string tokens could hide a remote authority.
Inspection now checks both the original decoded token and an inspection-only copy
with those three WHATWG-ignored ASCII controls removed. Emitted strings are unchanged.
The existing module-layout/default and worker-token scope is unchanged; this is not
a general proof against arbitrary computed networking.

- Focused real-Rollup policy tests: **33 passed**, retaining all prior 21 cases.
  TAB, LF, CR, mixed/repeated controls, Unicode/encoded hosts and source escapes reject;
  retained comments, local strings and unrelated main-app URLs remain accepted.
- Independent read-only real-Rollup probes: **24 passed** (18 rejection and 6 compatibility
  cases), including checking that accepted local runtime strings are not rewritten.
- Typecheck/lint: pass. Full frontend suite: **162 passed**.
- `npm audit --omit=dev`: zero reported vulnerabilities. Production build: pass.
- Fresh emitted graph audit: one worker chunk, 35,418 bytes, 485 parsed string/template
  tokens checked in original and normalized form; no prohibited remote URL/CDN tokens.
  Local reader WASM remains bundled at 966,895 bytes.
- Windows `npm run desktop:build`: pass, executable and NSIS installer rebuilt.
  Focused packaged camera: **2/2 groups passed**, with local worker/WASM loads,
  zero runtime errors and zero external requests; report
  `.cache/desktop-check-1792048267003/report.json`. Synthetic camera evidence only.
- `git diff --check`: pass. Existing frontend chunk-size advisory and linker informational
  warning did not fail packaging. Full desktop regression was not rerun for this policy-only fix.
- No Rust/runtime source, dependency, lockfile, platform or CSP remediation changes.
  Prior native 71-test/fmt/check/Clippy evidence is reused; no Rust retest is claimed.
- M2-D, M2 and Issue #6 remain OPEN. Real Windows webcam hardware verification: NONE.

## M2-D bounded build-policy remediation — 2026-10-15

Security review identified build-policy gaps in the original local candidate
`b9d85bd1df7c6c842085056ac87fe1137010132a`, not evidence of runtime remote requests.
The remediation changes only the Vite policy, focused policy tests and relevant documentation.
The worker build now requires exactly one expected pinned reader transformation and audits
all emitted worker JavaScript chunks using parsed string/template tokens. Missing/relocated
modules, zero/duplicate defaults, HTTP(S), protocol-relative ASCII/Unicode/encoded hosts,
split protocol-relative prefixes, blob URLs and known CDN identifiers fail. Comments and
unrelated main-app URLs remain outside that check. Main/dev transformation remains active.
This guards the defined module-layout/default and URL-token boundary; it is not a general
proof against arbitrary computed networking in malicious dependency code.

- Focused policy suite: **21 passed**, using actual in-memory Rollup builds with secondary chunks.
- Repeated read-only policy probes: **21 passed**, including the previously missed Unicode host.
- Typecheck/lint: pass. Full frontend suite: **150 passed** (previous 129 plus 21 policy tests).
- `npm audit --omit=dev`: zero reported vulnerabilities. `npm run build`: pass.
- Generated graph audit: one worker JavaScript chunk, 35,418 bytes; no HTTP(S), protocol-relative
  remote authority, blob, jsdelivr, fastly or unpkg tokens. Local reader WASM: 966,895 bytes.
  Asset names/sizes are unchanged; synthetic tests additionally cover multiple worker chunks.
- `npm run desktop:build`: pass, Windows executable and NSIS installer rebuilt with this policy.
- Focused packaged camera: **2/2 groups passed**, report
  `.cache/desktop-check-1792044602512/report.json`; no runtime errors or external requests.
  Full desktop regression was not repeated for this build-policy-only remediation; the
  previous 34/34 runtime regression evidence below is retained separately.
- Final diff whitespace check passed.
- No Rust source, Cargo/npm dependencies, lockfiles, runtime camera lifecycle, persistence,
  platform configuration or CSP changed relative to the reviewed candidate. Prior native
  71-test/fmt/check/Clippy evidence is reused on that basis.
- M2-D, M2 and Issue #6 remain OPEN. Physical webcam/platform acceptance limitations below
  are unchanged. No remote integration or CI success is claimed for the remediation.

## Automated and decoder evidence

- `npm run typecheck`, `npm run lint`: pass.
- `npm run test`: **129 passed** (17 library, 7 foundation, 26 metadata,
  7 duplicate, 30 scanner, 42 camera).
- `npx vitest run src/domain/camera.test.tsx`: **42 passed** separately.
- `npm run test:rust`: **71 passed** (13 unit, 20 duplicate decisions,
  24 integrity, 3 migration, 5 restore limits, 6 restore schema).
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, locked all-target
  Cargo check and normal Clippy: pass. Six existing advisory locations remain:
  db.rs:856, metadata.rs:203, lib.rs:188, integrity.rs:613/717, duplicates.rs:129.
  No new M2-D Clippy warning was observed.
- The real zxing-wasm reader decoded synthetic 9780306406157, 9791090636071 and
  non-book 4006381333931 frames using local WASM bytes with fetch prohibited.
  Existing ISBN validation rejected the non-book EAN; no live provider was used.
- `npm audit --omit=dev --json`: zero reported vulnerabilities at audit time;
  this is not proof that the dependency has no security defects.
- Sandbox process-spawn restrictions initially blocked Vite/esbuild; the same
  authorized commands passed outside that restriction.

## Bundling and privacy evidence

`npm run build` passed. Final emitted assets (uncompressed): reader WASM 966,895 bytes,
module worker 35,418 bytes, main JS 552,971 bytes, CSS 28,457 bytes. Compared with
pre-change local build output (JS 542,896 / CSS 28,343 bytes), main JS grew 10,075
bytes and CSS 114 bytes, plus the worker/WASM. This is a local-output comparison,
not a fresh baseline rebuild. MIT/Apache decoder notices ship in decoder-licenses.txt.

The worker has no HTTP(S) URL or blob worker URL. A version-pinned build transform
removes the upstream unused CDN default and fails on unexpected source drift;
the active reader uses only its bundled same-origin asset. CSP adds only same-origin
worker/connect access and wasm-unsafe-eval; no generic unsafe-eval or remote worker
source. No camera frames are uploaded, saved or logged. The existing optional
metadata workflow remains explicit and unchanged.

## Windows package and synthetic desktop evidence

`npm run desktop:build` passed for the final runtime source, including NSIS packaging.
Executable: 15,737,856 bytes; SHA-256
`4502b2afa0b557eb83ed67b7f85b037872aabdec481128e7d2c0b4bd3891f353`.
Installer: 4,561,037 bytes; SHA-256
`10fd01d3766755fc30093cca7d941364cfeb0184f64b58a448141af8384b0fb2`.
The existing Vite >500 kB chunk advisory and MSVC import-library linker message remain.

Focused camera desktop run: **2/2 groups passed**, local ignored report
`.cache/desktop-check-1791958626603/report.json`. It exercised actual packaged worker/WASM
HTTP 200 loads from tauri.localhost with BarcodeDetector disabled, no remote requests,
no capture before explicit action, repeated 978 queue entries, 979 single scan, non-book
rejection, unchanged library before Save, fresh M2-B duplicate review at Save, permission
error, late grant after cancellation, track cleanup, EN/TR labels and focus restoration.

Full `npm run test:desktop`: **34/34 workflow groups passed** against the same executable.
Local ignored report: `.cache/desktop-check-1791958648057/report.json`.
Both final reports have no frontend runtime errors and no external network requests.
The full run includes prior M2-A/B/C, persistence/restart, frozen V1 migration,
backup/restore, import/export, and copy/Edition regression checks. No desktop assertion
was weakened to obtain this result.

An earlier run caught single-scan focus restoration occurring before dialog cleanup;
the implementation now schedules it from the parent effect after camera unmount. The
same assertion passed in the final focused run. An earlier harness-only dialog-label
mismatch was also corrected; no product assertion was removed or weakened.

## Hardware and platform limitations

Real Windows webcam hardware verification: NONE

Windows desktop camera automation uses generated EAN-13 frames in canvas MediaStreams
inside the actual packaged Tauri/WebView2 app. It cannot establish physical camera
permission prompts, printed-book recognition, OS camera indicators or real-device recovery.
Candidate four-platform CI and CodeQL have not run. macOS/Linux native interactive
camera acceptance is not claimed. macOS usage-description packaging and the Linux
permission callback still require their platform gates. M2-D is ready only for local
candidate review, not milestone closure.

---

# M2-C USB keyboard-wedge scanning — CLOSED

M2-C was integrated by fast-forward at `1edf3014d252067b7ee435478cba3f6aaf9350c9`.
[PR #4 — M2-C: USB barcode batch scanning](https://github.com/fatihemres/MyLibrary/pull/4)
is merged at that exact SHA. [PR CI 38362240863](https://github.com/fatihemres/MyLibrary/actions/runs/38362240863)
and [final push CI 38365564445](https://github.com/fatihemres/MyLibrary/actions/runs/38365564445)
both passed Windows x64, Linux x64, macOS Intel and macOS Apple Silicon, including packaging
and artifact upload. Candidate branch cleanup is complete. M2-A/B/C are CLOSED;
M2 remains OPEN and M2-D webcam scanning is pending.

The following local implementation evidence was recorded on 2026-10-13 on the historical
`agent/codex-m2c-usb-batch-scan` candidate, based on `f469306b9f8edd720046376fee07f3de913323dc`.
It remains separate from the final integration CI evidence above.

## Final local automated evidence

- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- `npm run test`: **87 passed** (17 library, 7 foundation, 26 metadata,
  7 duplicate, 30 scanner tests).
- `npx vitest run src/domain/scanner.test.tsx`: **30 passed** separately.
- `npm run test:rust`: **69 passed** (11 unit, 20 duplicate decisions,
  24 integrity, 3 migration, 5 restore limits, 6 restore schema tests).
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check` and
  `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked`: pass.
- `git diff --check`, scoped formatting, documentation links and all 34 EN/TR scanner keys:
  pass. Final diff review contains only the 17 intended M2-C source, test and documentation files.

Scanner tests exercise the production parser, terminator rules, bounded session queue,
repeat preservation, ISBN-only seed isolation, EN/TR key resolution and labeled input markup.
Interactive focus, component lifecycle, paste and persistence are verified in the real desktop
harness rather than inferred from static rendering. Existing M2-A/M2-B and F1–F4 assertions remain.

## Windows executable, installer and simulated keyboard-wedge evidence

`npm run desktop:build` passed, including the production frontend build and NSIS installer.

- Executable: `src-tauri/target/release/mylibrary.exe`.
  SHA-256: `e9866d42768fff6c57cf72e0b4940f32908847b5446758192baff44aa78ba59e`.
- Installer: `src-tauri/target/release/bundle/nsis/MyLibrary_2.0.0-alpha.1_x64-setup.exe`.
  SHA-256: `784e69d6c68ec2222f7e78e50b48a890c6d12e4f89357f16fb7ef6c5a2cf150f`.
- Vite's >500 kB chunk advisory and MSVC's informational import-library linker message
  remain non-blocking; no dependency or bundling changes were made for them.

`npm run test:desktop`: **32/32 workflow groups passed** against that executable.
Local ignored report: `.cache/desktop-check-1791843635529/report.json`.
The report records `passed: true`, `errors: []`, `network: []` and the executable hash above.
Only isolated synthetic libraries were used. Windows verification is simulated keyboard-wedge
input in the real Tauri app; it is not physical-device acceptance.

The 29 existing regression groups passed, including metadata preview, duplicate decisions,
imports, copies, locations, backup/restore, V1 migration and restart persistence. Three added
scanner groups verified:

- Initial focus, empty Enter/Tab, batch clear/refocus, repeated ISBN-10/13 entries, visible invalid
  UPC/EAN, queue removal, new-record seed, cancel/return focus and added-item status.
- Repeated ISBN processing sees fresh library state: explicit existing-Edition attachment preserves
  the original copy; explicit separate-Edition creation remains independent. No automatic metadata
  command is made by scanning; pending queue discard defaults to Cancel and preserves the queue.
- Persisted Tab setting after restart, either-mode Enter/Tab, AIM prefixes, 979 without ISBN-10,
  bounded paste rejection, BookEditor and CopyEditor barcode fields, no persistence before Save,
  and copy/Edition identity preservation after barcode save.
- Barcode collision remains copy-level with no Edition attachment choice; Turkish scanner labels
  and discard confirmation resolve; restart preserves data. The 900-pixel scanner screenshot was
  visually inspected, and the dialog has no horizontal overflow.

During implementation, real desktop verification exposed an initial-focus ordering issue and an
ambiguous settings accessible name. The input now focuses after modal effects, and the setting
has an explicit localized accessible name. A later Turkish harness selector incorrectly used the
last dialog; it now targets the named confirmation dialog. No product assertion was weakened.
The final full run passed; these failures were not attributed to environmental timing flakes.

**Real USB barcode scanner hardware verification: NONE.** No macOS/Linux interactive scanner
acceptance is claimed; successful CI packaging does not establish interactive acceptance. Signing, notarization and
disabled updater configuration remain unchanged. Full assistive-technology certification is not claimed.

## Scope and remaining limits

See [barcode architecture](docs/architecture/barcode-scanning.md) and the
[section-by-section requirements audit](docs/testing/m2c-requirements-audit.md).
The queue is session-only and capped at 1,000 entries; payloads at 128 UTF-16 code units.
Metadata lookup stays manual. No global character capture, device API, camera, BarcodeDetector,
ZXing, dependency, migration, native command, network endpoint, permission expansion, telemetry,
Work table or M3+ feature is introduced. Production data was not accessed. Runtime profiles,
reports, covers, backups and build artifacts remain ignored and excluded from the commit.

---

# M2-B duplicate decisions — local implementation candidate, 2026-10-11

Branch `agent/codex-m2b-duplicate-intelligence`, based on unchanged V2 baseline
`ec661cd0f153540b2fb27784d2642fc01d356f00`. M2-A is closed; M2 remains OPEN.
This is local Windows evidence, not CI, cross-platform interactive acceptance or release approval.

## Final automated checks

- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- `npm run test`: **57 passed** (17 library, 7 foundation, 26 metadata, 7 duplicate UI tests).
- `npx vitest run src/domain/duplicates.test.tsx`: **7 passed** separately.
- `npm run test:rust`: **69 passed** (11 unit, 20 duplicate decisions, 24 integrity,
  3 migration, 5 restore limits, 6 restore schema tests).
- `cargo test --manifest-path src-tauri/Cargo.toml --test duplicates --locked`:
  **20 passed** separately.
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check` and
  `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked`: pass.
- `git diff --check`, scoped Markdown/TypeScript/harness formatting, local documentation
  links and EN/TR translation-key coverage/parity: pass.

Tests exercise the production Store and actual decision components, not only mock decisions.
Native regressions cover all copy fields/custom values, old-copy equality, selected-only edition
patches, atomic rollback, opaque V1 IDs, stale/hostile targets, same-group identifier collisions,
incoming ISBN conflicts, weak-only non-linking and F1–F4 compatibility. The rating assertion uses
`5.0` because SQLite returns floating JSON ratings; it still requires rating five and Finished status.

## Windows release and desktop evidence

`npm run desktop:build -- --no-bundle` passed. Release executable:
`src-tauri/target/release/mylibrary.exe`.
SHA-256: `316ac38cc1016f724a76a9ffe8a56dad58a4afc57bf832cd7c04fa53f000afbf`.
No installer was repackaged in this slice. The existing Vite ~532 kB chunk advisory and MSVC
informational import-library linker message are non-blocking.

`npm run test:desktop` passed **29/29 workflow groups** against that executable.
Report: `.cache/desktop-check-1791736429970/report.json`; errors `[]`, network `[]`.
All profiles, file selections, exports, media and archives are isolated synthetic data under `.cache`.

The new real Tauri/WebView2 workflows verify:

- Valid new ISBN creation, equivalent ISBN-10/13 resolver before persistence, no default target,
  Cancel/Escape draft preservation and a separate-edition choice.
- Existing-edition attachment preserves the original copy and incoming location, acquisition date,
  source, condition, barcode, reading state/page/rating/favorite, copy extras and custom value.
- Weak title/author and barcode warnings offer no inferred attachment; explicit selected-title
  reconciliation changes the shared title while keeping page count and publisher.
- Multiple targets require a choice. Portable two-copy groups attach together or create one
  independent edition; ratings/statuses remain independent. Skip decisions, zero-row no-op safety
  and incoming-versus-incoming ISBN conflicts are exercised through the UI.
- Archived-only editions remain visible and can receive a new active copy without restoring old
  copies. Restart preserves the final domain snapshot.
- Direct legacy IPC new save/import rejects unreviewed ISBN duplicates, fabricated edit IDs fail,
  ordinary existing-copy editing still succeeds and rejected operations leave the snapshot intact.

The retained suite also passes Add Physical Copy, M2-A fixture-driven metadata preview, locations,
loans, notes/quotes, covers/attachments, CSV/JSON round trips, backup/restore, Trash, V1 startup,
language switching, keyboard/unsaved safety and responsive/reduced-motion checks. The 900-pixel
resolver screenshot was visually inspected; controls fit and remain readable.

During continuation, failing desktop probes were harness issues: an ambiguous Condition label,
a nested-dialog transition race, a zero-row import that correctly disables Confirm, and acquisition
setup inserted in the wrong test block. These were corrected without weakening product assertions.
The final complete run passed; no product source changes were needed during this continuation.

## Boundaries and limitations

No production library was accessed. No schema/migration, dependencies, network/provider rules,
permissions/CSP, CI, updater/signing, Work entity or protected release refs changed. Changed-file
and tracked-file audits exclude databases, personal media, archives, generated output and secrets.
See [architecture](docs/architecture/duplicate-decisions.md) and
[requirements audit](docs/testing/m2b-requirements-audit.md).

Desktop automation uses loopback WebView2 and synthetic file-picker/provider fixtures; it is not
live-provider availability, OS-picker certification or macOS/Linux interactive evidence. No new CI
run or full assistive-technology certification is claimed. Cross-incoming group linking is deferred;
import attachment keeps shared metadata, with field reconciliation offered only during manual create.
Large-library performance has not been benchmarked. USB scanner, batch scan and webcam work remain
pending. The local candidate requires the owner's subsequent review/integration gates.

---

# V2 Milestone 1 verification — CLOSED 2026-10-09

Branch `v2`, application 2.0.0-alpha.1, schema 2. This is an unreleased foundation, not V2 product acceptance. The historical V1 report below remains evidence for the immutable V1 tag only.

## Foundation checks

- TypeScript, ESLint and 23 frontend tests pass (16 existing domain regressions + 7 foundation tests).
- 24 native tests pass: 21 integrity/path tests, 2 V1 migration/ZIP integration tests and 1 migration rollback unit test. Rustfmt and all-target locked Cargo check pass.
- Frozen V1 SQL and synthetic fixture preserve every value in 18 domain tables. No Work table, reset or inferred relationship was introduced. Upgrade safety snapshots and V1 ZIP staged migration passed.
- Windows production frontend/Tauri/NSIS build passes. Final installer: `src-tauri/target/release/bundle/nsis/MyLibrary_2.0.0-alpha.1_x64-setup.exe`. Unsigned; no production updater configured. Vite reports a non-fatal ~511 kB chunk-size advisory; code splitting remains future performance work.
- The actual Tauri/WebView2 executable passed 26 desktop workflow groups. The final executable passed the full repeat after the wording/accessibility fixes.
- GitHub Actions run [37884695260, attempt 1](https://github.com/fatihemres/MyLibrary/actions/runs/37884695260/attempts/1) passed all four platforms: Windows x64, macOS Apple Silicon, macOS Intel and Linux x64. Every applicable check, production package and artifact upload succeeded. This automated matrix evidence is separate from Windows local/manual visual and actual desktop workflow verification.

## Desktop scope and safety

The suite exercises copies/edition grouping, Finished navigation, hierarchical locations and occupied deletion, nested unsaved drafts, loans, notes, quotes, attachments, covers, CSV/JSON round trips, ZIP restore/failed restore, Trash, settings, narrow/normal layout, reduced motion and restart. New checks exercise Turkish system detection, explicit English selection, Turkish/English switching, saved preference after restart, localized formatting, inactive update status, V1 fixture startup, data-folder path and native folder-open action.

Language checks compare all snapshot domain collections, including reading status, names, notes/quotes and media references. UI language is independent of the fixture's French default book language. No runtime errors or external core WebView requests were observed in the passed run. Production data was neither opened nor modified; `.cache/desktop-check-*` holds synthetic libraries, exports, screenshots and reports only and is ignored.

Test harness uses a loopback WebView2 connection and substitutes native file-picker return paths. It does not certify OS picker interaction, install/uninstall, macOS/Linux native UI or full assistive-technology support. Open-folder action checks backend/UI success, not Explorer shell internals. RTL readiness is a source/layout baseline, not a completed Arabic localization.

## Final evidence

Final local desktop report: `.cache/desktop-check-1791481281264/report.json`, 26/26 passed, errors=[], network=[]. Synthetic artifacts remain ignored.

Installer SHA-256: `65f928fc90c135f7c2b4455629b4f94352439437e7d81edd8a1f518769dc66ea`.
Executable SHA-256: `fbd12d2586b576e2d1fa60e0cb2d96f52035afe61079e92622db4a364525097f`.

Source audit: 620 English/Turkish keys with parity, no missing literal component keys. No database, personal media, runtime/build output or credential-pattern hits in the 88 audited source files. Ignore rules also exclude portable ZIP and installer formats. V1 refs retain their original release hashes. The source milestone `b2d5817` was pushed normally. Earlier GitHub startup failures are resolved: the owner confirmed an account billing lock, not a MyLibrary source/workflow defect. The same source/workflow passed after billing resolution. Final CI source commit: `3856fd661943eebb93520a6783356734af6405ca`. Four non-expired CI artifacts were verified after the checkout/setup-node/upload-artifact @v7 upgrade. Final logs no longer contain the Node 20 Actions-runtime warning. Milestone 1 is CLOSED; the platform matrix records package formats and verification boundaries.

Windows signing is not configured; macOS packages are unsigned for distribution and not notarized. The updater remains disabled. No Milestone 2 work has started. Native interactive macOS/Linux acceptance remains distinct from their successful CI checks/packages.

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

## PO-reported Windows scanner/camera observations — 2026-10-22

**Evidence type: PO-reported physical Windows observation. Not an automated test, not CI.** Tested by the PO on 2026-10-22 on Windows using a **local, unmerged MyLibrary development candidate**, not canonical integrated `v2` at `96b87461f4b3fb75861156d802bcfde0d2f47fc0`. The candidate commit/build was not independently reviewed or recorded here.

- USB barcode scanner: worked reliably; one older/difficult barcode required more effort.
- Phone used as a webcam: worked very well.
- Ordinary webcam: recognized easier/larger barcodes; struggled with difficult ones.

Limitations: single PO session, Windows only; no macOS/Linux hardware evidence; no barcode counts or success rates recorded; the candidate's camera performance/UX changes are not integrated and are not claimed as verified for `v2`. PO decision D-014 stops further ordinary-webcam optimization; integrated M2-D webcam scanning is preserved. All earlier reports above are unchanged.
