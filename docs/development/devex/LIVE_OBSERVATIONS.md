# MyLibrary — DevEx & Design Council Live Observation Log

> **Status:** FIELD PILOT / OBSERVATION — not a tool-adoption, release, or product-design approval.
> **Opened:** 2026-11-07, per PO request to stop prolonged pre-pilot auditing and observe practical use.
> **Tracking:** [DevEx #47](https://github.com/fatihemres/MyLibrary/issues/47), [Tool pilot #51](https://github.com/fatihemres/MyLibrary/issues/51), [Design Council #52](https://github.com/fatihemres/MyLibrary/issues/52), [UX #27](https://github.com/fatihemres/MyLibrary/issues/27).
> **Project authority:** [AGENTS.md](../../../AGENTS.md), [decisions](../../DECISIONS.md), [status](../../../PROJECT_STATUS.md), [verification](../../../VERIFICATION.md), [roadmap](../../v2/ROADMAP.md).

## Operating intent

Test Graphify, Context7 and the already reported Ponytail installation during bounded, **real development workflows** (actual repository/code and tools, but **synthetic app data only**) and convene the Design Council for independent UI/UX alternatives. Observe what the tools actually contribute, break, cost and change. Do not declare adoption merely because a tool was installed or a skill generated a report.

This single living file is the **append-only observation ledger**. Add dated entries after each meaningful attempt, failure, rollback, or PO observation; never overwrite earlier observations to make the trial look successful. The log itself is public repository material: **no credentials, private files, absolute personal-data paths, proprietary source excerpts, personally identifying data, complete environment variables, tokens, private screenshots or recovery artifacts.** Reference safe local evidence by sanitized relative name and its provenance.

## Verified GitHub starting checkpoint — 2026-11-07

- Canonical `v2`: `10510ab0c5a5d413717cf736b1d74d3590b39e2b`; PR #57 merged through exact-SHA FF. Its final push CodeQL workflow was reported SUCCESS by GitHub. The second full Foundation push run did not trigger, per D-027.
- Open unrelated Draft PR #48 must remain untouched.
- This observation branch begins **after** the checkpoint. Its creation and this file do **not** establish any tool installation, executable test, native Windows acceptance, or permission to integrate into `v2`.
- No existing branch, worktree, protected ref, CI setting or real library is to be cleaned, deleted or modified as part of this pilot.

## Field-pilot safeguards (fast checks, not a separate research phase)

1. Before running a third-party executable/skill, confirm its actual source/version, requested writes/hooks and network targets and record them here. Prefer existing verified installations, isolated per-project use, reversible configuration and no autonomous persistent hooks. If scope cannot be bounded or an unapproved global/account change is required, record **BLOCKED** and stop that step.
2. No tests on the PO's actual personal book library, DB/WAL, media, attachments, backups or normal WebView2 profile. When a live desktop run is useful, use a dedicated synthetic `MYLIBRARY_DATA_DIR` and independent WebView2 profile. Do not turn network-capable plugins loose on project-private material.
3. Do not combine Design Council skills in the same independent creative pass. Keep the same frozen synthetic brief/fixture, independent tools/session contexts, and comparable snapshots. The PO alone selects a visual direction. Council exploration does not authorize production UI redesign or integration.
4. Historic D-023 excludes Ponytail in UI/UX, while the PO has requested practical impact observation. Until a **specific Council/UI exception** is clearly recorded, use Ponytail only in approved engineering tasks; verify it is truly OFF in new UI/UX sessions rather than assuming prompt wording disables an auto-hook. Capture any existing auto-FULL behavior as an observation, not as successful isolation.
5. No uncontrolled installer scripts, cloud file uploads, API keys in Git, telemetry, silent repo source exports, automatic background agents, global skill stacks, `v2` mutation, release or destructive cleanup. Stop and report unexpected egress, hook effects, security detection or unsafe write.
6. Actual code/config/skill changes made in a scoped candidate require their own diff, local tests, independent review, Draft PR and exact-SHA CI before any separate PO authorization to integrate. An agent's PASS is not GitHub CI or Windows PO acceptance.

## Tool integration and observation register

| Tool / role | Starting evidence (not assumed current install state) | Intended live task | State / first result |
| --- | --- | --- | --- |
| Graphify / local code graph | Official GitHub: `Graphify-Labs/graphify`, PyPI package `graphifyy`; no verified current Windows install | Local `--code-only` navigation and change-impact analysis in isolated worktree, compare with ordinary source search | **NOT RUN** |
| Context7 / versioned docs | Official `upstash/context7`; Codex plugin/MCP may affect shared configuration and require sign-in | Explicit Tauri 2 or React documentation query using generic API terms only | **NOT RUN** |
| Ponytail / engineering assistant | PO historically reported user-level v5.3.3, potential auto-`full` hook; current mode/install not rechecked | Engineering review in explicit mode, record suggestion quality, interference, hook behavior, token/runtime cost; not Council UI/UX by default | **NOT RUN** |
| UI UX Pro Max / Council perspective | Official `nextlevelbuilder/ui-ux-pro-max-skill`; current Windows activation not verified | Independent accessibility, typography, density and component hierarchy direction | **NOT RUN** |
| Taste / Council perspective | Official `Leonxlnx/taste-skill`; current version/install not verified | Independent creative visual voice, motion and layout direction | **NOT RUN** |
| Impeccable / Council perspective | Official `pbakaus/impeccable`; old isolated synthetic pilot evidence exists, not a current production install | Independent critique/audit of identical baseline, or isolated creative alternative | **NOT RUN** |
| Figma / optional synthesis | Connected-account/project design permission is separate; do not assume setup | Editable synthesis only after explicit PO direction and account/file approval | **NOT STARTED** |

## Design Council operating room

- **Brief v0 — PROPOSED for first real observation:** evaluate current Wishlist + Dashboard visual hierarchy, dense libraries, narrow window, EN/TR text expansion, focus, reduced motion, missing covers, dark/light themes, no invented data or behavior changes. Use the same synthetic case and application baseline; record the exact freeze SHA before starting.
- **Independent seats:** UI UX Pro Max (system/accessibility), Taste (visual direction), Impeccable (critique/refinement). They are **distinct inputs**, not an automatic three-skill pipeline. A neutral comparison is followed by the PO's selection, not by an automatic app redesign.
- **Artifacts:** only safe, synthetic screenshots/mocks and compact evidence/rationale. Separate agents' proposed designs from actual browser/native observations.
- **Current status:** Council framework defined; actual sessions, installations, comparisons, Figma file and PO winner **NOT YET EXECUTED**. Moving an initial bounded experiment earlier than the pre-demo Design Council does not close the final pre-demo UX gate or alter the V2 roadmap.

## Append-only observations

### OBS-000 — 2026-11-07 — Kickoff and evidence boundary

- **Authority:** PO asked for practical integration + live observation rather than another prolonged audit; requested one durable observation file and Council setup.
- **Environment:** GitHub-only scoped observation-file creation. No access to PO's Windows installation from this action; no tool was executed, installed or configured by the file creation.
- **Baseline:** canonical GitHub `v2` at `10510ab0c5a5d413717cf736b1d74d3590b39e2b`; #47/#51/#52 OPEN; PR #48 Draft/unmerged.
- **Observed result:** logging format and Council responsibilities established. **No live pilot result yet**.
- **Next:** continue in an isolated Codex Desktop Windows task worktree; record exact installed versions, bounded configuration actions and first actual use in separate OBS-001+ entries. Do not rewrite OBS-000.

## New observation template — duplicate per real attempt

### OBS-XXX — YYYY-MM-DD HH:mm local — [tool / Council seat / workflow]

- **Status:** PLANNED / PASS / PASS WITH FINDINGS / FAIL / BLOCKED / ROLLED BACK
- **Provenance:** USER_OBSERVED / AGENT_REPORTED / SOURCE_INSPECTED / EXECUTED_LOG / GITHUB_CI
- **Task and reason:** ...
- **Environment:** Codex Desktop/CLI or other host; selected model + thinking; OS; repo branch/worktree; exact candidate/base SHA; synthetic dataset/profile
- **Tool:** official source URL; installed exact version or commit; prior mode -> new mode; installation scope
- **Activation/permissions:** triggered explicitly or automatically; hooks/skills injected; files and settings touched; approved network domains, actual egress; account/API authorization
- **What happened:** actual commands/actions and their results; failures and unexpected side effects
- **Measured effect:** wall-clock, context/token availability if exposed, quality/correctness, comparison with no-tool baseline; mark unknowns as UNKNOWN
- **Evidence:** reproducible safe paths/screenshots/test names; distinguish agent reports from independent checks and actual PO observation
- **Risk, rollback:** unexpected changes, exposure, restoration steps/status
- **Decision:** CONTINUE / ADJUST / PAUSE / REJECT / PO DECISION NEEDED (not automatic ADOPT)
- **Next:** one narrow next action and its permission boundary

## Observation discipline

- Append observations when actual evidence exists; do not invent time savings, token data, tests or Council decisions.
- `LIVE_OBSERVATIONS.md` is a change-tracked repository document, not a real-time autonomous recorder. Each future entry is written in an authorized branch/PR and only reaches canonical `v2` after independent review, CI and distinct PO fast-forward approval.
- Product/engineering decisions approved by the PO also require synchronization to `docs/DECISIONS.md` and relevant DevEx/Design Council issue records. Keep historical contrary decisions visible and explicitly record any new exception or supersession.
