# MyLibrary V2 — Roadmap, DevEx, Design Council and Versioning Gate Audit

**Checked:** 2026-11-16 (Europe/Istanbul). **Status:** `LIVE-GITHUB-CHECKED AUDIT / PROPOSED SEQUENCE / PO ROADMAP AND RELEASE DECISIONS PENDING`.  
**Scope:** Public-safe research planning record; **not** an approved revised milestone plan, product-feature scope, new tool adoption, implementation request, issue closure, protected-branch mutation or release authorization.

## Live repository evidence

- Canonical protected `v2` **`10510ab0c5a5d413717cf736b1d74d3590b39e2b`** (PR #57 HEAD/merge SHA); `main` `af436ece7ce09fcdcf9d57375739d5407e52d6ad`, `v1-maintenance` `21d2614d91f0c6fbf8b799aba754c50c05f96963`. Current `v2` check-runs: all returned required platform and CodeQL entries SUCCESS; some duplicate CodeQL checks existed in the response. Exact CI does not certify native Windows PO acceptance or readiness of later candidates.
- `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` all report **`2.0.0-alpha.1`**. Only published GitHub Release and Git tag returned: **`v1.0.0`**. Source-version label is not a V2 installer/tag/release.
- `docs/versioning.md` makes `v2` the future-development line and defines SemVer and synchronization among package/npm lock, Tauri, Cargo/lock and About. Stable `2.0.0` requires separate RC, upgrade/rollback and acceptance, then separately approved `main` promotion, annotated tag and immutable released installer/checksum; no tag exists for V2 today.
- Existing `main` has a proprietary `LICENSE`, but `v2` root `LICENSE` fetch returned **404**. Issue #21 remains open for third-party font/media/code rights, notices, public-repository limits and release attribution; no automatic licence copying or retroactive rights claim.
- At audit time, only **three open MyLibrary PRs**, all Draft/docs-only against `v2`: [#48](https://github.com/fatihemres/MyLibrary/pull/48) `85d7ac6989c5e8cea4986681c62913f30303e3e5` (older public research library), [#58](https://github.com/fatihemres/MyLibrary/pull/58) `d9b43c7479c3307398259ba0854534c72f7e8e6a` (live DevEx trials and text-only Council), [#59](https://github.com/fatihemres/MyLibrary/pull/59) (Design Council evidence ledger and EngineeringOS handoff; at the audit checkpoint `f9df748a66f29a5fbd9db2fdcd48c0a1615afe8d`). #48/#58 reported 8/8 historical check entries SUCCESS; #59 still had in-progress platform checks. **Do not equate CI to review, or close/merge/clean any PR without distinct PO permission.** New review commits after this audit require own exact-SHA CI; status snapshots here will become historical.
- GitHub fetched open Issues and closed PR histories on 2026-11-16. **PR #55**, backup/restore crash-recovery `f54472b962505ded0c27f4e2d837aaf10e93d56a`, **MERGED**; **PR #56**, M3-C reviewed Wishlist acquisition `05580f51cb9dcc11f53aa63ffbf6afc522f87945`, **MERGED**; **PR #57**, Foundation/cleanup policy `10510ab0c5a5d413717cf736b1d74d3590b39e2b`, **MERGED**. The top sections of `PROJECT_STATUS.md` and some issue descriptions still say **NOT INTEGRATED** or discovery-only for these earlier candidates. Treat those as dated snapshots, not as today's integration status. Preserve original evidence while adding a clearly dated current reconciliation when separately authorized.
- GitHub's specialized milestones REST endpoint was not exposed by the current GitHub fetch tool, so **milestone object metadata was not independently read**; canonical `docs/v2/ROADMAP.md` and open closeout Issue #31 unambiguously say M2 overall OPEN. Do not claim GitHub milestone records independently verified.

## Where the roadmap stands (source authority: docs/v2/ROADMAP.md)

| Area | Verified status | What remains |
| --- | --- | --- |
| **M1 Foundation** | CLOSED (2026-10-09) | Retain compatibility and safety regression; no reopening implied |
| **M2 Barcode & Metadata** | M2-A/B/C CLOSED, D/E/F integrated; optional providers and scanner flow deployed to unreleased V2; **M2 overall OPEN** | #31 milestone acceptance/closure audit; decide how to carry #29 Google Books quota and #30 multi-volume ISBN ambiguity as separate limitations |
| **M3 Organization** | M3-A Turkish search/advanced filters [PR #41] MERGED; M3-B Wishlist [#42] MERGED; M3-C explicit Wishlist acquisition [#56] MERGED | #26 M3-B administrative acceptance OPEN; #32 M3-C discovery issue still OPEN despite code integration; #33 Smart/Manual Collections and assisted series organization are discovery/planned; #34 Visual Shelves remains discovery/planned |
| **M4 Reading Intelligence** | PLANNED [#35] | Sessions/goals/statistics/rereads/insights need PO scope and staged engineering authority |
| **M5 Data Ecosystem** | PLANNED [#36], #37 Wishlist Studio discovery | Import/export, Backup V2, privacy-preserving formats and limited approved offline share card remain to be scoped; [PR #55] is an existing backup/restore **safety hardening**, not M5 Backup V2 delivery |
| **M6 Cross-platform Productization** | PLANNED [#38] | Native platform and hardware acceptance, full accessibility/UX QA, V1→V2 migrations/backup/WAL/regression, distribution rights, signing/updater decision, RC/private beta and stable-release gates |

**Roadmap sequencing nuance:** The canonical pre-demo Design Council gate #52 occurs **after V2 core feature slices required for demo** (M3–M5 as actually scoped) and **before** M6 demo/private-beta/release acceptance. Early D0/D1 design-direction discovery was separately PO-authorized; it must **not be mislabeled the complete pre-demo UI/UX acceptance**. The PO now seeks to avoid endless prototype loops, preserve useful Council research, return to Collections and consider versioning, while not missing significant DevEx obligations. This is a **planning preference to reconcile**, not unilateral roadmap rewrite.

## DevEx / Design Council — avoid unlimited research scope

- [#47](https://github.com/fatihemres/MyLibrary/issues/47) keeps D0–D7 developer-tool research open; inventory, tool-identity analysis and partial security/controlled pilots exist. D5 role/model/quota matrix, D6 actual `ADOPT/PILOT/WATCH/REJECT` choices and D7 persistent governance publication are not automatically complete.
- [#51](https://github.com/fatihemres/MyLibrary/issues/51) scopes Graphify code-only vs `rg` evidence, opt-in Context7 generic versioned docs with controlled egress, and Ponytail UI/UX OFF + separate opt-in technical use. Ponytail `FULL` in D0 exposed all design contexts; a later **fresh Codex CLI D1** run reported `PONYTAIL_DEFAULT_MODE=off`, clean coordinator/A/B/C/D effective received contexts and no live mode flag. **This is session-specific evidence, not proof global default changed permanently**, a fifth specialist, or adopted workflow.
- [#52](https://github.com/fatihemres/MyLibrary/issues/52) Design Council: D0 genuine three-way creative comparison, PO strongly preferred **Reading Table**, especially selected-book spatial transition. D1 trial selected a **labelled left rail** as PO-leading shell, but PO reports harsher surrounding motion, visible vertical page hopping and excessive sparsity. D1 preserved prototype is **PARTIAL** after Windows Chrome/Edge/host launch failures; limited in-memory Chromium inspection did not deliver real 1× D1 or native motion acceptance. Keep all four initial Council contributions and failure evidence.
- An effective near-term Council/DevEx **readiness checkpoint** need not mean committing to installing or adopting *every* researched tool. Recommended decision outcomes: (a) document official roles/evidence limits and isolation; (b) keep existing D0/D1 prototypes and confirm the chosen design principles; (c) defer holistic visual polish until actual target functionality exists; (d) explicitly label open evaluation candidates `WATCH`/`RESEARCH` instead of falsely marking them `ADOPTED`; (e) leave confirmed production UX/keyboard findings under [#27](https://github.com/fatihemres/MyLibrary/issues/27).
- The three Draft docs PRs #48/#58/#59 overlap in research-provenance purpose but are **not identical by assumption**; perform read-only per-file diff, provenance/private-path audit, supersession plan and exact-SHA review before the PO separately decides which (if any) to integrate or close. The separate EngineeringOS Draft PR #15 is research only and not an accepted runtime workflow.

## Collections re-entry is the major product gate, not just UX

Issue [#33](https://github.com/fatihemres/MyLibrary/issues/33) explicitly leaves open:
- Smart rule model vs manually curated Collections; create/edit/membership/selection behavior.
- Manual Edition membership plus explicitly chosen Physical Copy membership where needed, **without** converting one to the other or violating independent Copy identity.
- Whether Wishlist items may be Collection members (**not resolved** by the historical M3 Discovery PDF).
- Source-aware, user-confirmed series organization; no invented order or automatic merge.
- Filter/FTS, persistence, schema, migration, backup/restore, import/export and UI acceptance impact.

The Reading Table prototype's Collection interactions are **design research**, not a technical spec or production authorization. Before implementing Collections: perform PO product policy discovery, database/data-safety architecture review, frozen synthetic acceptance criteria and a scoped implementation PR, with independent exact-SHA source/security review and actual Windows acceptance. Visual Shelves #34 similarly requires explicit PO scoping and no 3D-engine assumption.

## Versioning and release decision boundary

**Existing development source is already `2.0.0-alpha.1`**, not a published V2. The PO may choose **one** of the following later, subject to specific authority:
- **Internal SHA-labelled test checkpoint:** reuse the existing dev version, reference an exact commit/source tree and synthetic build manifest without tagging, changing package manifests or publishing a release. Least disruptive for planning and manual acceptance.
- **Explicit pre-release increment / distribution candidate** (e.g. future `2.0.0-alpha.2` only if PO approves exact content, scope, tests, version synchronization, distribution/security and permitted private audience): not equivalent to stable V2; a SemVer label alone cannot satisfy release checklist.
- **Stable `v2.0.0` release**: only after owner-approved product scope, acceptance/regression, platform/rights/signing/updater decisions, final release-candidate SHA, protected-reference and GitHub Release authorizations. Do not create any tag now.

**Avoid false dependency:** Satisfying each open DevEx idea is **not** necessarily a V2 stable-release gate. Conversely, M3/M4/M5 required product scope, crash-safe restore and #21/#27/#38 acceptance cannot be waved through merely because Council or DevEx research is complete. The PO must decide what functionality belongs in the *initial* V2 stable cut if the roadmap would otherwise defer significant milestones.

## Proposed sequence for PO deliberation (NOT an approved revised roadmap)

1. **One live integration/acceptance reconciliation:** compare #31, #26, #32, #54, #21 and #27 with exact merged PR #55/#56/#57 facts. Identify completed versus remaining acceptance, security and docs gaps. Recommend making dated corrections in PROJECT_STATUS/VERIFICATION/DECISIONS/ROADMAP **only after separately bounded PO authorization**. Do not auto-close M2 or any Issue.
2. **Time-box DevEx and Council foundation:** use #47/#51/#52 to preserve actual tool/role findings, isolate Ponytail for creative work, address the D1 partial/scroll-jump motion lessons, declare a *provisional* Reading Table + preferred rail direction with color engineering still an open idea, and consolidate duplicated drafts when safely reviewed. No requirement to exhaust every DevEx research lead.
3. **Return to M3 product development:** #33 Collections PO policy decisions → safe architecture and synthetic acceptance → scoped implementation; then #34 Visual Shelves only to PO-chosen first-delivery scope; finish M3 acceptance.
4. **Scope and deliver planned M4/M5 product areas under explicit owner sequencing** (or explicitly revise initial-release scope if a narrower V2 is desired); do not silently drop future milestone items or call them complete.
5. **Full cross-screen UI/UX implementation and visual acceptance** once core target screens exist: Council #52 + real code QA #27, EN/TR, light/dark, reduced-motion, real Windows/DPI, keyboard/accessibility and interruption continuity. The PO's D0/D1 research becomes evidence for the actual app, not an automatic CSS migration.
6. **M6 release readiness:** data/WAL/recovery and V1 migration, rights/licences, cross-platform tests, external dependency/security, signing/updater choices and release-candidate distribution; choose and approve pre-release or stable version milestone **separately**.

**No milestone/roadmap change, Issue closure, PR merge, tag or release was performed by this research audit.**

## Questions intentionally left to PO (do not infer an answer)

- Is the PO seeking an **internal versioned preview** before Collections, or a full `v2.0.0` stable release after the agreed V2 scope and UI/UX work? The two choices have radically different evidence and distribution gates.
- Must every planned M4/M5 line item ship in the initial `v2.0.0`? The current ROADMAP still includes them. Do not silently narrow without an explicit owner decision.
- Which remaining #47/#51 pilots are essential before Collections implementation, and which are research ideas that can stay open as `WATCH`?
- What does “finish the Council” mean in relation to the formally later pre-demo gate: provisional design language and experience rules now, or an exhaustive final whole-app UX pass (which would need future screens)?

**Conclusion:** `M2_OPEN_ADMIN / M3_PARTIAL_WITH_COLLECTIONS_DISCOVERY_OPEN / PR55_56_57_INTEGRATED / D0_D1_DESIGN_RESEARCH_NOT_FINAL / DEVEX_PILOT_SELECTION_PENDING / VERSION_ALPHA1_IN_SOURCE_ONLY / V2_RELEASE_UNAUTHORIZED`.
