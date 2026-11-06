# PR #56 — scoped M3-C UI polish (not integrated)

Authority: the PO's 7 November 2026 instruction authorizes scoped UI/test changes,
normal commit/push, exact-SHA read-only review and updating Draft PR #56. Base `v2`
is `f54472b962505ded0c27f4e2d837aaf10e93d56a`; the preceding candidate is
`c8417662594dc26d8ab7ff5e7dbb25722574f46f`. No integration, cleanup or release is authorized.

## Attributed PO observations

The PO reported real native Windows observations in the isolated acceptance session:
confirmation text touched the left edge; long title/author gallery cards and actions
were unbalanced; one fulfilled card had a black cover. The PO also observed acquisition
events in status history. That last observation does **not** approve the entire history
model, Purchased/Fulfilled representation, reversal semantics or the whole feature.
The changed candidate still needs PO visual acceptance.

## Changes and boundaries

- ConfirmationHost now uses the existing padded `dialog-body`, with zero paragraph
  outer margin and 1.6 line height. Its message is the dialog's accessible description.
  Cancel remains initially focused; Escape/close still resolve false. No handler,
  button order or confirmation meaning changes.
- Shared modal headings wrap; close/footer buttons have 44px minimum targets and
  footer controls wrap within their available width.
- Wishlist cards separate effective status, priority, title, author, ISBN and price.
  Covers retain the existing 160x240 gallery / 64x96 list dimensions. Gallery title
  and author previews use three and two lines with reserved space. Full text remains
  in the DOM, accessible name/description, title tooltip, editor and detailed list.
  Card actions sit at the bottom; acquisition is visually primary and retailer/Copy
  actions remain distinct. Wishlist action targets are at least 44px high.
- At narrow widths the detailed list stacks cover and text. The before native 390px
  screenshot reproduced a one-character-wide text column with the old side-by-side
  layout. No global horizontal-overflow hiding is added.

No Rust, schema, migration, acquisition transaction, retailer/network behavior, cover
writer, recovery, dependency, permission or workflow changes are included. The existing
Intel-only packaging diagnostic and all platform/security requirements remain intact.

## Black cover investigation

The preserved PO session's original wish links explicitly to the existing Edition
whose cover is `covers/synthetic.png`. Its SHA-256 is
`431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460`, matching the
synthetic fixture. A separate native test of these exact PNG bytes loads successfully
with natural dimensions 1x1; canvas readback is RGBA `[0,0,0,255]` (opaque black).
The appearance is fixture artwork, not a demonstrated CSS/image-load defect. A new
Edition acquisition intentionally does not rewrite the wish's original explicit
Edition link. No stored media is changed, regenerated or deleted.

## Verification and evidence

Evidence stays ignored under `.cache`; screenshots/runtime data are not committed.
`scripts/test-m3c-visual.mjs` runs the actual Windows release/WebView2 with a new
synthetic database and distinct WebView2 profile per run. Its child-only rejection
proxy follows the existing desktop harness; it is not full OS/browser network isolation.
The report records source base, dirty status, scoped file hashes and executable hash,
so an uncommitted-source run cannot be mistaken for an exact-commit run.

The matrix uses EN/TR, light/dark, gallery/list, Wishing/Purchased cards, ordinary long
text, unbroken long words, TRY/USD, unlink explanations, Cancel/Tab/Shift+Tab/Escape,
focus return and full editor text. Viewports: 390x800, 900x620, 1024x768, 1280x800,
1366x768 and 1920x1080. Geometry checks cover horizontal overflow, target sizes,
dialog insets, accessible descriptions and equal-height cards in each gallery row.
Additional 720x496 and 600x413 viewports exercise short-window layouts approximating
900x620 effective space at 125/150%; they remain viewport emulation, not real DPI checks.
Before: `.cache/m3c-visual-1793999259069/report.json`, old EXE SHA-256
`ce4e4c0515a4c5d92f2db6f063a8efeda8477e850dac59073c9d8cca5a65b996`.
An earlier fixture-only run failed because its newly acquired Edition had not been
explicitly linked to the wish for cover display; that failed evidence is retained.
The intermediate UI run `.cache/m3c-visual-1794000182358/report.json` caught a real
Turkish 390px action-width regression: grid min-content sizing exceeded the card's
inner width. The scoped action track now uses `minmax(0,1fr)` and permits only
necessary long-word wrapping; the failure is retained rather than counted as PASS.
The complete native run `.cache/desktop-check-1794000448184/report.json` then caught
the old list `flex-basis` becoming a 64px height when narrow lists stack vertically.
The narrow cover now disables flex sizing and retains 64x96 dimensions; the visual
matrix also asserts the 2:3 ratio. This failed full run is preserved and is not 47/47 PASS.

Final commands/results, exact committed review, new EXE hash, screenshots and CI links
are recorded in Draft PR #56 and the final handoff. No pending check is a PASS.
Local final visual report: `.cache/m3c-visual-1794000826475/report.json` — **64 card
states / 32 dialog states PASS**, zero runtime errors or unexpected network requests.
Complete final native report: `.cache/desktop-check-1794000872123/report.json` — **47/47 PASS**.
Both use EXE SHA-256 `6b11ef31e519777a49e33dddb07503fe7eb33abb89d7bce30c58e25b8530ae84`.
Representative before/after screenshots include `tr-light-390-confirmation.png`,
`en-light-1280-gallery.png`, `tr-light-390-list.png`; the final report directory also
includes `en-light-1280-gallery-cards.png` and `tr-dark-1280-gallery-cards.png`.
Physical Windows 100/125/150% display-scale observations remain a PO gate; CDP viewport
sizes and the existing effective-viewport scale matrix do not establish real DPI acceptance.

## Bounded shared-UI inspection / Issue #27

At a 390px viewport the existing sidebar/topbar consumes much of the available width.
This is a cross-screen navigation/layout finding for [Issue #27](https://github.com/fatihemres/MyLibrary/issues/27),
not authorization to redesign it in M3-C. Dashboard, Settings, scanner and import/export
layouts are unchanged. Shared delete/discard/restore confirmation regressions are covered
by the existing complete synthetic native suite; automated results remain separate from PO
observations and formal GitHub reviews.

The original PO session, old launcher/EXE, failed test outputs and recovery generations
must remain preserved. The new candidate needs its own hash-checked launcher and profile;
the previous EXE hash is evidence only for the previous executable.
