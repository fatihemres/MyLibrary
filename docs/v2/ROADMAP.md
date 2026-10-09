# MyLibrary V2 roadmap

This is the canonical owner-approved V2 milestone roadmap. The shared safety and verification
contract is [AGENTS.md](../../AGENTS.md). Active development stays on `v2`; V1 release refs remain
protected. Milestone 1 is closed; **M2 — Barcode & Metadata is NEXT, not started by this document**.

Future milestone scopes may be refined by the owner. Agents must not infer or move features between
milestones, or start future work, without approval. A roadmap entry is not evidence of implementation
or verification.

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

## M2 — Barcode & Metadata — NEXT

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

- Smart Collections.
- Manual collections.
- Wishlist.
- Advanced search.
- Visual shelves.

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

## M6 — Cross-platform Productization — PLANNED

- Windows/macOS/Linux product acceptance.
- Updater activation only with valid signed distribution and explicit authorization.
- Signing/notarization.
- Platform QA.
- Accessibility QA.
- Packaging and release-candidate work.

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
