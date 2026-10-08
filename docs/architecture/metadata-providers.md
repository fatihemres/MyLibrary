# Metadata provider and update boundaries

`services/metadata.ts` defines MetadataProvider and MetadataResult. Results normalize title, subtitle, authors, contributors, publishers, publication date, ISBNs, languages, page count, description, cover candidates, subjects and per-field source provenance. The Open Library adapter reuses the existing explicit V1 Rust lookup; it is not a new M2 lookup workflow. A compatibility adapter supplies the existing selected-field preview without overwriting manual data automatically.

Normalization accepts unknown provider payloads, validates arrays/page counts and permits only HTTPS Open Library cover candidates. Future Google Books support should implement the interface and provider-specific provenance/consent, not leak provider JSON into book persistence. No Google Books client, barcode/camera workflow or additional network permission is included in M1.

`services/updates.ts` is deliberately fail-closed: configured=false, automatic=false, no fetch and no installation path. Settings displays current version and a disabled stable channel, and Check now explicitly reports that no network request was made. This is groundwork, not a functioning update service.

Activation requires a reviewed public distribution endpoint, signed artifacts, Tauri updater verification configuration, secure CI signing credentials and a rollback/data-compatibility policy. Never embed a private GitHub token, commit signing keys or install unsigned updates. Nothing automatically publishes releases or moves tags.

Reference: https://v2.tauri.app/plugin/updater/ .
