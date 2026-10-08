# V2 foundation assessment and milestone plan

Baseline: v1.0.0 (`21d2614d91f0c6fbf8b799aba754c50c05f96963`). Work stays on `v2`; main, v1-maintenance, the annotated V1 tag and its release assets remain untouched.

## Contract and findings

V1 stores editions and physical copies separately, but has no work table. Copy reading state is intentional and must not be reinterpreted. Preserve all IDs, optional JSON attributes, relationships, managed relative paths, current app identifier/data directory, V1 JSON catalogue format and ZIP format. No title-based inferred work/edition merges.

The frontend currently uses English strings for both display and internal route/status values; these must be separated at presentation boundaries without translating persisted values or user text. Native errors need a localized public boundary and optional technical detail. UI language is a new setting, separate from book language. React state must survive language changes.

Platform debt: explorer.exe is hard-coded; Ctrl ignores macOS Command; NSIS-only bundling; scripts assume a Windows executable/WebView2 for desktop QA. Tauri already resolves application data programmatically, dialog APIs are portable, SQLite is bundled, managed file paths are relative, and Rust file locking is portable. Keep native Windows automation as one platform adapter rather than claiming it covers other OSes.

Migration debt: one inline schema bootstrap and hard-coded schema 1 in backup validation. Extract a versioned transactional runner, SQLite-backup-API pre-migration safety snapshots, staged restore migration and tests based on the frozen V1 SQL fixture. Foundation will add a non-destructive migration ledger first; defer the work table until a reviewed work-domain milestone rather than invent semantic links now. Additive schema evolution must not discard V1 data. Reject future schemas; V1 must not open upgraded databases. Downgrade uses the retained V1 backup, never an old executable on V2 data.

Provider debt: Open Library response parsing is tied to the editor. Introduce a common normalized result and provider interface, retaining selected-field consent and manual entry. No Google Books/barcode expansion in Milestone 1.

Updater constraint: the GitHub repository is private and no signing key/public endpoint exists. Expose a fail-closed settings/service boundary with no background requests by default, no embedded credentials and no unsigned installation. Activation requires a deliberate signed distribution configuration; never manufacture a key or make the repository public.

Performance debt (later milestones): full snapshots, global FTS rebuilds, base64/byte-array cover loading and no thumbnails. Do not mix a pagination/data-query rewrite into this foundation.

## Milestone 1 implementation order

1. Preserve baseline desktop evidence; centralize platform information/shortcuts/folder opening and per-OS packaging.
2. Extract migrations and extend archive validation to migrate only staging. Add V1 fixture/rollback/restore compatibility tests.
3. Add i18next resources, English/Turkish presentation, language preference/fallback/plurals/Intl formatting. Prepare locale registry and logical CSS for RTL; unsupported translations are not advertised as complete.
4. Normalize metadata through a provider interface; establish safe update configuration/status and Settings foundation. Improve accessible feedback/focus/high-contrast handling.
5. Add CI checks/build matrix for Windows x64, macOS ARM64/Intel and Linux x64, with optional Windows ARM64 build. No tag/release publishing automation without explicit dispatch/approval. Document signing credentials without storing them.
6. Run V1 regressions plus foundation tests, actual isolated Windows workflows and CI where available. Record actual results and limitations, commit verified work and push origin/v2. Stop before Milestone 2.

## Risks and verification

System Turkish default can change existing English automation; test profiles set UI language explicitly. Dates/currencies use Intl for display; persisted ISO dates/numeric values remain unchanged. Translation must never modify author/title/location text or route keys. RTL must preserve ISBN/path direction and use logical spacing. Native Linux/macOS dependencies and bundlers require real CI; successful Windows compilation is not cross-platform evidence. Camera/updater installation/signing, accessibility assistive-technology QA and translated installer text require later platform acceptance. No mandatory network listener/mobile backend is added.

References: i18next fallback/plural documentation and Tauri updater/opener documentation informed the boundaries. Small local resources; no translation service receives library content.

## Implementation outcome

Milestone 1 implements the six planned foundation areas. Schema 2 only adds the ledger; V1 source/schema fixture is frozen and all existing domain relationships remain. English/Turkish resources and live persisted language selection are connected throughout V1 screens; platform helpers replace shell-specific folder opening and modifier handling. Update status remains explicitly inactive. No M2 features are included. See VERIFICATION.md and the platform matrix for actual local/CI results and remaining native-platform acceptance limits.
