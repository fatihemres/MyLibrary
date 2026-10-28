# MyLibrary V2 roadmap

This is the canonical owner-approved V2 milestone roadmap. The shared safety and verification
contract is [AGENTS.md](../../AGENTS.md). Active development stays on `v2`; V1 release refs remain
protected. Milestone 1 is closed; **M2 — Barcode & Metadata remains OPEN**.

Future milestone scopes may be refined by the owner. Agents must not infer or move features between
milestones, or start future work, without approval. A roadmap entry is not evidence of implementation
or verification.

## Dated evidence checkpoint — 2026-10-28 (no milestone closure)

- Canonical `v2` `42f963e450186d81da3922a209eaffae11e843c6`; separate PO-approved one-line Apple Silicon runner maintenance [PR #44](https://github.com/fatihemres/MyLibrary/pull/44) integrated, with post-push [Foundation 4/4](https://github.com/fatihemres/MyLibrary/actions/runs/40651855231) and [CodeQL 3/3](https://github.com/fatihemres/MyLibrary/actions/runs/40651857486) SUCCESS. Does not expand product scope.
- [M2 evidence/closure audit #31](https://github.com/fatihemres/MyLibrary/issues/31) and [M3-B bounded Wishlist acceptance audit #26](https://github.com/fatihemres/MyLibrary/issues/26) were recorded. **M2 overall OPEN and M3-B administrative acceptance OPEN**, awaiting separate PO decision; M3-C/Collections/Visual Shelves remain planned. Google Books [#29](https://github.com/fatihemres/MyLibrary/issues/29), multi-volume ISBN [#30](https://github.com/fatihemres/MyLibrary/issues/30), visual [#27](https://github.com/fatihemres/MyLibrary/issues/27), performance [#28](https://github.com/fatihemres/MyLibrary/issues/28) not silently resolved.
- No release, signing, updater, tag, `main` promotion or extra implementation approved. Earlier dated notes are historical.

## Dated implementation checkpoint — 2026-10-27 (no milestone closure)

- **M2-F Optional Scan-to-Lookup — INTEGRATED:** [PR #19](https://github.com/fatihemres/MyLibrary/pull/19), exact commit `6b62eb8c9dbc87df351e4d1a4b87f3ca3b7e6eaf`; user-selected lookup after USB/camera scanning only, preserving offline scan and separate Apply/Save. Earlier candidate-only M2-F wording below is historical, not current status.
- **M3-A Turkish Search/Advanced Filters — INTEGRATED:** [PR #41](https://github.com/fatihemres/MyLibrary/pull/41) at `ec742660f9c2e2bb33df9f4434b8dcf9efd0fab8`; old stacked [#20](https://github.com/fatihemres/MyLibrary/pull/20) closed unmerged/superseded.
- **M3-B Real Wishlist — INTEGRATED:** [PR #42](https://github.com/fatihemres/MyLibrary/pull/42) at `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa`; wishlist records are independent from owned Physical Copies; former stacked [#22](https://github.com/fatihemres/MyLibrary/pull/22) is superseded, not a merged feature. See [verification](../../VERIFICATION.md) for final CI status and attributed review.
- **M2 milestone remains OPEN** pending [#31](https://github.com/fatihemres/MyLibrary/issues/31) and a separate PO decision. Remaining M3 Organization areas are **PLANNED** pending scoped authorization. This checkpoint does not authorize release, signing, updater, tag, other feature development, or milestone closure.

## M1 — Foundation — CLOSED

- English/Turkish i18n foundation and RTL readiness.
- Platform abstraction.
- Safe migration framework and V1 compatibility.
- Metadata provider abstraction.
- Updater groundwork, with updates disabled.
- Accessibility baseline.
- Windows, macOS (Apple Silicon and Intel), and Linux automated CI/package verification.
- No M2 feature work.

Closed on 2026-10-09. See the [foundation assessment](foundation-assessment.md),
[verification record](../../VERIFICATION.md), and [platform matrix](../testing/v2-platform-matrix.md).
Windows manual desktop evidence is separate from automated CI/package evidence. macOS/Linux native
manual acceptance, signing/notarization, and full accessibility QA are not implied by M1 closure.

## M2 — Barcode & Metadata — OPEN

- **M2-A — ISBN & Metadata Foundation — CLOSED.** Integrated at `ec661cd0f153540b2fb27784d2642fc01d356f00`; final integration CI run `38120576734` passed all four platforms.
- **M2-B — Duplicate Intelligence + Edition / Physical Copy Decisions — CLOSED.** Integrated at `f469306b9f8edd720046376fee07f3de913323dc`; final integration CI run `38257915937` passed all four platforms. See [duplicate decisions](../architecture/duplicate-decisions.md).
- **M2-C — USB HID Barcode Scanner + Batch Scan — CLOSED.** Integrated at `1edf3014d252067b7ee435478cba3f6aaf9350c9`; final integration CI run `38365564445` passed all four platforms. Focus-only keyboard-wedge capture and session queue; see [barcode scanning](../architecture/barcode-scanning.md). M2 remains open.
- **M2-D — Webcam scanning — INTEGRATED.** [PR #7](https://github.com/fatihemres/MyLibrary/pull/7) integrated at `25f928c7e915b9fb92ccf0e48e2312ac666530e1` (2026-10-15); [Issue #6](https://github.com/fatihemres/MyLibrary/issues/6) closed. PO observed physical Windows camera scanning; this does not establish macOS/Linux hardware acceptance. Earlier candidate-only reports are historical evidence in [VERIFICATION.md](../../VERIFICATION.md). **Overall M2 remains OPEN pending explicit PO milestone closure.**

- **M2 quality follow-ups (integrated 2026-10-19):** [PR #11](https://github.com/fatihemres/MyLibrary/pull/11) adds safe bounded Open Library ISBN cover acquisition (`625ea3dff84ac138c455e17a24eea0983268999f`); [PR #12](https://github.com/fatihemres/MyLibrary/pull/12) fixes non-blocking data-folder opening (`f4e0d6ecf946bcb23310dc926656b65908c1d3cb`). See [verification evidence](../../VERIFICATION.md) for final push CI and native acceptance boundaries. Neither PR closes M2 or authorizes M3.

- **M2-D camera decision (PO, 2026-10-22):** further ordinary-webcam image-quality, resolution and decoder-performance experiments are stopped; no additional camera-optimization effort is planned. The integrated M2-D webcam feature is preserved. Unmerged local performance/UX candidates are **not** integrated, and this does not establish acceptance on all platforms. See [VERIFICATION.md](../../VERIFICATION.md) and [DECISIONS.md](../DECISIONS.md).

- **M2-E — Series & Genre Metadata Enrichment — INTEGRATED (limited PO-accepted scope).** [PR #17](https://github.com/fatihemres/MyLibrary/pull/17) was integrated by exact-SHA fast-forward on 2026-10-23 at `7c3430eacc47b1c5cf7996e9fbf71a4b25f636ef`; final push [V2 foundation](https://github.com/fatihemres/MyLibrary/actions/runs/39946788500) 4/4 and [CodeQL](https://github.com/fatihemres/MyLibrary/actions/runs/39946788497) 3/3 PASS. Accepted delivery offers opt-in series names only from bracketed Open Library `[series:...]` community tags (possibly incorrect or publisher collections), and conservative, source-attributed genre suggestions. No reliable series order is available; none is inferred. Google Books quota/availability, richer series discovery and clearer multi-volume/set-ISBN duplicate UX are separate follow-ups, not newly authorized development. **M2 remains OPEN.** The original conditional scope follows: During the existing user-initiated ISBN metadata lookup, offer: series name when supported by reliable provider data; series volume/order when reliably available; genre suggestions from Open Library / Google Books metadata. Preserve source provenance, field-level preview, explicit Apply and separate Save. Never overwrite existing user values without approval. No new metadata fields beyond series/order/genre (e.g. weight, dimensions, translators, edition information are out of scope); currently implemented metadata fields are preserved. No Work table, title-based merging, invented series assignments or silent record changes.
- **M2-F — Optional Scan-to-Lookup — LOCAL CANDIDATE / DRAFT PR PREPARATION AUTHORIZED.** *PO authorization on 2026-10-23 covers local implementation/testing and commit, feature-branch push and draft PR only. Automated verification is reported in [VERIFICATION](../../VERIFICATION.md); physical USB/camera Windows acceptance and independent review remain pending. No integration or final PO acceptance; overall M2 remains OPEN.* When the user explicitly selects an ISBN scanning + metadata lookup workflow, USB HID or webcam scanning may open the existing metadata preview without requiring a second lookup click. Regular scanning stays offline-only. No automatic background network access, bulk provider-request fan-out, silent metadata application or automatic saving.
- *Provenance:* original inclusion was a PO planning direction; later M2-E acceptance is recorded in [D-012](../DECISIONS.md). The later scoped M2-F implementation and draft checkpoint authorization is recorded in D-013; hardware acceptance and integration are separate gates.

- Manual ISBN entry/lookup.
- USB barcode scanner workflows.
- Webcam barcode scanning where supported.
- Batch scan workflow.
- Open Library and Google Books providers.
- Normalized provider results and provenance/source awareness.
- Metadata preview before apply, with field-level merge/selection; never blindly overwrite manually
  entered user data.
- Duplicate intelligence before creating/importing records, preserving Edition vs Physical Copy
  semantics and avoiding title-based inferred merging.

Boundaries: no Work table, unrelated performance rewrite, updater activation, or signing work.
Existing optional lookup and M1 provider boundaries are foundations, not proof that M2 is complete.

## M3 — Organization — PLANNED

**M3-A scoped exception (2026-10-24 checkpoint):** the PO separately authorized Turkish FTS5
search foundation and bounded advanced filters, including concise/detailed presentation. The local
candidate is verified and commit/push plus a stacked DRAFT PR targeting M2-F
[PR #19](https://github.com/fatihemres/MyLibrary/pull/19) is authorized. See
[search architecture](../architecture/search.md) and [verification](../../VERIFICATION.md).
Independent review and physical Windows acceptance remain pending. No integration or milestone
closure is authorized; M2 stays OPEN. Other M3 features remain planned except the separate M3-B authorization below.

**M3-B scoped local authorization (2026-10-25):** the PO approved Real Wishlist local implementation,
schema-4 migration, synthetic verification and documentation on the exact M3-A parent. See
[Wishlist architecture](../architecture/wishlist.md) and [D-010 supplement](../DECISIONS.md).
No commit/push/PR, integration, PO acceptance or milestone closure is authorized. M3-C conversion,
Collections and Visual Shelves are not started. Wishlist Studio remains future M5 discovery.

- Smart Collections.
- Manual collections.
- Wishlist.
- Advanced search.
- *(Planned addition)* Assisted series organization for existing independent Edition records, requiring explicit user confirmation.
- *(Planned addition)* Concise versus detailed filters within Advanced Search. A complete Simple/Advanced application redesign is **not** part of M3.
- Visual shelves.

*Historical PO directions (19 October Master Handoff; not approved schemas, no M3 implementation authorization; see [D-010, D-017, D-018](../DECISIONS.md)):* Manual Collections may hold Editions and, when necessary, a specifically selected Physical Copy; Visual Shelves follow Room → Bookcase → Shelf with 2D covers and typographic spines; Wishlist stays separate from owned Physical Copies.

## M4 — Reading Intelligence — PLANNED

- Reading sessions.
- Goals.
- Statistics.
- Rereads.
- Insights.

## M5 — Data Ecosystem — PLANNED

- Goodreads import.
- StoryGraph import.
- Calibre integration/import where feasible.
- PDF/HTML catalogue and reporting.
- Backup V2.
- Optional proven encryption.
- *(Planned addition)* Limited offline PNG card generated from manually selected books, with an explicit privacy preview. No automatic social posting, personal-information export, or advanced Wrapped/profile features.

## M6 — Cross-platform Productization — PLANNED

- Windows/macOS/Linux product acceptance.
- Updater activation only with valid signed distribution and explicit authorization.
- Signing/notarization.
- Platform QA.
- Accessibility QA.
- Packaging and release-candidate work.
- *(Planned addition)* Small outstanding TR/EN book-detail timestamp localization fixes, if not already addressed.

## After V2 — deferred discovery ideas (not roadmap scope)

App-free phone-to-MyLibrary scanning, full Simple/Advanced UI, local reader profile, Reading Garden, achievements, advanced sharing cards and premium themes remain deferred discovery ideas; see [post-V2 discovery](../product/post-v2-discovery.md).

## Cross-cutting requirements

- English/Turkish first; extensible localization and RTL readiness.
- Local-first/offline core; no mandatory account, cloud backend, telemetry, or remote logging.
- Platform-aware behavior, with actual results reported separately per platform and verification type.
- Security/privacy: isolated test data, no production library access, and no committed secrets or
  user data. Treat external inputs and provider responses as untrusted.
- Preserve archive/path traversal protections and safe, versioned migration/backup semantics.
- Use synthetic performance testing; do not inspect real personal libraries to benchmark changes.
- Preserve Edition/Physical Copy identity and V1 compatibility; do not silently merge or discard data.
- Keep signing credentials external and updates disabled until authorized, valid signed distribution
  is configured.
- No `v2.0.0` tag until explicit owner approval. Published tags and historical V1 releases are immutable.

Existing V1 capabilities may provide a starting point for planned milestones; their presence does
not authorize expansion or imply the future milestone is complete. Each milestone needs scoped
implementation, relevant regression checks, truthful verification evidence, and owner-directed closure.
