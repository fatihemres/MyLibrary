# M2-C requirements audit

This maps the owner-approved M2-C request to the implementation CLOSED at
`1edf3014d252067b7ee435478cba3f6aaf9350c9`. [PR #4](https://github.com/fatihemres/MyLibrary/pull/4),
PR CI `38362240863` and final push CI `38365564445` passed all four platforms. Actual execution
evidence is in [VERIFICATION.md](../../VERIFICATION.md). M2 remains OPEN; M2-D is pending.

| Request sections | Implementation and verification boundary                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline / 1     | Started clean on v2 at `f469306b9f8edd720046376fee07f3de913323dc`; separate local `agent/codex-m2c-usb-batch-scan` branch. Existing editors, metadata/duplicate flows, settings, localization and desktop harness inspected.                              |
| 2–3, 20          | `ScannerInput`: visible focus-only input, typing/paste, initial focus, batch clear/refocus, no global character listener. Actual focus/keyboard checks run in the Windows desktop harness.                                                                |
| 4, 22            | Existing settings infrastructure persists Enter/Tab/either; invalid preferences fall back to Enter. Empty/unconfigured Tab navigates normally. Unit and restart workflow coverage.                                                                        |
| 5–7, 25–26       | Pure bounded transport parser strips at most one AIM prefix and edge transport characters, rejects embedded controls, and calls unchanged M2-A `parseIsbn`. 978/979/ISBN-10, invalid checksums, UPC/EAN, length and suffix tests.                         |
| 8                | Explicit BarcodeScan in BookEditor and CopyEditor changes only the draft barcode. No Edition identity or persistence authority; no uniqueness constraint. Desktop checks exercise both entry points.                                                      |
| 9                | `seed?: Isbn` is separate from `initial?: Book`; newBookDraft whitelists ISBN, generates empty identities and preserves defaults. Unit seed isolation test plus real save/duplicate workflow.                                                             |
| 10–11            | Scan books → Single → Review & add opens a new draft. No scan-triggered save or metadata request. Native metadata commands are observed/blocked by synthetic fixtures during the scanner acceptance group to verify no call occurs.                       |
| 12–15            | Session queue; repeated canonical ISBNs remain separate. Save marks only its item added; cancel retains it. Every later save reuses current M2-B duplicate validation, not a cached preview. Desktop checks create, attach and create a separate Edition. |
| 16               | Optional informational duplicate preview deliberately omitted; authoritative review happens in BookEditor at Save.                                                                                                                                        |
| 17–19            | Invalid rows remain visible and removable for rescan. Pure queue helper enforces 1,000 entries without discarding prior rows. Pending session close requires Cancel-default confirmation; native close/reload uses existing unsaved protection.           |
| 21, 23–24        | Existing command bar/modal surfaces, narrow reflow, EN/TR flat translation keys, explicit labels, radio groups, status announcements and existing reduced-motion behavior. Not full accessibility certification.                                          |
| 27–29            | Deterministic parser/session/seed/render tests; real WebView2 component/focus/paste/keyboard interactions and Rust persistence through extended `desktop-smoke.mjs`. No new DOM/test dependency. Real scanner hardware is not simulated evidence.         |
| 30               | Windows automated build and synthetic keyboard-wedge verification only when recorded as passed. Final PR/push CI passed four platforms; macOS/Linux interactive acceptance and real USB hardware verification are NOT claimed.                                                                                          |
| 31               | Barcode architecture document, this audit, truthful M2-A/B/C closed and M2-D pending roadmap; verification updated from actual results.                                                                                                     |
| 32–34, 37        | No dependencies, migration, USB/HID API, permission, network endpoint, camera, Work table, updater/signing change or M3+ functionality. Existing native/metadata/security tests retained.                                                                 |
| 35–36, 38        | Historical local candidate passed checks/build/desktop and source/privacy audit before commit. Subsequent authorized PR/CI, exact-SHA fast-forward integration, final CI and cleanup completed; no tag or release.                                                                                                               |

Deliberate limits: session queue is not persisted, removing a scan is not a library deletion,
metadata lookup is manual per draft, and physical hardware/platform acceptance needs separate
testing. M2-D is the remaining webcam slice and is not started by this implementation.
