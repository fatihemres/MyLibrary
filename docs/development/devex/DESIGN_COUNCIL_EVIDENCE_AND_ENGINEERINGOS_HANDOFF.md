# MyLibrary — Design Council Evidence Ledger & EngineeringOS Transfer Pack

**Prepared:** 2026-11-09 (Europe/Istanbul)  
**Document state:** `DISCOVERY / RESEARCH RECORD / PUBLIC-SAFE DRAFT-PR CANDIDATE — NOT INTEGRATED`  
**Proposed canonical MyLibrary repository path:** `docs/development/devex/DESIGN_COUNCIL_EVIDENCE_AND_ENGINEERINGOS_HANDOFF.md`  
**Intended secondary destination:** EngineeringOS **Private Workspace** for full context and a separately reviewed, generalized subset for **Public Core**.  
**Authority:** MyLibrary PO retains product/design/roadmap/implementation/integration decisions. EngineeringOS governance remains separate.  
**Reconciliation:** Live public GitHub status verified 2026-11-09; other results are marked as supplied Codex reports, submitted files, or PO observations. This document does not silently promote any research result to acceptance.

> **Read first:** This is a living, source-attributed, append-oriented learning record for Design Council discovery. It is **not** an adopted design system, implementation specification, required engineering workflow, tool adoption, formal UX acceptance, or an EngineeringOS integration. A locally generated Markdown file is not a GitHub commit or PR. Only a separately authorized, reviewed repo change can make the candidate canonical.

## 1. Why this record exists

MyLibrary's PO wants to preserve the full practical learning of the UI/UX Council experiments, including failed approaches, real collaboration improvements, visual feedback, motion-design hypotheses, costs, and opportunities for an equal-authority cross-disciplinary design team. A future EngineeringOS transfer should carry **what was tried, what the evidence actually demonstrates, what did not work, and what is still undecided**—not an overconfident summary claiming that tools, agents, or proposed product policies have been approved.

The immediate investigation sequence is:

1. **First:** re-run the existing three participants (UI UX Pro Max, Taste, Impeccable) with **equal creative authority across all dimensions**, using the existing successful isolated setup, on a bounded v3 visual/motion improvement task, producing **one shared artifact**, with real rendered-motion review.
2. **Only after measuring stage 1:** introduce optional methods, reference libraries, or extra specialists **one at a time**, under separate scoped permissions and a fair baseline, to see whether they add measurable value.
3. **Preserve results:** append dated experiment entries, sourced artifacts, outcomes, costs and PO feedback without overwriting earlier records. Transfer generalized lessons to EngineeringOS only after separation and rights/privacy review.

This is a staged research direction from the PO's 2026-11-09 conversation, **not** a permission to add dependencies to production, install tools, open new cloud accounts, change global skills/hooks, or merge a PR.

## 2. Evidence taxonomy and integrity rules

| Marker | Meaning | May establish | Must not be inferred |
| --- | --- | --- | --- |
| `GH-LIVE` | GitHub connector read of an actual ref/issue/check during this preparation | Repo state at that instant | Windows acceptance or safety of local pilots |
| `PO-DIRECT` | PO's statements, preferences, explicit authorizations, or screenshots in conversation | PO's report and design preference/observation | Codex internal execution facts not independently seen |
| `AGENT-REPORTED` | Codex Desktop final report copied by PO | Attribution and what agent claims | Verified model backend, honest vote, exact test result or cost without independent logs |
| `UPLOADED-SOURCE` | Files actually supplied in the conversation and locally inspected | Content and byte hash of that specific attachment | Unavailable locally referenced files or missing runtime measurements |
| `VISUAL-OBSERVED` | Visible screenshots reviewed in conversation | Static composition, typography, density, visible control design | Animation timing/FPS, semantics, accessibility or real native performance |
| `WEB-REFERENCE` | Dated upstream or official public documentation | Candidate capabilities and source claims | Production compatibility, licensing completeness or implementation permission |
| `HYPOTHESIS` | Assistant/PO design proposal awaiting controlled test | The candidate experiment rationale | Accepted standard, measured benefit or authorization |

**Always distinguish:** design-candidate vote vs. exact pixel review; browser test vs. native Tauri/WebView2+Windows DPI; reported PASS vs. personally observed behavior; implementation vs. GitHub integration; GitHub PR CI vs. PO acceptance; current public source vs. historical handoff.

### Do not silently resolve conflicting evidence

- Earlier conversation snippets and handoffs are historical snapshots. Live `v2` and current versioned decisions supersede dated status statements.
- A Council `ACCEPT` is a vote on an identified **candidate version**, not blanket endorsement of a later HTML mockup or policy.
- A successful synthetic mockup is evidence of a **research prototype**, not compatibility with the real MyLibrary app.
- Where no raw video/CLI log was supplied, retain `AGENT-REPORTED` or `PO-DIRECT` status.
- Do not invent missing exact SHA, render FPS, current provider model ID, cost, license clearance, or additional PO decisions.

## 3. Live repository checkpoints (2026-11-09)

### MyLibrary

- Repo: [`fatihemres/MyLibrary`](https://github.com/fatihemres/MyLibrary), **public**, canonical branch `v2` protected.
- Verified exact `v2` HEAD: `10510ab0c5a5d413717cf736b1d74d3590b39e2b`.
- [Draft PR #58](https://github.com/fatihemres/MyLibrary/pull/58): OPEN, unmerged, HEAD `d9b43c7479c3307398259ba0854534c72f7e8e6a`; 8/8 visible PR check runs successful (Windows x64, Linux x64, macOS Intel, macOS Apple Silicon, JavaScript/TypeScript CodeQL, Rust CodeQL, Actions CodeQL, additional CodeQL check). **Do not modify/rebase/merge this PR for this research log.**
- [Draft PR #48](https://github.com/fatihemres/MyLibrary/pull/48): also OPEN/unmerged historical research PR, do not reuse or rewrite.
- [#33 Collections](https://github.com/fatihemres/MyLibrary/issues/33): OPEN, discovery/planned; [#52 Design Council](https://github.com/fatihemres/MyLibrary/issues/52): OPEN, controlled UX discovery; [#27 UX QA](https://github.com/fatihemres/MyLibrary/issues/27): OPEN; [#51 tool pilot](https://github.com/fatihemres/MyLibrary/issues/51) and [#47 DevEx](https://github.com/fatihemres/MyLibrary/issues/47): OPEN.
- Canonical policy: `AGENTS.md`, `docs/DECISIONS.md` (**D-023** Ponytail UI/UX OFF, **D-024** Council planning), `docs/v2/ROADMAP.md`, `PROJECT_STATUS.md`, `VERIFICATION.md`, architectural safety documentation. **The latest chat-level equal-authority method is still a research direction, not yet reconciled into D-024.**
- Repo `package.json`: React 19, Tauri 2, Lucide, etc.; **no explicit Motion, GSAP or React Spring dependency** at inspection. `src/styles.css` has a 0.12 s background transition on buttons; this is not proof that all other UI motion is absent. React `^19.0.0` is only a semver range; do not claim exact runtime version without inspecting lockfile and environment.

### EngineeringOS

- Repo: [`fatihemres/EngineeringOS`](https://github.com/fatihemres/EngineeringOS), public; current verified `main` HEAD `2f31e248bf82f64870bb9591aafdfc53261add19` (not the older `617c0a...` snapshot).
- Historical PR #10 is now **MERGED**, not pending; recheck its exact implementation and current policies before any follow-up transfer.
- Prior standing product boundary: **Public Core + Private Workspace**. Use reusable, sanitized principles in the public repository; full project-specific/raw conversations, personal artifacts and private execution context remain in the private workspace. The MyLibrary source-of-truth remains MyLibrary; EngineeringOS does not override its decisions.
- Existing EngineeringOS touchpoints (inspection of current `main` directories): `workflows/ui-ux-craft.md`, `workflows/multi-agent-feature.md`, `docs/CAPABILITY_NETWORK.md`, `docs/RESEARCH_IMPORT.md`, `docs/PRIVACY.md`, `docs/DECISIONS.md`, and the P0 handoff/journal materials. These are **review candidates**, not files already modified by this record.

## 4. Dated experimental sequence: complete known milestones

### 4.1 Early groundwork: controlled isolation, deterministic harness (historical)

- `AGENT-REPORTED` / prior discussion: Council design initially investigated independent UI UX Pro Max, Taste and Impeccable contexts, while avoiding accidental cross-skill instruction stacking and Ponytail injection.
- Some exploratory tests passed **62/62 deterministic host-parity checks**; this validated harness assertions, **not live three-way debate or visual quality**.
- Six unexpected host developer-skill references retained `UNKNOWN` provenance. These are a disclosed residual provenance risk, not proof of malicious activity or safe operation.
- First attempt at a real live CLI session was **BLOCKED — AUTHENTICATION**: one CLI call attempted, zero model replies. This was an execution obstacle, not evidence of Council design failure.
- Later isolated CLI profile was signed in through the **official interactive browser flow**; there was a reported successful model probe without copying authentication material from the normal profile. An initial native probe reported Ponytail injection, which motivated use of the separately authenticated isolated CLI profile.

### 4.2 First true live Council — compact list B-X2 (`v001`)

- **Task:** compact Windows desktop library management presentation, preserving user grid/list preferences and Edition/Copy identity.
- `AGENT-REPORTED`: genuine independent initial opinions from A/B/C, the same `v001` candidate, three actual explicit ACCEPT votes, no actual OBJECT/rebuttal. **Real one-round consensus**, not a demonstrated conflict-resolution cycle.
- Reported calls: **10/18 attempted, 9 completed**, one quota-related failure. Approximately **140,393 input / 5,617 output tokens** in reported CLI usage; probe usage and money cost unknown. Reported execution phases ~5m19s, excluding waits.
- Result: plausible functional consensus; no visual QA or working native product acceptance.
- Experiment identifier (portable only): `council-live-debate-20261109-02`. Local originals not uploaded to this conversation; archive with provenance in private storage before claiming hash-level verification.

### 4.3 Collections semantic Council — `v002` (`COLLECTIONS-COMPLEX-01`)

- **Task:** manual + smart collections, Edition/Copy typed membership, Wishlist open policy, series review, archiving/recovery, saved rules, responsive desktop semantics.
- `AGENT-REPORTED`: **18 calls attempted, 17 completed** (one mockup call timed out); ~**531,260 input / 52,758 output tokens**; 34m10s reported CLI execution; monetary cost unknown. Ten candidate proposals received three final `ACCEPT` votes each on common `v002` decision hash `7d026e8c83a633bd28f56dc155d1f4f53ad783fd39d219044fea1e5bc3d1314c` (hash refers to the **candidate decision**, not necessarily the Markdown file bytes).
- `UPLOADED-SOURCE`: full Council transcript, decision document and one HTML mockup were supplied and inspected. Their exact uploaded-attachment byte hashes appear in §10.
- **Actual evidenced peer criticism:** A changed initial one-witness Copy-group recommendation after B/C demonstrated independent Copy witnesses; B withdrew misleading ownership vocabulary; C dropped an undefined “material changes” threshold and specified complete inspectable result deltas/revision-bound review. These are documented, concrete changes, not invented disagreements.
- **Critical limitation:** The shared v002 decisions were voted on; the mockup was **authored separately by A**. B/C did **not** vote on the actual HTML rendering/pixels. The first visual call timed out. Three experts accepting a textual specification did not yield a visually refined interface.
- `AGENT-REPORTED`: 32/32 mockup interaction, 74/74 recording, and 11/11 delivery checks passed; neither browser checks nor candidate hashes imply actual native app quality.
- `VISUAL-OBSERVED`: HTML looked like a generic management panel: excessive card height/empty space, low book-cover presence, weak collection-opening journey, over-technical Smart UI. Good semantic discovery, weak visual product design.

### 4.4 Collaborative Collections design studio — *The Reading Table*, `v3`

- New working premise: **one team, one shared design**, not three alternatives delivered to the PO. All participants see and critique real rendered outputs, not only a candidate document.
- `AGENT-REPORTED`: A/B/C jointly reviewed actual renders twice; all rejected `v1` visuals; revised shared prototype passed through later revisions and the same `v3` was declared **ready for PO visual assessment**. B reportedly withdrew its competing tray layout after seeing the final renders.
- Reported **21 completed CLI calls**, **503,612 input / 86,739 output tokens**, money cost unknown; **48 base UI + 7 narrow-window/reduced-motion checks** successful in reported run.
- Local research identifier: `council-collections-design-studio-v1`; final subpaths reported `FINAL_DESIGN/`, `FINAL_SHOWCASE.md`, `FINAL_REPORT_TR.md`, `COUNCIL_COLLABORATION.md`, `PO_OPEN_DECISIONS.md`, `DESIGN_CONTINUATION.md`. **The actual final HTML/JS and full collaboration log were not uploaded in this conversation; do not claim source verification.**
- `VISUAL-OBSERVED` / PO screenshots: stronger aesthetic identity—warm paper surfaces, dark green sidebar, editorial/serif display headings, synthetic full covers, collection browsing, real grid/list modes, Manual selection and Smart recipe preview in rendered screens. Stronger than semantic mockup.
- `PO-DIRECT`: PO described the result as a positive, substantial development and **6–7/10 first impression**, while keeping visual direction and implementation acceptance OPEN. Assistant also assessed ~6/10 as subjective design feedback, **not a quantitative benchmark**.
- Visible issues: misfit book-cover typography/wrapping; oversized repeating collection presentation; excessively tall collection list rows; Grid/List content and selector abruptly jumping; native/standard-looking buttons/selects; disclosure titled “Description · optional” opening abruptly; 900px Smart dialog and advanced section dense, scroll and sticky footer visually awkward; technical terminology/localization awkwardness. Photos of two expanded/collapsed description states and view toggle indicate abrupt state change as **PO observation**; still images alone cannot prove animation duration or measured frame rate.
- **Acceptance boundary:** Council's `READY FOR PO REVIEW` ≠ PO design approval. No Tauri/WebView2 125–150% DPI, native screen reader, real persistence, formal a11y certification, security verification or production integration evidenced.

### 4.5 2026-11-09 PO motion and design discussion (NEW direction)

- PO finds motion largely absent or abrupt (“çötenk”): description disclosure, Grid/List switch, buttons, selectors, Smart advanced expansion and modal transitions need more seamless, purposeful behavior. Speed and responsiveness are appreciated; **do not make the UI slow or theatrically animated**.
- PO wants original/niche visual craft and experiments with specialist methods/tools, but has **NOT adopted** a particular animation library, new permanent team member, style, final product UI, or design policy.
- PO and advisor explored fixed roles vs shared creative authority. **New preferred research method:** all three members can propose, criticize and improve **every dimension** (visuals, motion, UX, accessibility, semantics). Distinct skills are *sources of perspectives*, not zones of exclusive decision rights. Avoid “A owns UX, B owns beauty, C owns QA” as restrictive silos.
- Equal authority does **not** eliminate quality gates, evidence requirements, independence at ideation, or final PO product authority. Avoid both premature agreement and endlessly forced dissent.
- PO approved the exploration sequence **first existing trio, then optional tools/specialists only after observing outcomes**, with explicit project-memory preservation and future EngineeringOS transfer; no final Council method or production-stack decision recorded.

## 5. What the team model should retain

**Research hypothesis:** *Equal-authority, cross-disciplinary, evidence-driven collaboration will produce a better single shared design than fixed exclusive specialist lanes.* This is not yet a controlled causal finding; the previous pilots changed prompts, workflows, evidence availability and output medium at the same time.

**Working principles to test** (not mandatory EngineeringOS defaults):

1. **Equal creative scope:** every participant may propose visual direction, interactions, animation, information hierarchy, a11y and technical feasibility; no one is told to “stay in their lane”.
2. **Independent first thinking:** each begins from the same frozen, factual brief and baseline to reduce first-speaker anchoring; specialist skills may shape ideas without restricting their allowed scope.
3. **Genuine reciprocal critique:** actual shared sketches/prototypes and actual objections; peer arguments can change views. Preserve the original concern and reason for resolution.
4. **Collaborative convergence:** multiple internal alternatives are welcome; PO receives **one jointly refined final**, with transparently disclosed substantial unresolved questions, not a mandatory gallery of three competing finals.
5. **Visual/audio-motion evidence when relevant:** final screenshot for composition, **recorded video or frame sequence** for animation; all specialists must genuinely review the same build/revision, including post-revision visuals.
6. **Nontrivial quality gate:** interaction purpose, polished visual hierarchy, typography, density, EN/TR, keyboard/focus, color, reduced-motion, rapid toggles and narrow/large viewport check; automation PASS alone does not validate taste.
7. **PO feedback loop:** preserve the latest team-approved design; send targeted PO criticism back to all three; expand alternatives internally, critique, converge, revise and show one new final. Do not re-vote unchanged product constraints.
8. **Permissions and source-of-truth:** participant consensus never approves product scope, dependencies, repo mutation, release or EngineeringOS policy. Real MyLibrary user data remains untouched.

### Why not entirely unconstrained collaboration?

Unbounded “do whatever you want” may yield groupthink, duplicate model work, hidden critical checks and unjustified claims of success. Use a shared **outcome contract** and independent **review gates**, but **no rigid creative role monopoly**. Evaluate quality by observed deltas, not by unanimous vote count.

## 6. Motion + distinctive UI research candidates (NOT adopted)

| Candidate | Research utility | Risk / evidence to gather | Suggested sequencing |
| --- | --- | --- | --- |
| CSS transitions + WAAPI | Minimal existing-platform capability; quick state feedback, opacity/transform, controlled disclosure | Height/layout transitions can jump, interruption and focus need tests | **Stage 1 baseline** without new deps |
| Existing Impeccable `animate` capability | Existing specialist's dedicated micro-interaction review principles; recommends `prefers-reduced-motion` | Exact installed version, isolation and skill invocation must be verified; loading extra instructions can alter baseline | Optional **Stage 2A**, only if verified and authorized |
| [Motion](https://github.com/motiondivision/motion) / [docs](https://motion.dev/docs) | Layout transitions, shared-element effects, entrance/exit, spring animation | Extra dependency, Tauri/WebView2 compatibility, measured responsiveness and accessibility | **Stage 2B candidate**, new sandbox only |
| React `ViewTransition` | React 19.3 made ViewTransition stable in 2026; possible alternative without extra dependency | Confirm actual installed exact React and WebView2 browser API support; may be unsuitable for some transitions | Stage 2B alternative |
| [Motion Primitives](https://github.com/ibelick/motion-primitives) | Reference patterns for interactive disclosure and modal | Sample code/license/dependency/stack compatibility; design copying risk | Reference, not blanket installation |
| [FormKit AutoAnimate](https://github.com/formkit/auto-animate) | Basic DOM add/remove/reorder easing | Unintended global behavior; not enough to define coherent style | Optional constrained comparator |
| [React Spring](https://github.com/pmndrs/react-spring) | Physics alternative | Duplicate animation engine, learning/performance cost | Compare as an alternative, not stacked |
| [React Bits](https://github.com/DavidHDev/react-bits), [Animate UI](https://github.com/imskyleen/animate-ui), [SmoothUI](https://github.com/educlopez/smoothui) | Inspiration and candidate component/interaction ideas | Some repositories/components advertise extra license restrictions; verify exact licenses, maintainers, changes and commercial redistribution before copying. Not evidence of native app compatibility | Inspiration/review only until separately vetted |
| Additional independent motion designer | Different timing/easing/interruptibility perspective without necessarily installing new software | More calls/token usage, groupthink, unclear independent contribution | Only after current 3-person delta is measured |

**Verified time-sensitive public references (2026-11-09):** React team [19.3 release](https://react.dev/blog/2026/09/09/react-19-3); [Motion docs](https://motion.dev/docs), [layout](https://motion.dev/docs/layout-animations), [AnimatePresence](https://motion.dev/docs/react-animate-presence); [Impeccable animate](https://www.skills.sh/pbakaus/impeccable/animate). These URLs are references, not adoption decisions or licenses cleared for bundling.

**Design idea pool (OPEN, not requirements):** meaningful shared-element collection-to-detail continuity; smoothly sliding active Grid/List indicator; book cards that move to their new arrangement; description panel expand/collapse moving neighboring content without a jump; light button/press response; Smart rule-builder expansion/reorder; clear Save/Undo feedback; restrained bookish micro-metaphors rather than heavy 3D page-flips; polished generated cover typography and responsive density even when motion disabled.

## 7. Proposed fair staged experiments

### Stage E1 — Existing A/B/C, equal-authority visual/motion improvement

**Goal:** determine what the existing, already-proven team can improve **without introducing a new participant, global skill, package, paid API, or production integration**.

- **Same baseline:** latest *The Reading Table* v3 in a new, non-overwriting isolated sandbox; record file manifest and hash on first read (do not assume prior SHA). Preserve original v3 untouched.
- **Same task for all three:** improve motion continuity and distinctive visual craft across description disclosure, Grid/List indicator + book rearrangement, Smart advanced expansion, modal open/close, and related controls as genuinely helpful. **This is a shared problem, not A/B/C role segregation;** they may extend scope to immediately connected visual defects with explicit rationale, without changing product semantics or adding production features.
- **Independent start:** all propose any ideas; then share and critique actual proposals, converge on one shared candidate.
- **Build a single experimental revision**, not three final submissions. Use existing CSS/JS/WAAPI and existing tooling; no new runtime dependency in E1.
- **Capture baseline and after:** real videos or sequential frames of key interactions under normal motion and reduced-motion. Static screenshots for visual typography/layout. Reuse exact synthetic scenarios and viewport presets.
- **Team review:** A/B/C each review actual revised behavior, not only text. Iterate if meaningful defects remain. Show final build version and relevant artifacts to PO.
- **Checks:** repeated rapid toggles, interruption, focus restoration, dialog scroll/close, keyboard, 900x620/1280x800/1920x1080, TR/EN, dark/light, long titles, sparse/dense book data; separate what actually ran from proposed matrix.
- **Output:** one team-designed final revision; evidence log (who proposed/criticized/chose what); known unfinished issues; call/token/time budget and true limitations. No manufactured PASS or cost.
- **Success criterion:** demonstrably improved perceived continuity **without** regression in responsiveness, keyboard/a11y, identity, safety or visual hierarchy, judged by PO on actual motion recordings. Do not claim objective superiority merely from successful tests.

**Scope authorization note:** The PO approved the E1 exploration direction in conversation. Any actual agent work must remain within the already scoped isolated synthetic setup; if new package/tool/API/global config or repo mutation is required, stop for a new PO grant. A local experiment is not GitHub integration.

### Stage E2 — One added variable per comparison

Only if E1's results leave a concrete gap or a new candidate is likely to outperform it:

- E2A: evaluate already-available Impeccable `animate` guidance **as a narrowly defined extra capability**, or equivalent specialized motion-review procedure, after verifying installed version and isolation. Retain equal creative rights for all participants.
- E2B: compare **one** motion technology at a time (e.g., Motion vs. CSS/WAAPI, or React ViewTransition against the locked React/WebView2 version). Use a new isolated sandbox; never stack all engines or copy unreviewed snippets into production.
- E2C: add one fourth **equal-authority** creative participant only if a clear missed perspective is documented. A fourth participant may contribute to all design topics, not motion alone.
- Keep the same baseline and tasks, log changed variables, build/render verification, token/time cost, output quality and any defects; compare with E1 rather than with an unrelated scope.
- Report **adopt / pilot further / watch / reject** only as recommendations; PO decides adoption and product implementation later.

### Evaluation rubric (proposed, uncalibrated)

- **Visual/brand quality:** coherence, typography, originality, readability, alignment, cover treatment.
- **Continuity:** understandable causal spatial transition; absence of abrupt layout jumps; animation supporting task.
- **Interaction:** clarity and correctness of button/toggle/disclosure/modal states; progressive disclosure; no delayed critical feedback.
- **Accessibility:** reduced motion, keyboard focus, screen-reader semantics where actually assessed, contrast, nonanimated equivalent.
- **Resilience:** fast toggle interruption, window resize, dialog scroll, high-density lists, long Turkish strings, 900px and Windows-DPI boundary.
- **Engineering:** bundle/dependency budget, maintainability, performance on actual platform, licensing, offline operation.
- **Experiment economy:** actual successful calls, token usage, changed artifacts, review cycles and measured value, not just number of experts.

Numbers/scores from these categories must be attributed to evaluators and methods. PO subjective 6–7/10 baseline is qualitative feedback, not a stable quantitative benchmark.

## 8. What a transferable Council workflow should look like

```text
PO brief + real product contracts + evidence baseline
     |
     v
Independent idea generation by A/B/C (equal scope)
     |
     v
Real reciprocal proposal and artifact review
     |
     v
Internal alternatives / experiments / prototype variants
     |
     v
One shared build and actual screenshot/video capture
     |
     v
All members inspect same render/build, challenge, refine
     |
     v
One traceable team-selected result (+ unresolved objections)
     |
     v
PO visual/functional judgment — NOT automatic product approval
     |
     +--> PO critique -> original team reconvenes -> delta revisions
     |
     +--> separate implementation scope -> code review/CI/native PO acceptance
```

**Non-negotiable anti-patterns:** fixed role vetoes; simulated reviewers; skills accidentally stacked; voting only on prose followed by unreviewed solo mockup; three visually unrelated finals dumped onto PO; inflated test pass interpreted as design approval; design finalized without seeing real output; replacing native desktop product with a generic HTML admin page; large animation with no purpose; secret/session leakage; rewriting product decisions from agent vote.

## 9. Future EngineeringOS migration contract

### 9.1 Split what travels

| Information | MyLibrary research file | EngineeringOS Private Workspace | EngineeringOS Public Core |
| --- | --- | --- | --- |
| Generic equal-authority Council workflow | Yes, detailed | Yes | **Candidate**, distilled and abstracted |
| Genuine critique / artifact-review gate pattern | Yes | Yes | **Candidate**, generic evidence/role contracts |
| Source status and experiment measurement methodology | Yes | Yes | **Candidate**, sanitized example and methodology |
| MyLibrary exact product semantics (Edition/Copy, recovery, Wishlist) | Linked, necessary context | If project-specific, private | **No** as assumed universal defaults |
| Raw model prompts/outputs, full transcripts, local experiment locations | Only safe links/manifest | **Yes**, subject to rights/privacy review | **No** without explicit sanitization and publication approval |
| Personal screenshot, credential, token, browser profile, DB, user library | **No public inclusion** | Only if truly necessary and separately safe/authorized | **Never** |
| Proposed tool/skill installations, Figma integrations, workflow defaults | Clearly non-adopted | Research | Only after independent EngineeringOS decision |

**EngineeringOS principles:** It has its own Public Core/Private Workspace, license and PR controls; a MyLibrary artifact does not grant engineering runtime, tool install, agency authority or release rights. The public workflow should describe a *reusable, optional pattern*, with project governance and PO decision gates supplied by the target project. Do not import source code or personal artifacts merely because MyLibrary is a public repo.

### 9.2 Suggested import mapping (not a repo edit)

1. `EngineeringOS-Private`: preserve full dated Council narrative, original per-experiment manifests and raw outputs only after private sourcing/rights review; include source repo, exact source commit/PR or staged local candidate state.
2. `EngineeringOS Public Core / workflows/ui-ux-craft.md`: optional equal-authority collaboration variation: independent ideas, shared artifact, visual/motion evidence, team critique/revision, PO acceptance. **Do not overwrite existing EngineeringOS workflow or force it as default.**
3. `docs/CAPABILITY_NETWORK.md` or appropriate registry: individual skills/tools as provenance-tagged **research candidates**, with isolation/egress/licensing/installed-versus-adopted distinction.
4. `docs/RESEARCH_IMPORT.md` / contribution protocol: source/rights/sanitization checklist; mark synthetic versus actual platform validation.
5. Update EngineeringOS `docs/DECISIONS.md` only when its PO explicitly adopts a specific process/contract. Do not copy MyLibrary D-023/D-024 as EngineeringOS policy.

### 9.3 Sanitization checklist before public transfer

- Remove local absolute paths, usernames, private file names, session/browser tokens, key material, internal prompts with unsafe data, unapproved screenshot content and confidential links.
- Ensure figures are attributed to an agent report vs uploaded source vs independently reproduced run.
- Attribute third-party design skills, animation repositories, versions and licenses; do not copy third-party implementation assets/code without review.
- Verify the EngineeringOS receiving `main` exact SHA/PR and current Public Core/Private Workspace contract immediately before any proposed PR.
- Keep the source MyLibrary provenance and date, plus a license/rights assertion or explicit unknown.
- Maintain a small reversible, docs-only diff; no runtime or capability-default mutation without separate authority.
- Get scoped PO branch/commit/push/Draft-PR approval for each repository; get separate reviewed integration approval. EngineeringOS uses its own Git policies, not MyLibrary's exact-SHA-FF rule by implication.

## 10. Source/evidence manifest (reproducible records)

### Files actually uploaded and inspected in this conversation

| Artifact | Evidence | SHA-256 of uploaded bytes |
| --- | --- | --- |
| `COLLECTIONS_COUNCIL_TRANSCRIPT.md` | Full genuine v002 exchanges as archived by prior controller; inspected text | `18343c8d212693cbc196bf1ebeeee7368d93df49873eca5cb6513f3c0bf0822f` |
| `COLLECTIONS_DESIGN_DECISION.md` | v002 recommendation and exact-version vote strings; inspected | `ae882dda740b63ca0c9d882c25d4b71e9015d1d85d478be9bd6b86b768b97ad4` |
| `COLLECTIONS_MOCKUP.html` | Prior A-authored standalone first research mockup; inspected/rendered | `693231120ce383dae870ec542d49982a3c07f918ad0cf78ac9cb5780e0b3b219` |
| `MYLIBRARY_DESIGN_COUNCIL_MOTION_RESEARCH_2026-11-09.md` | Prior research register; inspected during new consolidation | `00456e4a70f499c3746f831d6a48289a5ef0632d6f7304af224a4bf4463e3bd9` |

The Council `v002` *candidate SHA-256* in its report (`7d026...`) and the *uploaded markdown SHA-256* above are different artifacts; do not substitute one for the other. Hashes show byte identity of uploaded attachments, not validation of claims inside them. In a future PR, add publicly safe relative links only to artifacts actually committed with publication authority.

### Additional evidence present, but incomplete

- User-submitted v3 screenshots in current conversation include overview, collection detail grid/list, 900px dark layouts, Smart create and advanced states, Manual editing, and description collapsed/expanded. They support visual review, but do not include the full source, browser recordings, full raw agent logs or measured timing. Do not publish the screenshots into public repositories without explicit review.
- Live original v1/v3 controller files remain in their isolated **private local experiments** and are not byte-verified through this conversation. Keep original experiment manifests and versions in the private archive; no guessed SHA or fabricated reconstruction.
- Prior reported controllers: compact-list `council-live-debate-20261109-02`; semantic Collections `council-collections-challenge-20261109-01`; collaborative studio `council-collections-design-studio-v1`. These are portable IDs, not public local path disclosures.
- Repo canonical rules and issue references are in §3. Any future pilot must record exact source SHA, provenance, actual execution environment, observed skill injection, budget, total calls, real responses and actual visual review artifacts.

## 11. Open questions, explicit non-decisions and next gates

| Item | Status at 2026-11-09 | Next decision/evidence owner |
| --- | --- | --- |
| Collections final product UI / *The Reading Table* adoption | **NOT APPROVED**; positive v3 prototype, PO 6–7/10 feedback | PO after visual motion/UX comparison |
| Equal-authority team method as mandatory project rule | **RESEARCH DIRECTION**; E1 to test | PO after observed E1/E2 learning |
| Description/Grid-List/modals/advanced motion behavior | **IDEAS / E1 CANDIDATES** | Three-member Council proposes; PO evaluates |
| Motion engine, React upgrade, new dependencies | **NOT AUTHORIZED / NOT ADOPTED** | PO after scoped compatibility/license/a11y/performance pilot |
| Impeccable `animate` skill effective installation/capability | **PUBLIC DOC EXISTS; LOCAL ACTIVE STATE UNVERIFIED** | Safe read-only environment check; scoped permission for use |
| Fourth specialist / any permanent agent membership | **OPEN** | Consider only if E1 measured gap |
| Wishlist membership of Collections, Smart archive/witness semantics, series features | **PO PRODUCT DISCOVERY OPEN** | #33 and canonical decision process |
| EngineOS Public Core transfer | **NOT IMPLEMENTED** | Sanitization, licensing, separate EngineOS scoped repo PR and PO approval |
| GitHub publication of this ledger | **LOCAL FILE ONLY** | Scoped MyLibrary docs branch+commit+push+Draft PR authorization, independent review and later separate integration approval |
| Real native Windows/DPI/reader acceptance | **NOT RUN** for prototype | Future scoped product UX implementation validation |
| Six host developer-skill references | **UNKNOWN provenance** | Distinct security/host-boundary assessment; do not claim cleared |

## 12. Practical repo-publication strategy (proposed, not executed)

**MyLibrary:** one **docs-only** scoped feature branch from a newly checked live `v2` exact SHA, separate clean worktree if needed. Add this single public-safe ledger under `docs/development/devex/`. Update the existing DevEx `README.md` index only if separately authorized and conflict-free; **do not touch #58/#48**. Perform Markdown validity/sanitization/link review, then an independent read-only exact-SHA review, Draft PR and required CI. No direct `v2` write, no merge, no cleanup and no changes to Decisions/Issue closure without scope approval.

**Ongoing update rule:** append new dated entries for E1/E2, include actual versioned artifacts/hashes/review evidence; update status markers and current source links without rewriting past reports as though later evidence had existed then. A PR-ready record is not yet canonical until reviewed and explicitly integrated.

**EngineeringOS:** work from its independently verified current `main` and Public Core/Private Workspace doctrine. First import as a separately reviewed, sanitized **candidate**; do not automatically use generic Council guidance as a mandatory workflow, alter agents, set a motion framework default or expand a milestone.

## 13. Handoff for the next conversation or agent

- Treat this file as a **dated research dossier**, not as overriding MyLibrary `AGENTS.md`, `DECISIONS.md`, `ROADMAP.md`, live CI or PO instruction.
- Before action recheck `fatihemres/MyLibrary` live `v2`, PR #58/#48, Issues #33/#52/#27/#51, exact CI and any new decisions; do not reuse the 2026-11-09 SHA as a current ref after time passes.
- For design work, ask for/obtain the actual original v3 experiment files or a source manifest rather than assuming the screenshot contents prove the code. Stay in a fresh isolated **synthetic** sandbox and reuse authenticated isolated context safely.
- **Current PO goal:** equal-authority A/B/C motion-quality iteration of one shared v3 prototype, with real moving-image review and one final artifact; only then controlled additive tool/specialist trials.
- Do not include model/Thinking settings inside agent prompts. If prompting a coding agent, give current available model/effort selection **outside** the prompt, plus environment, base SHA, mode, authorization and success criteria.
- Save all new agent outputs and stage results locally; report what ran vs what was suggested. No claim of further work after this document's timestamp.
- If migrating to EngineeringOS, start with §9's privacy/rights split; no immediate transfer of MyLibrary internals to Public Core.

---

**Document preparation disclosure:** This file was assembled from the current conversation's PO statements/screenshots, inspected uploaded evidence, live GitHub API reads and externally linked reference docs. Neither the E1 experiment nor a new GitHub commit, PR, EngineeringOS import, tool install or product change was executed by preparing this document.
---

## 14. Dated follow-up — E1 equal-authority collaborative motion pilot (2026-11-10)

> **Status:** `AGENT-REPORTED EXPERIMENT COMPLETE / PO VISUAL REVIEW PENDING`.
> **Provenance:** PO forwarded the Codex E1 completion report on 2026-11-10. The original local prototype, screenshots, motion files, raw conversations, local source tree and CLI trace were **not provided to this GitHub update**; no independent replay, byte-level hash, animation timing or visual acceptance is claimed here.
> **Supersedes only the E1 pending status in §§11–13.** Earlier entries remain dated historical evidence, not false statements about this later checkpoint.

### Experiment identity, authority and method

- Experiment ID: `council-collections-e1-equal-authority`, shared resulting version **The Reading Table E1-v3**.
- Goal: test the same three participants (UI UX Pro Max, Taste, Impeccable), with **equal authority to comment on any design dimension**, improving the earlier v3 experience. No fixed exclusive ownership of motion, aesthetics or accessibility.
- Scope: local/synthetic research prototype with the existing isolated Council runner; no new animation libraries or fourth participant in this E1 baseline. Earlier product and data-safety contracts remain binding.
- Desired method: independent starting positions; substantive reciprocal debate; shared implementation; review of *actual rendered motion* as well as screenshots; refinement; **one final team-designed prototype** for later PO visual feedback.
- Result attribution: the PO-submitted agent report says **A/B/C each inspected actual images and motion frames of the same E1-v3 revision and deemed it ready for PO review**. This is a process/completion claim, **not** a source-verified visual-quality PASS or product approval.

### Reported decisions and visual/interaction changes

| Topic | Codex-reported team exchange or result | Validation state |
| --- | --- | --- |
| Description disclosure | A adopted a controlled reveal instead of abrupt expansion | Agent-reported; actual motion not independently inspected |
| Book transitions | B withdrew its fragmented book-motion alternative; books now move together | Agent-reported; real frame/video review still pending |
| Dialog close | C objected to an exit ghost; peers accepted removing it, with reported immediate close | Agent-reported, not directly verified |
| Editor stability | Editor frame remains stable during interactions | Agent-reported |
| Spatial density | Unnecessary empty space reduced | Agent-reported |
| Accessibility | Focus and reduced-motion defects reportedly fixed | Reported local checks, not screen-reader/Windows acceptance |
| Known design debt | Some motion paths intersect; year labels remain small on similar red covers | Explicitly retained limitations |

**Product-design assessment:** E1 provides stronger evidence of the *collaborative review method* than the earlier semantic-consensus-only pilot, because feedback reportedly reached the visible, animated shared artifact and changed its content. The visual quality, actual animation smoothness and extent of improvement **remain unverified without the source/frames or PO observation**. Do not translate the three participants' “ready” statements into PO acceptance.

### Reported quantitative evidence (not independently reproduced)

| Metric | Reported result | Interpretation |
| --- | --- | --- |
| Real CLI model calls | **16 / 24** allowed | Count from Codex report, no local trace reviewed |
| Requested model/effort | `gpt-6.1-sol / high` | Server model identity was not separately returned |
| Input tokens | **530,933** | Reported model usage |
| Output tokens | **39,228** | Reported model usage |
| First-to-last model time | **25 min 39 sec** | Excludes unobserved interruptions and full human turnaround |
| Monetary cost | **UNKNOWN** | Do not infer billing from token count |
| Behavior checks | **48** reported pass | Counts partially overlap |
| Motion/focus checks | **30** reported pass | Counts partially overlap |
| Narrow-window checks | **7** reported pass | Counts partially overlap |
| Additional checks | **12** reported pass | Counts partially overlap |
| Package checks | **7** reported pass | Counts partially overlap |

The check categories must **not** be summed and presented as a deduplicated test count; underlying assertions and execution logs are not available in this update.

### Reported local artifact inventory (private experiment ID only)

- `FINAL_DESIGN/index.html` — interactive revised prototype.
- `MOTION_COMPARISON.html` — before/after motion comparison player.
- `FINAL_REPORT_TR.md` — agent-written Turkish completion report.
- `COUNCIL_COLLABORATION.md` — agent-written team discussion.

These names are provenance pointers, **not working public download links, archived GitHub artifacts or independently verified exact files**. Do not publish private local absolute paths, complete raw logs, personal media or source snapshots without separate privacy/right-to-publish review.

### Remaining gates and EngineeringOS transfer implications

1. **PO review pending:** independently inspect the final prototype's rendered states and motion **as motion**, comparing it to earlier v3. Collect short clips/frame sequences and the necessary offline-safe prototype assets, if the PO elects to share them.
2. **Motion acceptance not established:** focus return, interruption/race handling, layout continuity, button/selector refinement, TR/EN overflow, reduced-motion, and high-density use require actual verification. Reported local browser checks cannot substitute for native WebView2, 125/150% Windows DPI, real FPS measurements or screen-reader testing.
3. **Residual safety unknown:** the known six host developer-reference provenance findings remain UNKNOWN; the report does not establish total isolation or an unauthorized-tool absence audit.
4. **Controlled comparison next:** if PO finds E1 improvements promising, treat E1 as a named baseline for later **one-variable-at-a-time** E2 comparisons (e.g. an already-verified animation skill, motion engine, or a fourth specialist) with separate PO authorization for new dependencies/services/settings. No automatic adoption.
5. **EngineeringOS transfer status:** this addendum is a reusable *attributed methodological observation*, **not** proof of generalizable superiority of the equal-authority method. A later public-safe synthesis should distinguish E1 reported outcomes from PO-verified quality and comparable controls.
6. **GitHub governance:** this addendum belongs only to the docs-only Draft PR. No `v2` integration, design approval, Issue #52 closure, EngineeringOS modification, production UI implementation or permanent team policy is authorized.

**Follow-up checkpoint (2026-11-10):** E1 experiment **reported complete**; next meaningful action is PO visual/motion review, **not** a blind new design, tool-installation or production implementation.
---

## 15. Independent uploaded E1 artefact review (2026-11-10)

> **Evidence level:** Independently inspected PO-provided ZIP **source bytes, manifest SHA-256 hashes and selected historical/final screenshot/filmstrip files**, plus read supplied local check/report JSON. **Not** independent execution of browser interaction tests, Windows WebView2/DPI/FPS, model-call re-attestation or PO visual acceptance. Do not silently promote reported checks to independent PASS.

### Verified source and process evidence

- The uploaded ZIP contains **11,929 entries** (~713 MB uncompressed, ~153 MiB compressed). Large subtrees named `browser-runs/`, `po-browser-sessions/` and `profiles/` contain browser profile/cache/session artefacts. **They were excluded from inspection and must never be copied into this public GitHub record or EngineeringOS Public Core.** Even test profiles may retain cookies or browsing state; secrets were **not** inspected, so their safety cannot be certified.
- A deliberately whitelisted **290-file** subset of static source, docs, screenshots and motion captures was examined without executing user-provided launcher/scripts.
- Independently computed SHA-256 values of **all six** `FINAL_DESIGN` source files match `SOURCE_MANIFEST.json`. E1 `data.js` and basic `styles.css` are **byte-identical** to the included baseline-v3 versions; `index.html`, `app.js` and the two new `e1-* ` files provide the iteration.
- Each of the three provided `research/E1_FINAL_REVIEW-A/B/C.json` files records **the same** final `sourceBundleHash` `a658f97f2cf60260c1ee166cf79c3f2fc191c51afef06d59e13fc2019608f677`, **13 described visual samples** and `readyForPO=true`. This verifies **consistency of recorded final review claims**, not human-equivalent independence, exact model attribution or complete frame exposure.
- Code and supplied rAF measurement show a genuine native disclosure-height transition in the captured browser (`0 → 16.56 → 31.92 → 46.02 → … → 100 px`), grouped whole-book translation (`160 ms`, up to 12 visible Edition items), limited dialog entrance (`120 ms`/4 px), deliberate immediate close, and reduced-motion cancellation paths. **Compatibility with target WebView2 versions and native performance remains untested.**
- Original `E1_CHECKS_e1-v3.json` retains failed pseudo-element animation measurement attempts; later `E1_CHECKS_e1-v3_RAF.json` provides a supported geometry trace. Retaining the failed method is correct; do not report all historical checks as passing or add partially overlapping test counts.
- Filmstrips are **discrete timestamped JPEG samples**, not a continuously recorded, independent native video/FPS benchmark. They show clear movement compared with the previous abrupt baseline, but also **visible transient crossings between moving book units and neighboring text**.

### Design-quality findings and unresolved tradeoffs

- **Real improvement:** The old abrupt Description and Grid/List behavior received genuine intermediate movement; layout is less vertically wasteful, the toolbar was compacted, book covers retain more readable blocks, and the Manual/Smart editor retains a stable, scrollable outer frame.
- **Still weak:** moving book paths collide/cross readable content; two visually similar red Editions depend on a small year/imprint; generic buttons/native selects have not acquired a distinctive shared interaction language; Smart modal remains dense and technical, especially in 900px TR dark.
- **Prototyping caveat:** certain synthetic Edition IDs receive hand-curated short jacket titles. This is appropriate for a research fixture but **must not be promoted as a generic production-ready cover typography algorithm**.
- All three reported a genuine revised proposal; nonetheless the impact of **equal creative authority** remains promising rather than independently established as superior to a controlled alternative. PO's visual acceptance of E1-v3 is still outstanding.

### Portability and disclosure boundary

- A new, explicitly **review-only** 45-file bundle was constructed outside GitHub containing just final offline design assets, screenshots, selected filmstrips and research summaries; **no browser profiles, request/event logs or credentials** were carried into that curated bundle. It was **not uploaded to GitHub or EngineeringOS**, and the absence of those directory names does not by itself grant external public publication rights.
- Any EngineeringOS transfer must separately review user screenshots, transcript provenance, author rights, licenses, absolute paths and any latent secrets; a portable research observation is not a product implementation mandate.
- Follow-up: PO reviews the actual motion comparison and final prototype; then the same A/B/C team can address path crossing and visual hierarchy. E2 external-library/fourth-specialist trials remain **unapproved until independently scoped**. No product work, GitHub integration or issue closure is implied.

**This is a separate later observation** appended to the earlier agent-report summary (§14); it does not rewrite that historical section.
---

## 16. PO first-hand E1 visual/motion feedback (2026-11-10)

> **Source and authority:** Direct first-hand PO comments after briefly viewing the E1 prototype, 2026-11-10, 10:21 Europe/Istanbul. These are **early visual observations and design ideas, NOT approved visual specification, final acceptance, UI implementation authority or evidence that every screen was tested**. Distinguish these from the earlier uploaded-Codex reports and the assistant's independently reviewed motion samples (§§14–15).

| Area | PO observation (paraphrased without silently converting it to a decision) | Research disposition |
| --- | --- | --- |
| Button press feedback | PO finds the click/press effect good. | **Preserve as positive evidence**; avoid unnecessary wholesale changes. |
| Full-page navigation | Page transitions still feel abrupt, described as “çötenk”. | **Open visual-continuity defect hypothesis**. Need actual transition recording, context preservation and repeat-navigation tests. |
| Modal opening | Modal enters abruptly despite source-level entrance timing. | **PO-perceived unsatisfactory**. A coded 120 ms animation does not establish perceived smoothness. Distinguish entrance from immediate close chosen for avoiding exit ghost. |
| Grid → List content | Attempted movement visibly overlaps, splits or crosses during reflow; needs a more coherent and smooth transition. | **High-priority observable design defect**. Do not simply lengthen the animation or claim geometry tests prove polish. Compare coordinated layout movement against crossfade and other proposals. |
| View selector itself | Hover feedback is pleasant, but the selected state changes instantaneously. | **Separate defect from the content transition**. Explore a moving active indicator, gentle sliding or a distinct switch-like metaphor; the light-switch analogy is an **example**, not a required final design. |
| General evaluation | Brief initial PO look only. | Further full visual review remains pending; no product/theme/animation-engine adoption decision. |

### Proposed next evidence loop (not an implementation mandate)

- Preserve the already-liked button press and hover behavior as regression references.
- Ask the **same equal-authority three-person Council** to separately inspect (a) active control indicator and (b) book content reflow; prototype genuinely different internal motion ideas and together choose one refined, single result for PO review.
- Also test page navigation and dialog **entrance**, including high-frequency interruptions, focus, scroll locking, reduced-motion, TR/EN, light/dark, 900px and 1280px layouts. Modal **exit** may legitimately remain immediate if the team shows why, but this must not excuse abrupt entrance.
- Capture actual timestamped intermediate frames and, where feasible, trustworthy continuous video; inspect overlapping book paths and text as visual defects rather than treating test-count PASS as acceptance.
- Consider a controlled library/tool comparison **only after establishing a reproducible failure and a no-new-dependency baseline**, and only with separate dependency/install permission. Avoid prescribing Motion, GSAP, React View Transitions or a fourth member merely from a screenshot.
- Preserve rejected concepts and PO comments in the evidence archive for later EngineeringOS adaptation. Do not assert that a particular transition metaphor has been chosen.

**Current distinction:** E1 technical/prototype progress is verified within the limits of §15; **PO-perceived smoothness and overall motion quality are not accepted**. This section adds later user evidence without retroactively rewriting the earlier research records.
