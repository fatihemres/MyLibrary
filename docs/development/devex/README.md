# MyLibrary — Developer Experience (DevEx) Research Library

> **Status:** DISCOVERY / RESEARCH, not an adopted tool stack or a product roadmap milestone.
> **Owner:** MyLibrary Product Owner (PO). **Tracking:** [Issue #47](https://github.com/fatihemres/MyLibrary/issues/47).
> **Initialized:** 2026-10-29. This living index is updated only through reviewed, separately PO-authorized documentation PRs.

This directory is the **durable repository-side research library** for AI coding agents, agent skills, prompts, MCP integrations, security tools, UI/UX/test automation, model comparisons and developer workflow improvements. It complements the live [Issue #47](https://github.com/fatihemres/MyLibrary/issues/47), rather than replacing the canonical project contracts.

## Read first / authority

1. Revalidate the **live** `v2` HEAD, open PRs/Issues, exact candidate CI and any explicit PO decisions. The snapshot below is historical.
2. Follow [AGENTS.md](../../../AGENTS.md), [PROJECT_STATUS.md](../../../PROJECT_STATUS.md), [docs/DECISIONS.md](../../DECISIONS.md), [docs/v2/ROADMAP.md](../../v2/ROADMAP.md), [VERIFICATION.md](../../../VERIFICATION.md) and [the issue/review workflow](../issue-review-workflow.md).
3. Read this index, [RESEARCH_LOG.md](RESEARCH_LOG.md), [Issue #47 and its comments](https://github.com/fatihemres/MyLibrary/issues/47), then the dated reports below.
4. Separate **source claims**, assistant interpretation, independent review, observed pilot/test results, GitHub CI and real Windows PO acceptance. Never treat a research snapshot or an agent `APPROVED` as a PO implementation/integration decision.

**Canonical v2 checkpoint when this library was authored:** `83bdc097256171e1f1b629685f28ad8312249374`. Do **not** treat it as a current HEAD without checking GitHub again.

## PO directions — 2026-11-05 (planning only; current adoption requires later evidence)

- **Controlled tool pilot:** [Issue #51](https://github.com/fatihemres/MyLibrary/issues/51) tracks Graphify local/code-only source navigation, Context7 explicit versioned documentation queries and existing PO-reported Ponytail configuration/activation checks. Graphify and Context7 are **not proven installed and adopted**; do not auto-install packages, reconfigure `AGENTS.md` or enable background network use.
- **Ponytail UI/UX exclusion:** the PO wants Ponytail disabled for design and UI/UX tasks. The prior Codex user-level auto-`full` hook must be examined and a genuine fresh-session OFF result demonstrated **before claiming isolation**; default-off and per-engineering-task opt-in are controlled proposals, not a config operation already performed.
- **Design Council:** [Issue #52](https://github.com/fatihemres/MyLibrary/issues/52) and [existing V2 UX #27](https://github.com/fatihemres/MyLibrary/issues/27) cover independent UI UX Pro Max/Taste/Impeccable perspectives and editable Figma synthesis, intended after core V2 features and before demo/beta; the PO selects the eventual direction. Previous Wishlist A/B/C/D/E tests are limited non-equivalent research, not a winning design.
- **Security/testing:** comprehensive M6 pre-release evaluation remains planned, while current PR-specific security/privacy and data-integrity checks continue. DevEx #47 remains open. These are **PO planning directions**, not permission to install external tools, enable plugins/accounts, rewrite local/global configs, implement a redesign or integrate a new PR.

## Latest attributed checkpoint — 2026-11-04 (historical at publication)

- **Live repository check on 2026-11-04:** canonical `v2` = `83bdc097256171e1f1b629685f28ad8312249374`; [Draft PR #48](https://github.com/fatihemres/MyLibrary/pull/48) remains **OPEN / UNMERGED** at `85d7ac6989c5e8cea4986681c62913f30303e3e5`, with its *own* old 7/7 CI and **0 submitted reviews**. Revalidate again before acting; this public-safe successor is a **new local candidate**, not #48's changed HEAD or an integrated repo source.
- **D0:** 29 Oct public-stars export has 33/33 IDs, but 30 Oct [Issue #47](https://github.com/fatihemres/MyLibrary/issues/47) documents a later 42-star point-in-time inventory. The October 29 33-entry snapshot is **not** current stars. PO-submitted Windows Codex/Antigravity/model/quota inventory exists in later comments; current completeness and quotas require fresh inspection.
- **D1/D2:** initial seven pinned README sources and deeper selective studies recorded. Neither all-candidate legal license checks nor source/maintenance/alternative review is complete. The 33 legacy source licenses are not independently attributable; v0.2 marks all 33 unverified.
- **D3:** selected tool permissions, local skill/hooks, egress/telemetry and redirect behavior were inspected on reported pilots. This is **not** a program-wide independent supply-chain security audit.
- **D4:** independent isolated synthetic hidden-acceptance evidence exists for R4/R5, distinct from agent reports; Ponytail installation/skill pilots and Impeccable D/E experiments were performed under separately scoped PO permissions. [EV-039 (2026-10-31)](https://github.com/fatihemres/MyLibrary/issues/47#issuecomment-6548488434) closed only the first Wishlist A/B/C/D/E **research round**. Its E concept came from an offline-degraded index assignment over seven prewritten directions, followed by Codex implementation; it was **not** original engine-generated design. Fixture/method differences preclude an equal-footing A/B/C/D/E winner.
- **D5/D6/D7:** final model/agent responsibility and quota matrix, PO adopt/pilot/watch/reject decisions and integrated new DevEx governance are **not** completed. Existing MyLibrary AGENTS/DECISIONS/ROADMAP authority remains intact.
- **Privacy/provenance:** The public source handoff and first-pass report below are explicitly labeled derivatives. Byte-for-byte originals remain subject to a **separate private-archive preservation check**. The older public PR #48 Git commits may still be discoverable; this candidate neither erases them nor rewrites history. No product code, data, worktree, integration, milestone or release authority follows from this index.

## Historical research coverage — 2026-10-29 (superseded by checkpoint above)

| Track | State | Evidence / next action |
| --- | --- | --- |
| D0: public GitHub starred-repository inventory | **33 / 33 captured** | Raw and normalized snapshots below; 8 first-pass categories |
| D0: actual Windows agent/skill/MCP/plugin/CLI versions, models and quota | **OPEN** | Collect read-only inventory; no credentials or secrets |
| D1: tool identity/classification | **First-pass completed** | 33 catalogued; seven workflow/skill candidates reviewed at README level |
| D2: alternatives, version/license and operational comparison | **In progress** | Deep source, installer, changelog, license, alternatives and support |
| D3: sandbox, telemetry, privacy, hooks and supply chain | **Not completed** | Must pass before any installation or execution |
| D4: identical-task controlled pilots | **Not started** | Requires separate PO scope/permission, synthetic data and independent evidence |
| D5: model/agent roles and quotas | **Not started** | Benchmark-informed Codex/Antigravity/other agent matrix |
| D6: adoption / rollback decisions | **Not started** | PO chooses adopt / pilot / watch / reject |
| D7: process/agent governance updates | **Not started** | Separate reviewed PR; no automatic roadmap or product feature changes |

## Dated primary artifacts — preserved snapshots

All files in [`snapshots/2026-10-29/`](snapshots/2026-10-29/) are date-stamped **historical research records**; two public derivative filenames replace unsafe/whitespace-heavy originals in this new candidate. Historical source originals are not embedded in this new public branch; new findings should be appended to [RESEARCH_LOG.md](RESEARCH_LOG.md) and delivered as a new dated report, not silently retroactively rewritten.

| Artifact | Purpose | SHA-256 provenance (candidate bytes or original, as specified) |
| --- | --- | --- |
| [Original stars export](snapshots/2026-10-29/MyLibrary_GitHub_Stars_2026-10-29.json) | Unmodified public-stars source supplied by PO | `444484353A4B628E1F1B42C1368A11E6B0538AF6457AAF3A817FAAD18D126E0A` |
| [Corrected usable inventory v0.2](snapshots/2026-10-29/MyLibrary_DevEx_Stars_Inventory_Normalized_2026-10-29_v0.2.json) | All 33; ALL licenses marked unverified pending independent lookup | Derived file; Git blob integrity in candidate commit |
| [Legacy normalized inventory v0.1](snapshots/2026-10-29/MyLibrary_DevEx_Stars_Inventory_Normalized_2026-10-29.json) | Original first attempt; **license associations may be wrong** | `1FE976614F248A69AA3CD9995DE747DF2915974CCCC6627531433FF28B6E3A3B` |
| [All-33 first-pass report](snapshots/2026-10-29/MyLibrary_DevEx_Stars_FirstPass_2026-10-29_PUBLIC_FORMATTED.md) | Eight classifications, first risks and research order | **Public formatted derivative SHA-256 `9D39CE14C188786A1A27B70DE032CFF0E49E6F1CD1B19C3FAFDC47FF2FF231D2`; private original SHA-256 `A85A94236BAF1E315FF210B46BC3132894A7F808CF3A7732DC90A57450C319CC` (different bytes)** |
| [D1 first seven workflow candidates](snapshots/2026-10-29/MyLibrary_DevEx_D1_Agent_Workflows_2026-10-29.md) | Pinned official README evidence, feature overlap, risks and pilot designs | `8681A901D5D9C3E46BC45C793F59A349891EB77C83AE587159C4DEDD5DA8FBD6` |
| [Conversation handoff v0.1](snapshots/2026-10-29/MYLIBRARY_DEVEX_HANDOFF_2026-10-29_v0.1_PUBLIC_SANITIZED.md) | Historical checkpoint, source order, PO boundaries, suggested continuation | **Public sanitized derivative SHA-256 `7EFC65D30E2616F702929DF6C5CB5F4CC36ED68CB9A04AB2FF0225910E5818BF`; private original SHA-256 `734FA651B72619A964890F2F0902A1AA56E563A69F96EF3DA5EF555A502B182B` (different bytes)** |

**Source caveats:** the raw JSON has UTF-8 BOM plus CRLF and a one-element wrapper array containing column arrays; strip the BOM before `json.loads`/`JSON.parse`. Do not edit the archival raw bytes. The original export is one array-of-columns object, not an array of repository objects. Seven fields have 33 entries but the `License` array contains **32**. The missing license **position is not identifiable** from the exported column array; consequently **none of the 33 positional license associations is reliable** until per-repository validation. Use the [corrected v0.2 catalog](snapshots/2026-10-29/MyLibrary_DevEx_Stars_Inventory_Normalized_2026-10-29_v0.2.json), not the original normalized v0.1 file, for future research. Details: [data-quality erratum](snapshots/2026-10-29/DATA_QUALITY_ERRATUM_2026-10-29.md). `Updated` originates from `pushed_at`. GitHub stars/README claims do not establish performance or safety.

## How to maintain this library

- **Issue #47:** live queue, checkpoints, questions, candidate findings, evidence and links to the PR/commit; not a second product roadmap.
- **RESEARCH_LOG.md:** append-only dated evidence summary, investigated exact external repository SHA/version, provenance and open risks. Changes go through the usual review/PR/CI/PO authorization process.
- **snapshots/YYYY-MM-DD/:** complete reports, pinned-source references, sanitized data exports, comparison matrices and handoffs. Keep original date-stamped artifacts intact; new version means a new file.
- **Evaluation record:** for each tool record exact URL/SHA/version, license, maintenance, practical MyLibrary task, feature overlap, installer/hooks, telemetry/egress, secret exposure, Windows/Codex/Antigravity compatibility, costs, risk, test/benchmark method/results, decision owner and rollback.
- **Status markers:** `CANDIDATE`, `RESEARCHED`, `SECURITY-REVIEWED`, `PILOT-PASS/PILOT-FAIL`, `PO-ADOPTED`, `WATCH`, `REJECTED`. A README scan is **not** `SECURITY-REVIEWED` or `PILOT-PASS`.
- **Conflict resolution:** live GitHub exact commit/CI and explicit PO decisions outrank this library. New persistent workflow decisions belong in `docs/DECISIONS.md` after separate authorization; do not rewrite `AGENTS.md` or `ROADMAP.md` from a research report.

## Safety and permissions

**This repository library grants no tool installation or execution permission.** Separate historical PO-scoped tool pilots are described in Issue #47; none implies blanket adoption or new permission. No agent or plugin may access a real personal library DB/WAL, covers, attachments, backups, or private keys. Pilot only on synthetic `MYLIBRARY_DATA_DIR` with isolated WebView2 profile; no implicit network requests, cloud service, telemetry, auto-updates or API key transmission. Preserve Edition/Physical Copy semantics and local/offline-first architecture. Respect protected `main`, `v1-maintenance` and `v1.0.0` and exact-SHA FF-only `v2` integration; no PR or Issue authorizes its own merge or release.

**Chat migration:** In a new conversation, ask to continue *MyLibrary DevEx Issue #47*, read this repo directory and its dated snapshots, validate the live HEAD, then resume from **the newest Issue #47 evidence** rather than re-running completed D4/R4/R5 or Wishlist A/B/C/D/E research rounds. Evaluate the still-open D2/D3/D5 gates and any separately authorized Graphify-vs-grep Track B plan. ChatGPT Project Sources are **not** automatically synced from a GitHub commit.
