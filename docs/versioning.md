# Versioning and release policy

One coherent source tree; never duplicate application code into `v1/` and `v2/` folders.

| Reference | Purpose |
|---|---|
| `main` | Latest stable released baseline; initially v1.0.0 |
| `v1-maintenance` | Backward-compatible V1 maintenance; initially the v1.0.0 commit |
| `v2` | Active future V2 development; initially the same commit, with no V2 changes yet |
| Annotated `vX.Y.Z` tags | Immutable exact release source commits |
| GitHub Releases | Historical installers, SHA256SUMS.txt, release notes and tag source archives |

Use Semantic Versioning `MAJOR.MINOR.PATCH`: PATCH (`1.0.1`) fixes backward-compatible bugs; MINOR (`1.1.0`) adds backward-compatible functionality within a major generation; MAJOR (`2.0.0`) introduces a new generation and potentially incompatible changes. Synchronize npm root/lockfile, Tauri, Cargo/lockfile and About metadata before each release. Do not bump versions merely to create branches.

## V1 maintenance

Start from `v1-maintenance`, implement a scoped fix, add appropriate regressions, verify schema/data compatibility, test and build the Windows installer. Document changes and known limits. Tag the exact verified commit as annotated `v1.0.1` and publish a new GitHub Release with installer and checksum. Advance `main` normally to the latest stable V1 release while V1 remains the stable generation. Port applicable fixes forward to `v2` with review/tests; never silently merge incompatible V2 code into V1. Once main becomes V2, later V1 fixes stay on the maintenance branch and its own release tags.

## V2 development and release

Develop on `v2`; preserve real user data and add forward, non-destructive migrations only when needed. Prepare a release candidate, perform full acceptance/regression and upgrade verification, then promote/merge normally to `main`. Tag its verified commit `v2.0.0` and publish a new installer/checksum release. Keep V1 tags, releases and maintenance history.

## Immutability and recovery

Never move, overwrite, recreate or force-update a published release tag. Never replace published installer bytes or delete historical releases. Correct mistakes with a new patch version and release notes. Never force-push release branches. Publication must use an existing verified tag (`gh release create --verify-tag`); download the uploaded installer again and compare SHA-256 before declaring publication complete.

Release evidence is frozen in the release commit. Publication receipts (tag object/peeled commit, release URL, asset hashes and remote branch refs) are verified after publication and recorded in the execution report; do not amend a release commit merely to add its own hash. For historical source use a clean checkout of its tag. Lockfiles preserve dependency resolution, but build tools/network archives are external prerequisites and binary rebuilds are not guaranteed byte-identical. The uploaded installer is the canonical archived binary.

GitHub access/retention is under the repository owner's control. Keep an independent offline mirror of Git history and downloaded release assets if protection against account loss or hosting loss is required. Never put private library data into a source mirror or release.
