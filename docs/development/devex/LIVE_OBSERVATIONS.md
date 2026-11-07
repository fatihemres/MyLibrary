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


## Live Windows field pilot — 2026-11-08 (D-028; not adopted or integrated)

The original register and OBS-000 above are retained as historical starting evidence.
The following entries record actual execution, not replacements for those initial NOT RUN states.
Entry time windows are approximate session notes; elapsed command times and token counts below
come from the actual recorded results.

### OBS-001 — 2026-11-08 00:05–00:20 +03:00 — Exact-source setup and activation boundary

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, SOURCE_INSPECTED.
- **Environment:** Windows, Codex Desktop; actual current-session metadata identifies
  `gpt-6.1-sol`, `high`. Existing Codex CLI `0.165.0`; no model substitution assumed.
- **Baseline:** live GitHub / `git ls-remote` matched `v2`
  `10510ab0c5a5d413717cf736b1d74d3590b39e2b` and existing pilot branch
  `codex/devex-live-field-pilot-council-20261107` at
  `ef821469abf5230bcd03fc819db3abfca787063b`. Its existing `aa37e42` ledger and
  `ef82146` D-028 commits were verified and preserved. Issues #47/#51/#52 are OPEN.
- **Actions:** fetched that existing branch; Desktop created one dedicated clean worktree
  named `devex-live-field-pilot-council-20261107`; attached the same local tracking branch.
  Read canonical instructions, decisions, ledger and issue boundaries before trials.
  No unrelated worktree, protected ref, product source or real library was changed.
- **Activation finding:** this parent session received automatic developer-level
  `PONYTAIL MODE ACTIVE — level: full`; it cannot serve as a Ponytail-off UI context.
  Installed Ponytail `5.3.3` declares SessionStart, SubagentStart and UserPromptSubmit
  hooks. Source defaults to `full`, with process/config overrides. No hook was manually
  executed or global setting edited by this pilot.
- **Isolation actually tried:** a fresh, ephemeral CLI probe with the flags below reported
  no active Ponytail developer/skill instructions. Each later Council seat repeated that
  context check; its event log contains only an `agent_message`, no tool execution.
  This combines process-level plugin/hook suppression with model-reported context absence;
  it is not an audit of every internal CLI/host operation.

```powershell
$env:PONYTAIL_DEFAULT_MODE='off' # child shell only, never a global/user change
codex exec --ignore-user-config --disable plugins --disable hooks --disable remote_plugin `
  -c project_doc_max_bytes=0 -c model_reasoning_effort='"high"' `
  --ephemeral --sandbox read-only --model gpt-6.1-sol --json -o <local-result> -
```

- **Side effects / limits:** the probe reported model-list refresh timeouts and unsupported
  PowerShell shell snapshots, yet completed successfully. CLI startup also reported failed
  temporary/PATH setup under the restricted environment. No new login/OAuth was needed.
  These runtime attempts are not evidence of persistent configuration changes or network
  isolation. An initial sandboxed GitHub read failed at a blocked proxy; the authorized
  network read succeeded afterward. Source files were not supplied to external tool services.
- **Cost / evidence:** probe usage 14,103 input / 12,288 cached / 372 output tokens as exposed
  by CLI, not an incremental Ponytail overhead measurement. Safe local logs are under
  ignored `.cache/field-pilot/`; credentials, raw session logs and personal paths stay out of Git.
- **Decision / rollback:** CONTINUE isolated trials; global Ponytail remains unchanged.
  End these process overrides by ending their child shell; no persistent rollback is needed.

### OBS-002 — 2026-11-08 00:10–00:12 +03:00 — Graphify versus ordinary source search

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, SOURCE_INSPECTED.
- **Tool / scope:** existing uv-isolated `graphifyy 0.9.99`, CLI `graphify 0.9.99`;
  package metadata points to [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify)
  (Apache-2.0). No reinstall, assistant installer, hook, watcher, global graph or cloud service.
- **Real task:** identify the callers, dispatch path and tests affected by changing
  `wishlist_reopen_acquisition`; verify the graph against `rg` and current source.
- **Executed:** installed `--help` verified the syntax; process-only
  `GRAPHIFY_BACKEND=none`, `GRAPHIFY_QUERY_LOG_DISABLE=1` applied to extraction and queries.

```text
graphify extract . --code-only --out .cache/field-pilot/graph --max-workers 2
graphify query wishlist_reopen_acquisition --graph .cache/field-pilot/graph/graphify-out/graph.json --budget 900
graphify affected wishlist_reopen_acquisition --graph .cache/field-pilot/graph/graphify-out/graph.json --depth 2
rg -n 'wishlist_reopen_acquisition|reopenWishlistAcquisition|reopen_wishlist|reopenAcquisition' src src-tauri scripts
```

- **Measured:** extraction exit 0, **41.712 s**; 129 code files, **1,111 nodes / 3,129 edges /
  41 communities**. Skipped 46 non-code files and potentially sensitive `.npmrc`.
  Six SQL files contributed nothing because optional `tree_sitter_sql` is absent;
  12 code files yielded no symbols. No missing dependency was installed.
- **Comparison:** `rg` exit 0 in **0.069 s**, with 10 matching lines across the Wishlist UI,
  command dispatch, Rust implementation, acquisition tests and recovery tests. Graph query
  exit 0 in **0.878 s**, returning 179 nodes but displaying 35 under the 900-token budget:
  useful UI/Rust/test entry points plus broad neighbors. **`affected` returned no affected
  nodes despite real callers.** The Rust method has an extracted containment edge but no
  incoming caller edge in this graph. Keyword discovery is not a verified cross-IPC call graph.
- **Disk / network:** graph output after query: 48 files / 2,194,609 bytes including AST cache,
  graph, manifest and analysis. Source confirms `none` skips LLM dispatch and the logging-disable
  flag wins; no query-log file was found in the output inventory. No packet trace was collected,
  so zero egress is not claimed. A later restricted-shell `explain` probe with unreachable
  process proxy settings stalled without output and was interrupted; cause UNKNOWN, not an
  offline PASS or confirmed network attempt. The successful commands above remain separate evidence.
- **Evidence / decision:** ignored `graph-extract.log`, `graph-query.txt`, `graph-affected.txt`,
  `rg-impact.txt`; CONTINUE as optional navigation, not a complete impact-analysis authority.
  No measured time saving here: ordinary search was faster and found actual call sites.
  Generated data is retained locally; no cleanup or automatic update is scheduled.

### OBS-003 — 2026-11-08 00:10–00:13 +03:00 — Context7 on-demand API documentation

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, SOURCE_INSPECTED.
- **Tool / activation:** existing connected Context7 `resolve_library_id` / `query_docs` tools,
  explicitly invoked; official source [upstash/context7](https://github.com/upstash/context7)
  (MIT). No installer, project/global configuration rewrite, API key or OAuth action.
  The deployed MCP server version and configuration scope were not exposed and remain UNKNOWN;
  no claim that a project-local server was installed.
- **Real task:** check the Tauri 2 close-listener/unlisten pattern already used by
  `src/components/useUnsaved.ts`; only generic public API questions were transmitted.
  No repository code, local paths, book records or secrets were in either query.
- **Executed:** resolved Tauri 2 to `/tauri-apps/tauri-docs`; queried async close confirmation
  and React unlisten cleanup, then narrowed once to `Window.onCloseRequested`.
- **Measured / usefulness:** first docs query **1.292 s**, second **1.034 s** (tool wall-clock,
  excluding resolution). First returned useful promise/unlisten and React cleanup examples
  linked to the v2 docs; the targeted retry returned migration/general listener material,
  **not the requested close-handler API**. No exact installed patch-version match was established.
- **Comparison:** direct [official Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/#oncloserequested)
  supplied `Promise<UnlistenFn>`, async-handler support and scope-end cleanup that retrieval missed.
  Existing source already handles listener resolution after disposal. No API defect or source fix
  was established. Context7 improved quick cleanup-example access but was less precise for this API.
- **Network / evidence:** remote documentation lookup is intentional; provider-side processing,
  transport destinations and retention were not packet-audited. Tool responses and public source
  links are evidence, not a privacy certification. No auth material is stored in this ledger.
- **Decision / rollback:** CONTINUE explicit generic queries with primary-doc verification;
  stop using the tool to end this on-demand integration, no local installation to undo.

### OBS-004 — 2026-11-08 00:13–00:15 +03:00 — Ponytail bounded engineering review

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, SOURCE_INSPECTED.
- **Tool:** existing [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
  `5.3.3`, MIT; actual parent mode automatic FULL, accepted only for this non-UI trial.
  No reinstall or global mode/hook change. Reviewed its skill, plugin manifest and hook sources.
- **Real task:** review maintainability of `scripts/native-tauri-origin.mjs` against both
  native harness callers and its existing adversarial test matrix. No UI critique or product edit.
- **Useful output:** keep the one shared native-origin parser and distinct page-selection versus
  resource-accounting functions; a generalized allowlist framework or new URL dependency adds
  nothing for these three fixed origins. Retain validation rather than compressing the parser.
- **Checked counterexample:** the superficially shorter `new URL(value).origin === trusted`
  accepts `http://user@tauri.localhost/` and `http:tauri.localhost`; the current helper rejects
  both. This is a deliberately tested candidate simplification, **not a claim that the skill
  explicitly recommended it**. Twenty Node assert checks passed (16 boundary assertions and
  four comparison assertions); no source change or new tracked test framework was needed.
- **Limits / overhead:** generic 'write less code' advice was not evidence of a needed edit.
  There is no controlled non-Ponytail paired model run, measured token saving, isolated hook
  runtime or causal quality improvement. Incremental overhead UNKNOWN. Automatic FULL and
  lifecycle hooks are real interference risks for D-023, even though this review preserved safety.
- **Evidence / decision:** ignored `engineering-review.mjs`; CONTINUE deliberate non-UI trials,
  PAUSE any broader/global adoption decision. Global configuration remains as found; Council
  work used the independently checked process-isolation route in OBS-001 instead.

### OBS-005 — 2026-11-08 00:15–00:19 +03:00 — Independent first Council proposals

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, AGENT_REPORTED.
- **Scope:** genuine first skill-assisted **text proposals**, not full tool-engine execution,
  visual/runtime QA, native Windows acceptance, product implementation or adoption.
- **Sources / installation:** manual project-local files under ignored `.cache/field-pilot/`:
  - [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), MIT,
    `4f2dbb67e64969a9a30ab00742f2d55d66ddec2b`; shallow clone; supplied its actual skill text.
  - [Taste](https://github.com/Leonxlnx/taste-skill), MIT, skill `2.5.1`,
    `f6b76575f949707b4e3c37cd86cb44b0b98643e8`; exact-SHA skill downloaded through GitHub API.
  - [Impeccable](https://github.com/pbakaus/impeccable), Apache-2.0, skill `4.8.0`,
    `687bc381bc9091bf252c0a05303640561014a425`; exact-SHA skill and Operate reference via API.
- **Actual side effects / safe fallback:** a full Taste shallow clone stalled and was interrupted;
  its partial files remain; the later process check found no surviving Taste clone process.
  The queued full Impeccable clone never ran. No installer was executed.
  Taste's skill declares a Stop command hook; it was **not registered or run**, nor were its gate,
  random-deal, image-search or asset scripts. Impeccable's context loader can download a binary;
  that launcher/detector was NOT RUN. Its permitted planning fallback was used, not represented
  as engine integration. Missing references/runtime were disclosed in outputs. No external
  Figma file, account link, persistent design hook, production UI or global setting was created.
- **Local UI UX Pro Max use:** `python <skill>/scripts/search.py 'long title readability'
  --domain ux --max-results 3`, exit 0 in **1.573 s**. Real local CSV matches: Truncation,
  Line Length, Number Formatting. First was directly relevant; latter two were generic/contextual,
  not proof that prose line-length guidance fits a compact card. No persist flag or remote assets.
- **Independence / activation:** three separate ephemeral `gpt-6.1-sol` / high CLI contexts,
  using OBS-001's plugin/hook suppression, no inherited conversation and `project_doc_max_bytes=0`.
  Each received only the same frozen synthetic brief plus **its one** official skill (UI UX also
  received the actual local search output; Impeccable received Operate guidance). Each reported
  Ponytail absent and emitted no tool calls. No seat saw another seat's proposal before completion.
  Distinct skills share one model; this is not independent human expertise or model diversity.
- **Frozen input:** local `council-brief.md`, SHA-256 `6fa6687be7335073303f993f31f05596f584b8970d8c41f98aa60f5b7d9e5ebe`.
  The complete shared text follows, so the comparison can be repeated without private artifacts.

#### Frozen shared brief v1

##### Frozen Council brief v1 — synthetic, planning only
Baseline: MyLibrary v2 10510ab0c5a5d413717cf736b1d74d3590b39e2b; pilot source ef821469abf5230bcd03fc819db3abfca787063b has documentation-only additions.
Task: one small independent proposal for the existing Wishlist and Dashboard. No production implementation, winner, new navigation system, backend or acquisition behavior change. Respond in English, at most 450 words plus a small text wireframe. Distinguish source-derived inventory, hypothesis and unexecuted validation. No screenshots are supplied, so do not claim pixel inspection.
Source-derived inventory: Windows-first local/offline Tauri 2, React and CSS. Wishlist has separate active-count/currency budgets, search/sort/status filters, gallery/list switching, cover, status/priority, title/author/ISBN, price, retailer links and explicit acquire/open-copy/unlink actions. Gallery uses minimum 220px columns, 20px card padding and flex-column cards. Dashboard has four main stats (total, finished, reading, on-loan), secondary stats including active wishes, reading-progress rows, recently-added rows, favorites and expandable insights. These facts describe current UI structure, not a verified visual defect.
Frozen synthetic case: six owned independent physical copies; two finished, one reading at 45%, one on loan. Three Wishlist intentions: two Wishing, one Fulfilled linked to a copy. Synthetic titles: 'The Very Long Atlas of Quiet Reading Rooms and Everyday Library Journeys'; 'Sessiz Okuma Odalarının ve Gündelik Kütüphane Yolculuklarının Çok Uzun Atlası'; 'Compact Sample'. Authors: 'Synthetic Author Alpha; Synthetic Author Beta; Synthetic Author Gamma'. Prices: TRY 420.00 and USD 18.50, separate active budgets, no conversion or combined currency total. One missing cover, one plain synthetic color cover, one long title. No personal books or real media.
Boundaries: Wishlist intention, Edition and Physical Copy are distinct; fulfilled wishes keep history and leave active count/budget; explicit unlink returns Wishing and retains the existing copy. Confirmation must remain deliberate with safe Cancel, focus return and unsaved-change protection.
Compare at CSS viewports 390, 900x620, 1024x768 and 1280x800; Windows real 125/150% DPI remains a separate later test. EN/TR expansion, light/dark, keyboard/focus, labels, reduced motion and missing-cover fallback must be covered. No global overflow hiding, text shrinking to conceal data, remote fonts/assets, photography search, shader/motion framework, new dependencies, external uploads or hooks. Preserve accessible full text even if preview is limited.
Deliver: (1) one bounded direction and tiny Wishlist/Dashboard wireframe; (2) three concrete recommendations tied to this case; (3) one concern/tradeoff and relative implementation cost; (4) exact follow-up checks still needed. This is a proposal, not product acceptance or a measured accessibility score.

#### Executed seat cost (CLI-exposed, not billing or incremental skill overhead)

| Seat | Seconds | Input tokens | Cached input | Output tokens |
| --- | ---: | ---: | ---: | ---: |
| UI UX Pro Max | 55.499 | 19,152 | 12,288 | 1,085 |
| Taste | 48.690 | 23,085 | 12,288 | 1,120 |
| Impeccable | 52.222 | 18,391 | 12,288 | 1,129 |

Independent outputs are reproduced verbatim below. Their recommendations and estimated costs
are **agent proposals**, not verified behavior, approved requirements or implementation authorization.


#### Independent seat — UI UX Pro Max

Ponytail active in visible context: NO

Applying the supplied UI UX Pro Max text to one independent planning proposal. No tools, files, screenshots or runtime were inspected. The supplied search supports expandable title previews; unavailable reference and React guidance are replaced by the skill’s supplied priority-table defaults.

**Source-derived inventory:** The brief describes Wishlist filters, view switching, separate currency budgets, metadata and explicit actions; gallery cards have a 220px minimum width and 20px padding. Dashboard contains four main stats, secondary stats and reading/content sections. These are structural facts, not verified defects.

**Bounded direction — hypothesis:** Improve text hierarchy and wrapping within the existing Wishlist cards and Dashboard rows. Keep the current navigation, sections and domain behavior. This may make long EN/TR content easier to scan while keeping actions identifiable.

```text
WISHLIST
Active 2 | TRY 420.00 | USD 18.50*
Search [          ]  Filters [wrap]  Gallery/List
[Cover / fallback]  Wishing · Priority
Long title preview…
[Show full title]
Authors · ISBN
Price · Retailer
[Acquire]
Fulfilled item: [Open copy] [Unlink]

DASHBOARD
Total 6 | Finished 2 | Reading 1 | On loan 1
Active wishes 2
Reading: Long title… [Show full title]
[Progress bar] 45%
Recently added · Favorites · Insights [expand]
```

*Budget placement assumes the two supplied prices belong to the two Wishing intentions; confirm fixture assignment.*

Three recommendations:

1. **Make long text recoverable.** Offer a two-line title preview with a labeled, keyboard-operable expansion control when needed. Expansion displays the complete title without navigation; accessible names retain full text. Allow authors and ISBN to wrap. Reserve consistent cover space for the missing-cover fallback and plain synthetic cover.

2. **Let controls and rows reflow.** At narrow widths, stack metadata and actions; wrap filters and currency summaries. Allow gallery columns to fit available width without clipping. Dashboard stats can become a 2×2 arrangement; reading rows stack their title and progress. Keep readable text sizing, existing local typography, 44×44px targets and at least 8px control spacing.

3. **Clarify state beside actions.** Keep Wishing/Fulfilled text visible independently of color. Fulfilled history stays available while leaving active count/budgets. Keep acquire, open-copy and unlink distinct. Preserve deliberate confirmations, safe Cancel, focus return and unsaved-change protection; unlink retains the physical copy.

**Tradeoff and relative cost:** Expansion produces variable card heights and additional keyboard stops. Estimated low-to-medium React/CSS effort; confirmation and focus regression checks account for much of the uncertainty.

**Unexecuted follow-up checks:** Compare all three titles and authors at CSS viewports 390, 900×620, 1024×768 and 1280×800, in EN/TR and light/dark. Verify wrapping without global overflow hiding or text shrinking; full-text access; missing-cover labeling; keyboard order, visible/unobscured focus and screen-reader labels; contrast; reduced motion; confirmation Cancel/confirm/focus return and unsaved edits; fulfilled/unlink count and separate-currency behavior. Test Windows 125%/150% DPI separately later. No accessibility score or product acceptance is asserted.


#### Independent seat — Taste

Ponytail active in visible context: NO

Kind: software — existing local/offline library application.

Applying the supplied **design-taste-frontend** text as a planning lens: equal content edges, one visual system, plain action labels and visible focus. The frozen brief limits this to application UI; landing-page heroes, screen-height sections and decorative moments are outside this proposal.

**Bounded direction — consistent reading alignment.** Give Wishlist and Dashboard the same alignment between titles, metadata and actions. Preserve their existing structure and behavior.

**Source-derived inventory.** The brief describes Wishlist’s separate active counts/currency budgets, filters, gallery/list modes and explicit actions; gallery cards use minimum 220px columns, 20px padding and flex columns. Dashboard contains four main statistics and supporting sections. These facts establish structure, not a visual defect. No production source or screenshots were inspected.

**Three recommendations — hypotheses:**

1. **Wishlist: make long text govern card height.** Place title and author beside the cover; let both wrap without shrinking. Keep ISBN and price readable, and align action groups consistently where available space permits. At 390px, propose one column with stacked controls. Preserve full text in both view modes. Use a stable missing-cover frame with an accessible fallback; retain the plain synthetic color cover.

2. **Keep intention state legible.** Show “2 active wishes” and separate TRY/USD budget summaries together. Keep the fulfilled intention visibly labeled and its linked-copy action explicit. Preserve acquire, open-copy and unlink semantics. The supplied TRY 420.00 and USD 18.50 are price fixtures; their assignment to active intentions is unspecified, so no budget totals are inferred.

3. **Dashboard: establish a compact shared rhythm.** Align the four main statistics and supporting rows to the same content edges. Keep “Active wishes: 2” secondary. Pair the reading title with a visible “45%” label and progress indicator. Reuse existing typography, surfaces and focus treatments across both screens.

```text
WISHLIST
2 active wishes    TRY budget | USD budget
Search · Sort · Status · Gallery/List
[Cover] Long title wrapping
        Author · ISBN · Status · Priority
        Price · Retailer
        Explicit actions

DASHBOARD
Total 6 | Finished 2 | Reading 1 | On loan 1
Active wishes 2
Reading title                 45% [====-----]
Recently added · Favorites · Expand insights
```

**Tradeoff and cost.** Full wrapping makes cards taller and less uniform. Relative cost: small-to-medium presentation work; actual component coupling is unknown.

**Unexecuted follow-up checks.** Compare 390, 900×620, 1024×768 and 1280×800 with both long EN/TR titles and all three authors, both themes and cover variants. Check overflow, text completeness, labels, contrast, keyboard order, visible focus, 44px targets and reduced motion. Exercise deliberate confirmation, safe Cancel, focus return and unsaved-change protection; verify fulfilled exclusion and unlink retaining the copy. Test Windows 125/150% DPI separately.

References, runtime and gates were unavailable under this observation’s boundaries. No acceptance or accessibility score is claimed.


#### Independent seat — Impeccable

Ponytail active in visible context: NO

Applying the supplied Impeccable Operate guidance: one bounded proposal to improve scanning through consistent summary placement and content alignment across Wishlist and Dashboard.

**Source-derived inventory:** The frozen brief describes Wishlist controls, gallery/list views, explicit copy actions, and separate currency budgets; Dashboard has four primary stats and supporting sections. Gallery columns have a 220px minimum with 20px card padding. These are supplied structural facts, not verified defects.

**Limitation:** The binary context loader was NOT RUN. Project context, additional references, production source, and screenshots are unavailable under this scope. This proposal uses only the supplied skill and frozen brief; no visual inspection or validation occurred.

**Hypothesis:** A consistent summary-to-content hierarchy could make the synthetic case easier to scan while preserving existing navigation and behavior.

```text
WISHLIST
Active 2       [TRY budget] [USD budget]
[Search.................................]
[Sort] [Status]             [Gallery/List]
[Cover] Title wrapping across lines
        Author · Status · Priority
        Price · Retailer links
        [Existing explicit actions]
Fulfilled history: 1 (under current filters)

DASHBOARD
Total 6 | Finished 2 | Reading 1 | On loan 1
Active wishes 2 · Other secondary stats
Reading       [Title................] 45%
Recently added
Favorites
[Expand insights]
```

Three recommendations:

1. **Make status accounting legible.** Keep active count and currency budgets together above Wishlist results. Fulfilled wishes remain available through existing filtering and history behavior but contribute neither active count nor budget. Keep TRY 420.00 and USD 18.50 currency-specific; never convert or combine them. Dashboard’s active-wishes statistic should agree with Wishlist.

2. **Let content determine height.** Keep readable system typography and allow the long English/Turkish titles and author string to wrap. At narrow widths, stack controls and use one gallery column; let actions wrap without overlap. Preserve accessible full title, author, and ISBN text. Use a consistent local missing-cover placeholder with an appropriate accessible label.

3. **Align task information across surfaces.** Use consistent label/value spacing for Dashboard statistics, 45% reading progress, and Wishlist metadata. Distinguish status with text as well as color. Keep Acquire, Open copy, and Unlink explicit. Preserve deliberate confirmation, safe Cancel, focus return, and unsaved-change protection.

**Tradeoff and relative cost:** Wrapping increases card height and reduces visible items. Estimated low-to-medium implementation cost for layout and styling, subject to source review.

**Unexecuted follow-up checks:** Render at 390px width, 900×620, 1024×768, and 1280×800 in EN/TR and light/dark. Check wrapping, overflow, missing covers, labels, contrast, keyboard order, focus, applicable interaction states, and reduced motion. Verify fulfillment accounting and unlink returning Wishing while retaining the copy. Exercise confirmation cancellation and unsaved edits. Test real Windows 125%/150% DPI separately afterward.

This is an independent proposal, not acceptance or an accessibility score.

### OBS-006 — 2026-11-08 00:18–00:19 +03:00 — Neutral Council comparison

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, AGENT_REPORTED.
- **Method:** a fourth separate ephemeral CLI context with the same Ponytail-off controls,
  no design skills stacked, received all three outputs **after** they completed plus the shared
  frozen brief. No tools were called; no screenshots or production source were supplied.
- **Cost:** 33.927 s; 16,852 input / 12,288 cached / 681 output tokens. No winner selected.
  The following comparison is preserved verbatim, including uncertainty about fixture prices.

Ponytail active in visible context: NO

The proposals share a presentation-focused scope. Their clearest difference is how they expose long text; their secondary emphases are alignment and summary accounting.

| Seat | Distinct proposal and potential benefit | Usability concern | Relative implementation cost |
|---|---|---|---|
| **uiux** | Two-line title previews with explicit expansion; responsive control wrapping and a possible 2×2 Dashboard stats arrangement. Could support compact scanning while retaining full-text access. | Expansion adds interaction and keyboard stops; expanded cards vary in height. Its budget wireframe assumes the two prices belong to active wishes, explicitly requiring confirmation. | Low–medium estimate, with added React state, expansion controls and focus checks. |
| **taste** | Full title/author wrapping, cover-adjacent metadata and shared content edges. Could make information readable immediately and strengthen consistency between screens. | Taller cards reduce visible items; aligning action groups becomes harder with unequal content lengths. Explicitly avoids inferring budget totals from unassigned prices. | Small–medium presentation estimate; component coupling remains unknown. |
| **impeccable** | Full wrapping plus consistent summary placement and cross-screen active-wish accounting. Could clarify the relationship between Wishlist summaries and Dashboard statistics. | Taller content reduces density. The proposed fulfilled-history summary needs review against existing filter behavior and available space. | Low–medium layout/styling estimate; accounting verification could expose additional work. |

These are text-only first proposals: wireframes communicate intended hierarchy but cannot establish visual balance, discoverability or interaction quality. Separate seat outputs using a shared model may contain correlated assumptions, so agreement is not independent validation. Without source inspection or runtime, layout behavior, component reuse and effort remain uncertain. The specified viewport, EN/TR, theme, keyboard, confirmation and separate Windows DPI checks remain unexecuted.

**PO decision gate:** Pending PO review of scope, fixture assignments and required validation before any direction or acceptance decision.

- **Evidence / decision:** local `council-*-prompt.txt`, `council-*-result.md`, metrics and
  JSONL event logs remain ignored. CONTINUE first-proposal discussion only; the PO must select
  scope/direction separately. No screenshot/mockup or native/DPI run was executed: this first
  bounded text comparison required no app launch, dependencies, DB or WebView2 profile.
  The text wireframes above are proposals, not captures of MyLibrary.
- **Risk / rollback:** hooks/gates/binary engines were not adopted; end ephemeral CLI processes
  to end activation. Preserve local artifacts; no automatic removal. A later render-based
  comparison requires its own safe synthetic app session and explicit implementation scope.

### OBS-007 — 2026-11-08 — Candidate validation and publication boundary

- **Status / provenance:** PASS WITH FINDINGS / EXECUTED_LOG, SOURCE_INSPECTED.
- **Scope:** append this ledger, add its index link and a factual status/verification pointer.
  Existing D-028 and OBS-000 remain intact. Product source, dependencies, workflows, migrations,
  settings, original worktrees and real personal data are outside the diff.
- **Drafting correction:** a later formatting pass normalized old line endings; the byte-prefix
  assertion rejected it. Restored the exact original prefix from the saved pre-edit bytes;
  the append-only assertion then passed. No historical observation text was revised.
- **Executed checks:** twenty focused Node assertions; ledger-prefix and frozen-brief consistency;
  local Markdown link/anchor checks; full tracked/untracked/ignored inventory and `git diff --check`.
  Final exact committed SHA, independent read-only evidence review and published PR SHA are
  recorded in the Draft PR because a commit cannot embed its own identity.
- **Not run:** app/Rust/native/visual suites, screenshots and real Windows DPI checks; no product
  code changed or application was launched. Historical PO/CI results do not certify this pilot.
- **Local artifacts:** at the pre-publication inventory, ignored pilot cache had 798 files /
  24,991,584 bytes in the initial non-hidden PowerShell view. The later full inventory including
  hidden files counted **850 files / 41,112,047 bytes** (official skill files, partial clone,
  source graph, prompts, outputs and logs; later validation/review files add to it). No credentials or app data
  were deliberately collected. These artifacts are not staged or uploaded.
- **Boundary:** independent exact-SHA review precedes normal push and one Draft PR targeting
  `v2`, linked to #47/#51/#52. Verify published HEAD, then STOP. New Foundation, CodeQL and
  separate security evaluation remain **PENDING / not polled**. No integration, adoption,
  issue closure, global rollout, deletion or product-design selection follows from this record.
