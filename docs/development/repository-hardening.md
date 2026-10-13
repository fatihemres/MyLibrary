# Repository Hardening v1-A

This infrastructure candidate adds CI configuration; it does not change application behavior.
The repository default branch remains `main`. V2 development and integration use `v2`.
See [AGENTS.md](../../AGENTS.md) and the [roadmap](../v2/ROADMAP.md) for scope and data safety.

## Exact-SHA integration contract

Candidate → implementation verification → independent review → security/data-integrity review
when appropriate → PR-triggered CI → fast-forward-only integration → push `v2` → final
push-triggered CI → authorized branch cleanup → milestone closure.

The reviewed candidate SHA must equal the canonical integrated `v2` SHA. Integration uses
`git merge --ff-only`, never a new merge commit, squash or rebase. If the base advances so that
fast-forward is impossible, stop and obtain an explicitly reviewed candidate; do not rewrite
published history to bypass the gates. Successful packaging is not native UX or hardware acceptance.
No push, cleanup, tag or release is authorized merely by this document.

Protect `main`, `v1-maintenance` and immutable `v1.0.0`. Never force-push or move published tags.
Use only synthetic verification data; never access production libraries or commit runtime data.

## CI configuration and evidence boundary

`v2-foundation.yml` retains its four-platform checks, bundles and artifacts. Normal
`cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked` runs once on Linux,
reusing the existing job. Only Linux installs the Clippy component. Command failures fail CI;
warnings are neither suppressed nor promoted to errors. The audited Windows baseline has six
warning locations. Strict `-D warnings` is deferred until a separately approved cleanup.
Stable Rust can introduce new lints; investigate changes rather than silently suppressing them.

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
