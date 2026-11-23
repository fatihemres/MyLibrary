# MyLibrary — D0 Creative Direction: Independent Package and UX Review

**Review date:** 2026-11-13 (Europe/Istanbul)  
**Status:** `EXPLORATORY THREE-WAY COMPARISON / INDEPENDENT PACKAGE CHECK / NO WINNER OR PO DESIGN ACCEPTANCE`  
**Source baseline:** `fatihemres/MyLibrary` `v2` exact `10510ab0c5a5d413717cf736b1d74d3590b39e2b`  
**Scope:** This is public-safe **research memory** of an isolated, synthetic, offline design experiment. It is **not** the approved whole-app design, an accepted EngineeringOS workflow, a production prototype, a new feature authorization, or permission to modify protected branches.

## Source and verification boundaries

- PO-supplied archive: `MyLibrary-Design-Council-D0-20261113.zip`, **24,847,894 bytes**; independently calculated SHA-256 `853164127e82a9a1d882c004d9f99f6cac19ee7b146ee31958bd8f8899705194`.
- ZIP integrity: **166 entries; no ZIP CRC failure**; path-traversal/Unix-symlink screening found none. Manifest **163/163 payload byte lengths and SHA-256 digests matched**. `SHA256SUMS.txt`: **165/165 hashes matched**, covering the manifest and its sidecar; the sums file excludes itself. Manifest sidecar independently verified.
- Includes **37 evidence/screens screenshots**, **27 timestamp-labelled motion-frame PNGs**, **nine original D0 WebM captures** (ordinary, TR/dark/narrow, reduced-motion for each candidate), and a retained dark-mode v1 failure. Three motion/contact-sheet PNGs and a larger original/frozen reference subset are also present.
- All **nine D0 WebM** files independently SHA-matched the `video-validation-final.json` entries and fully decoded with ffmpeg. Duration range **9.64–11.20 seconds**. These are actual continuous recordings of *browser mockups*, **not** native Tauri recordings or independently measured FPS. We independently sampled representative temporal frames; **no human PO normal-speed assessment of these D0 videos is yet supplied**.
- Embedded frozen source archive and source-blob reports attribute **114 committed files** to the stated product SHA; this review checked manifest integrity and selected supplied source/report material, **not** a fresh Windows app build or exhaustive independent Git-object comparison.
- Supplied records report four separately prompted initial A/B/C/D submissions against the same brief. These are attributable self-recorded contexts, not independently verified distinct provider models or installed visual specialist skills. **The focused final three-way review was done by D**; do not describe it as four people reviewing all final videos or final source.
- Ponytail `full` activation was *reported* in Council contexts under the D0 session-specific observer-only PO exception. It is not a fifth independent reviewer, visual judge, global default change or future UI-session authorization.
- Originals, full recordings, screenshots, raw participant logs, local provenance paths, experimental ZIPs and profiles **are not committed to this public GitHub review**. Local file safety screening is not a privacy/security certification.

## Three concepts that are genuinely different

| Direction | Composition and value | Explicit trade-off / normal-speed question |
| --- | --- | --- |
| **Okuma Masası (Reading Table)** | Warm cream/forest palette, editorial typographic hierarchy, full colourful book-cover field, focused Edition hero, independent Copy cards, centered sheet editing. Strongest immediate sense of books as personal objects. | Tall Detail at narrow width pushes Copy selection below first viewport; centered edit overlays the collection. The 260ms cover/jacket travel across a Browse→Index switch can temporarily traverse row text, even though text is present immediately. Review at 1×. |
| **Katalog Masası (Catalogue Desk)** | Cool graphite/cobalt working surface, dense rows/tiles, wide split library + selected Edition/Copy inspector, compact actions suitable for repetitive cataloguing. | Wide empty inspector reserves substantial space before selection; at narrow widths the inspector *replaces* the catalogue, losing the key simultaneous-context advantage. Rows/tiles move **with their text**, risking visual disturbance. May feel more like a records-management tool than a personal library. |
| **Sayfa Sayfa (Page by Page)** | Strong graphic/page hierarchy, title-led catalogue rows, full-page task areas, clearly separated shared Edition vs independent Physical Copy panels, full-page forms. | Dense lists show fewer books at first; navigating Detail hides the surrounding catalogue, and Save/Cancel may be below the first narrow viewport (reachable by scroll). Main task region moves ~16px; some typography changes abruptly during compact layout. |

These conclusions are based on actual supplied screenshots, working source structure and temporal sampling plus authored BUILD-NOTES. They are **evaluation hypotheses**, not a PO-selected design or scores assigned by real users.

### Concrete design strengths and opportunities

- **Reading Table**: compelling cover-led first impression, intentional locally drawn missing-cover state and visually meaningful book identity. Consider whether the same delight can survive large libraries and long repetitive editing.
- **Catalogue Desk**: efficient browse/detail co-presence at wide widths and directly visible Good/Poor Copy conditions; evaluate whether it can feel warmer without adding ceremonial content that defeats density. Narrow layout should be tested separately because its split-view advantage disappears.
- **Page by Page**: strongest explicit full-page Edition/Copy separation and easy-to-scan title-led structure; evaluate the attention benefits against required back/forward navigation and loss of broader collection context.
- Designs are **not just palette variations**: each changes information architecture, use of space, editor mode and transition logic. No combined final design was produced in D0 by design.

## Real peer critique, failures and correction provenance

1. All four initial proposals were made independently against a frozen source/brief (per shipped provenance), with rejected alternatives retained: literal 3D shelf, palette-first shell, statistics-first dashboard and overly elaborate motion. Coordinator then chose three directions as a comparison, **not a winner**.
2. D found a **material Catalogue Desk v1 dark-theme inheritance/readability defect**. C corrected only scoped experimental CSS; v1 screenshots/source were preserved, and v2 dark focus/geometry retested. Final v2 source bundle hash: `596d75268b65975c15314e9fdbab7efa6a1e33bf51662c45fe340282f1b00675`.
3. The first combined harness wrongly targeted Catalogue acquisition controls and later Reading Table's card wrapper rather than its Copy-selection button. Failures and corrections were preserved; a corrected real-target check confirmed independent cp1/cp2 behavior. These harness failures are **not** production bugs.
4. An initial supplemental keyboard run reported **15 PASS / 3 FAIL**. A Catalogue modal focus assertion was overly strict, leaving the modal open and contaminating two subsequent action timeouts. An isolated recheck found an intermediate document/BODY focus boundary with modal still open and background controls not focused. **Do not claim universal keyboard trapping or screen-reader conformance.**
5. Final Catalogue v2 affected validation reports **51 checks PASS / 0 FAIL** (source bundle and state attributed); offline package/link audit reports 11 HTML files, 100 links, zero missing and zero unexpected external requests. Those are **coordinator reports**, not substitute for independent native QA.

## Product and permission guardrails

- Same synthetic fixture for three candidates: **six Editions, seven independent Physical Copies, two active Wishlist wishes and one fulfilled wish linked to cp7**, with separate 18 USD and 420 TRY active budget targets. No work/title auto-merge.
- Ephemeral browser-only edits; user-entered Add title can equal another Edition title without destructive merging; shared Edition metadata and individual Copy condition are separately edited. Wishlist acquisition needs explicit existing/new Edition review and **stops before final commit**.
- Export, real import, recovery/backup, providers, complete screen set and native desktop hooks are **not implemented**. Extension previews do not establish working features.
- The five previously reproduced `v2` issues from native baseline **remain open**: Detail back-label mismatch; Library pagination reset; ArrowDown context-menu dismissal; Ctrl+N stacked Add Book/Copy dialog; full-title search discrepancy. None is fixed in product by D0.
- No remote downloads, new dependencies, app mutation, source PR, external provider, new permanent Ponytail config, GitHub writes or production data changes were authorized by the D0 source experiment.
- Reduced-motion alternatives exist and were recorded, but they do not certify actual Windows accessibility/comfort. Native WebView2, real physical DPI, measured rendering FPS, screen reader and **PO visual acceptance of these D0 ideas** remain unverified.

## PO calibration recommendation — **not yet a decision**

Show the PO the three **actual** sketches and their nine 1× videos before major new Council spending. Ask for liked elements **across** directions rather than forcing one winner:

1. **Feeling:** Which presentation makes a personal book library feel inviting; which is too administrative or visually sparse?
2. **Work:** In which direction can they best locate books, understand Edition vs Copy and edit frequently?
3. **Motion:** Which navigation/reflow/dialog behavior feels coherent rather than abrupt or distracting, especially rapid reversals?
4. **Boundaries:** Which particular elements, if any, are explicitly non-negotiable? Otherwise use **Creative Freedom by Default**.

Record the *reason* behind PO likes/dislikes separately from acceptance, open design hypotheses and immutable product constraints. Then authorize/brief a separate convergence experiment to synthesize **one** representative candidate, with full-speed evidence and contextual critique by all required participants. D0 itself is correctly stopped prior to that phase.

**Verdict:** `D0 SOURCE PACKAGE VERIFIED / THREE MEANINGFULLY DIFFERENT PO CALIBRATION OPTIONS / ONE REAL PEER-LED DARK-MODE CORRECTION / NO FINAL DESIGN CHOSEN`. Document evidence as research only; no automatic product or EngineeringOS adoption.
