# MyLibrary — Decision Register

> **Reconciled on:** 2026-10-20 against repository/GitHub evidence and the supplied PO discovery context. D-010/D-011 preserve the PO discovery directions recorded in the 19 October Master Handoff; that original handoff was not independently reviewed here. This reconciliation date is not a separate PO reapproval date. A decision's registration date is **not** necessarily its original approval date. Where original decision dates are unclear, do not invent them. The PO is final authority for product scope, milestone closure, integration and releases.
>
> **Canonical boundaries:** [AGENTS.md](../AGENTS.md) defines agent permissions and safety; [ROADMAP.md](v2/ROADMAP.md) defines milestone scope; [ARCHITECTURE.md](../ARCHITECTURE.md) describes architecture; [repository-hardening.md](development/repository-hardening.md) governs exact-SHA Git workflow; [versioning.md](versioning.md) governs releases. This register records **why/what was decided** and links to those sources; it must not create a competing set of rules.

## Accepted standing decisions

| ID | Standing decision | Rationale / constraint | Primary source |
| --- | --- | --- | --- |
| **D-001** | Windows-first, cross-platform target; Tauri 2 + React/TypeScript + Rust + SQLite; local/offline-first with no required server, account, cloud or telemetry. | Keep personal library private and usable offline; preserve future platform portability. | [Architecture](../ARCHITECTURE.md), [AGENTS](../AGENTS.md) |
| **D-002** | Distinguish **Edition** and **Physical Copy**. Do **not** introduce a Work table, infer identity from title, or auto-merge editions/copies. | Copy-specific condition, location, reading and loans must remain independent; shared bibliographic data is edited deliberately. | [Architecture](../ARCHITECTURE.md), [duplicate decisions](architecture/duplicate-decisions.md) |
| **D-003** | Preserve user records, cover files, attachments, V1 identities and backup/restore integrity. Never test on a real personal library; use isolated synthetic libraries. | Irreversible data loss is unacceptable; migrations and restores must be validated and recoverable. | [AGENTS](../AGENTS.md), [migrations](architecture/migrations.md) |
| **D-004** | Metadata/ISBN lookups are user-initiated, reviewable and bounded; remote input is untrusted. No unapproved network request. | Protect offline operation, privacy, existing cover/draft content and SSRF/resource boundaries. | [AGENTS](../AGENTS.md), [metadata providers](architecture/metadata-providers.md), [CQ-02-A cover policy](testing/cq02a-safe-openlibrary-covers.md) |
| **D-005** | Protect `main`, `v1-maintenance`, `v1.0.0`; develop V2 in scoped feature branches/worktrees. Review/test/PR/CI/PO desktop acceptance where applicable and obtain **separate explicit PO integration approval**. Integrate to `v2` only by **exact-SHA fast-forward**; no merge commit, squash, rebase or force. | Keep canonical history linear, auditable and recoverable. | [Repository hardening](development/repository-hardening.md), [AGENTS](../AGENTS.md) |
| **D-006** | Release, signing, updater enablement, tagging and `main` promotion need their own explicit PO approval. | Passing CI or closing a feature is not a public release or platform certification. | [Versioning](versioning.md), [ROADMAP](v2/ROADMAP.md) |
| **D-007** | M1 closed; M2-A/B/C closed; M2-D integrated and Issue #6 closed; **overall M2 remains open until PO closure**. M3 and later are planned, not approved for implementation. | Technical completion, milestone decision and release gate are separate. | [ROADMAP](v2/ROADMAP.md), [PR #7](https://github.com/fatihemres/MyLibrary/pull/7), [Issue #6](https://github.com/fatihemres/MyLibrary/issues/6) |
| **D-008** | For CQ-02-A only, safe bounded Open Library ISBN cover acquisition was authorized, reviewed and integrated. Google Books permanent cover download and automatic orphan cover deletion remain out of scope. | Restrict scope and prevent unsafe or unlicensed media persistence/destructive cleanup. | [PR #11](https://github.com/fatihemres/MyLibrary/pull/11), [CQ-02-A policy](testing/cq02a-safe-openlibrary-covers.md) |
| **D-009** | The Windows data-folder opener responsiveness correction was integrated separately on top of CQ-02-A and PO-verified in a synthetic Windows session. | Avoid UI/global loading and database-lock blocking; do not conflate CI with actual Explorer window observation. | [PR #12](https://github.com/fatihemres/MyLibrary/pull/12), [VERIFICATION](../VERIFICATION.md) |

## PO discovery directions — not approved implementation scope

The following PO discovery directions are recorded in the 19 October Master Handoff. No separate reapproval date is asserted here. They do not authorize M3 implementation or define an approved schema.

| ID | Discovery direction | Rationale / constraint | Source |
| --- | --- | --- | --- |
| **D-010** | **M3 discovery direction only:** a Wishlist entry represents not-yet-owned material, never a fake Physical Copy. After explicit acquisition flow it may become Edition/Copy; fulfilled/purchased Wishlist history is retained. Multiple retailer links and currency-aware budget summaries are PO discovery preferences, **not** an approved schema or implementation scope. | Protect ownership semantics and historical purchase intent; separate detailed M3 acceptance decision. | 19 October PO Master Handoff (not committed; not independently reviewed here); [roadmap](v2/ROADMAP.md) defines only approved milestone scope |
| **D-011** | **M3 export direction only:** catalogue export defaults to Library with selectable groups such as Wishlist/Collections when implemented; comprehensive Backup/Restore remains separate from catalogue export. "All Data" needs explicit design review. | Do not mistake a partial export for full recoverability or omit new relationships from backups. | 19 October PO Master Handoff (not committed; not independently reviewed here); [architecture](../ARCHITECTURE.md) documents backup integrity |

## Historical PO directions from the 19 October Master Handoff — not approved schema or scope

Source: `MYLIBRARY_MASTER_HANDOFF_2026-10-19.md`, as relayed by the PO in the 2026-10-22 documentation instruction. The file itself and the original first-chat transcript were **not** independently reviewed here; no quotation, approval date or acceptance criterion is asserted. Status for all entries: **HISTORICAL PO DIRECTION**. They are **not** an approved schema, and they do **not** authorize M3 implementation (Q-002 remains open). Wishlist direction is already recorded in **D-010**.

| ID | Historical direction | Distinct from |
| --- | --- | --- |
| **D-017** | **Manual Collections — membership model.** Manual Collections should support Edition membership and, when necessary, membership of a specifically selected Physical Copy. | **Not** the M3 Discovery PDF's PO-03 question (may Wishlist items be members of a Manual Collection?), which remains an open, separate question. The identifier "PO-03" is deliberately not reused here. |
| **D-018** | **Visual Shelves — design direction.** Support the physical Room → Bookcase → Shelf hierarchy, with 2D covers and typographic book spines. | **Not** the PDF's PO-04 question about the precise scope of the first delivery, which remains open. |
| **D-019** | **Release approval sequence (direction).** PO final review → installer candidate → private beta → feedback/triage → **separate** final PO approval → stable release. | Does **not** authorize a beta, an installer candidate or a release; D-006 and [versioning](versioning.md) still govern. `versioning.md` was not changed in this task; whether it should state the private-beta step explicitly is a flagged follow-up for the PO. |

## PO planning decisions of 2026-10-22 (roadmap placement and camera scope)

Status terms: **ACCEPTED — planning direction** = the PO requested or approved the item's inclusion in the V2 plan; **ACCEPTED — PO decision** = direct PO stop/deferral decision; **PROPOSED — assistant allocation** = assistant-proposed naming, wording or ordering awaiting PO confirmation; **NOT AUTHORIZED** = no implementation start.

**Roadmap placement alone is not implementation authorization.** M2-E local implementation was separately authorized; the PO accepted its limited behavior on 2026-10-23 and authorized commit, feature-branch push and draft PR preparation. Integration and milestone closure remain unauthorized. M2-F remains PLANNED without implementation authorization; M2 remains OPEN. Earlier readiness proposals are not standalone PO decisions.

**Provenance note.** The 2026-10-22 planning decisions (D-012 to D-016, D-020, D-021) were provided directly by the PO through the ChatGPT project conversation, which is not stored in the GitHub repository. The roadmap and discovery references to these entries are cross-references within this branch, not independent evidence. The historical M3 and release directions (D-017 to D-019) derive from the PO-provided 19 October Master Handoff; the original first-chat transcript was not independently verified. The ACCEPTED / PROPOSED / NOT AUTHORIZED distinctions in this section and below are unchanged by this note.

| ID | Item | Status | Direct PO instruction versus assistant proposal | Source |
| --- | --- | --- | --- | --- |
| **D-012** | **Series & Genre Metadata Enrichment** in V2. The PO explicitly approved series name, series volume/order (when reliably available) and genre suggestions from Open Library / Google Books, offered during the existing user-initiated ISBN lookup, with provenance, field-level preview, explicit Apply and separate Save; no overwrite without approval; no new fields (weight, dimensions, translators, edition information); no Work table, title merging or invented series. | ACCEPTED — local implementation separately authorized; limited M2-E behavior accepted by PO on 2026-10-23. Commit, feature-branch push and draft PR authorized; integration and M2 closure require separate approval. | PO: later acceptance of opt-in bracketed community series tags and conservative genres; no inferred order. Google Books availability and richer series discovery require separate future scope decisions. Original planning direction is retained above. | [ROADMAP](v2/ROADMAP.md) |
| **D-013** | **Optional Scan-to-Lookup.** Only when the user explicitly picks a scan + lookup workflow may USB HID/webcam scanning open the existing preview without a second lookup click. Plain scanning stays offline; no background network, bulk provider fan-out, silent apply or autosave. | ACCEPTED — planning direction. NOT AUTHORIZED for implementation. | PO: inclusion and the limits above. Assistant: the slice name "M2-F" and its order after M2-E — PROPOSED. | [ROADMAP](v2/ROADMAP.md) |
| **D-014** | **Camera optimization stopped.** After the PO's physical Windows tests on 2026-10-22 (USB scanner reliable; phone-as-webcam very good; ordinary webcam handles easy/larger barcodes, struggles with difficult ones) the PO stopped further ordinary-webcam image-quality, resolution and decoder-performance work. Integrated M2-D is preserved; unmerged local candidates are not integrated; no all-platform acceptance is claimed. | ACCEPTED — PO decision. | PO: decision. Hardware observations are PO-reported (see VERIFICATION). | [VERIFICATION](../VERIFICATION.md), [PROJECT_STATUS](../PROJECT_STATUS.md) |
| **D-015** | **M3 additions:** assisted series organization of existing independent Edition records (user confirmation required); concise versus detailed filters within Advanced Search. A complete Simple/Advanced application redesign is not part of M3. | ACCEPTED — planning direction. NOT AUTHORIZED; M3 scope still needs Q-002. | PO: placement. Assistant: milestone-level wording — PROPOSED. | [ROADMAP](v2/ROADMAP.md) |
| **D-016** | **Deferred after V2 (discovery only):** app-free phone-to-MyLibrary scanning, full Simple/Advanced UI, local reader profile, Reading Garden, achievements, advanced sharing cards, premium themes. | ACCEPTED — PO decision (deferral). NOT AUTHORIZED. | PO: deferral. | [post-V2 discovery](product/post-v2-discovery.md) |
| **D-020** | **M5 addition:** limited offline PNG card from manually selected books, with explicit privacy preview. No automatic social posting, personal-information export or advanced Wrapped/profile features. | ACCEPTED — planning direction. NOT AUTHORIZED. | PO: placement. Assistant: milestone-level wording — PROPOSED. | [ROADMAP](v2/ROADMAP.md) |
| **D-021** | **M6 addition:** small outstanding TR/EN book-detail timestamp localization fixes, if not already addressed. | ACCEPTED — planning direction. NOT AUTHORIZED. | PO: placement. Assistant: wording — PROPOSED. | [ROADMAP](v2/ROADMAP.md) |

## Open PO decisions — do **not** silently resolve

| ID | Question | Current disposition / source |
| --- | --- | --- |
| **Q-001** | Is the **M2 milestone formally closed**, and are any remaining acceptance checks necessary? | **OPEN**. M2-D integration and Issue #6 closure are confirmed but not sufficient for automatic M2 closure. [ROADMAP](v2/ROADMAP.md) |
| **Q-002** | Which M3 Organization feature slices/acceptance criteria should start, and in what order? | **NOT AUTHORIZED**. Requires PO scoping against M3 Discovery and [ROADMAP](v2/ROADMAP.md). |
| **Q-003** | Should Reading Garden grow only when books are completed, or also from ongoing reading progress? | **DISCOVERY ONLY**. See [post-V2 ideas](product/post-v2-discovery.md). |
| **Q-004** | Should CQ-02-B cover cache / performance profiling receive a scoped discovery task? | **NOT AUTHORIZED**. Static risks are not measured performance defects. |
| **Q-005** | When, if ever, should optional share-card templates become paid? | **DISCOVERY ONLY**. No monetization/payment authorization. |

## Recorded ideas are not approved roadmap scope

The PO discussed optional **Simple / Advanced UI**, offline shareable PNG cards, opt-in local reader profile, non-punishing Reading Garden / alternative metaphors, achievements and potential paid themes. Preserve these in [post-V2 discovery](product/post-v2-discovery.md). Their documentation grants **no** development, scheduling, monetization or release authority. The V2 M3–M6 scope remains in [ROADMAP](v2/ROADMAP.md).

## How to maintain this register

1. Add/change an entry only when a PO decision has a clear status and referent. Capture **ID, decision, short rationale, effective date if known, source/link and superseding entry if replaced**.
2. Never transform an *open question*, agent suggestion or successful technical implementation into an accepted product decision. Use **OPEN / PROPOSED / ACCEPTED / SUPERSEDED** explicitly.
3. Keep entries concise. Detailed investigation belongs in existing architecture, test or discovery files; date-sensitive execution evidence belongs in [PROJECT_STATUS.md](../PROJECT_STATUS.md) and [VERIFICATION.md](../VERIFICATION.md).
4. If a decision changes, preserve the historical entry and link its successor; do not silently rewrite history. Keep the update within a reviewed, scoped branch/PR and apply the PO integration gate.
