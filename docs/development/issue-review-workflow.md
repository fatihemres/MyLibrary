# GitHub Issue and PR Review Workflow

> **PO-approved process direction (2026-10-26).** This file formalizes tracking and verification, not permission to implement a feature, write unrelated code, merge a PR, close a milestone, publish a release, change repository settings or modify protected refs. Read [AGENTS.md](../../AGENTS.md), [roadmap](../v2/ROADMAP.md), [decision register](../DECISIONS.md), [verification](../../VERIFICATION.md) and [repository-hardening.md](repository-hardening.md). Live GitHub SHA/CI and explicit owner decisions outrank dated snapshots.

## What belongs where

| Record | Purpose | Does **not** establish |
| --- | --- | --- |
| **Issue** | A separately actionable feature/discovery, confirmed defect, credible investigation, technical debt or acceptance/closure gate | Roadmap placement, implementation approval |
| **PR** | A particular proposed code/doc diff and linked implementation/test evidence | An accepted feature or permission to integrate |
| **Independent source review** | Actual diff/source review for correctness, security, data integrity, regressions and scope by a distinct agent or person | A submitted GitHub `Approve` review, execution of tests not run |
| **GitHub PR Review** | Inline threads and a submitted `Comment`, `Approve` or `Request changes` from an eligible GitHub reviewer | Product Owner's Windows acceptance, exact-SHA integration permission |
| **CI** | Automated check jobs on the exact commit / trigger | Real native desktop hardware or visual acceptance |
| **PO decision** | Explicit approval of scoped implementation, commit/push/PR, exact-SHA integration, milestone closure or release | Any other approval not specifically granted |

AI review reports are **attributed reports**, not GitHub-submitted reviews. The author cannot independently approve their own PR in GitHub. No external eligible reviewer means recording independent report evidence transparently, **not** forging an `Approve`. A green CI job does not prove accessibility/security completeness. Fresh commits may invalidate earlier reviews and tests.

## Issue creation and maintenance

- Start from [Issue #23 delivery board](https://github.com/fatihemres/MyLibrary/issues/23), search current issues/PRs and [idea register](../product/idea-register.md), and avoid duplicates. Preserve historical integrated work as closed issue/PR evidence; do not reopen it for paperwork.
- Use **one issue per separately actionable outcome**. Avoid dozens of tasks for trivial code edits and do not turn every speculative audit warning into a confirmed bug.
- Suggested title pattern: `[M2-F / ACCEPTANCE]`, `[M3 / DISCOVERY]`, `[V2 / UX]`, `[M6 / PLANNED]`. This is a fallback; title prefixes do not create actual repository Labels.
- An issue describes **status and evidence source**, desired outcome, exact included/excluded scope, links to dependencies/PRs and canonical sources, synthetic/real acceptance checks, security/privacy boundaries and **next PO authorization gate**.
- Separate `PLANNED`/`DISCOVERY` from active implementation. PO roadmap decision and product acceptance are separate. Unverified performance risks remain investigations until measured.
- On meaningful progress, link exact SHA, verified test command/result, actual CI and PO observation. Do not turn agent-reported tests into GitHub CI or emulated DPI into physical Windows DPI testing.
- Close only after the scoped issue outcome and its own evidence. Milestone closure/release require their own explicit PO decision; issue creation/closure cannot authorize those transitions.

## PR, review and integration workflow

1. **Preflight:** Check current `v2` HEAD, PR base/head, Issue, CI, review and source contracts. Use a task-scoped branch/worktree and preserve unrelated work. Protect `main`, `v1-maintenance` and `v1.0.0`.
2. **Implement/test with separate scoped PO permission:** Preserve local/offline-first architecture, Edition/Physical Copy separation, DB/WAL, covers, attachments and backup/restore. Always use synthetic isolated `MYLIBRARY_DATA_DIR` and a separate WebView2 profile. No unauthorized provider calls.
3. **Candidate:** Review *all* tracked/untracked changes, prevent committing runtime data/secrets/caches, record actual commands and exact SHA. Commit, push and Draft PR preparation require appropriate PO authorization and do not authorize integration.
4. **Independent review:** Reviewer reads actual diff/source/tests and records exact SHA, independence, findings/severity, security/data risks and limits; outcome `PASS`, `PASS WITH FINDINGS` or `BLOCKED`. Stop on blockers. Attach agent reports to PR/Issue as reports, not fictitious GitHub Approvals.
5. **GitHub Review when eligible:** In PR → `Files changed`, create inline comments and submit `Comment`, `Approve` or `Request changes` via `Review changes`. Resolve substantive threads after verification; inspect approvals after each candidate update. A PR author cannot approve themselves.
6. **Exact candidate CI:** V2 Foundation Windows x64, Linux x64, macOS Apple Silicon/Intel and CodeQL JS/TS, Rust, Actions. Distinguish PR-triggered vs post-push CI. Stacked Draft PRs targeting feature branches may have **zero GitHub checks**, even if parent checks passed; do not claim inherited CI or silently retarget/rebase to trigger it. Resolve CI coverage via a separately PO-authorized, reviewed strategy that preserves SHA/ancestry.
7. **Real PO acceptance:** Windows app/hardware/visual checks where applicable are separate from CI, browser emulation and macOS/Linux native acceptance. Capture limitations without exaggerating.
8. **Separate integration PO approval:** Before every change to `v2`, verify reviewed HEAD, exact base ancestry, independent findings, correct SHA CI and PO acceptance. Only authorized `git merge --ff-only` is allowed (no squash, merge commit, rebase or force). If ancestry changed, stop.
9. **Final push check:** Verify the integrated `v2` exact SHA and completed push-triggered platform + CodeQL CI. Only then consider authorized documentation synchronization and safe cleanup of the successfully integrated own branch/worktree.
10. **Later independent gates:** PO explicitly decides M2/M3 milestone closure, release candidate, signing, updater, tags, promotion to `main`, cleanup and public distribution.

## Latest integrated succession checkpoint — 2026-10-27

- [PR #19](https://github.com/fatihemres/MyLibrary/pull/19) M2-F and [PR #41](https://github.com/fatihemres/MyLibrary/pull/41) M3-A were integrated at exact reviewed SHAs, with prior independent review and final push CI evidence tracked in [VERIFICATION.md](../../VERIFICATION.md).
- [PR #42](https://github.com/fatihemres/MyLibrary/pull/42) M3-B Wishlist was integrated at exact `889ae3eb6299a1aa9dd85d9fd4211dc11e5fdefa` through a forward-only ref update; original stacked [#22](https://github.com/fatihemres/MyLibrary/pull/22) is superseded, not a separately merged feature. See live PR status for its administrative closure.
- [#24](https://github.com/fatihemres/MyLibrary/issues/24) and [#25](https://github.com/fatihemres/MyLibrary/issues/25) are completed; [#26](https://github.com/fatihemres/MyLibrary/issues/26) preserves M3-B acceptance/evidence; two non-blocking aesthetic criteria remain deferred to [#27](https://github.com/fatihemres/MyLibrary/issues/27). [#31](https://github.com/fatihemres/MyLibrary/issues/31) is the separate open M2 milestone closure decision.
- Repository documentation governance [PR #39](https://github.com/fatihemres/MyLibrary/pull/39) is an older draft candidate; its 2026-10-26 checkpoint is historical, not a current integration instruction.

## Historical issue/PR mapping (2026-10-26 snapshot only)

- [#19 M2-F PR](https://github.com/fatihemres/MyLibrary/pull/19) → [#24 acceptance](https://github.com/fatihemres/MyLibrary/issues/24)
- [#20 M3-A PR](https://github.com/fatihemres/MyLibrary/pull/20) → [#25 acceptance](https://github.com/fatihemres/MyLibrary/issues/25)
- [#22 M3-B PR](https://github.com/fatihemres/MyLibrary/pull/22) → [#26 acceptance](https://github.com/fatihemres/MyLibrary/issues/26)
- [#27 cross-screen UX](https://github.com/fatihemres/MyLibrary/issues/27), [#28 Wishlist performance](https://github.com/fatihemres/MyLibrary/issues/28), [#29 provider availability](https://github.com/fatihemres/MyLibrary/issues/29), [#30 ISBN discovery](https://github.com/fatihemres/MyLibrary/issues/30) are distinct follow-ups; they are not automatically PR blockers or authorized work.
- [#31 M2 closure](https://github.com/fatihemres/MyLibrary/issues/31) is a separate PO milestone gate.
- [#32–#38 planned/discovery](https://github.com/fatihemres/MyLibrary/issues/23) remain tracked without automatic implementation authority.

## Permanent memory update mapping

- A new accepted PO product/workflow decision → `docs/DECISIONS.md` (dated and sourced).
- New PR/commit, CI, tests, risk or native PO acceptance → `PROJECT_STATUS.md` and, when evidence warrants, `VERIFICATION.md`; distinguish evidence sources.
- Changed approved milestone scope/closure → `docs/v2/ROADMAP.md` **only upon separate PO decision**.
- New idea/discovery → `docs/product/idea-register.md` and/or `docs/product/post-v2-discovery.md` as warranted, with Issue links; do not silently promote ideas.
- Process/agent governance → `AGENTS.md` concise contract and this document's operating details.
- ChatGPT Project Sources, local handoffs and GitHub are not automatically synchronized. Adding a file to GitHub is not automatically adding it to ChatGPT Project Sources.
