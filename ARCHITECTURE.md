# MyLibrary architecture and delivery plan

MyLibrary is a Windows-first Tauri 2 desktop application. React, TypeScript and Vite render the interface; Rust owns all persistent data and file operations. npm manages frontend dependencies. No server, account, telemetry, Docker, or remote repository operation is part of the product.

## Model

An edition contains shared bibliographic information. A copy references an edition and holds ownership, condition, location and reading state. Adding a copy explicitly shares the edition; normal additions remain separate editions even when duplicate warnings appear. Editing shared edition metadata affects all its copies and the editor makes this clear. People are first-class records joined to editions with contributor roles. Genres, categories, tags and collections are typed terms joined to editions. Publishers, series and acquisition sources have independent records. Locations form a checked hierarchy. Loans, reading history, quotes, notes, attachments and custom values belong to copies. Custom field definitions are typed and reusable.

Core fields have typed SQL columns and constraints. Less frequently queried descriptive attributes use documented JSON objects on their owning entities. This is not a single flattened books table: relationships and repeated records are normalized. A materialized FTS5 index provides global text matching; indexed relational queries and frontend combination provide filtering. User deletion is reversible through a trash flag; related data and managed files remain until an explicit future purge feature.

## Data safety

SQLite uses foreign keys, WAL, busy timeout and transactional writes. Versioned SQL migrations are applied transactionally; existing databases receive a pre-migration snapshot. SQLite online backup produces consistent snapshots. Portable ZIP backups include database, covers and attachments, with a versioned manifest. Restore validates archive paths, size limits, schema and SQLite integrity in staging, makes a mandatory safety archive, then swaps data with rollback on failure. Covers and attachments use generated local names. No absolute user-supplied path is served as an asset.

The production root is the platform application-data directory for `com.mylibrary.desktop`. Development can use `MYLIBRARY_DATA_DIR` pointing inside this repository. No demo data is inserted automatically. Preferences persist in SQLite. Automatic backups run while the application is open and never delete old backups automatically.

## Boundaries

- `src/domain`: shared UI types, field metadata, validation and filtering.
- `src/services`: typed desktop bridge, import/export parsing.
- `src/components`: reusable UI, editor and dialogs.
- `src/pages`: dashboard, library, detail, exploration, personal records and settings.
- `src-tauri/src`: repository, migrations, managed files, backups and desktop commands.
- `src-tauri/tests` and colocated frontend tests: data integrity and behavior.

## Milestones / verification

1. Project configuration, schema, repository and integrity tests.
2. Application shell, complete editor, copy workflow, search/filter/bulk actions.
3. People/series/locations, reading, lending, notes, quotes, fields and attachments.
4. Validated import/export, managed images, safe portable backup/restore, settings.
5. Accessibility/polish, automated tests, lint/type checks, desktop launch and Windows installer.

Each milestone receives a local commit. Final documentation must distinguish tested behavior from unverified or unfinished features. Optional ISBN lookup is explicit, previewed and isolated from offline functionality.
