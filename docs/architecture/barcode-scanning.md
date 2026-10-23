# M2-C: focused keyboard-wedge scanning

M2-C is CLOSED at `1edf3014d252067b7ee435478cba3f6aaf9350c9`; final integration CI
`38365564445` passed all four platforms. See [verification](../../VERIFICATION.md) for
separate local desktop and CI evidence. M2 remains OPEN; M2-D webcam scanning is pending.

The M2-C/M2-D sections below describe their original behavior. The local M2-F extension
is described at the end; its opt-in workflow changes when metadata lookup may begin.

## Capture boundary

USB HID keyboard-wedge scanners act as keyboards. `ScannerInput` is a visible, labeled,
focused input with its own React key handler. There is no document/window character collector,
typing-speed detection, clipboard monitoring, device enumeration, USB permission or driver.
Normal typing elsewhere is unaffected. Existing application shortcut handlers remain; they do
not accumulate scanner characters. Native dialogs keep background controls inert.

Settings stores `scanner_terminator` in the existing settings table: `enter` (default), `tab`, or
`either`. Unknown values fall back to Enter. A configured key submits nonempty input only.
Empty Tab and unconfigured Tab retain ordinary focus navigation. Enter never submits a parent
editor form. Capture also supports explicit typing, paste and a button, without scanner hardware.

`scannerPayload` strips edge CR/LF and, when enabled, Tab transport characters. It recognizes
at most one leading AIM-style `]` + ASCII letter + alphanumeric modifier. `]C1` is transport
metadata, not an EAN/ISBN conversion instruction. Embedded C0/C1 control characters are rejected.
Payloads are capped at 128 UTF-16 code units, raw input at 136 including transport. The input
retains at most 137 units so an oversized paste is rejected instead of becoming a valid truncated
ISBN. Raw values stay only in the session; no logs or database records are created by capture.

ISBN mode calls the existing M2-A `parseIsbn` unchanged. It accepts valid ISBN-10 and 978/979
ISBN-13, canonicalizes equivalent 978 values, and never invents an ISBN-10 for 979. Invalid
checksums, UPCs and unrelated EANs remain invalid ISBNs. Copy mode accepts bounded text and
fills only `barcode` in the current draft, preserving existing barcode compatibility and collision
rules. It has no Edition-target or persistence authority.

## Draft and session lifecycle

The top command bar opens Scan books. Single mode captures one item for review. Batch mode
keeps the input ready for consecutive scans, clearing/refocusing after capture. Invalid rows remain
visible and can be removed/rescanned. Repeated canonical ISBNs remain independent queue entries
with a visible repetition label. No title inference or automatic grouping/linking is introduced.

The queue is session-only and bounded to 1,000 entries, including invalid/completed rows.
At capacity, new captures fail with a localized message while prior rows remain. Remove allows
space to be reclaimed. Closing with unprocessed entries requires the existing Cancel-default
confirmation; native close/reload uses existing unsaved-change protection.

Review & add opens `BookEditor` using a separate ISBN-only `seed` prop, never `initial`.
`newBookDraft` preserves language/location/currency defaults and always creates blank identities.
`initial` retains its original persisted-edit meaning. The scanner input is unmounted while the
editor is open. Cancel returns to the intact queue; successful save/reload marks only that item
added. Returning to batch remounts/focuses the input. The editor protects the pending session on
native close even before its seeded draft is edited.

Scans make no metadata requests and perform no database writes. M2-A lookup remains an explicit
editor action. Every save uses M2-B `create_decided` and current backend duplicate validation.
Thus processing a repeated item after saving the first sees the new Edition and requires a fresh
explicit decision. Shared metadata, selected reconciliation and transaction behavior are unchanged.

## Verification boundaries

Pure parser/session/seed tests live in `src/domain/scanner.test.tsx`. Interactive component,
keyboard and persistence checks live in `scripts/desktop-smoke.mjs` and run against an isolated
real Windows Tauri executable. See `VERIFICATION.md` for observed results, rather than treating
this design description as acceptance evidence.

M2-C introduced no dependencies, migrations, native commands, provider endpoints, permissions or updater
changes. EN/TR text and native modal semantics are retained; layout uses logical spacing.
Synthetic keystrokes do not establish physical USB hardware acceptance. Real-device testing and
macOS/Linux interactive scanner testing require separate evidence. No camera/image decoding,
automatic bulk lookup, queue persistence, destructive merging or M3+ work is included.


## M2-D camera scanning — implementation candidate

Camera capture is available only from the explicit **Scan with camera** action inside Scan Books.
It is not mounted at startup and is not offered in BookEditor, CopyEditor or copy-barcode capture.
One explicit opening accepts at most one book EAN-13; capture ends before the result enters the
existing session queue. Reopening permits another intentional copy of the same ISBN. Queue limits,
discard protection, Review, Save and backend `duplicate_report` / `create_decided` remain authoritative.
No camera path requests metadata, saves data, assigns an Edition or creates relationships.

### Decoder and transport boundaries

`CameraScan` owns the preview and supplies browser ports to `CameraSession`. The controller owns
capture lifetime, cancellation and the 200 ms scheduler; it has no persistence/network service.
`CameraBarcodeDecoder` exposes initialize/decode/dispose and bounded untrusted text/format results.
`CameraDecoder` feature-detects BarcodeDetector and `ean_13`; failures fall back to the local worker.
An ordinary empty detection does not trigger fallback. No browser/OS-name detection or flags are used.

The exact npm dependency is `zxing-wasm@3.1.5`, reader only. Its module worker receives at most one
ImageData frame at a time, no larger than 640 x 480. It asks for one EAN-13 symbol and returns at most
one result with at most 128 characters. The camera domain then requires exactly 13 ASCII digits and
`ean_13` before calling the unchanged M2-A `parseIsbn`. UPC, other EANs, other formats, keyboard AIM
prefixes and suffixes are not reinterpreted. 979 never produces an ISBN-10.

Vite emits the reader WASM and worker as local assets. The worker permits only the known same-origin
reader asset. A version-specific build transform replaces the pinned library's otherwise-unused
CDN default with an exception. The worker build requires exactly one transformation of the expected
pinned shared module: missing/relocated modules and zero/multiple default patterns fail closed.
Its post-generation audit parses every JavaScript chunk in the worker output graph, including
secondary chunks regardless of filename. String/template tokens reject HTTP(S), protocol-relative
(including Unicode/encoded hosts) and blob URLs, plus known CDN identifiers; comments are excluded.
Inspection checks both the decoded token and a copy with URL-parser-ignored ASCII TAB/LF/CR removed.
This normalization is inspection-only and does not rewrite emitted strings.
The main/dev transform is retained, but unrelated main-app metadata URLs are outside the worker audit.
This is a guard against layout/default and URL-token regressions, not a general proof against
arbitrary computed URLs in malicious dependency code. This changes bundled code only, not installed
dependencies. The local override remains
mandatory; there is no remote fallback. The native detector is an optional optimization, never a
runtime requirement. A 15-second worker request timeout terminates the worker and reports a localized
reader error. No blob worker, frame upload or runtime package download exists.

### Capture and cleanup

The controller requests video with ideal (not mandatory) 640 x 480 constraints and `audio: false`.
It initializes the decoder before requesting capture. Cancellation invalidates subsequent work;
a stream resolving after cancellation is stopped without attachment. Accepted results, cancellation,
errors, device end, unmount, page hide and background visibility stop all tracks, clear the video and
canvas, cancel scheduling and dispose the decoder/worker. No frames, screenshots or device IDs are
persisted. Permission denial, missing device, busy/unreadable camera, constraints, unsupported context
and decoder errors have distinct EN/TR states. Repeated invalid results do not repeat announcements.

The modal reuses native dialog keyboard/focus behavior, offers Cancel while permission is pending,
and has a labeled preview and polite status. No decorative motion or global keyboard capture exists.

### Platform configuration

- Windows: unchanged application origin and default WebView2 camera permission behavior. No new
  Windows permission or signing configuration. Secure context/mediaDevices are checked at runtime.
- macOS: `src-tauri/Info.plist` supplies NSCameraUsageDescription. The installed Tauri CLI schema
  explicitly documents merging Info.plist beside tauri.conf.json. No signing, sandbox or entitlement
  changes. Actual macOS camera authorization is not established by this source configuration.
- Linux: locked Tauri 2.12.1 / Wry 0.57.0 expose `on_permission_request`; no Cargo upgrade is used.
  A `camera_session` IPC call arms a 30-second, one-use in-memory lease for the local main WebView.
  The Linux handler accepts only Camera with that lease and denies microphone/display/other requests.
  Cleanup revokes only its matching token so an old session cannot revoke a newer session. Wry checks
  microphone first for combined requests, so audio+video is denied. Other platforms keep native
  permission behavior. There is no permanent app permission grant or camera-ID storage.
  WebKitGTK runtime media support and distro multimedia prerequisites still need native acceptance;
  Linux is not disabled by platform name.

CSP adds only `script-src 'self' 'wasm-unsafe-eval'`, `worker-src 'self'`, and `'self'` to connect-src.
Existing image, style and IPC restrictions remain. No generic unsafe-eval, wildcard or remote source
is added. Native camera leases do not change database/schema, capabilities or updater behavior.

### Evidence boundary

See [M2-D audit](../testing/m2d-requirements-audit.md) and [verification](../../VERIFICATION.md).
Synthetic video in the real Windows executable is distinct from physical webcam acceptance.
M2-D is a local candidate; Issue #6 and M2 remain open until review, CI and integration gates finish.


## M2-F optional scan-to-lookup — local candidate

Scan Books defaults to **Scan ISBN only**, which makes no provider requests. Users may explicitly
select **Scan and look up book details**; EN/TR help explains that the ISBN is sent to Open Library
and Google Books. Workflow and single/batch choices are locked while the queue contains entries
or a camera/editor dialog is active. Copy-barcode capture, Quick Add and ordinary editors are unchanged.

In single mode, a valid USB HID or camera capture retains its queue row and opens a new ISBN-only
BookEditor draft. Camera capture stops its tracks and decoder before acceptance, and ScanBooks waits
for CameraScan unmount cleanup before opening the editor. In batch mode, capture stays offline;
only an explicit **Review & add** starts lookup for that row. Repeated ISBNs remain independent.
Cancel keeps the row pending; only successful explicit Save marks it added.

An explicit `lookupAfterScan` prop creates a per-opening intent in BookEditor. MetadataLookup consumes
it after effect setup survives cleanup, including React StrictMode replay. The editor-owned ref survives
section remounts. One intent starts one existing lookup operation (normally two provider calls), with
no automatic retries or extra fan-out. New editor openings get fresh intents. Unmount and changed ISBN identity
invalidate late results; lookup failure preserves manual entry and the existing retry action.

The existing provider preview, field choices and cover protections remain authoritative. Lookup does
not fill or persist the draft. Apply changes selected draft fields; Save remains separate and runs fresh
backend duplicate validation. Save is unavailable while the scan-started request or preview is active;
dismissal releases that guard. No database schema, provider endpoint, permission or dependency changes
are introduced. Edition and Physical Copy boundaries are unchanged.

Focused tests are in `src/domain/scanner.test.tsx`. Run
`node scripts/test-m2f-components.mjs` for actual development React StrictMode checks in an isolated
headless Edge profile. Its synthetic Tauri bridge cannot persist library data, external requests are
blocked, and Vite file watching is disabled to avoid watching native build artifacts on Windows.
`npm run test:desktop` adds deterministic M2-F provider fixtures to the existing isolated Windows
WebView2/SQLite smoke suite. Synthetic keyboard/video and provider fixtures do not establish hardware
acceptance or live provider availability. M2-F integration and milestone closure are not implied.


The 2026-10-23 PO authorization permits commit, feature-branch push and a DRAFT PR for this
candidate. Physical USB scanner, camera and Windows UI acceptance remain pending; automation is
not PO hardware acceptance. Independent review and separate integration authorization are required.
Overall M2 remains OPEN. See [verification](../../VERIFICATION.md) for attributed evidence.

The native smoke harness also supplies a child-process-only loopback rejection proxy. It never
forwards requests upstream. A deliberate fixture-bypass probe verifies that both native provider
clients fail through this guard; any later native HTTP attempt fails the suite. This covers Tauri's
native IPC fallback if a fetch mock breaks. The guard changes neither application networking nor
system proxy settings, and fixture results are not evidence of live provider availability.
