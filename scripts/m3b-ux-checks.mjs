/* global window, document, getComputedStyle */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function verifyWishlistUx({ page, nav, snapshot, fileChoice, runDir }) {
  const before = await snapshot();
  const invoke = (action, payload = {}) =>
    page.evaluate(
      ({ action, payload }) => window.__TAURI_INTERNALS__.invoke('database', { action, payload }),
      { action, payload },
    );
  const initialCount = await invoke('wishlist_active_count');
  const names = [
    'İstanbul’dan Diyarbakır’a Uzanan Bir Yolculuk: Kültür, Bellek ve Edebiyat Üzerine Çok Uzun Türkçe Bir Kitap Başlığı',
    'A Very Long English Book Title Exploring Libraries, Memories and Extraordinary Journeys Across the World',
    'KesintisizUzunBaşlık'.repeat(12),
  ];
  for (let i = 0; i < 5; i++) {
    const draft = {
      id: '',
      edition_id: i === 1 ? before.books[0]?.edition_id || null : null,
      title: names[i % 3] + ' UX ' + i,
      author: 'Synthetic author / İhsan Işık',
      isbn10: '',
      isbn13: '',
      preference: 'Any',
      edition_description: '',
      priority: 'High',
      status: i === 3 ? 'Cancelled' : 'Wishing',
      target_minor: '123456',
      currency: 'TRY',
      notes: '',
      archived: i === 4,
      updated_at: '',
      retailers: [0, 1].map((n) => ({
        id: randomUUID(),
        name: n === 0 ? 'ÇokUzunKitapçıAdı'.repeat(10) : 'Second synthetic retailer',
        url: 'https://shop.example/book/' + n,
        offer_minor: null,
        currency: 'TRY',
        notes: '',
      })),
    };
    assert.equal((await invoke('wishlist_save', { draft })).saved, true);
  }
  assert.equal(await invoke('wishlist_active_count'), initialCount + 3);
  assert.deepEqual((await snapshot()).books, before.books);
  const results = [];
  const initialViewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
  }));
  for (const language of ['en', 'tr']) {
    await nav((await page.locator('html').getAttribute('lang')) === 'tr' ? 'Ayarlar' : 'Settings');
    await page
      .getByLabel(
        (await page.locator('html').getAttribute('lang')) === 'tr'
          ? 'Uygulama dili'
          : 'Application language',
        { exact: true },
      )
      .selectOption(language);
    // Navigation titles come from the same shipped translations as the production UI.
    const locale = JSON.parse(
      await readFile(join(process.cwd(), 'src/i18n/locales', language + '.json'), 'utf8'),
    );
    const aliases = JSON.parse(
      await readFile(join(process.cwd(), 'src/i18n/aliases.json'), 'utf8'),
    );
    const labels = {
      dashboard: locale[aliases.Dashboard],
      import: locale[aliases['Import CSV/JSON']],
      read: locale['ui.importCsvJsonAlt'],
      active: locale['wishlist.activeCount'],
      gallery: locale['wishlist.gallery'],
      list: locale['wishlist.list'],
    };
    await nav(labels.dashboard);
    const link = page.locator('.secondary-stats button').filter({ hasText: labels.active });
    await page.waitForFunction(
      ({ label, count }) =>
        Array.from(document.querySelectorAll('.secondary-stats button')).some(
          (b) =>
            b.textContent.includes(label) &&
            b.querySelector('strong')?.textContent === String(count),
        ),
      { label: labels.active, count: initialCount + 3 },
    );
    assert.equal(
      await page.locator('.stats .stat').first().locator('strong').innerText(),
      String(before.books.length),
    );
    await page.screenshot({
      path: join(runDir, 'ux-dashboard-' + language + '.png'),
      animations: 'disabled',
    });
    await link.focus();
    await page.keyboard.press('Enter');
    await page.locator('.wish-card').first().waitFor();
    for (const scale of [1, 1.25, 1.5])
      for (const [physicalWidth, physicalHeight] of [
        [900, 620],
        [1024, 768],
        [1280, 800],
        [1366, 768],
        [1920, 1080],
      ]) {
        const width = Math.floor(physicalWidth / scale),
          height = Math.floor(physicalHeight / scale);
        await page.setViewportSize({ width, height });
        for (const mode of ['gallery', 'list']) {
          await page.getByRole('button', { name: labels[mode], exact: true }).click();
          const geometry = await page.evaluate(() => {
            const rect = (e) => {
              const r = e.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right };
            };
            return {
              viewport: window.innerWidth,
              documentWidth: document.documentElement.scrollWidth,
              containers: ['main', '.wishlist'].map((selector) => {
                const el = document.querySelector(selector);
                return { selector, width: el.clientWidth, scrollWidth: el.scrollWidth };
              }),
              cards: Array.from(document.querySelectorAll('.wish-card')).map((card) => ({
                rect: rect(card),
                cover: rect(card.querySelector('.cover')),
                title: rect(card.querySelector('h3')),
                titleWrap: getComputedStyle(card.querySelector('h3')).whiteSpace,
                overflow: Array.from(
                  card.querySelectorAll('.wish-open > div:last-child, .wish-retailers button'),
                )
                  .filter(
                    (e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1,
                  )
                  .map((e) => e.className),
                controls: Array.from(card.querySelectorAll('button')).map(rect),
              })),
            };
          });
          assert(
            geometry.documentWidth <= geometry.viewport + 1,
            JSON.stringify({ language, width, height, mode, geometry }),
          );
          for (const el of geometry.containers)
            assert(
              el.scrollWidth <= el.width + 1,
              JSON.stringify({ language, width, height, mode, el }),
            );
          for (const card of geometry.cards) {
            assert.equal(card.titleWrap, 'normal');
            assert.deepEqual(card.overflow, []);
            assert(card.title.right <= card.rect.right + 1);
            assert(card.cover.width <= (mode === 'list' ? 64 : 160) + 1);
            assert(Math.abs(card.cover.height / card.cover.width - 1.5) < 0.02);
            for (const b of card.controls)
              assert(b.x >= card.rect.x - 1 && b.right <= card.rect.right + 1);
          }
          const filename =
            'ux-' +
            language +
            '-' +
            physicalWidth +
            'x' +
            physicalHeight +
            '-scale' +
            scale +
            '-' +
            mode +
            '.png';
          await page.screenshot({
            path: join(runDir, filename),
            animations: 'disabled',
            fullPage: true,
          });
          results.push({
            language,
            physicalWidth,
            physicalHeight,
            scale,
            logical: { width, height },
            mode,
            filename,
            geometry,
          });
        }
      }
    await page.setViewportSize({ width: 1280, height: 800 });
    await nav(labels.import);
    const path = join(runDir, 'wishlist-rejected.json');
    await writeFile(
      path,
      JSON.stringify({ format: 'MyLibrary Wishlist catalogue', version: 1, items: [] }),
    );
    await fileChoice('open', path);
    // Use the file-picker action (localized label is read from the rendered page).
    await page.getByRole('button', { name: labels.read, exact: true }).click();
    await page.getByText(locale['wishlist.importUnsupported'], { exact: true }).waitFor();
    assert.equal(
      await page.getByText('Error: wishlist.importUnsupported', { exact: true }).count(),
      0,
    );
    await page.screenshot({
      path: join(runDir, 'ux-import-' + language + '.png'),
      animations: 'disabled',
    });
    assert.deepEqual((await snapshot()).books, before.books);
  }
  await writeFile(
    join(runDir, 'wishlist-ux-geometry.json'),
    JSON.stringify(
      {
        initialWebViewViewport: initialViewport,
        measurement:
          'Windows WebView2 with CDP logical viewport emulation; OS scaling was not changed',
        results,
      },
      null,
      2,
    ),
  );
}
