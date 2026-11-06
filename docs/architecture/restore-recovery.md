# Restore recovery contract (Issue #54 candidate)

Authority: [Issue #54](https://github.com/fatihemres/MyLibrary/issues/54) and the
PO instruction of 6 November 2026 authorize this narrow implementation, synthetic
verification and a Draft PR. They do not authorize integration or M5 Backup V2.
ZIP format 1 and product schema 4 remain unchanged.

| State                   | Files / transition                                                                                                                            | Access and recovery                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Normal / genuinely new  | No pending marker; no evidence of an interrupted generation if DB is absent                                                                   | Existing library opens; a genuinely new library may initialize                                                            |
| Validating              | Extract untrusted ZIP in owned staging; validate schema, SQLite, references and supported migration                                           | Live data untouched; validation failure may discard only owned validation staging                                         |
| Prepared                | Create and stage-validate mandatory safety ZIP; check WAL checkpoint; sync staging; create and sync `.restore-pending` before first live move | Marker records stage, previous and safety paths; content is diagnostic, never executed                                    |
| Moving / installing     | Old DB, existing WAL/SHM and media move to owned `.previous-*`; staged DB and media install separately                                        | Pending marker blocks every startup and existing Store connection                                                         |
| Swap failed             | Attempt all independent safe undo operations; never replace occupied rollback destinations                                                    | Keep marker, remaining staging, previous files and safety ZIP; report original and all rollback errors                    |
| Installed               | Sync installation before removing pending marker                                                                                              | Open restored library; retain previous generation and safety ZIP                                                          |
| Interrupted / uncertain | Marker present, malformed, unreadable or of unexpected type; or missing DB with legacy recovery/sidecar evidence                              | Repeated startup fails closed without creating DB/media or moving/deleting artifacts; manual recovery requires inspection |

This deliberately implements bounded, idempotent **detection and preservation**,
not automatic recovery. Even a fully completed best-effort rollback retains the
marker for inspection. Never delete a marker merely to make the app open. Preserve
the whole root, inspect the marker plus all generations, and validate a chosen
safety ZIP in a separate library before any separately authorized recovery action.
No automatic orphan cleanup, merge, reference repair or removal of old copies.

Backup checks all Edition cover references (including Editions without Copies)
and attachment references against managed single-level paths. Incomplete source
libraries fail explicitly without changing records or publishing a ZIP. The safety
ZIP additionally passes the same staging validator as an incoming restore before
the first live move. A future partial-recovery export policy needs PO approval.

Backup publication writes an owned temporary file in the destination directory,
then syncs and closes it before an atomic no-clobber hard link to the final name.
Only its own temporary file is removed. Filesystems without hard-link support
fail explicitly; no direct-to-final copy fallback. Source and destination may be
on different filesystems because only the temporary and final files share a volume.

## Filesystem assumptions and limits

The desktop command mutex and library lock serialize cooperating app operations.
SQLite connections close before renames. Busy checkpoint results stop replacement;
Windows locking errors enter the same preservation path as other rename failures.
Rollback checks occupied destinations because [Rust rename](https://doc.rust-lang.org/std/fs/fn.rename.html)
can replace them. [Rust hard_link](https://doc.rust-lang.org/std/fs/fn.hard_link.html)
fails when the final name already exists, including a concurrent publisher.

Files use `sync_all`; Unix also syncs directories for metadata ordering. Windows
file flushing is not represented as a portable directory-fsync guarantee:
[FlushFileBuffers](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers).
Process termination tests establish application-interruption behavior, not sudden
power-loss, disk-controller, antivirus, network-share or all-filesystem durability.
The [SQLite WAL checkpoint result](https://sqlite.org/pragma.html#pragma_wal_checkpoint)
must be read; successful SQL execution alone does not establish completion.
Native Windows PO desktop acceptance remains distinct from Rust tests and CI.
