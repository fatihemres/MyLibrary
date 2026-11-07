# Repository Hardening v1-A

This infrastructure candidate adds CI configuration; it does not change application behavior.
The repository default branch remains `main`. V2 development and integration use `v2`.
See [AGENTS.md](../../AGENTS.md) and the [roadmap](../v2/ROADMAP.md) for scope and data safety.

## Exact-SHA integration contract

Candidate → implementation verification → relevant independent/security review and PO
acceptance → full exact-candidate PR CI → separate PO integration authorization →
exact-SHA fast-forward → verify canonical `v2` HEAD and push CodeQL/security →
separately authorized safe cleanup. Milestone closure and release remain independent gates.

**PO-approved change, 2026-11-07 (D-027):** full Foundation runs for PRs targeting `v2`;
fast-forwarding the already tested SHA to `v2` no longer starts another full Foundation.
Before integration require all four Foundation platforms, CodeQL JS/TS, Rust and Actions,
and the separate GitHub Advanced Security / Code Scanning evaluation where reported.
Seven successful workflow jobs do not replace that separate security result; pending,
neutral or failing evaluations are not PASS. Bind evidence to the candidate SHA and actual
checkout tree; if the candidate/base changes, reassess ancestry, review and CI before proceeding.

After authorized integration, independently read live canonical `v2` HEAD and require it
to equal the approved candidate. Verify the required **push-triggered CodeQL** analyses and
security evaluation for the correct SHA/ref; do not substitute old PR results for required
push evidence. A second Foundation push run is intentionally **not required**.
This preserves security checks while avoiding duplicate four-platform packaging.

The reviewed candidate SHA must equal the canonical integrated `v2` SHA. Integration uses
`git merge --ff-only`, never a new merge commit, squash or rebase. If the base advances so that
fast-forward is impossible, stop and obtain an explicitly reviewed candidate; do not rewrite
published history to bypass the gates. Successful packaging is not native UX or hardware acceptance.
No push, cleanup, tag or release is authorized merely by this document.

Protect `main`, `v1-maintenance` and immutable `v1.0.0`. Never force-push or move published tags.
Use only synthetic verification data; never access production libraries or commit runtime data.

## Safe feature-branch lifecycle

Eligibility is not deletion authorization. Before proposing cleanup, record:

1. The branch's own PR was integrated through the approved exact-SHA fast-forward process;
   capture its reviewed candidate SHA, integration approval and PR history. PR closure alone
   (including closed-unmerged/superseded PRs) is insufficient.
2. Freshly verified canonical `v2` contains that candidate; required post-integration push
   CodeQL/security checks succeeded. Missing or pending evidence stops cleanup.
3. No open PR uses the branch as head/base and no active task or collaborator depends on it.
   Check stacked PRs and confirm ownership; unknown dependencies stop cleanup.
4. The ref is neither protected nor shared. Preserve `main`, `v1-maintenance`, `v2` and
   release tags. A feature-branch name or merged label never proves eligibility.
5. Inspect linked worktrees, local-only/unpushed commits, tracked/untracked changes and
   **ignored** evidence: synthetic acceptance data, screenshots, logs, backups and recovery
   generations. A clean `git status` does not establish an empty or disposable worktree.
   Preserve required evidence and verify any agreed preservation copy before destructive work.
6. Obtain separate explicit PO approval naming the operation, remote/local ref and, for
   local removal, resolved path. Inaccessible worktrees or uncertain evidence remain preserved.

Treat these as separate operations:

- **Remote ref deletion:** after eligibility and approval, remove only the named obsolete
  feature ref. It does not authorize local deletion or disposal of acceptance data.
- **Local branch deletion:** separately check linked worktrees and local commits; do not
  discard unmerged/unpushed work or detach/move another active task to make deletion possible.
- **Worktree removal:** requires independent destructive-local-cleanup authorization and a
  verified evidence inventory/preservation plan. Never automatically remove ignored data,
  backups or recovery copies because a remote branch was deleted.
- **PR closure/history:** preserve PR discussions, reviews and CI evidence. Do not close an
  open PR merely to make its branch eligible; cleanup never deletes PR history.

Do not enable unconditional GitHub automatic head-branch deletion or add a write/delete
workflow for this policy. Merged PR #56 is only a future cleanup candidate: its local PO
test data and worktree are not authorized for removal. Draft PR #48 and its branch remain
unrelated and protected from this task. No existing branch/worktree is deleted by D-027.

## Issues and review evidence boundary — PO process decision of 2026-10-26

Use the [Issue/PR/Review workflow](issue-review-workflow.md) and
[Issue #23](https://github.com/fatihemres/MyLibrary/issues/23) as linked tracking infrastructure, not a
competing roadmap. Independently attributed human/agent audits are not submitted GitHub
`Approve` reviews. Verify the exact candidate SHA, actual review scope/threads, CI
source and native PO acceptance separately. Parent checks cannot certify stacked child
PRs whose branches do not trigger the V2 workflows. Never alter branch ancestry,
PR target, CI workflow or integration method without separately authorized review.
An Issue, green build or Review is not PO merge/closure/release permission.

## CI configuration and evidence boundary

`v2-foundation.yml` retains its four-platform checks, bundles and artifacts. Normal
`cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked` runs once on Linux,
reusing the existing job. Only Linux installs the Clippy component. Command failures fail CI;
warnings are neither suppressed nor promoted to errors. The audited Windows baseline has six
warning locations. Strict `-D warnings` is deferred until a separately approved cleanup.
Stable Rust can introduce new lints; investigate changes rather than silently suppressing them.

Foundation's automatic event is `pull_request` targeting `v2`; the `push` event is removed.
The existing `workflow_dispatch` declaration remains, but is not a guaranteed operational
fallback. Preflight found default branch `main` has no Foundation file while workflow ID
`378793026` is registered active. GitHub documents the default-branch requirement for the
[Run workflow UI](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).
No live UI/API dispatch was attempted; API dispatch usability is **NOT VERIFIED**, and an
active workflow record alone does not prove it. Verify an approved execution route before
relying on manual dispatch; do not change `main`, the default branch or settings to enable it
under this authorization.

The separate Linux CodeQL workflow analyzes `javascript-typescript`, `rust` and `actions`
using official `github/codeql-action` actions, `build-mode: none` and the default query suite.
It runs on PRs targeting `v2` and pushes to `v2`, with contents-read and security-events-write
permissions. It does not package the app, publish releases, use custom tokens or enable Autofix.
Rust extraction may execute build scripts/procedural macros even without a full build.
No Linux system packages are added speculatively: inspect the first Rust extraction logs and
add only demonstrated requirements in a reviewed follow-up if needed.

CodeQL is deterministic security analysis, not a replacement for application tests or targeted
security review. A successful workflow means analysis executed, not complete security coverage.
This local candidate has not run on GitHub yet; workflow YAML validation is not extraction evidence.
No schedule or manual-dispatch trigger is added while the workflow exists only outside the default
branch. See [GitHub CodeQL build options](https://docs.github.com/en/code-security/reference/code-scanning/codeql/build-options-for-compiled-languages).

## Deferred GitHub configuration

- Dependabot activation is deferred: its configuration is read from the default branch. A future
  `target-branch: v2` directs version-update PRs, not default-branch security updates. No active
  Dependabot configuration is added here.
- Automatic PR-template activation is deferred for the same owner/default-branch decision. No
  automatic PR template is added here. Neither deferral authorizes changing `main` or the default branch.
- Repository secret scanning and push protection were disabled at audit time; enabling them,
  reviewing bypass permissions and assigning alert ownership are separate GitHub-side tasks.
- Rulesets were absent at audit time. The intentions below are proposals, not enabled settings.
- Signed commits are not currently required; existing reviewed commits are unsigned. Do not
  require signatures retroactively or rewrite release history.
- Dependency alerts, Project/dashboard creation and any settings changes require separate approval.

## Future ruleset intent — not enabled

| Target | Intended protections |
| --- | --- |
| `main` | Block deletion and force pushes; require linear history. |
| `v1-maintenance` | Block deletion and force pushes; require linear history. |
| `v2` | Block deletion and force pushes; require linear history; preserve direct exact-SHA fast-forward integration. |
| `v1.0.0` | Immutable: no deletion or movement. |

Do not mandate GitHub merge/squash/rebase or a merge queue for `v2`. Required checks must accept
successful PR evidence for the exact incoming SHA. Do not require the final push-triggered run
before the push that creates it. Define maintenance CI before requiring V2-only checks on V1
branches. Published release tags must never be rewritten; release-asset protection is a separate
settings decision. Do not use broad bypasses to defeat deletion/force-push protections.

## Cost and scope

The core pipeline requires no AI service, Copilot subscription or paid third-party analyzer.
Standard public-repository GitHub-hosted CI is used; storage allowances and any future larger
runners still need billing review. Clippy runs once and CodeQL does not duplicate packaging.
No dependency, schema, migration, permission, updater/signing or version changes are included.
M2-C is CLOSED; M2 remains OPEN with M2-D webcam scanning pending. Hardening does not start M2-D.
