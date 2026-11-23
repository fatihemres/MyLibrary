# D1 Reading Table Evolution — Independent Partial-Package and Derived Visual Diagnostic

**Reviewed:** 2026-11-13 · **State:** `INDEPENDENT PACKAGE INTEGRITY PASS / LIMITED MEMORY-LOADED BROWSER SMOKE PASS / D1 PARTIAL / NO PO OR NATIVE MOTION ACCEPTANCE`.

This is a public-safe research record of the PO-supplied **D1 partial** ZIP, **not** an approved D1 final product design, an automatically accepted Design Council decision, a passed Windows browser test or an instruction to change production code.

## Verifiable source integrity

- User-supplied ZIP `MyLibrary-D1-PARTIAL-20261113.zip`: **33,214,002 bytes**, independently calculated SHA-256 `bb5e6e5292c0a41c9f530fb34756a12d2c56b70371980b08622c60d19c4f7734`. This matches the prior Codex-reported fingerprint.
- ZIP contains **63 entries**: **61 contents** tracked in `PARTIAL-MANIFEST.json` and two manifest/sidecar metadata files. **61/61 content byte counts and SHA-256 digests independently matched**; manifest hash `4106bb6889beead0a2df2929e40ecf3b05f613ea78eba5f0b14b60aa5bf57c7d` matched `PARTIAL-MANIFEST.sha256`. ZIP CRC test clean, no unlisted entries, no unsafe absolute/parent traversal paths, backslash paths or Unix symlinks found. Targeted checks only, **not** a full privacy/security audit.
- Nested, unmodified `D0-original-20261113.zip`: **24,847,894 bytes**, hash `853164127e82a9a1d882c004d9f99f6cac19ee7b146ee31958bd8f8899705194`, matching the previously independently reviewed D0 source package. The nine D0 recordings remain historical **D0** material; **no new D1 video** appears in this partial ZIP.
- `review/reading-table/index.html` is a local HTML prototype with a content-security policy restricting `connect-src 'none'`, same-origin/file script and media use. Source inspection found no direct `fetch(`, `XMLHttpRequest`, `WebSocket`, web URL, localStorage, sessionStorage or `eval(` in the reviewed interactive entry point; this **does not** constitute a complete active-security verification of every archived script or nested source.

## Actual Council and design source

- Four separate initial A/B/C/D critiques and attribution files are present. The received-context records report Ponytail `FULL` absent in A/B/C/D, with only skill-catalogue metadata; this is participant/self-reported context evidence, **not** independently attested server-side model identity or proof that every hook fired. Coordinator used CLI 0.169.0 with recorded `gpt-6.1-sol / high`. No real installed A/B/C/D specialist skill is demonstrated.
- **Two deliberately light shell variants share a single prototype and fixture**, selected via `?shell=horizontal` or `?shell=rail`; they are not two fully independent product redesigns and neither was endorsed by all four after implementation.
- **Compact horizontal shell**: the main Library retains near-full content width, removes repeated two-row link chrome and large editorial preambles, puts less-used existing sections into a labelled navigation menu. Appears visually close to PO-favoured D0's spacious book field, but may retain a web-navigation impression.
- **Labelled rail shell**: persistent grouped navigation at left (primary Library/Dashboard/Wishlist and existing extension previews) plus a shallow contextual command band. Clearer sense of stable desktop destinations; reduces book/copy working width, especially around a 900px viewport. Moving top navigation left is only one tested hypothesis for reducing the PO's reported web-like feel.
- D1 still uses D0's warm paper/deep-green theme, book-focused scenes and separate Edition/Physical Copy identity. It simplifies Dashboard introductory hierarchy, moves Copy choices up, retains two explicit independent Copies for e1, restores return origin/scroll/focus in code, keeps a deliberately separate 170ms Browse/Index local settle and 140ms Copy detail settle.
- **Signature selected-jacket bridge is preserved in source** at `260ms` and `cubic-bezier(.2,.7,.25,1)`. The animation implementation also checks reduced-motion preferences and cancels outdated tracked animations. This is not proof that all intermediate frames are beautiful or that rapid reversal is safe.
- Four independent critiques pointed to repeated chrome, long introductions and distant Copy actions as contributors to a web-like feel—not top navigation alone. Authors rejected faux Windows controls, permanent split catalogue-detail panels, large page-wide movements and arbitrary feature invention. No post-build common final visual review was commissioned.

## Independent limited render/smoke in a separate sandbox

The ZIP was reviewed without changing source bytes, production code, user profiles, Windows browser settings or GitHub application files.

- **Exact original `file://` navigation and virtual HTTP navigation were blocked** by this independent inspection container's administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). This was **not** reproduced in the PO's Windows environment and must not be conflated with the original Codex Windows `spawn EPERM` / Chrome Crashpad / Edge exception blocker.
- As a narrow diagnostic fallback, the unchanged D0/D1 source files were loaded into an **in-memory Chromium page**. The test-only HTML instance omitted its external resource tags and CSP and injected the exact CSS/fixture and JS source, apart from substituting a hardcoded `horizontal`/`rail` value for the shell URL query parser. The **ZIP bytes were not modified**. Consequently this is a **derived render / logic smoke**, **not** exact-package CSP, file-origin or native app execution.
- Rendered **D0 and both D1 shells** for Dashboard, Library and Detail at **1280×820 EN/light** and **900×620 TR/dark**. Generated private diagnostic screenshots/contact sheets (not committed). The D1 derived render produced **no pageerror and no observed external request** during tested flows; no horizontal body overflow was measured at those sizes.
- Both D1 shells' **Library → e1 Detail → Library** smoke passed; both displayed **two independent Copy cards**. **Selecting cp2** updated only the selected-Copy state; opening a Copy editor, changing condition and cancelling via dirty confirmation restored the pre-edit `Poor` condition. Both shells exposed a running Web Animations API cover transition with **260ms effect duration** when opening e1. These are narrow tests, not full application, focus, keyboard, interruption, motion quality, native WebView2 or visual-accessibility acceptance.
- A separate attempt to record new video with the sandbox's Playwright recorder **could not start** because its configured ffmpeg executable was not present. No new D1 full-speed video was produced; no new packages were installed.

## Visual observations and remaining concerns

- D1's **horizontal variant** keeps the PO-loved warmth and visible cover array while dramatically reducing the stacked headings/navigation of D0. In 900px TR/dark, the three primary routes remain visible but some labels wrap within compact cells; assess regular keyboard and scaling behavior.
- D1's **rail variant** improves discoverability of more sections and desktop-like persistent navigation; its 160–184px left region competes with content at 900px and may feel more administrative. At the sampled narrow Detail, **two Copy controls were visible** in the derived render; this verifies a rendered sample, not all titles/DPI/font settings.
- Neither variant is an established winner. The special book-click motion is preserved and begins at the expected duration, but **does not yet have continuous normal-speed D1 evidence** against frozen D0; no final motion comfort decision is possible.
- Remaining D1 gates: genuine package `file://`/browser operation in a supported, safely configured Windows environment; consistent EN/TR/light/dark and long-title coverage; real scroll/focus restoration from non-first books; keyboard modal and rapid-reversal checks; reduced-motion mid-flight; same-source independent A/B/C/D final review; visual PO acceptance and, for future real integration only, native Windows/WebView2/DPI/FPS accessibility.
- The original Windows blocker remains **unresolved**: Codex reported Chrome crashpad/Mojo access denied and Edge `0x80000003` screenshot; no reliable root-cause evidence or approval to weaken security, install dependencies, alter browser/antivirus settings, or restart previous worktrees.

## Recommended continuation gate

1. Keep **D1 partial** and all original Council submissions as frozen research evidence. Do not commission another full design pass merely to diagnose browser launches.
2. Let the PO compare the **existing two D1 drafts** in an already functioning, trusted browser if safely possible after static source review, rather than having Codex launch more headless Chrome/Edge attempts. The packaged `INDEX.html` links directly to both local variants. This is a manual conceptual check, **not** full acceptance.
3. For final D1 proof, use a separately authorized healthy isolated capture environment or specifically approved diagnostic task; then capture **original D0 vs exact D1 continuous 1× motion**, including e1/e3 book open/return, reversal, Copy/editor and reduced-motion. Do not bypass or weaken security controls.
4. After valid render evidence, ask A/B/C/D for independent final same-source assessments and the PO for subjective motion/art-direction acceptance. Any subsequent MyLibrary implementation needs its own scoped authorization and exact-SHA Windows review gates.

**Conclusion:** `D1 PARTIAL VALID / SOURCE-INTEGRITY PASS / LIMITED RENDER + LOGIC SMOKE PASS / MOTION QUALITY STILL OPEN / TWO SHELL OPTIONS PO CHOICE OPEN`. This report does not approve production changes, feature scope, GitHub integration, or EngineeringOS adoption.
