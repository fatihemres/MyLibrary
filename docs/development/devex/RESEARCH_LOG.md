# DevEx research log — MyLibrary

> Append dated, source-attributed checkpoints here. **Research facts ≠ tool approval.** Actual adoption, repo policy edits and integration require separate PO authorization. [Index](README.md) · [Issue #47](https://github.com/fatihemres/MyLibrary/issues/47).

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
