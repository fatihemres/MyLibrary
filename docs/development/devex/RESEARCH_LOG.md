# DevEx research log — MyLibrary

> Append dated, source-attributed checkpoints here. **Research facts ≠ tool approval.** Actual adoption, repo policy edits and integration require separate PO authorization. [Index](README.md) · [Issue #47](https://github.com/fatihemres/MyLibrary/issues/47).


## 2026-11-23 — DevEx Draft PR reconciliation and EngineeringOS transfer boundary

**Live checkpoint at preparation:** `v2` = `3faefabc10b4bbf8e1bbdd92cda612df35d389a3`. [PR #61](https://github.com/fatihemres/MyLibrary/pull/61) MERGED at exactly that SHA; PR candidate Foundation 4/4 + CodeQL/Advanced Security 4/4 and subsequent push CodeQL 3/3 passed. The latter is a **push** check, unlike pre-integration PR/Advanced Security results. No native Windows application tests were rerun for this docs-only reconciliation.

**Authorized preparation:** New isolated `docs/devex-evidence-reconciliation-20261123` branch from that exact base; source/privacy checks, documents, commits, push and **Draft PR only**. No authorization to modify `v2`, close old PRs/issues, change global tools/hooks, transfer EngineeringOS materials, implement Collections or release.

- **Source [PR #58](https://github.com/fatihemres/MyLibrary/pull/58):** preserved [LIVE_OBSERVATIONS.md](LIVE_OBSERVATIONS.md) exactly (original blob `05dfd54b931036ce3a5479bc7638af4b696e1b96`). Graphify `graphifyy 0.9.99 --code-only` reported 1,111 nodes/3,129 edges but missed real reverse callers; not suitable as sole impact-analysis authority. Context7 helped on a generic Tauri 2 API question but did not consistently beat primary docs, with deployed version/scope unknown. Existing Ponytail auto-FULL was observed; bounded Node checks do **not** prove productivity gains or fresh UI/UX OFF isolation. First Council seat outputs are perspectives, not product approvals.
- **Source [PR #59](https://github.com/fatihemres/MyLibrary/pull/59):** imported [Council ledger](DESIGN_COUNCIL_EVIDENCE_AND_ENGINEERINGOS_HANDOFF.md) with original 1–35 sections unchanged (source blob `efd4ea6654faffdd2f4fef09dc14158e86bf35cc`) and appended 2026-11-23 §36 state correction. Five [dated review records](reviews/) retain exact original Git blobs. E1/E2/E3, D0/D1 and PO visual reactions have distinct provenance and incomplete/native-validation boundaries. No final design-system or motion stack chosen.
- **Old [PR #48](https://github.com/fatihemres/MyLibrary/pull/48):** [PR #49](https://github.com/fatihemres/MyLibrary/pull/49) is already the merged public-safe successor. Old public Git history and original private-source preservation still need separate treatment; no bulk import of its legacy contents.
- **Current milestone/acceptance distinction:** Explicit PO 2026-11-23 closures for [#31](https://github.com/fatihemres/MyLibrary/issues/31), [#26](https://github.com/fatihemres/MyLibrary/issues/26) and [#54](https://github.com/fatihemres/MyLibrary/issues/54) are administrative scoped decisions, **not new application test evidence**. M3-C [#32](https://github.com/fatihemres/MyLibrary/issues/32) final acceptance remains OPEN after integration; M3 Collections #33 discovery is not implementation approval.
- **Privacy scan:** The seven source Markdown files were checked for direct user-home paths, common token/secret assignments, obvious private keys and email-like strings. Two heuristic matches were technical text/false positives, not detected credentials. **This does not certify absence of hidden sensitive content**, third-party license suitability, public redistribution rights, linked-asset safety or real-private-archive integrity. Do not import any associated ZIP, browser profile, screenshots, logs or private payloads without separate review.
- **D-023 vs later PO observation direction:** Keep the existing policy as written. The later “observe whether Ponytail contributes, disable if necessary” direction is **not** a documented permanent exception or global setting instruction; propose a new bounded PO decision if UI/UX experimentation becomes necessary, followed by separately authorized `docs/DECISIONS.md` sync.
- **EngineeringOS:** `main` observed at `2f31e248bf82f64870bb9591aafdfc53261add19` (revalidate before transfer). Follow its [privacy policy](https://github.com/fatihemres/EngineeringOS/blob/main/docs/PRIVACY.md) and [research import process](https://github.com/fatihemres/EngineeringOS/blob/main/docs/RESEARCH_IMPORT.md): sanitized reusable patterns only in Public Core; protected source manifests/originals only in private workspace after access and rights checks. No EngineeringOS mutation made.

**Remaining gates:** independent exact-SHA Markdown/source/privacy/relative-link review → PR CI → explicit exact-SHA fast-forward PO integration permission → push CodeQL confirmation. [Issues #47](https://github.com/fatihemres/MyLibrary/issues/47), [#51](https://github.com/fatihemres/MyLibrary/issues/51), [#52](https://github.com/fatihemres/MyLibrary/issues/52) remain open independently; there is no justification for restarting broad research to close this documentation task.


## 2026-11-05 — PO DevEx tooling and pre-demo Design Council planning checkpoint

**Current authority:** User approved recording new roadmap/decision direction and separately actionable tracking issues. This entry does not represent installed Graphify/Context7, switched Ponytail defaults, modified Codex hooks, linked Figma, adopted an external tool, changed application code or closed a milestone.

- [Tool pilot #51](https://github.com/fatihemres/MyLibrary/issues/51): Graphify local code-only vs baseline source search; Context7 just-in-time external documentation queries with explicit network/data gates; already reported Ponytail user-level auto-`full` must be verified **OFF for UI/UX**, with deliberate non-UI engineering opt-in only after a scoped setup/permission decision. Source-pinned installer and privacy review still pending.
- [Design Council #52](https://github.com/fatihemres/MyLibrary/issues/52): separate independent UI UX Pro Max / Taste / Impeccable design perspectives; Figma synthesis if separately connected; fixed synthetic task, no uncontrolled skill stacking, PO final visual decision, pre-demo/limited V2 polish with UX #27 and M6 #38. Earlier unequal A/B/C/D/E trials have no causally justified winner.
- D2/D3/D5–D7 DevEx evidence/PO adoption gates remain OPEN under #47. Existing per-PR security and review rules stay in force; M6 retains full release-stage testing/security/rights review.

## 2026-11-04 — public-safe replacement candidate (local staging only)

**Authority / provenance:** PO approved **local preparation** of a new sanitized docs-only candidate from exact `v2`; NOT commit, push, PR creation/closure, review submission, merge or cleanup. Live `v2` at plan time `83bdc097256171e1f1b629685f28ad8312249374`; old [PR #48](https://github.com/fatihemres/MyLibrary/pull/48) remains OPEN/DRAFT/UNMERGED at `85d7ac6989c5e8cea4986681c62913f30303e3e5`. This entry does not claim a new GitHub branch or candidate CI.

- **Private-source integrity:** Five original source hashes were checked against candidate Git bytes during offline staging. That is not an independent comparison with original private files. Three originals remain unchanged in the new public set: raw stars JSON, legacy v0.1 JSON (historical/unreliable license mapping) and pinned seven-candidate D1 report. Corrected v0.2 and dated data-quality erratum remain unchanged.
- **Public derivatives:** first-pass report formatted (`9D39CE14C188786A1A27B70DE032CFF0E49E6F1CD1B19C3FAFDC47FF2FF231D2`) from original source `A85A94236BAF1E315FF210B46BC3132894A7F808CF3A7732DC90A57450C319CC`; portable handoff sanitized (`7EFC65D30E2616F702929DF6C5CB5F4CC36ED68CB9A04AB2FF0225910E5818BF`) from original source `734FA651B72619A964890F2F0902A1AA56E563A69F96EF3DA5EF555A502B182B`. Neither public hash equals nor replaces the private original SHA. The true private originals must be independently retained outside public GitHub.
- **Evidence delta:** 29 Oct D0/D1 snapshots were overtaken by [Issue #47](https://github.com/fatihemres/MyLibrary/issues/47) inventory, synthetic R4/R5 oracle runs and scoped Ponytail/Impeccable exercises. The latest [EV-039 (2026-10-31)](https://github.com/fatihemres/MyLibrary/issues/47#issuecomment-6548488434) closes only the first A/B/C/D/E Wishlist *research* round, not an overall tool winner, adoption, product UX/native acceptance or V2 milestone.
- **Still open:** D2 alternatives/licenses, comprehensive D3 supply-chain assessment, D5 responsibility/quota matrix, D6 PO adoption decisions and D7 approved governance updates. Optional Graphify-vs-grep Track B is an unapproved separate research proposal.
- **Required before any integration:** stage privacy/Markdown/relative-link/source validation, new exact commit SHA, independent PR/content review, new candidate 4+3 CI, and separate exact-SHA FF PO approval; final push CI afterward. Do not silently integrate old PR #48 or claim already-public original history has disappeared.

## 2026-10-29 — D0 GitHub stars and initial D1 source study

**Repo context:** Live MyLibrary `v2` verified at `83bdc097256171e1f1b629685f28ad8312249374`; no open PR at original research time. This is a historical verification, not a live HEAD assertion for later sessions.

**PO-supplied evidence:** public GitHub stars JSON. 33 distinct repositories, 8 categories. Raw JSON uses column-aligned arrays, with only 32 license values; missing license position cannot be established; **all 33 positional license mappings are unverified**, not merely the final record. See [the erratum](snapshots/2026-10-29/DATA_QUALITY_ERRATUM_2026-10-29.md) and [corrected v0.2 catalog](snapshots/2026-10-29/MyLibrary_DevEx_Stars_Inventory_Normalized_2026-10-29_v0.2.json). Original v0.1 remains as a dated historical artifact. Files and source hashes are indexed in [README.md](README.md).

**Read-only D1 study:** seven methodology/skill repositories were studied via official README and adjacent documentation; no installation, executable source/security assessment or pilot. External repo commit snapshots:

| Repository | External source commit SHA | Preliminary focus — NOT an adoption decision |
| --- | --- | --- |
| [github/spec-kit](https://github.com/github/spec-kit) | `99e047e9b48c3ecbbc5c3e530fb45bed671960bc` | Structured SDD/spec/assessment vs existing PO decision gates |
| [obra/superpowers](https://github.com/obra/superpowers) | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | Full-methodology auto workflow may conflict with scoped Git/worktree permissions |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `59db609eb1e18aaf59b63284d0e52255aff0c63c` | Small TDD/bug diagnosis skills; conditional future isolated pilot |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `eb07f19f52c2669f2364897aaa293e2aaddd7b1c` | Lifecycle skills; do not inherit automatic /ship or build approval |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | `92a9a34ac3bf88e695e468b90c7bf32f163d32c8` | Installer/manager distinct from skill content; third-party supply chain risk |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | `7801d061243d7b753bad0e0b3c057cd250b11755` | Minimal code/review; publisher benchmark claims need independent measurements |
| [chaseai-yt/claudex-loop](https://github.com/chaseai-yt/claudex-loop) | `53cddc42e39346fb8c6d5d612281a3b1add14e66` | Cross-provider independent review potential; model approvals ≠ PO approval |

Read the [full D1 report](snapshots/2026-10-29/MyLibrary_DevEx_D1_Agent_Workflows_2026-10-29.md), not just this synopsis, for sources, limitations and controlled-pilot designs.

**Current technical baseline:** MyLibrary `package.json` already includes `playwright-core` and `npm run test:desktop`; new Playwright MCP/CLI proposals must be compared to the existing native smoke setup before deployment. No new tool was installed or benchmarked.

**Open and next:** D0 actual Windows Codex/Antigravity/agent/CLI/skill/MCP/plugin/model quotas inventory; D1 deeper exact source/installer inspection; D2 competing options; D3 permissions/privacy/supply chain; then separately authorized D4 synthetic pilots. No inference that M2 Issue #31 or M3-B Issue #26 is closed. No production personal library access.

## 2026-10-29 — Durable GitHub research library proposal

**Action scope:** PO requested a persistent GitHub section housing reports and transferable project research. The proposed files in `docs/development/devex/` are a **docs-only candidate**, separate from the V2 product roadmap, code and CI.

**Verification required before integration:** independent documentation/source review; link, file integrity and `git diff --check` checks; PR-specific CI; then distinct, explicit PO authorization of the exact reviewed SHA for FF-only integration. A Draft PR and green CI do **not** constitute merge permission. If not integrated, the library remains a **proposal branch**, not an established canonical v2 source.

**Keep after integration:** changes to the research index/log/snapshots only via scoped PRs; no silent editing of dated original reports. Issue #47 remains the live cross-conversation work queue.
