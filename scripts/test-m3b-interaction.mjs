/* global window, document, getComputedStyle */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const baseline = process.env.MYLIBRARY_INTERACTION_BASELINE === '1';
const dir = '.cache/m3b-interaction/' + (baseline ? 'before-' : 'after-') + Date.now();
await mkdir(dir, { recursive: true });
const report = { baseline, cases: [], errors: [], blocked: [], passed: false };
const server = await createServer({
  configFile: false,
  appType: 'custom',
  root: process.cwd(),
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { entries: ['scripts/fixtures/m3b-wishlist.tsx'] },
  server: { host: '127.0.0.1', port: 0, watch: null },
});
server.middlewares.use('/interaction', async (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(
    await server.transformIndexHtml(
      '/interaction',
      '<div class="app"><aside class="sidebar">Synthetic isolated Wishlist fixture</aside><div class="workspace"><main id="root"></main></div></div><script type="module" src="/scripts/fixtures/m3b-wishlist.tsx"></script>',
    ),
  );
});
let browser;
try {
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.route('**/*', (r) => {
    if (r.request().url().startsWith(origin)) return r.continue();
    report.blocked.push(r.request().url());
    return r.abort();
  });
  await page.goto(origin + 'interaction');
  await page.addStyleTag({ url: origin + 'src/desktop.css' });
  await page.getByRole('button', { name: 'Add a wish', exact: true }).click();
  await page
    .getByLabel('Title', { exact: true })
    .fill('Journey — İstanbul’dan Diyarbakır’a: A Long English and Turkish Book Title');
  await page.getByLabel('Author(s)', { exact: true }).fill('Synthetic Author / İhsan Işık');
  await page.getByRole('button', { name: 'Save wish', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.evaluate(() => {
    window.wishTest.items[0].draft.retailers = [0, 1].map((n) => ({
      id: 'retailer-' + n,
      name: n ? 'Second retailer' : 'Uzun Kitapçı Adı / Long Retailer Name',
      url: 'https://shop.example/' + n,
      offer_minor: null,
      currency: 'TRY',
      notes: '',
    }));
    window.wishTest.retailerOpens = [];
    const invoke = window.__TAURI_INTERNALS__.invoke;
    window.__TAURI_INTERNALS__.invoke = (command, args) => {
      if (command === 'database' && args.action === 'wishlist_open_retailer') {
        window.wishTest.retailerOpens.push(args.payload);
        return Promise.resolve();
      }
      return invoke(command, args);
    };
  });
  await page.locator('.wish-toolbar input').first().fill('Journey');
  await page.getByRole('button', { name: 'Second retailer', exact: true }).waitFor();
  const card = page.locator('.wish-card').first(),
    open = card.locator('.wish-open'),
    retailer = card.locator('.wish-retailers button').first();
  const state = () =>
    card.evaluate((card) => {
      const b = card.querySelector('.wish-open'),
        r = card.querySelector('.wish-retailers button');
      const css = (e) => {
        const s = getComputedStyle(e);
        return {
          outline: s.outlineStyle,
          width: s.outlineWidth,
          offset: s.outlineOffset,
          color: s.outlineColor,
          background: s.backgroundColor,
          border: s.borderColor,
        };
      };
      return {
        card: css(card),
        open: css(b),
        retailer: css(r),
        focus: document.activeElement === b,
        visible: b.matches(':focus-visible'),
        retailerFocus: document.activeElement === r,
        width: card.clientWidth,
        scrollWidth: card.scrollWidth,
        mainWidth: document.querySelector('main').clientWidth,
        mainScrollWidth: document.querySelector('main').scrollWidth,
        coverWidth: card.querySelector('.cover').getBoundingClientRect().width,
      };
    });
  for (const theme of ['light', 'dark'])
    for (const [width, height] of [
      [900, 620],
      [1280, 800],
    ])
      for (const mode of ['gallery', 'list']) {
        await page.setViewportSize({ width, height });
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        await page
          .getByRole('button', {
            name: mode === 'gallery' ? 'Cover gallery' : 'Detailed list',
            exact: true,
          })
          .click();
        const evidence = { theme, width, height, mode, states: {} };
        const capture = async (name) => {
          await page.waitForTimeout(160);
          evidence.states[name] = await state();
          await card.screenshot({
            path: dir + '/' + theme + '-' + width + '-' + mode + '-' + name + '.png',
            animations: 'disabled',
          });
          await page.screenshot({
            path: dir + '/' + theme + '-' + width + '-' + mode + '-' + name + '-viewport.png',
            animations: 'disabled',
          });
        };
        await page.locator('.wish-intro h2').click();
        await page.mouse.move(1, 1);
        await capture('normal');
        await open.hover();
        await capture('hover');
        await page.locator('.wish-toolbar button').last().focus();
        await page.keyboard.press('Tab');
        assert(await open.evaluate((e) => e === document.activeElement));
        await capture('keyboard');
        if (!baseline) {
          assert.equal(evidence.states.keyboard.open.outline, 'none');
          assert.equal(evidence.states.keyboard.card.outline, 'solid');
          assert.equal(evidence.states.keyboard.card.width, '2px');
          assert.equal(evidence.states.keyboard.card.offset, '3px');
          assert.equal(evidence.states.hover.open.background, 'rgba(0, 0, 0, 0)');
          assert.equal(evidence.states.normal.card.outline, 'none');
        }
        await page.keyboard.press('Enter');
        await page.getByRole('dialog').waitFor();
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert(await open.evaluate((e) => e === document.activeElement));
        await capture('keyboard-return');
        await page.keyboard.press('Enter');
        await page.getByRole('dialog').waitFor();
        await page.getByLabel('Author(s)', { exact: true }).fill('Edited synthetic author');
        await page.getByLabel('Author(s)', { exact: true }).press('Enter');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert(await open.evaluate((e) => e === document.activeElement));
        await capture('save-return');
        await page.keyboard.press('Tab');
        assert(await retailer.evaluate((e) => e === document.activeElement));
        await capture('retailer');
        assert.equal(evidence.states.retailer.retailer.outline, 'solid');
        assert.equal(evidence.states.retailer.card.outline, 'none');
        const calls = await page.evaluate(() => window.wishTest.retailerOpens.length);
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => window.wishTest.retailerOpens.length), calls + 1);
        assert.equal(await page.getByRole('dialog').count(), 0);
        await retailer.click();
        assert.equal(await page.evaluate(() => window.wishTest.retailerOpens.length), calls + 2);
        await open.click();
        await page.getByRole('dialog').waitFor();
        await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert(await open.evaluate((e) => e === document.activeElement));
        await capture('mouse-return');
        if (!baseline)
          for (const name of ['keyboard-return', 'mouse-return', 'save-return']) {
            const s = evidence.states[name];
            assert.equal(s.open.outline, 'none');
            assert.equal(s.card.outline, s.visible ? 'solid' : 'none');
          }
        for (const s of Object.values(evidence.states)) {
          assert(s.scrollWidth <= s.width + 1);
          assert(s.mainScrollWidth <= s.mainWidth + 1);
          assert(s.coverWidth <= (mode === 'gallery' ? 160 : 64) + 1);
        }
        report.cases.push(evidence);
        console.log('PASS ' + theme + ' ' + width + 'x' + height + ' ' + mode);
      }
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.locator('.wish-toolbar button').last().focus();
  await page.keyboard.press('Tab');
  report.forcedColors = await state();
  assert.equal(report.forcedColors[baseline ? 'open' : 'card'].outline, 'solid');
  await card.screenshot({ path: dir + '/forced-colors-keyboard.png' });
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (e) {
  report.failure = String(e);
  throw e;
} finally {
  await writeFile(dir + '/report.json', JSON.stringify(report, null, 2));
  console.log('Evidence: ' + dir);
  await browser?.close();
  await server.close();
}
