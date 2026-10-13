# M2-C: focused keyboard-wedge scanning

M2-C is CLOSED at `1edf3014d252067b7ee435478cba3f6aaf9350c9`; final integration CI
`38365564445` passed all four platforms. See [verification](../../VERIFICATION.md) for
separate local desktop and CI evidence. M2 remains OPEN; M2-D webcam scanning is pending.

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

No new dependencies, migrations, native commands, provider endpoints, permissions or updater
changes. EN/TR text and native modal semantics are retained; layout uses logical spacing.
Synthetic keystrokes do not establish physical USB hardware acceptance. Real-device testing and
macOS/Linux interactive scanner testing require separate evidence. No camera/image decoding,
automatic bulk lookup, queue persistence, destructive merging or M3+ work is included.
