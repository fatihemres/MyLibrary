# MyLibrary shared agent contract

This is the canonical, tool-neutral instruction file for coding agents working in this repository.
The owner-approved [V2 roadmap](docs/v2/ROADMAP.md) defines milestone scope.

## Scope and Git

- Active V2 work belongs on `v2`. Verify the branch and inspect existing changes before editing;
  preserve unrelated or unfinished work.
- Protect `main`, `v1-maintenance`, and the immutable `v1.0.0` release. Do not alter these refs during
  V2 work. Never force-push, move published tags, or replace historical release assets.
- Do not commit, push, tag, or release unless explicitly requested by the task. Do not create
  `v2.0.0` without explicit owner approval.
- Stay within the approved task and milestone. Do not start future milestones or infer, expand,
  or move features between milestones without owner approval. Prefer minimal, evidence-based changes.

## Data, architecture, and privacy

- Never access or modify real production library data. Use isolated synthetic libraries and sanitized
  fixtures for development and verification; never commit runtime data, databases, covers,
  attachments, backups, exports, caches, or build artifacts.
- Preserve local-first architecture and offline core operation. No mandatory cloud service, account,
  telemetry, or remote logging. Repository visibility does not change product privacy guarantees.
- Edition and Physical Copy separation is intentional. Keep copies independently managed; do not
  merge records by title or infer relationships. No Work table unless an explicitly approved
  milestone requires it; M2 does not.
- Preserve V1 compatibility, record IDs, relationships, managed paths, and backup/restore semantics.
  Migrations must be versioned, transactional, safe, and non-destructive unless explicitly approved.
  Preserve recovery options, test failure/rollback, and never fall back to an empty database on error.
- Treat imports, archives, metadata, paths, URLs, and provider responses as untrusted. Validate them
  before use; preserve archive/path traversal protections and user consent before applying metadata.
- Never embed secrets, API keys, or signing credentials. Keep the updater disabled until explicitly
  authorized with valid signed distribution; do not invent endpoints or enable unsigned updates.

## Verification and reporting

- Implemented does not mean verified. Record actual commands, results, platform, and limitations;
  distinguish local automated, CI, manual desktop, and platform-specific evidence. A successful
  package build does not establish native UX acceptance on that platform.
- Use checks relevant to the changes: `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run test:rust`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`,
  `cargo check --manifest-path src-tauri/Cargo.toml --all-targets --locked`, `npm run build`,
  `npm run desktop:build`, and isolated desktop workflows (`npm run test:desktop`) where applicable.
  Markdown-only work needs documentation/format/link checks and `git diff --check`, not an app rebuild.
- Preserve English/Turkish localization, RTL readiness, keyboard/unsaved-change safety, accessible
  labels/focus, and reduced-motion behavior. Do not claim full accessibility certification from a
  baseline audit.
- Review the final diff and working tree, exclude private/generated content, and report unfinished
  or unverified work honestly. Stop at the approved milestone boundary.
