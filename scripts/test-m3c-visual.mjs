/* global window, document, getComputedStyle */
// Real Windows release/WebView2. Viewport sizes are emulation, never physical DPI acceptance.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
import { isLocalTauriResource, isTrustedTauriPage } from './native-tauri-origin.mjs';

assert.equal(process.platform, 'win32', 'Native Windows only');
const root = resolve(import.meta.dirname, '..');
const runDir = join(root, '.cache', 'm3c-visual-' + Date.now());
const data = join(runDir, 'library');
const exe = join(root, 'src-tauri/target/release/mylibrary.exe');
const baseline = process.env.MYLIBRARY_VISUAL_BASELINE === '1';
await mkdir(join(root, '.cache'), { recursive: true });
await mkdir(runDir);
await mkdir(join(data, 'covers'), { recursive: true });
const report = {
  baseline,
  runDir,
  sourceBase: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceStatus: execFileSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  }).trim(),
  sourceFiles: Object.fromEntries(
    await Promise.all(
      [
        'src/components/Confirmation.tsx',
        'src/components/common.tsx',
        'src/pages/Wishlist.tsx',
        'src/pages/Wishlist.css',
        'src/styles.css',
        'scripts/test-m3c-visual.mjs',
        'scripts/native-tauri-origin.mjs',
      ].map(async (path) => [
        path,
        createHash('sha256')
          .update(await readFile(join(root, path)))
          .digest('hex'),
      ]),
    ),
  ),
  executableSha256: createHash('sha256')
    .update(await readFile(exe))
    .digest('hex'),
  geometry: [],
  errors: [],
  network: [],
};
let child, browser, page;
let rejected = 0;
const guard = createServer((socket) => {
  socket.on('error', () => {});
  socket.setTimeout(5000, () => socket.destroy());
  socket.once('data', () => {
    rejected++;
    socket.end('HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
  });
});
guard.listen(0, '127.0.0.1');
await once(guard, 'listening');
const proxy = `http://127.0.0.1:${guard.address().port}`;
const reserve = createServer();
reserve.listen(0, '127.0.0.1');
await once(reserve, 'listening');
const port = reserve.address().port;
await new Promise((r) => reserve.close(r));
const inherited = Object.fromEntries(
  Object.entries(process.env).filter(
    ([k]) => !/^(https?|all|no)_proxy$|^MYLIBRARY_DATA_DIR$|^WEBVIEW2_/i.test(k),
  ),
);
const invoke = (action, payload = {}) =>
  page.evaluate(
    ({ action, payload }) => window.__TAURI_INTERNALS__.invoke('database', { action, payload }),
    { action, payload },
  );
const nav = (name) => page.locator('.sidebar').getByTitle(name, { exact: true }).click();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function screenshot(name) {
  await page.screenshot({
    path: join(runDir, name + '.png'),
    fullPage: true,
    animations: 'disabled',
  });
}
try {
  child = spawn(exe, [], {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...inherited,
      MYLIBRARY_DATA_DIR: data,
      WEBVIEW2_USER_DATA_FOLDER: join(runDir, 'webview'),
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port} --remote-debugging-address=127.0.0.1`,
      HTTP_PROXY: proxy,
      HTTPS_PROXY: proxy,
      ALL_PROXY: proxy,
      NO_PROXY: '127.0.0.1,localhost,tauri.localhost,ipc.localhost,asset.localhost',
    },
  });
  child.on('error', (error) => report.errors.push('Native launch: ' + error.message));
  for (let n = 0; n < 100; n++) {
    assert.deepEqual(report.errors, [], 'Native startup failed');
    try {
      if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break;
    } catch {
      /* WebView starting. */
    }
    await sleep(200);
  }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  for (let n = 0; n < 50; n++) {
    page = browser
      .contexts()[0]
      .pages()
      .find((p) => isTrustedTauriPage(p.url()));
    if (page) break;
    await sleep(100);
  }
  assert(page);
  report.applicationOrigin = new URL(page.url()).origin;
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.context().on('request', (r) => {
    if (/^https?:/.test(r.url()) && !isLocalTauriResource(r.url())) report.network.push(r.url());
  });
  await page.locator('.sidebar').waitFor();
  report.initialViewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
  }));
  const names = [
    'Short synthetic wish',
    'Long title with ordinary readable words '.repeat(9),
    'KesintisizUzunBaşlık'.repeat(15),
    'Fulfilled synthetic artwork',
  ];
  let fulfilled;
  for (let n = 0; n < names.length; n++) {
    const draft = {
      id: '',
      edition_id: null,
      title: names[n],
      author: n === 0 ? 'Short author' : 'Long synthetic author with several names '.repeat(8),
      isbn10: '',
      isbn13: '',
      preference: 'Any',
      edition_description: '',
      priority: 'Medium',
      status: 'Wishing',
      target_minor: '125099',
      currency: n === 1 ? 'USD' : 'TRY',
      notes: 'Synthetic visual fixture only',
      archived: false,
      updated_at: '',
      retailers: [
        {
          id: crypto.randomUUID(),
          name: 'Synthetic retailer',
          url: 'https://shop.example/book',
          offer_minor: null,
          currency: 'TRY',
          notes: '',
        },
      ],
    };
    const saved = await invoke('wishlist_save', { draft });
    assert.equal(saved.saved, true);
    if (n === 3) fulfilled = saved.id;
  }
  const wish = (await invoke('wishlist_list')).items.find((i) => i.draft.id === fulfilled);
  const request = {
    item: fulfilled,
    updated_at: wish.draft.updated_at,
    edition_id: null,
    title: names[3],
    author: wish.draft.author,
    isbn10: '',
    isbn13: '',
    physical: {
      barcode: '',
      inventory_code: '',
      location_id: '',
      source: '',
      acquisition_date: '',
      condition: 'Good',
    },
  };
  const review = await invoke('wishlist_acquisition_review', { request });
  const acquired = await invoke('wishlist_acquire', { request, review_token: review.review_token });
  await writeFile(
    join(data, 'covers/black.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
    { flag: 'wx' },
  );
  const book = (await invoke('snapshot')).books.find((b) => b.id === acquired.copy_id);
  await invoke('save', { ...book, cover: 'covers/black.png' });
  const fulfilledWish = (await invoke('wishlist_list')).items.find((i) => i.draft.id === fulfilled);
  const linkedDraft = { ...fulfilledWish.draft, edition_id: book.edition_id };
  const linked = await invoke('wishlist_save', { draft: linkedDraft });
  if (!linked.saved)
    assert.equal(
      (await invoke('wishlist_save', { draft: linkedDraft, review_token: linked.review_token }))
        .saved,
      true,
    );
  for (const language of ['en', 'tr']) {
    const previous = await page.locator('html').getAttribute('lang');
    await nav(previous === 'tr' ? 'Ayarlar' : 'Settings');
    await page
      .getByLabel(previous === 'tr' ? 'Uygulama dili' : 'Application language', { exact: true })
      .selectOption(language);
    const tr = JSON.parse(
      await readFile(join(root, 'src/i18n/locales', language + '.json'), 'utf8'),
    );
    await nav(language === 'tr' ? 'İstek listesi' : 'Wishlist');
    const beforeCancel = {
      books: (await invoke('snapshot')).books,
      wishes: await invoke('wishlist_list'),
    };
    const card = page.locator('#wish-' + fulfilled);
    await card.waitFor();
    await page.waitForFunction(() => document.querySelector('.wish-card img')?.naturalWidth === 1);
    report.blackCover = await card.locator('img').evaluate((img) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return {
        complete: img.complete,
        width: img.naturalWidth,
        height: img.naturalHeight,
        rgba: Array.from(ctx.getImageData(0, 0, 1, 1).data),
      };
    });
    assert.deepEqual(report.blackCover, {
      complete: true,
      width: 1,
      height: 1,
      rgba: [0, 0, 0, 255],
    });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
      for (const [width, height] of [
        [390, 800],
        [900, 620],
        [1024, 768],
        [1280, 800],
        [1366, 768],
        [1920, 1080],
        [720, 496],
        [600, 413],
      ]) {
        await page.setViewportSize({ width, height });
        for (const mode of ['gallery', 'list']) {
          await page.getByRole('button', { name: tr['wishlist.' + mode], exact: true }).click();
          await page.locator('.wish-' + mode).waitFor();
          const geometry = await page.evaluate(() => ({
            viewport: window.innerWidth,
            document: document.documentElement.scrollWidth,
            cards: Array.from(document.querySelectorAll('.wish-card')).map((card) => {
              const bounds = card.getBoundingClientRect();
              const opener = card.querySelector('.wish-open').getBoundingClientRect();
              const text = card
                .querySelector('.wish-open > div:last-child')
                .getBoundingClientRect();
              const cover = card.querySelector('.cover').getBoundingClientRect();
              const title = card.querySelector('h3');
              const author = card.querySelector('.wish-author');
              return {
                top: bounds.top,
                height: bounds.height,
                textWidth: text.width,
                openWidth: opener.width,
                textTop: text.top,
                coverBottom: cover.bottom,
                coverWidth: cover.width,
                coverHeight: cover.height,
                titleLines: title.clientHeight / parseFloat(getComputedStyle(title).lineHeight),
                authorLines: author
                  ? author.clientHeight / parseFloat(getComputedStyle(author).lineHeight)
                  : null,
                actionInset: card.querySelector('.wish-card-actions')
                  ? bounds.bottom -
                    card.querySelector('.wish-card-actions').getBoundingClientRect().bottom
                  : null,
                bottomPadding:
                  parseFloat(getComputedStyle(card).paddingBottom) +
                  parseFloat(getComputedStyle(card).borderBottomWidth),
                title: card.querySelector('h3').textContent,
                controls: Array.from(card.querySelectorAll('button')).map((b) => {
                  const r = b.getBoundingClientRect();
                  return {
                    inside: r.left >= bounds.left && r.right <= bounds.right + 1,
                    height: r.height,
                    width: r.width,
                    overflow: b.scrollWidth > b.clientWidth + 1,
                  };
                }),
              };
            }),
          }));
          report.geometry.push({ language, theme, width, height, mode, ...geometry });
          assert(geometry.document <= width + 1, 'Horizontal document overflow');
          if (!baseline) {
            for (const c of geometry.cards) {
              assert(
                Math.abs(c.coverHeight / c.coverWidth - 1.5) < 0.02,
                'Cover aspect ratio must remain 2:3',
              );
              assert(
                Math.abs(c.actionInset - c.bottomPadding) < 1,
                'Actions must align to card bottom padding',
              );
              if (mode === 'gallery') {
                assert(c.titleLines <= 3.1);
                assert(c.authorLines <= 2.1);
              }
              if (mode === 'list' && width <= 600) {
                assert(c.textWidth >= c.openWidth - 1);
                assert(c.coverBottom <= c.textTop);
              }
            }
            for (const c of geometry.cards)
              for (const b of c.controls) {
                assert(b.inside);
                assert(b.height >= 44);
                assert.equal(b.overflow, false);
              }
            if (mode === 'gallery')
              for (const c of geometry.cards)
                for (const other of geometry.cards)
                  if (Math.abs(c.top - other.top) < 1)
                    assert(Math.abs(c.height - other.height) < 1);
          }
          if (
            width === 390 ||
            width === 1280 ||
            (language === 'tr' && theme === 'light' && width === 900)
          ) {
            await screenshot(`${language}-${theme}-${width}-${mode}`);
            if (width === 1280) {
              await page
                .locator('.wish-' + mode)
                .evaluate((el) => el.scrollIntoView({ block: 'start' }));
              await screenshot(`${language}-${theme}-${width}-${mode}-cards`);
            }
          }
        }
        await card.getByRole('button', { name: tr['acquisition.reopen'], exact: true }).click();
        const dialog = page.getByRole('dialog', { name: tr['ui.pleaseConfirm'], exact: true });
        await dialog.waitFor();
        const geometryDialog = await dialog.evaluate((el) => {
          const p = el.querySelector('p'),
            r = el.getBoundingClientRect(),
            pr = p.getBoundingClientRect();
          return {
            leftInset: pr.left - r.left,
            rightInset: r.right - pr.right,
            width: r.width,
            right: r.right,
            left: r.left,
            scroll: el.scrollWidth,
            client: el.clientWidth,
            cancelFocused: document.activeElement === el.querySelector('footer button'),
            lineHeight: getComputedStyle(p).lineHeight,
          };
        });
        report.geometry.push({ language, theme, width, height, dialog: geometryDialog });
        assert.equal(geometryDialog.cancelFocused, true);
        if (!baseline) {
          assert(geometryDialog.leftInset >= 24 && geometryDialog.rightInset >= 24);
          assert(geometryDialog.scroll <= geometryDialog.client + 1);
          assert(geometryDialog.left >= 0 && geometryDialog.right <= width);
          assert(
            await dialog.evaluate(
              (el) => !!document.getElementById(el.getAttribute('aria-describedby')),
            ),
          );
        }
        if (width === 390 || width === 1280)
          await screenshot(`${language}-${theme}-${width}-confirmation`);
        await page.keyboard.press('Tab');
        assert(
          await dialog
            .getByRole('button', { name: tr['ui.continue'], exact: true })
            .evaluate((el) => el === document.activeElement),
        );
        await page.keyboard.press('Shift+Tab');
        assert(
          await dialog
            .getByRole('button', { name: tr['ui.cancel'], exact: true })
            .evaluate((el) => el === document.activeElement),
        );
        assert(
          await dialog
            .getByRole('button', { name: tr['ui.cancel'], exact: true })
            .evaluate(
              (el) =>
                parseFloat(getComputedStyle(el).outlineWidth) >= 2 &&
                getComputedStyle(el).outlineStyle !== 'none',
            ),
        );
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert(
          await card
            .getByRole('button', { name: tr['acquisition.reopen'], exact: true })
            .evaluate((el) => el === document.activeElement),
        );
      }
    }
    // Full content is still available in the editor, including gallery-clamped author text.
    await page.locator('.wish-open').filter({ hasText: names[1] }).click();
    const editor = page.getByRole('dialog').last();
    assert.equal(
      await editor.getByLabel(tr['wishlist.title'], { exact: true }).inputValue(),
      names[1],
    );
    assert.equal(
      await editor.getByLabel(tr['wishlist.authors'], { exact: true }).inputValue(),
      'Long synthetic author with several names '.repeat(8),
    );
    await page.keyboard.press('Escape');
    assert.deepEqual((await invoke('snapshot')).books, beforeCancel.books);
    assert.deepEqual(await invoke('wishlist_list'), beforeCancel.wishes);
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.network, []);
  assert.equal(rejected, 0);
  report.passed = true;
} catch (e) {
  report.passed = false;
  report.failure = e.stack;
  process.exitCode = 1;
  if (page) await screenshot('failure').catch(() => {});
} finally {
  await writeFile(join(runDir, 'report.json'), JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  if (child && child.exitCode === null) {
    child.kill();
    await Promise.race([once(child, 'exit'), sleep(3000)]);
  }
  await new Promise((r) => guard.close(r));
  console.log(JSON.stringify({ runDir, passed: report.passed, failure: report.failure }));
}
