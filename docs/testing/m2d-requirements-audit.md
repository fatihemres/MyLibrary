# M2-D requirements audit — local implementation candidate

Base: `950bdcd330ac5aea67dcd878a1701f62620f87d5`. Branch:
`agent/codex-m2d-webcam-scan`. Issue #6 remains OPEN. M2-D is not integrated or closed;
M2 remains OPEN. Evidence below is local Windows evidence recorded on 2026-10-14.

## Requirement-to-implementation mapping

| Contract | Implementation / evidence |
| --- | --- |
| Explicit camera action, Scan Books only | ScanBooks mounts CameraScan only after the camera button. No BookEditor/CopyEditor/BarcodeScan changes. |
| No startup/background capture | Controller does nothing until start; desktop asserts zero getUserMedia calls before the button. |
| Exact approved dependency | zxing-wasm 3.1.5; no existing npm package version changes and no Cargo changes. |
| Local reader/worker | Vite local WASM asset, same-origin module worker, required local locator. Version-specific build transform requires exactly one expected worker module/default; missing/relocated layout fails. Parsed URL-token audit covers every worker JS chunk, including Unicode/encoded protocol-relative hosts and blob URLs, while excluding comments and unrelated main-app chunks. Original decoded tokens and inspection-only TAB/LF/CR-normalized copies are checked; runtime strings are unchanged. |
| Optional native detector | Feature/API/format detection; constructor/query/detect failure falls back. Empty frames do not switch. |
| EAN-13-only input | Decoder format filter plus cameraIsbn requires ean_13 and exactly 13 ASCII digits. |
| Authoritative ISBN rules | Existing parseIsbn; tests cover 978, 979, bad checksums and unrelated EAN/UPC. No HID transport stripping. |
| One result per opening | Session stops before emitting the accepted ISBN; reopening deliberately keeps repeated entries. |
| Existing queue and persistence | queueScan's 1000 limit; unchanged Review/new seed/Save/duplicate_report/create_decided behavior. No camera persistence or metadata command. |
| Resource bounds | At most 640 x 480 RGBA, one decode in flight, 200 ms delay after each decode, one result and bounded text, 15-second worker timeout. |
| Late async work | Stopped session ignores decoder results; late streams stop all tracks without attachment. |
| All terminal paths | stop cancels timer, removes listeners, stops tracks, clears preview/canvas, disposes decoder and revokes session lease. Modal close, unmount, visibility/page hide call stop. |
| Error states | Unsupported context, denied permission, no device, unreadable/busy, constraints, capture/decoder failure, device ended; no raw exception display. |
| Accessibility and localization | EN/TR key parity; native modal, keyboard Cancel/Escape, labeled preview, polite status, no animations. Single success focuses Review when camera button disappears; batch/cancel restores initiating control. |
| Minimal CSP | wasm-unsafe-eval, same-origin worker, same-origin connect only. Existing CSP restrictions preserved; no unsafe-eval, wildcard, remote or blob worker source. |
| Windows | Same origin and default WebView2 permission policy; runtime secure-context/mediaDevices checks. |
| macOS | Info.plist camera usage description; locked CLI schema documents adjacent plist merge. No signing/entitlement changes. Native acceptance unverified. |
| Linux | Existing Tauri/Wry permission API, cfg-linux handler, local-main validation and expiring one-use camera lease. Microphone/display requests denied. No dependency upgrade or OS pre-disable. Native acceptance unverified. |
| Data/privacy | No frame storage/upload, device-ID storage, telemetry, provider changes, auto-save or auto-merge. Synthetic test profiles only. |
| Scope | No schema/migration/Work, camera copy-barcode workflow, M3, updater/signing, settings change or remote action. |

## Automated evidence

- Focused camera suite: 42 passed, including real local WASM reader fixtures and lifecycle fakes.
- Native suite: 71 passed (13 unit, 20 duplicate, 24 integrity, 3 migration, 5 restore limit,
  6 restore schema). Two new unit tests cover expiring/single-use leases and stale cleanup isolation.
- Rust fmt and locked all-target check passed.
- Normal Clippy passed with the six existing advisory locations only:
  db.rs:856, metadata.rs:203, lib.rs:188, integrity.rs:613/717, duplicates.rs:129.
- Final frontend suite: 129 passed; typecheck and lint passed.
- Production frontend, Windows executable and NSIS installer builds passed.
- Final focused packaged camera run: 2/2 groups passed; full desktop regression: 34/34
  groups passed against the same rebuilt executable. Reports and artifact hashes are in
  VERIFICATION.md. Both reports contain no runtime errors or external network requests.
- Final git diff whitespace check passed.

The actual reader test supplies local WASM bytes, rejects any fetch and generates synthetic
9780306406157, 9791090636071 and 4006381333931 EAN-13 frames. All decode; the non-book EAN is then
rejected by existing ISBN validation. Tests do not need a webcam or live metadata provider.

## Platform and hardware limits

Real Windows webcam hardware verification: NONE

Desktop camera evidence uses synthetic canvas MediaStreams in the real packaged Tauri/WebView2
application and actual local worker/WASM. It does not establish OS camera prompts, physical preview,
printed-book recognition, camera indicator behavior or real-device denial/recovery.
Four-platform CI for this candidate has not run. macOS/Linux native interactive camera evidence is
not available; package success alone would not establish it. Linux runtime media-stream availability,
GStreamer/runtime prerequisites and actual permission callback behavior need native validation.

## Closure still required

Independent review, security/data-integrity review, PR foundation CI + CodeQL, exact-SHA fast-forward
integration, final push workflows and separately authorized cleanup remain outstanding. Hardware
limitations must remain explicit, with owner acceptance of any unverified platform support. No local
commit uses an issue-closing keyword.
