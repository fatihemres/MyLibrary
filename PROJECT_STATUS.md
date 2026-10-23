# MyLibrary — Project Status

> **Current checkpoint: 2026-10-23** (see below). Dated checkpoint, not a live Git/CI feed.
> The PO controls scope, milestone closure, integration and release.
> The **2026-10-20 evidence review** is preserved further below as a historical checkpoint.

## Sources of truth

- [AGENTS.md](AGENTS.md): agent safety and working rules.
- [Decision Register](docs/DECISIONS.md): accepted PO decisions, discovery directions and open questions.
- [V2 roadmap](docs/v2/ROADMAP.md): approved milestone scope and closure.
- [VERIFICATION.md](VERIFICATION.md): CI, automated tests and attributed manual observations.
- [Post-V2 discovery](docs/product/post-v2-discovery.md): unapproved ideas, not implementation scope.
- [Idea Register](docs/product/idea-register.md): preserved idea IDs and their status; not implementation scope.
- [Founding decision origins](docs/product/founding-decision-origins.md): qualified historical directions, not new approvals.
- [Architecture](ARCHITECTURE.md), [versioning](docs/versioning.md) and
  [repository hardening](docs/development/repository-hardening.md): design and delivery policies.

## Current checkpoint — M2-E integrated, 2026-10-23

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
- **Overall M2 remains OPEN.** M2-F remains PLANNED / implementation not authorized;
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
