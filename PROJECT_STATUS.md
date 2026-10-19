# MyLibrary — Project Status

> **Evidence review: 2026-10-20.** Dated checkpoint, not a live Git/CI feed.
> The PO controls scope, milestone closure, integration and release.

## Sources of truth

- [AGENTS.md](AGENTS.md): agent safety and working rules.
- [Decision Register](docs/DECISIONS.md): accepted PO decisions, discovery directions and open questions.
- [V2 roadmap](docs/v2/ROADMAP.md): approved milestone scope and closure.
- [VERIFICATION.md](VERIFICATION.md): CI, automated tests and attributed manual observations.
- [Post-V2 discovery](docs/product/post-v2-discovery.md): unapproved ideas, not implementation scope.
- [Architecture](ARCHITECTURE.md), [versioning](docs/versioning.md) and
  [repository hardening](docs/development/repository-hardening.md): design and delivery policies.

## Current integrated checkpoint

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
