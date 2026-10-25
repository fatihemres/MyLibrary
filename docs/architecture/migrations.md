# Forward-only migrations and V1 compatibility

## Historical M1 foundation (schema 2)

V1 `PRAGMA user_version` is 1. V2 foundation is 2. `src-tauri/src/migrations.rs` owns ordered forward execution: empty database → frozen existing bootstrap schema 1 → foundation schema 2. Schema 2 adds only the `schema_migrations` ledger; no domain table, edition/copy relationship, reading model or identifier changes. The ledger records applied versions and timestamps. A future migration must be added in order, not by editing historical SQL.

Before upgrading a populated library, the SQLite backup API writes `backups/pre-migration-v<version>-<uuid>.sqlite3`, including committed WAL state. All pending migration SQL and user_version updates run in one transaction with foreign-key validation. Failure rolls back and reports an error; there is no reset-to-empty recovery path. Unsupported future versions are rejected. The data folder may contain SQLite coordination files, but failed migration must not modify domain records/schema.

The pre-migration file is a database snapshot, not a full portable ZIP. Managed assets are unchanged by M1. Keep a normal V1 backup ZIP before testing prerelease V2. Do not open a schema-2 database in V1; downgrade by restoring the retained V1 ZIP to a separate V1 library. Never lower user_version manually.

ZIP format remains 1; its manifest now records schema 2 and application version. Restore accepts schema 1 or 2, validates the manifest against the actual database, validates every required V1 table/relationship and all managed paths, then migrates **staging only**. The original archive is unchanged. Only after successful validation does restore create a complete current-library safety ZIP and replace live assets/database under the existing rollback protections. Future/malformed archives are rejected before replacement.

`tests/fixtures/v1-schema.sql` is frozen from tag v1.0.0. `v1-library.sql` contains synthetic data, not a production database. Tests compare every value in 18 V1 tables before/after upgrade, reopen idempotently, preserve media references, restore an actual schema-1 archive and force a partial migration failure. Existing integrity tests cover future-schema rejection, invalid import rollback, malformed restore, copies, loans and occupied locations.

## M3-A local candidate: schema 3

Schema 3 rebuilds only the existing derived FTS5 index with symmetric Turkish-I normalization; see [search architecture](search.md). Original domain values, IDs and media references remain unchanged. Fresh libraries and V1/V2 upgrades run all pending migrations in one transaction after the existing populated-library snapshot. Restore accepts trusted schema versions 1, 2 and 3, and upgrades older archives in staging. The ZIP format remains 1. Historical bootstrap/ledger migrations and schema-1 fixtures remain unchanged.

Migration tests compare the 17 original domain tables separately from the intentionally rebuilt search index, including populated V1/V2 upgrades, reopen, restore and index/version rollback on failure. Schema-3 databases must not be opened by older builds; retain the pre-upgrade backup. This is a local candidate, not an integrated schema release.

## M3-B local candidate: schema 4

Schema 4 adds independent Wishlist items, ordered retailers, status history and a separate derived
FTS index. Explicit version guards run the historical schema-3 rebuild only for versions below 3;
V3 upgrades leave Copy search untouched. See [Wishlist architecture](wishlist.md).
Trusted reference schemas and staging restore support V1/V2/V3/V4, preserving the existing
snapshot, WAL, transactional rollback, FK, media and safety-backup protections. Wishlist business
values, history and derived search consistency are validated before live replacement. The frozen
V1 SQL and fixtures are unchanged. This is a local candidate, not an integrated schema release.
