# MyLibrary — Project Status

> **Current checkpoint: 2026-10-27** (see below). Dated checkpoint, not a live Git/CI feed.
> The PO controls scope, milestone closure, integration and release.
> The **2026-10-20 evidence review** is preserved further below as a historical checkpoint.

## Final verified checkpoint — 2026-10-27: M3-B closed out, governance successor pending

- **Canonical `v2` HEAD `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa`.** [PR #42](https://github.com/fatihemres/MyLibrary/pull/42) is GitHub MERGED/CLOSED at that identical SHA via exact-SHA fast-forward after [#19 M2-F](https://github.com/fatihemres/MyLibrary/pull/19) and [#41 M3-A](https://github.com/fatihemres/MyLibrary/pull/41). The original stacked M3-B [PR #22](https://github.com/fatihemres/MyLibrary/pull/22) is now **CLOSED UNMERGED / SUPERSEDED**, with the correctly verified explanation linked to merged #42; old M3-A [#20](https://github.com/fatihemres/MyLibrary/pull/20) was likewise previously closed unmerged/superseded by #41.
- **Final post-push CI on canonical SHA: [V2 Foundation #40498417989](https://github.com/fatihemres/MyLibrary/actions/runs/40498417989) 4/4 SUCCESS** (Windows x64, Linux x64, macOS Apple Silicon, macOS Intel), and **[CodeQL #40498418115](https://github.com/fatihemres/MyLibrary/actions/runs/40498418115) 3/3 SUCCESS** (Actions, JS/TS, Rust). Original #42 PR-triggered CI on same SHA was 4/4 + 3/3 PASS. See [VERIFICATION](VERIFICATION.md) for evidence attribution.
- **Review/acceptance:** Antigravity final exact-SHA read-only delta/security report PASS WITH FINDINGS, 0 critical/high/medium, four LOW, **not a GitHub-submitted Approve**. Historical PO Windows functional 38/38 PASS and narrow-gallery 6/6 PASS; final visual criteria 4/6 checked, two cosmetic items deferred to [#27](https://github.com/fatihemres/MyLibrary/issues/27). No new on-SHA native Windows suite or macOS/Linux manual GUI acceptance is claimed.
- **Governance:** [Draft PR #43](https://github.com/fatihemres/MyLibrary/pull/43) is a separate docs-only, forward-only successor to outdated [Draft PR #39](https://github.com/fatihemres/MyLibrary/pull/39), which **remains open and unmerged** pending successful successor integration. The new documentation PR still requires independent exact-diff review, its own SHA-based PR CI, distinct integration safety gate, and post-push CI; it is not yet canonical. D-022 in the proposed docs is the PO-approved 2026-10-26 Issue/PR/Review process.
- **M2 overall OPEN** — [#31](https://github.com/fatihemres/MyLibrary/issues/31) requires separate PO closure; remaining M3 slices remain PLANNED without automatic approval. No release/tag/signing/updater, V1/`main` changes, destructive cleanup, or personal library tests. GitHub connectivity does not establish clean local Windows worktrees; unrelated agent worktrees remain untouched.

## Historical same-day checkpoint — 2026-10-27: M2-F / M3-A / M3-B integration with Foundation still running

- Verified canonical `v2` HEAD: `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa`. [PR #19 M2-F](https://github.com/fatihemres/MyLibrary/pull/19) integrated at `6b62eb8c9dbc87df351e4d1a4b87f3ca3b7e6eaf`; [PR #41 M3-A](https://github.com/fatihemres/MyLibrary/pull/41) at `ec742660f9c2e2bb33df9f4434b8dcf9efd0fab8`; [PR #42 M3-B](https://github.com/fatihemres/MyLibrary/pull/42) at `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa`, exact-SHA FF, GitHub MERGED/CLOSED. The original stacked [#20](https://github.com/fatihemres/MyLibrary/pull/20) was closed unmerged as superseded. Original stacked [#22](https://github.com/fatihemres/MyLibrary/pull/22) remains a superseded source record, not a merged feature; its administrative closure follows only after verified final push CI.
- PR #42 exact candidate [V2 Foundation #40482774114](https://github.com/fatihemres/MyLibrary/actions/runs/40482774114) **4/4 PASS** and [CodeQL #40482773994](https://github.com/fatihemres/MyLibrary/actions/runs/40482773994) **3/3 PASS**. On canonical `v2` after FF, [CodeQL #40498418115](https://github.com/fatihemres/MyLibrary/actions/runs/40498418115) **3/3 SUCCESS**. [V2 Foundation #40498417989](https://github.com/fatihemres/MyLibrary/actions/runs/40498417989) still **IN PROGRESS at this dated checkpoint**; do not describe final post-push as 7/7 until all platform jobs succeed. See current GitHub status and [VERIFICATION](VERIFICATION.md).
- The independent Antigravity final #42 delta/security report, **PASS WITH FINDINGS** (0 critical/high/medium; four low), explicitly reviews its exact SHA. Attribution is an external agent report, **not a submitted GitHub PR Approve**. Earlier PO isolated Windows functional **38/38 PASS** and gallery **6/6 PASS**; separate final appearance checklist **4/6** with two cosmetic criteria deferred by PO to [Issue #27](https://github.com/fatihemres/MyLibrary/issues/27). Historic agent native tests are not presented as tests rerun on #42. See [Issue #26](https://github.com/fatihemres/MyLibrary/issues/26) and [verification](VERIFICATION.md).
- **Governance:** PO's D-022 GitHub Issues/Review decision (2026-10-26) is implemented in a separate docs-only successor to old [draft #39](https://github.com/fatihemres/MyLibrary/pull/39); the original docs PR and its 26 Oct source checkpoint have not been merged. [Issue #23](https://github.com/fatihemres/MyLibrary/issues/23) tracks delivery. [#24](https://github.com/fatihemres/MyLibrary/issues/24) and [#25](https://github.com/fatihemres/MyLibrary/issues/25) are CLOSED; [#26](https://github.com/fatihemres/MyLibrary/issues/26) remains OPEN in this checkpoint.
- **M2 milestone is still OPEN** awaiting explicit PO decision [#31](https://github.com/fatihemres/MyLibrary/issues/31). Remaining M3 areas are planned/discovery only. No tag, release, updater/signing activation, main/V1 ref changes, real personal library tests or unsafe cleanup are authorized. GitHub cannot verify local Windows worktree cleanliness; unrelated agent worktrees are not touched.

## Sources of truth

- [AGENTS.md](AGENTS.md): agent safety and working rules.
- [Decision Register](docs/DECISIONS.md): accepted PO decisions, discovery directions and open questions.
- [Issue/PR/Review workflow](docs/development/issue-review-workflow.md): attributed independent reviews, Github Reviews and exact-SHA gates.
- [V2 roadmap](docs/v2/ROADMAP.md): approved milestone scope and closure.
- [VERIFICATION.md](VERIFICATION.md): CI, automated tests and attributed manual observations.
- [Post-V2 discovery](docs/product/post-v2-discovery.md): unapproved ideas, not implementation scope.
- [Idea Register](docs/product/idea-register.md): preserved idea IDs and their status; not implementation scope.
- [Founding decision origins](docs/product/founding-decision-origins.md): qualified historical directions, not new approvals.
- [Architecture](ARCHITECTURE.md), [versioning](docs/versioning.md) and
  [repository hardening](docs/development/repository-hardening.md): design and delivery policies.

## Historical checkpoint — M3-B local implementation, 2026-10-25

- Preflight verified integrated `v2` at `441d5481ae21525c42207060cc3d8dd2b9ff97d8`,
  M2-F Draft PR #19 at `4ca8bf7811751fbb4345db817c307aab509e43b6`, and M3-A Draft PR #20
  at `0afab459cf050f82c4479b1a387f643b0b910069`. Neither feature PR is integrated.
- The PO explicitly authorized M3-B local implementation/testing/docs on that exact M3-A parent.
  The uncommitted candidate adds independent Wishlist, schema 4, retailer/target-budget handling,
  explicit metadata review, list/gallery UI and private-by-default JSON catalogue export.
- See [Wishlist architecture](docs/architecture/wishlist.md) and [verification](VERIFICATION.md)
  for actual scope and evidence. Parent CI is not M3-B CI. Independent review and physical Windows
  PO acceptance remain separate gates; no M3-B commit, push or PR is authorized.
- **M2 remains OPEN.** No integration, milestone closure, release or cleanup. M3-C conversion,
  other organization slices and M5 Wishlist Studio are outside this implementation.

## Historical checkpoint — M3-A stacked draft preparation, 2026-10-24

- Live integrated `v2` remains `441d5481ae21525c42207060cc3d8dd2b9ff97d8` (PR #18).
- M2-F [PR #19](https://github.com/fatihemres/MyLibrary/pull/19) remains OPEN/DRAFT at
  `4ca8bf7811751fbb4345db817c307aab509e43b6`; its seven requested CI jobs passed.
- The PO separately authorized the bounded M3-A search/filter slice, local verification and now
  commit/push plus a stacked DRAFT PR from `codex/m3a-search-foundation` targeting
  `codex/m2f-scan-lookup`. This supersedes earlier planning-only statements solely for M3-A.
- M3-A adds Turkish-aware FTS5 search, a transactional schema-3 derived-index rebuild and validated
  copy-aware concise/detailed filters. See [search architecture](docs/architecture/search.md)
  and [agent-run evidence](VERIFICATION.md). Application/test file hashes match the verified candidate.
- Independent review and physical Windows PO acceptance remain pending. The stacked PR base is
  outside the existing workflows' `v2` PR filters; parent CI is not M3-A CI.
- **M2 remains OPEN. No M3 integration, milestone closure or release is authorized.** Other M3
  features remain planned and unauthorized. No integration into either the parent branch or `v2`.

## Checkpoint — M2-E integrated, 2026-10-23 (historical)

- GitHub `v2` was verified at `7c3430eacc47b1c5cf7996e9fbf71a4b25f636ef` after PO-authorized
  [PR #17](https://github.com/fatihemres/MyLibrary/pull/17) integration by **exact-SHA
  fast-forward** (2026-10-23). GitHub reports the PR as merged with
  `merge_commit_sha=7c3430eacc47b1c5cf7996e9fbf71a4b25f636ef`. Its sole commit has parent
  `11f7a767bb24d14139b489ab153b564e9e8a7d48`; no merge commit, squash or rebase.
  Documentation [PR #14](https://github.com/fatihemres/MyLibrary/pull/14) and
  [PR #15](https://github.com/fatihemres/MyLibrary/pull/15) were integrated earlier;
  PR #16 was closed without merge.
- **Final `v2` push-triggered CI for that exact SHA: 7/7 PASS**:
  [V2 foundation run 39946788500](https://github.com/fatihemres/MyLibrary/actions/runs/39946788500)
  (Windows x64, Linux x64, macOS Apple Silicon/Intel 4/4) and
  [CodeQL run 39946788497](https://github.com/fatihemres/MyLibrary/actions/runs/39946788497)
  (JavaScript/TypeScript, Rust, Actions 3/3). PR CI on the same candidate also passed 7/7;
  neither substitutes for native macOS/Linux desktop acceptance.
- **M2-E was PO-accepted on 2026-10-23 with explicit limitations**, after independent
  static review and isolated Windows native/manual verification (295 frontend and 86 Rust
  tests Codex-reported; 35/35 native smoke PO-executed). See
  [verification evidence](VERIFICATION.md); the candidate's local test artifacts were
  not committed.
- **Open follow-ups, not newly authorized work:** Google Books returned HTTP 429 daily
  quota rejection in two live ISBN probes; community-tag series suggestions are sparse
  and have no inferred order; multi-volume/one-set-ISBN duplicate messaging needs separate
  UX discovery. Upstream `Panama Yay?nc?l?k` can be manually corrected.
  See [metadata provider policy](docs/architecture/metadata-providers.md) and
  [Idea Register](docs/product/idea-register.md) IDEA-0006/0008.
- **Overall M2 remains OPEN.** M2-F is a local implementation candidate based on live `v2`
  `441d5481ae21525c42207060cc3d8dd2b9ff97d8` (documentation PR #18 integrated). The PO
  authorized commit/push and a DRAFT PR on 2026-10-23; automated evidence is in
  [VERIFICATION.md](VERIFICATION.md). Physical USB/camera Windows acceptance is deferred,
  not waived. Independent review and separate integration authorization remain required.
  M3 and later remain planned. No release, tag, signing, updater activation or cleanup
  is authorized by M2-E integration.

## Checkpoint 2026-10-22 (historical)

- GitHub `v2` was verified on 2026-10-22 (GitHub API) at `96b87461f4b3fb75861156d802bcfde0d2f47fc0`,
  the head and merge SHA of [PR #13](https://github.com/fatihemres/MyLibrary/pull/13)
  (`docs: reconcile project memory and integrated M2 evidence`, merged 2026-10-19T22:07:53Z).
  Passed on that SHA: push `V2 foundation` run 39332737260 and CodeQL run 39332737353; PR runs
  39327208978 and 39327208945. Per-platform job detail was not re-inspected in this update.
- **Chronology:** GitHub records the PR #13 merge at `2026-10-19T22:07:53Z`, which is
  2026-10-20 01:07:53 in Türkiye (UTC+3). The 2026-10-20 snapshot below states that PR #13 was
  not yet integrated "as of the evidence review"; the exact time of that review is not recorded,
  so no ordering relative to the merge is asserted. That text is preserved unchanged as history.
- M2 overall remains **OPEN**. **M2-E** (Series & Genre Metadata Enrichment) and **M2-F**
  (Optional Scan-to-Lookup) are PLANNED; neither is implemented or authorized. See
  [ROADMAP](docs/v2/ROADMAP.md) and [D-012..D-021](docs/DECISIONS.md). Roadmap placement is not
  implementation authorization.
- Camera performance work is **parked** by PO decision D-014; M2-D webcam scanning stays integrated.
  Local candidates such as `codex/m2d-camera-ux` / `codex/m2d-camera-performance` are not integrated.
- The PO's 2026-10-22 physical Windows observations are PO-reported; see [VERIFICATION.md](VERIFICATION.md).
- The local checkout `v2` was at `7c54e81` (behind `origin/v2`) when this checkpoint was prepared;
  this documentation branch is based on `96b8746`.

## Integrated checkpoint of 2026-10-20 (historical)

GitHub `v2` was verified at `f4e0d6ecf946bcb23310dc926656b65908c1d3cb` on 2026-10-20.
The 2026-10-19 integration sequence was `7c54e814554f3ce048f33c3e004c73fa681df767`
→ [PR #11](https://github.com/fatihemres/MyLibrary/pull/11)
(`625ea3dff84ac138c455e17a24eea0983268999f`)
→ [PR #12](https://github.com/fatihemres/MyLibrary/pull/12)
(`f4e0d6ecf946bcb23310dc926656b65908c1d3cb`). Git ancestry and GitHub merge SHAs
match the two exact-SHA fast-forwards; separate authorizations are PO-reported.
This is the dated pre-integration snapshot for [PR #13](https://github.com/fatihemres/MyLibrary/pull/13):
as of the 2026-10-20 evidence review, that documentation candidate was not integrated.
This historical statement does not assert its integration status after that review.

| Area | Status | Remaining gate |
| --- | --- | --- |
| M1; M2-A/B/C | CLOSED per roadmap | Preserve regression coverage |
| M2-D webcam ISBN | INTEGRATED via [PR #7](https://github.com/fatihemres/MyLibrary/pull/7); [Issue #6](https://github.com/fatihemres/MyLibrary/issues/6) closed | Windows physical scan is PO-observed; macOS/Linux native acceptance is not established |
| M2 overall | **OPEN** | Separate explicit PO milestone closure |
| CQ-02-A covers; Explorer opener | PR #11 and stacked PR #12 integrated | Preserve cover-failure safety and folder-open responsiveness |
| M3–M6 | PLANNED | Separate PO scope and implementation authorization |

Final integrated push CI passed: platform 4/4 and CodeQL 3/3. The exact runs,
PR CI evidence and manual/automated boundaries are in [Verification](VERIFICATION.md).
PO observations cover Open Library cover persistence and actual Explorer opening in
an isolated Windows test app. Cover preservation after failed download is automated
native evidence, not an additional PO manual test. Packaging does not certify native UX.

## Product and safety boundaries

Windows-first Tauri 2 / React / TypeScript / Rust / SQLite; local/offline-first core,
no mandatory account, cloud or telemetry. Edition and Physical Copy remain separate;
no Work table or title-based inferred merge. Preserve V1 IDs, relationships, database/WAL,
managed covers, attachments and backup/restore. Verification uses only synthetic
`MYLIBRARY_DATA_DIR` data with separate WebView2 profiles.

`main`, `v1-maintenance` and immutable `v1.0.0` remain protected V1 references.
No V2 release, signing/updater activation, automatic cover deletion or M3 implementation
is authorized by these documents. Kaspersky's earlier false-positive assessment is
PO-reported; see the attribution and limitations in [Verification](VERIFICATION.md).

## Open questions and historical context

- M2 closure and the first M3 slice require separate PO decisions.
- D-010/D-011 preserve PO-confirmed M3 discovery directions, not an approved schema or implementation.
- Post-V2 ideas and performance/cover-lifecycle candidates remain unapproved;
  static risk suggestions are not measured defects.
- Older verification and hardening documents retain candidate-era statements such as
  M2-D pending or CI not yet run. Read them as historical evidence alongside this checkpoint;
  do not retroactively rewrite their results.
- Other agent-owned worktrees were not inspected or cleaned. Their state is not certified here.

## Maintenance

Update this short checkpoint after verified integration. Keep detailed evidence in
Verification, decisions in the register, approved scope in the roadmap, and ideas in
discovery. Check live `v2` and relevant PR/CI evidence before relying on this snapshot.
