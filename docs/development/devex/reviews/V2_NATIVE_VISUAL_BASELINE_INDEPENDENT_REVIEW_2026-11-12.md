# MyLibrary V2 — Native Visual Baseline Independent Review

**Reviewed:** 2026-11-12; **recorded:** 2026-11-13 (Europe/Istanbul).  
**Research status:** `INDEPENDENT PACKAGE INTEGRITY + SOURCE/SCREENSHOT REVIEW / NATIVE RUNTIME REPORTED BY CODEX / PO DESIGN ACCEPTANCE NOT GIVEN`.  
**Authority:** Evidence and design discovery only. This review does not authorize implementation, cleanup, merge, release, tool adoption, production UI changes, or EngineeringOS changes.

> **Public-safe research summary.** The source archive, raw recordings, per-frame metadata, full provenance, filesystem inventories, runtime caches, and original unpublished reports remain outside this GitHub repository. This document is **not** an archive of private screenshot/video bytes. Links to absent private files must not be represented as repository attachments.

## Evidence provenance and integrity

- Submitted archive: `MyLibrary-V2-Native-Visual-Baseline-review-20261112.zip`, **42,386,088 bytes**, archive SHA-256 `4e1e4023c150d93d07f818476b0940fa487a203bfee2dacd9d348717718bf4cd`.
- Independently examined as ZIP in a local read-only inspection: **229 entries**, **227/227** package manifest payload files recalculated to matching SHA-256 hashes; the additional two entries contain package manifest and verification metadata.
- Includes **95 screenshots** and **7 WebM recordings** from six user journeys, plus **42 JPG frames from an interrupted, untimed Wishlist attempt**. All seven complete videos decoded successfully in the review environment.
- No ZIP path traversal or Unix symlink entries detected. A targeted path/secret review was performed; this is **not** comprehensive privacy/security certification.
- Source/source-artifact references were checked against the supplied manifests and cross-linked screenshots/video timelines. The native capture itself was **not** independently rerun on Windows during the ZIP inspection.
- The original experiment/source evidence reports `fatihemres/MyLibrary` `v2` commit `10510ab0c5a5d413717cf736b1d74d3590b39e2b`, Windows Tauri 2 / Rust / SQLite / WebView2 runtime, WebView2 version `155.0.4283.62`, application origin `http://tauri.localhost`, and runtime executable SHA-256 `95fc1e0d2287d5add9cce7410aa11d17106ed60c626ef0302072a1f50dae2842`. The EXE was **excluded** from the review ZIP.
- Codex's captured data are synthetic and separately isolated; its report records **69 Editions, 70 independent Physical Copies and 4 Wishlist items**. The personal library was outside the approved experiment.
- Native WebView2/CDP video files are encoded at **25 FPS**, not independently measured native FPS. Event/timing metadata are distinct from encoded video rate. `900×620` is a CSS viewport emulation in native WebView2, **not** a physically resized Windows desktop window.
- Real physical DPI, native FPS/frame pacing, screen reader, and PO final normal-speed visual acceptance are **not established**. Video contact sheets are sampled derivatives and do not replace human full-speed inspection.
- The package contains local provenance and an excluded-file-name inventory. **Do not upload the raw ZIP or its private metadata to public EngineeringOS/MyLibrary GitHub without a separate privacy/redaction decision.**

## Six captured, representative product journeys

1. Dashboard → Library → Detail → back, including sparse state and EN/TR/light/dark references.
2. Library Grid/Table, filters, sorting, paging, navigation, keyboard/context-menu behavior.
3. Quick Add → full editor → Cancel/Save, including validation and focus.
4. Edition detail and multiple separately owned Physical Copies.
5. Wishlist Gallery/List and acquisition review, including cancel/no-mutation safety.
6. Settings, localization/theme, and responsive representative states.

The baseline provides visual *research reference material*; there is no claim that all states on all hardware/DPI/accessibility environments have passed.

## Reproduced behaviors (separate triage candidates, not automatically approved fixes)

| Evidence ID | Observed reported native behavior; independent screenshot/report cross-check | Research priority / remaining uncertainty |
| --- | --- | --- |
| `UX-NAV-01` | Dashboard → Detail displays **“Back to library”**; action returns to Dashboard. | Medium: destination/label clarity |
| `UX-NAV-02` | Library page 2 → Detail → back returns to page 1 instead of preserving page position. | Medium: task/navigation context continuity |
| `UX-KEY-01-ARROW` | Context menu opens with Shift+F10 but closes with ArrowDown instead of moving through items. | High: keyboard interaction/accessibility; `Tab` closing was not itself declared a defect |
| `UX-KEY-02` | While an Add Physical Copy dialog is open, Ctrl+N opens an additional Add Book dialog. | High: unexpected stacked dialog and focus/command-scope risk; **no data-loss claim** |
| `UX-SEARCH-01` | Exact displayed full title `Baseline 001 — A Quiet Atlas` returned zero results, whereas `Baseline 001` found the item. | Medium: search reliability; no verified claim about punctuation/FTS root cause |

These cases were identified in the supplied native capture and traceable to screenshots/video evidence. An independent follow-up repository source inspection supports relevant handler hypotheses; **no fix** or root-cause proof is established by this review. An additional source observation notes that Library Grid/Table view selectors lack `aria-pressed`/`aria-selected`, but native assistive-technology effects were not measured.

**Research triage distinction:** Confirmed reproducible application behavior is not equivalent to a PO-authorized implementation ticket. These cases should be considered independently under existing [cross-screen UX #27](https://github.com/fatihemres/MyLibrary/issues/27), rather than silently bundled into aesthetic redesign.

## Independent visual hypotheses (not PO-accepted defects)

- **Sparse Dashboard:** unused panel area and competition between first-use next actions and statistical framing; test one-book and full-library states without imposing decorative widgets.
- **Dense Library:** cover/title/metadata rhythm and scanning hierarchy need creative comparison; repeated synthetic cover placeholders must not be mistaken for actual private library artwork.
- **Wishlist at narrow TR/dark:** two large title levels, budget explanation and control block occupy much of the first viewport, pushing books downward. Explore compact prioritization **without hiding budget, Purchased, Edition/Copy and safe acquisition semantics**.
- **Book Editor at narrow TR/dark:** long horizontally scrollable section strip and nested vertical scrolling can make orientation/focus difficult; confirm in physical Windows and keyboard tests before claiming a blocker.
- **Whole-product identity:** the current blue-gray/teal sans-serif shell and serif editorial elements do not yet prove a single accepted art direction. The warm E3 Collections concept is a **learning reference**, not a mandated visual style.

The 95 sampled screenshots do not establish all-state responsive correctness. Screenshots alone also do not certify smooth motion.

## Existing strengths to preserve

- Consistent desktop navigation shell and recognizable controls.
- Correct distinction between Edition and individually owned Physical Copy; no title-based destructive merging.
- Explicit add/review/confirm/cancel pathways and meaningful recovery/unsaved-change signaling.
- Light/dark, EN/TR, visible focus and reduced-motion foundations that merit further testing.
- PO's earlier positive reaction to Library hover and smoother E3-R1 v6 motion. An occasional rapid-toggle stall remained open in the E3-R1 prototype; neither resolved nor transferred to production by this review.

## Ponytail attribution and constraints

The original Codex report describes Ponytail **`full` mode active under a one-session PO observer/reporting exception**. No independent Ponytail actor or standalone visual watcher was evidenced.

- Reported PT-01/PT-02: harness and evidence-method limitations; use to scope tests, not certify product defects.
- PT-03: possible cover/blob URL-cache longevity risk; **unmeasured**, not an observed memory regression.
- PT-04: the prior Git JSON/EOL checkout anomaly; source-integrity bookkeeping, not a UX finding.
- Ponytail use in a **future creative UI/UX session** remains governed by the PO's current task-specific exception or the recorded D-023/#51 default exclusion, whichever is explicitly authorized for that session. Do not presume this observer-only exception persists.

## Next design study — proposed, not yet adopted

1. Give the Design Council the verified public-safe facts, actual visual evidence under local authorized access, the product constraints and representative real journeys.
2. Independently explore **2–3 genuinely distinct small visual/motion directions**; avoid full redesign/coding before PO preference calibration.
3. Let the PO respond to atmosphere, information density, navigation feel and motion personality by selecting **aspects across alternatives**, without forcing a single complete visual concept.
4. After a bounded calibration, all A/B/C/D participants remain equal creative owners of the whole experience, challenge weak ideas and converge on **one cohesive representative working prototype**.
5. Maintain continuous motion proof, focus/keyboard/EN/TR/light/dark/narrow-state checks, actor provenance and differentiated technical, visual and PO acceptance.
6. No real-library testing, new network/cloud, dependencies, global hooks, production changes, issue closure or `v2` integration follows from this review.

**Owner decision still needed for a particular execution scope:** new creative experiment authorization and any tools/skills/install exceptions; not implied by this source document. `Issue #52` remains the council discovery tracker and `Issue #33` keeps Collections product policies open.

## Exact status at review checkpoint

- Repository baseline `v2`: `10510ab0c5a5d413717cf736b1d74d3590b39e2b`, **not modified by this native baseline experiment**.
- Design Council #52, cross-screen UX #27 and Collections discovery #33 were open.
- Research dossier [Draft PR #59](https://github.com/fatihemres/MyLibrary/pull/59) was unmerged.
- Full independent local source report was generated separately; this version is the **public-safe archive copy**, with private provenance media excluded.

**Verdict:** Evidence package has independently verified internal integrity and useful product/design coverage. **Native visual baseline ready for controlled creative exploration; production UI design acceptance and all five functional triage decisions remain open.**
