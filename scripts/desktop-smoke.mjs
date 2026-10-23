/* global window, document */
// End-to-end checks against the real Windows executable and Rust/SQLite backend.
// OS file pickers use isolated paths; metadata lookup uses deterministic provider fixtures.
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';
import { ean13Image } from './fixtures/ean13.mjs';

const root = resolve(import.meta.dirname, '..');
const runDir = join(root, '.cache', `desktop-check-${Date.now()}`);
let dataDir = join(runDir, 'library');
const exe = join(root, 'src-tauri/target/release/mylibrary.exe');
await mkdir(runDir, { recursive: true });
const report = {
  started: new Date().toISOString(),
  executable: exe,
  dataDir,
  checks: [],
  errors: [],
  network: [],
  blockedNativeRequests: 0,
  nativeGuardVerified: false,
};
// Child-process-only rejection proxy: never resolve, connect to or forward an upstream host.
// Fetch mocks are not a network boundary: Tauri can fall back to native postMessage IPC.
const nativeGuard = createServer((socket) => {
  socket.on('error', () => {});
  socket.setTimeout(5000, () => socket.destroy());
  socket.once('data', () => {
    report.blockedNativeRequests++;
    socket.end('HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
  });
});
nativeGuard.listen(0, '127.0.0.1');
await once(nativeGuard, 'listening');
const nativeProxy = `http://127.0.0.1:${nativeGuard.address().port}`;
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^(https?|all|no)_proxy$/i.test(key)),
);
let processHandle, browser, page;
let profileInitialized = false;
const acceptDialogs = true;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function check(name, fn) {
  if (process.env.MYLIBRARY_DESKTOP_FOCUS === 'camera' && !name.startsWith('M2-D')) return;
  const blockedBefore = report.blockedNativeRequests;
  await fn();
  if (
    report.nativeGuardVerified &&
    name !== 'M2-F native network guard blocks missing provider mocks'
  )
    assert.equal(
      report.blockedNativeRequests,
      blockedBefore,
      'Provider fixture reached native HTTP',
    );
  report.checks.push(name);
  console.log(`PASS ${name}`);
}
function assertDomainUnchanged(after, before) {
  for (const key of [
    'books',
    'people',
    'publishers',
    'series',
    'locations',
    'sources',
    'fields',
    'terms',
    'loans',
    'entries',
    'attachments',
  ])
    assert.deepEqual(after[key], before[key], key + ' changed with UI language');
}
function assertCopyDetails(snapshot) {
  const first = snapshot.books.find((b) => b.copy_extra.inventory_code === 'Copy #1');
  const second = snapshot.books.find((b) => b.copy_extra.inventory_code === 'Copy #2');
  assert(first && second);
  assert.equal(first.edition_id, second.edition_id);
  assert.equal(first.condition, 'Very Good');
  assert.equal(second.condition, 'Poor');
  assert.equal(first.copy_extra.currency, 'TRY');
  assert.equal(second.copy_extra.currency, 'USD');
  assert.equal(first.copy_extra.shelf_position, 'A4');
  assert.equal(first.source, 'First store');
  assert.equal(second.source, 'Second store');
  assert.equal(first.acquisition_date, '2025-01-02');
  assert.equal(second.acquisition_date, '2026-02-03');
  assert.equal(snapshot.locations.find((l) => l.id === first.location_id).name, 'Shelf 1');
  assert.equal(first.location_id, second.location_id);
}
async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function launch(language = 'en') {
  const port = await freePort();
  processHandle = spawn(exe, [], {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...childEnv,
      HTTP_PROXY: nativeProxy,
      HTTPS_PROXY: nativeProxy,
      ALL_PROXY: nativeProxy,
      NO_PROXY: '127.0.0.1,localhost,tauri.localhost,ipc.localhost,asset.localhost',
      MYLIBRARY_DATA_DIR: dataDir,
      WEBVIEW2_USER_DATA_FOLDER: join(runDir, 'webview'),
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port} --remote-debugging-address=127.0.0.1`,
    },
  });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* WebView2 may still be starting. */
    }
    await sleep(250);
  }
  assert(ready, 'WebView2 debugging endpoint did not become available');
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  for (let i = 0; i < 40; i++) {
    page = context.pages().find((p) => p.url().startsWith('http://tauri.localhost'));
    if (page) break;
    await sleep(250);
  }
  assert(page, 'The real Tauri application page was not found');
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  context.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !/^http:\/\/(tauri|ipc|asset)\.localhost/.test(r.url()))
      report.network.push(r.url());
  });
  page.on('dialog', async (d) => {
    if (acceptDialogs) await d.accept();
    else await d.dismiss();
  });
  if (!profileInitialized) {
    await page
      .getByRole('heading', { name: /Your library, at a glance\.|Bir bakışta kütüphaneniz\./ })
      .waitFor();
    if ((await page.locator('html').getAttribute('lang')) === 'tr') {
      await page.locator('.sidebar').getByTitle('Ayarlar', { exact: true }).click();
      await page.getByLabel('Uygulama dili', { exact: true }).selectOption('en');
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
      await page.locator('.sidebar').getByTitle('Dashboard', { exact: true }).click();
    }
    profileInitialized = true;
  }
  await page
    .getByRole('heading', {
      name: language === 'tr' ? 'Bir bakışta kütüphaneniz.' : 'Your library, at a glance.',
    })
    .waitFor();
  await page.evaluate(() => {
    window.__testFilePaths = { open: [], save: [] };
    const original = window.fetch.bind(window);
    window.fetch = (url, options) => {
      const decoded = decodeURIComponent(String(url));
      if (
        decoded === 'http://ipc.localhost/plugin:dialog|open' ||
        decoded === 'http://ipc.localhost/plugin:dialog|save'
      ) {
        const key = decoded.endsWith('open') ? 'open' : 'save';
        const path = window.__testFilePaths[key].shift();
        if (!path) throw new Error(`No test path queued for ${key}`);
        return Promise.resolve(
          new Response(JSON.stringify(path), {
            headers: { 'Content-Type': 'application/json', 'Tauri-Response': 'ok' },
          }),
        );
      }
      return original(url, options);
    };
  });
}
async function close() {
  if (browser) {
    await browser.close();
    browser = null;
  }
  if (processHandle && !processHandle.killed) {
    processHandle.kill();
    await Promise.race([once(processHandle, 'exit'), sleep(3000)]);
  }
  processHandle = null;
}
const button = (name, scope = page) => scope.getByRole('button', { name, exact: true });
const dialog = () => page.getByRole('dialog').last();
const selectPlace = (name) =>
  page
    .locator('.entity-list')
    .getByRole('button', { name: new RegExp('^' + name + '\\s') })
    .click();
const nav = (name) => page.locator('.sidebar').getByTitle(name, { exact: true }).click();
const snapshot = () =>
  page.evaluate(() =>
    window.__TAURI_INTERNALS__.invoke('database', { action: 'snapshot', payload: {} }),
  );
async function until(predicate, label) {
  for (let i = 0; i < 60; i++) {
    const s = await snapshot();
    if (predicate(s)) return s;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
}
async function saved() {
  await dialog().waitFor({ state: 'hidden' });
  await page.locator('.loading').waitFor({ state: 'hidden' });
}
async function fileChoice(kind, path) {
  await page.evaluate(({ kind, path }) => window.__testFilePaths[kind].push(path), { kind, path });
}
async function openFirst() {
  await nav('Library');
  await page
    .locator('.book-title')
    .filter({ hasText: 'Verification — The Quiet Shelf' })
    .first()
    .click();
}
let originalId, coverPath;
try {
  await launch();
  await check('release startup uses isolated, empty SQLite library', async () => {
    const s = await snapshot();
    assert.equal(s.books.length, 0);
    assert.equal(s.dataDir.toLowerCase(), dataDir.toLowerCase());
    await page.screenshot({
      animations: 'disabled',
      path: join(runDir, 'dashboard-navigation.png'),
    });
  });
  await check('M2-F native network guard blocks missing provider mocks', async () => {
    // Deliberately bypass all provider fixtures; both real native clients must fail locally.
    const results = await page.evaluate(() =>
      Promise.all(
        ['isbn_lookup', 'google_books_lookup'].map(async (command) => {
          try {
            await window.__TAURI_INTERNALS__.invoke(command, { isbn: '9780306406157' });
            return 'unexpected success';
          } catch (error) {
            return String(error);
          }
        }),
      ),
    );
    assert.deepEqual(results, ['metadata.unavailable', 'metadata.unavailable']);
    assert.equal(
      report.blockedNativeRequests,
      2,
      'Both native clients must use the rejection proxy',
    );
    report.nativeGuardVerified = true;
  });
  await check(
    'M2-A explicit lookup, validation, source selection, draft safety and provider failure',
    async () => {
      // Synthetic provider IPC responses only; real UI, adapters and native storage.
      await page.evaluate(() => {
        window.__metadataCalls = [];
        window.__metadataMode = 'both';
        window.__metadataFetch = window.fetch.bind(window);
        window.fetch = async (url, options) => {
          const command = decodeURIComponent(String(url)).replace('http://ipc.localhost/', '');
          if (['isbn_lookup', 'google_books_lookup'].includes(command)) {
            window.__metadataCalls.push(command);
            if (window.__metadataMode === 'delayed') {
              await new Promise((resolve) => window.__metadataPending.push(resolve));
            }
            const failed =
              window.__metadataMode === 'offline' ||
              (command === 'google_books_lookup' && window.__metadataMode === 'partial');
            const value = failed
              ? 'metadata.unavailable'
              : command === 'isbn_lookup'
                ? {
                    title: 'Open candidate',
                    subjects: [
                      { name: '[series:Synthetic cycle]' },
                      { name: 'Fiction' },
                      { name: 'Poetry' },
                      { name: 'Paris' },
                    ],
                    series: ['Publisher classics'],
                    authors: [{ name: 'Open author' }],
                    number_of_pages: 200,
                  }
                : {
                    items: [
                      {
                        volumeInfo: {
                          title: 'Google candidate',
                          categories: ['Fiction / Historical', 'Drama', 'Science'],
                          seriesInfo: {
                            bookDisplayNumber: '2',
                            volumeSeries: [{ seriesId: 'opaque', orderNumber: 2 }],
                          },
                          authors: ['Google author'],
                          industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780306406157' }],
                        },
                      },
                    ],
                  };
            return new Response(JSON.stringify(value), {
              headers: {
                'Content-Type': 'application/json',
                'Tauri-Response': failed ? 'error' : 'ok',
              },
            });
          }
          return window.__metadataFetch(url, options);
        };
      });
      await button('Quick add').click();
      const editor = page.getByRole('dialog', { name: 'Quick add', exact: true });
      await editor.getByLabel('Title *', { exact: true }).fill('Manual protected title');
      await editor
        .getByLabel('Genres (separate with ;)', { exact: true })
        .fill('My manual genre; FICTION');
      await editor.getByLabel('ISBN-13', { exact: true }).fill('9780306406158');
      assert.equal(await page.evaluate(() => window.__metadataCalls.length), 0);
      await button('Look up ISBN online…', editor).click();
      await editor.getByRole('alert').filter({ hasText: 'checksum' }).waitFor();
      assert.equal(await page.evaluate(() => window.__metadataCalls.length), 0);
      await editor.getByLabel('ISBN-13', { exact: true }).fill('9780306406157');
      await button('Look up ISBN online…', editor).click();
      let preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
      await preview.waitFor();
      assert.equal(await page.evaluate(() => window.__metadataCalls.length), 2);
      assert(
        await preview
          .getByRole('group', { name: 'Title', exact: true })
          .getByRole('radio', { name: /Keep current/ })
          .isChecked(),
      );
      assert.equal(
        await editor.getByLabel('Title *', { exact: true }).inputValue(),
        'Manual protected title',
      );
      await page.keyboard.press('Control+s');
      assert.equal((await snapshot()).books.length, 0);
      await preview
        .getByRole('group', { name: 'Title', exact: true })
        .getByRole('radio', { name: /Google Books/ })
        .check();
      const genres = preview.getByRole('group', { name: 'Genre suggestions', exact: true });
      assert.equal(await genres.getByRole('checkbox', { checked: true }).count(), 0);
      const series = preview.getByRole('group', { name: 'Series suggestion', exact: true });
      assert(await series.getByRole('radio', { name: /Keep current/ }).isChecked());
      await series.getByRole('radio', { name: 'Synthetic cycle', exact: true }).check();
      await genres.getByRole('checkbox', { name: 'Poetry', exact: true }).focus();
      await page.keyboard.press('Space');
      assert(await genres.getByRole('checkbox', { name: 'Poetry', exact: true }).isChecked());
      await genres.getByRole('checkbox', { name: 'Fiction', exact: true }).first().check();
      await genres.getByRole('checkbox', { name: 'Fiction', exact: true }).last().check();
      assert.equal(await genres.getByRole('checkbox', { name: 'Paris', exact: true }).count(), 0);
      await page.screenshot({ animations: 'disabled', path: join(runDir, 'metadata-preview.png') });
      const metrics = await page.context().newCDPSession(page);
      for (const width of [900, 1280]) {
        await metrics.send('Emulation.setDeviceMetricsOverride', {
          width,
          height: 800,
          deviceScaleFactor: 1,
          mobile: false,
        });
        assert(
          await preview.evaluate((dialog) => {
            const radio = dialog.querySelector('input[type="radio"]');
            return (
              radio.getBoundingClientRect().width <= 24 &&
              dialog.scrollWidth <= dialog.clientWidth + 1
            );
          }),
          'Metadata choices must remain readable without horizontal overflow',
        );
        await page.screenshot({
          animations: 'disabled',
          path: join(runDir, `metadata-${width}.png`),
        });
      }
      await metrics.send('Emulation.clearDeviceMetricsOverride');
      await metrics.detach();
      await button('Apply selected fields', preview).click();
      await preview.waitFor({ state: 'hidden' });
      assert.equal(
        await editor.getByLabel('Title *', { exact: true }).inputValue(),
        'Google candidate',
      );
      assert.equal(
        await editor.getByLabel('Authors (separate with ;)').inputValue(),
        'Open author',
      );
      assert.equal((await snapshot()).books.length, 0);
      assert.equal(
        await editor.getByLabel('Genres (separate with ;)', { exact: true }).inputValue(),
        'My manual genre; FICTION; Poetry',
      );
      for (const mode of ['partial', 'offline']) {
        await page.evaluate((mode) => {
          window.__metadataMode = mode;
        }, mode);
        await button('Look up ISBN online…', editor).click();
        preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
        await preview
          .getByText('Provider unavailable. Manual entry remains available.', { exact: false })
          .first()
          .waitFor();
        assert.equal(
          await editor.getByLabel('Title *', { exact: true }).inputValue(),
          'Google candidate',
        );
        if (mode === 'partial')
          assert(
            await preview
              .getByRole('group', { name: 'Title', exact: true })
              .getByRole('radio', { name: /Open Library/ })
              .isVisible(),
          );
        await button(mode === 'partial' ? 'Cancel' : 'Close dialog', preview).click();
        await preview.waitFor({ state: 'hidden' });
        assert.equal((await snapshot()).books.length, 0);
        if (mode === 'partial') {
          // Cancel must release the parent Save guard without persisting the draft.
          await editor.getByLabel('Title *', { exact: true }).fill('');
          await page.keyboard.press('Control+s');
          await editor.getByText('Title is required', { exact: true }).waitFor();
          assert.equal((await snapshot()).books.length, 0);
          await editor.getByLabel('Title *', { exact: true }).fill('Google candidate');
        }
      }
      // Pending lookups use the latest draft and disappear safely when their section unmounts.
      await page.evaluate(() => {
        window.__metadataMode = 'delayed';
        window.__metadataPending = [];
      });
      await button('Look up ISBN online…', editor).click();
      await page.waitForFunction(() => window.__metadataPending.length === 2);
      await editor.getByLabel('Title *', { exact: true }).fill('Edited during request');
      await editor
        .getByLabel('Genres (separate with ;)', { exact: true })
        .fill('Latest manual genre');
      await page.evaluate(() => window.__metadataPending.splice(0).forEach((resolve) => resolve()));
      await preview.waitFor();
      assert(
        await preview
          .getByRole('group', { name: 'Title', exact: true })
          .getByRole('radio', { name: /Keep current/ })
          .isChecked(),
      );
      await preview.getByRole('checkbox', { name: 'Poetry', exact: true }).check();
      await button('Apply selected fields', preview).click();
      assert.equal(
        await editor.getByLabel('Title *', { exact: true }).inputValue(),
        'Edited during request',
      );
      assert.equal(
        await editor.getByLabel('Genres (separate with ;)', { exact: true }).inputValue(),
        'Latest manual genre; Poetry',
      );
      await button('Look up ISBN online…', editor).click();
      await page.waitForFunction(() => window.__metadataPending.length === 2);
      await editor.getByLabel('ISBN-13', { exact: true }).fill('9791090636071');
      await page.evaluate(() => window.__metadataPending.splice(0).forEach((resolve) => resolve()));
      await button('Look up ISBN online…', editor).waitFor();
      await page.waitForFunction(
        () =>
          !Array.from(document.querySelectorAll('button')).some((b) =>
            b.textContent.includes('Looking up'),
          ),
      );
      assert.equal(await preview.count(), 0);
      await editor.getByLabel('ISBN-13', { exact: true }).fill('9780306406157');
      await button('Open full editor', editor).click();
      const fullEditor = page.getByRole('dialog', { name: 'Add a book', exact: true });
      await button('Classification', fullEditor).click();
      assert.equal(
        await fullEditor.getByLabel('Series', { exact: true }).inputValue(),
        'Synthetic cycle',
      );
      assert.equal(
        await fullEditor.getByLabel('Series volume / order', { exact: true }).inputValue(),
        '',
      );
      await button('General', fullEditor).click();
      await button('Look up ISBN online…', fullEditor).click();
      await page.waitForFunction(() => window.__metadataPending.length === 2);
      await button('Publication', fullEditor).click();
      await page.evaluate(() => window.__metadataPending.splice(0).forEach((resolve) => resolve()));
      await button('General', fullEditor).click();
      assert.equal(await preview.count(), 0);
      await fullEditor.getByLabel('Title *', { exact: true }).fill('');
      await page.keyboard.press('Control+s');
      await fullEditor.getByText('Title is required', { exact: true }).waitFor();
      assert.equal((await snapshot()).books.length, 0);
      await button('Cancel', fullEditor).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await fullEditor.waitFor({ state: 'hidden' });
      await page.evaluate(() => {
        window.fetch = window.__metadataFetch;
      });
      assert.equal((await snapshot()).books.length, 0);
    },
  );
  await check('hierarchical rooms, bookcases, shelves and renaming through UI', async () => {
    await button('Toggle sidebar').click();
    const layout = await page.context().newCDPSession(page);
    await layout.send('Emulation.setDeviceMetricsOverride', {
      width: 900,
      height: 620,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.equal(await button('Locations', page.locator('.topbar')).count(), 0);
    assert(await button('Locations', page.locator('.sidebar')).isVisible());
    const locationButton = await button('Locations', page.locator('.sidebar')).boundingBox();
    assert(locationButton.x >= 0 && locationButton.x + locationButton.width <= 900);
    await nav('Locations');
    await page
      .getByText('No locations yet. Create your first room with Add Room above.', { exact: true })
      .waitFor();
    await page.screenshot({ animations: 'disabled', path: join(runDir, 'locations-empty.png') });
    assert(await button('Add Room').isVisible());
    await layout.send('Emulation.clearDeviceMetricsOverride');
    await layout.detach();
    await button('Toggle sidebar').click();
    for (const [name, parent, kind] of [
      ['Study draft', '', 'Room'],
      ['Bookcase 1', 'Study', 'Bookcase'],
      ['Shelf 1', 'Bookcase 1', 'Shelf'],
      ['Shelf 2', 'Bookcase 1', 'Shelf'],
    ]) {
      if (parent) await selectPlace(parent);
      await button('Add ' + kind).click();
      await dialog().getByLabel('Name *', { exact: true }).fill(name);
      await button('Save', dialog()).click();
      await saved();
      if (name === 'Study draft') {
        await selectPlace(name);
        await button(/^Rename /).click();
        await dialog().getByLabel('Name *', { exact: true }).fill('Study');
        await button('Save', dialog()).click();
        await saved();
      }
    }
    assert.equal((await snapshot()).locations.length, 4);
    await selectPlace('Bookcase 1');
    await button('Rename Bookcase').click();
    await dialog().getByLabel('Name *', { exact: true }).fill('Bookcase renamed');
    await button('Save', dialog()).click();
    await saved();
    await selectPlace('Bookcase renamed');
    await button('Rename Bookcase').click();
    await dialog().getByLabel('Name *', { exact: true }).fill('Bookcase 1');
    await button('Save', dialog()).click();
    await saved();
    await page.screenshot({
      animations: 'disabled',
      path: join(runDir, 'locations-hierarchy.png'),
    });
  });
  await check('custom field creation through UI', async () => {
    await nav('Settings');
    await button('Create field').click();
    await dialog().getByLabel('Name *', { exact: true }).fill('Recommended by');
    await button('Save', dialog()).click();
    await saved();
    assert.equal((await snapshot()).fields.length, 1);
  });
  await check('Quick Add, local cover upload, full editing and Ctrl+S', async () => {
    const cover = join(runDir, 'test-cover.png');
    await writeFile(
      cover,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGZkAAAAASUVORK5CYII=',
        'base64',
      ),
    );
    await button('Quick add').click();
    await dialog().getByLabel('Title *', { exact: true }).fill('Verification — The Quiet Shelf');
    await dialog().getByLabel('Authors (separate with ;)').fill('Verification Author');
    await dialog().getByLabel('Genres (separate with ;)').fill('Literature');
    await dialog()
      .getByLabel('Physical location')
      .selectOption({ label: 'Study / Bookcase 1 / Shelf 1' });
    await dialog().locator('input[type=file]').setInputFiles(cover);
    await dialog().getByRole('img', { name: 'Cover of Verification — The Quiet Shelf' }).waitFor();
    await button('Open full editor', dialog()).click();
    await button('Publication', dialog()).click();
    await dialog().getByLabel('Publisher', { exact: true }).fill('Verification Press');
    await dialog().getByLabel('Publication year', { exact: true }).fill('2020');
    await dialog().getByLabel('Pages', { exact: true }).fill('200');
    await dialog().getByLabel('Language', { exact: true }).fill('English');
    await button('Classification', dialog()).click();
    await dialog().getByLabel('Series', { exact: true }).fill('Verification Series');
    await dialog().getByLabel('Series volume / order').fill('1');
    await button('Custom Fields', dialog()).click();
    await dialog().getByLabel('Recommended by', { exact: true }).fill('Test friend');
    await page.keyboard.press('Control+s');
    await saved();
    const s = await until((s) => s.books.length === 1, 'book saved');
    originalId = s.books[0].id;
    coverPath = s.books[0].cover;
    assert(coverPath.startsWith('covers/'));
    assert.equal(s.books[0].pages, 200);
    assert.equal(s.people[0].name, 'Verification Author');
    assert.equal(s.books[0].custom[s.fields[0].id], 'Test friend');
    assert.equal((await stat(join(dataDir, coverPath))).size, (await stat(cover)).size);
  });
  await check('book detail, reading progress and editing persist', async () => {
    await openFirst();
    await button('Reading', page.locator('main .tabs')).click();
    await page.getByLabel('Current page', { exact: true }).fill('50');
    await button('Update progress').click();
    await until((s) => s.books[0].current_page === 50, 'progress');
    await button('Edit book').click();
    await button('Physical', dialog()).click();
    await dialog().getByLabel('Signed copy').check();
    await page.keyboard.press('Control+s');
    await saved();
    assert.equal((await snapshot()).books[0].copy_extra.signed, true);
  });
  await check('notes, quotes and reading sessions through UI', async () => {
    for (const [tab, add, content] of [
      ['Notes', 'Add note', 'Verification research note'],
      ['Quotes', 'Add quote', 'A verification quotation about quiet shelves.'],
      ['Reading', 'Log reading session', 'Verification reading session'],
    ]) {
      await button(tab, page.locator('main .tabs')).click();
      await button(add).click();
      await dialog()
        .getByLabel(tab === 'Quotes' ? 'Quotation' : 'Content', { exact: true })
        .fill(content);
      await dialog().getByLabel('Page reference').fill('25');
      await button('Save', dialog()).click();
      await saved();
    }
    assert.equal((await snapshot()).entries.length, 3);
  });
  await check('loan and return retain history', async () => {
    await button('Lend book').click();
    await dialog().getByLabel('Borrower *').fill('Verification Borrower');
    await dialog().getByLabel('Loan date', { exact: true }).fill('2026-10-01');
    await dialog().getByLabel('Expected return').fill('2026-10-05');
    await button('Save', dialog()).click();
    await saved();
    await button('Lending', page.locator('main .tabs')).click();
    await page.getByText('Overdue', { exact: true }).waitFor();
    await button('Return today').click();
    const s = await until(
      (s) => s.loans.length === 1 && !!s.loans[0].returned_date,
      'loan returned',
    );
    assert.equal(s.loans[0].borrower, 'Verification Borrower');
  });
  await check('managed attachments and export preserve bytes', async () => {
    const receipt = join(runDir, 'receipt.txt');
    await writeFile(receipt, 'Verification receipt — not personal data');
    await button('Attachments', page.locator('main .tabs')).click();
    await page.locator('main input[type=file]').setInputFiles(receipt);
    await until((s) => s.attachments.length === 1, 'attachment stored');
    const path = join(runDir, 'receipt-export.txt');
    await fileChoice('save', path);
    await button('Save a copy…').click();
    for (let i = 0; i < 30; i++) {
      try {
        assert.equal(await readFile(path, 'utf8'), await readFile(receipt, 'utf8'));
        return;
      } catch {
        await sleep(100);
      }
    }
    throw new Error('Attachment export did not complete');
  });
  await check('authors, series and location browsing', async () => {
    await nav('Authors');
    await button('Verification Author 1').click();
    await page.getByRole('heading', { name: 'Verification Author', exact: true }).waitFor();
    await button('Edit details').click();
    await dialog().getByLabel('Nationality').fill('Test nationality');
    await button('Save', dialog()).click();
    await saved();
    assert.equal((await snapshot()).people[0].extra.nationality, 'Test nationality');
    await nav('Series');
    await button('Verification Series 1').click();
    await page.getByRole('heading', { name: '1 copies in your library' }).waitFor();
    await nav('Locations');
    await selectPlace('Shelf 1');
    await page
      .getByRole('heading', { name: 'Study / Bookcase 1 / Shelf 1', exact: true })
      .waitFor();
  });
  await check(
    'physical copy editing, independent acquisition and copy-specific lending',
    async () => {
      await openFirst();
      await button('Edit physical copy').click();
      await dialog().getByLabel('Copy identifier / inventory code').fill('Unsaved copy name');
      await page.keyboard.press('Escape');
      const discardCopy = page.getByRole('dialog', { name: 'Please confirm', exact: true });
      await discardCopy.waitFor();
      assert.equal(await page.locator(':focus').innerText(), 'Cancel');
      await button('Cancel', discardCopy).click();
      assert.equal(
        await dialog().getByLabel('Copy identifier / inventory code').inputValue(),
        'Unsaved copy name',
      );
      assert.notEqual(
        (await snapshot()).books.find((b) => b.id === originalId).copy_extra.inventory_code,
        'Unsaved copy name',
      );
      await dialog().getByLabel('Copy identifier / inventory code').fill('Copy #1');
      await button('Location', dialog()).click();
      await dialog()
        .getByLabel('Room → Bookcase → Shelf')
        .selectOption({ label: 'Study → Bookcase 1 → Shelf 1' });
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'copy-location-assignment.png'),
      });
      await dialog().getByLabel('Shelf position').fill('A4');
      await dialog().getByLabel('Location note').fill('Left side');
      await button('Ownership', dialog()).click();
      await dialog().getByLabel('Acquisition date', { exact: true }).fill('2025-01-02');
      await dialog().getByLabel('Acquisition source', { exact: true }).fill('First store');
      await dialog().getByLabel('Purchase price', { exact: true }).fill('12.5');
      await dialog().getByLabel('Currency', { exact: true }).fill('TRY');
      await button('Physical', dialog()).click();
      await dialog()
        .getByLabel(/^Condition/)
        .first()
        .selectOption('Very Good');
      await button('Save physical copy', dialog()).click();
      await saved();
      await button('Add Physical Copy').click();
      await dialog().getByLabel('Copy identifier / inventory code').fill('Copy #2');
      await dialog().getByLabel('Barcode', { exact: true }).fill('VERIFY-002');
      await button('Location', dialog()).click();
      await dialog()
        .getByLabel('Room → Bookcase → Shelf')
        .selectOption({ label: 'Study → Bookcase 1 → Shelf 2' });
      await button('Ownership', dialog()).click();
      await dialog().getByLabel('Acquisition date', { exact: true }).fill('2026-02-03');
      await dialog().getByLabel('Acquisition source', { exact: true }).fill('Second store');
      await dialog().getByLabel('Purchase price', { exact: true }).fill('40');
      await dialog().getByLabel('Currency', { exact: true }).fill('USD');
      await dialog().getByLabel('Gift', { exact: true }).check();
      await dialog().getByLabel('Gifted by').fill('Verification friend');
      await button('Physical', dialog()).click();
      await dialog()
        .getByLabel(/^Condition/)
        .first()
        .selectOption('Poor');
      await button('Save physical copy', dialog()).click();
      await saved();
      let current = await until((s) => s.books.length === 2, 'second physical copy');
      const first = current.books.find((b) => b.id === originalId),
        second = current.books.find((b) => b.id !== originalId);
      assert.equal(first.condition, 'Very Good');
      assert.equal(second.condition, 'Poor');
      assert.equal(first.copy_extra.currency, 'TRY');
      assert.equal(second.copy_extra.currency, 'USD');
      assert.notEqual(first.location_id, second.location_id);
      assert.equal(first.edition_id, second.edition_id);
      assert.equal(second.current_page, 0);
      assert.equal(second.status, 'Unread');
      await button('Copies', page.locator('main .tabs')).click();
      const card = page.getByRole('article', { name: 'Copy #2', exact: true });
      await button('Loan', card).click();
      await dialog().getByLabel('Borrower *').fill('Second copy borrower');
      await button('Save', dialog()).click();
      await saved();
      await card.getByText('Lent to Second copy borrower', { exact: true }).waitFor();
      await page
        .getByRole('article', { name: 'Copy #1', exact: true })
        .getByText('Owned', { exact: true })
        .waitFor();
      current = await snapshot();
      assert.equal(current.loans.filter((l) => !l.returned_date).length, 1);
      assert.equal(current.loans.find((l) => !l.returned_date).copy_id, second.id);
      await button('Mark returned', card).click();
      await until((s) => s.loans.every((l) => l.returned_date), 'second returned');
      await button('Move', page.getByRole('article', { name: 'Copy #1', exact: true })).click();
      await dialog()
        .getByLabel('Room → Bookcase → Shelf')
        .selectOption({ label: 'Study → Bookcase 1 → Shelf 2' });
      await button('Save physical copy', dialog()).click();
      await saved();
      assert((await snapshot()).books.every((b) => b.location_id === second.location_id));
      await page.screenshot({ animations: 'disabled', path: join(runDir, 'physical-copies.png') });
    },
  );
  await check(
    'edition grouping and Dashboard Finished navigation retain independent copies',
    async () => {
      await nav('Library');
      assert.equal(await page.locator('.book-card').count(), 1);
      await page.locator('.book-card').getByText('2 copies', { exact: true }).waitFor();
      await nav('Dashboard');
      await button(/^Finished/, page.locator('.stats')).click();
      assert.equal(
        await page
          .locator('main')
          .getByLabel(/^Reading status/)
          .inputValue(),
        'Finished',
      );
      await page.getByRole('heading', { name: 'No matching books', exact: true }).waitFor();
      const setFirstStatus = async (status) => {
        await openFirst();
        await button('Copies', page.locator('main .tabs')).click();
        await button(
          'View copy / book',
          page.getByRole('article', { name: 'Copy #1', exact: true }),
        ).click();
        await button('Edit book').click();
        await button('Reading', dialog()).click();
        await dialog()
          .getByLabel(/^Reading status/)
          .selectOption(status);
        await page.keyboard.press('Control+s');
        await saved();
      };
      await setFirstStatus('Finished');
      await nav('Dashboard');
      await button(/^Finished/, page.locator('.stats')).click();
      assert.equal(await page.locator('.book-card').count(), 1);
      await page.locator('.book-card').getByText('Finished', { exact: true }).waitFor();
      await page
        .locator('.book-card')
        .getByText('2 copies · 1 matching', { exact: true })
        .waitFor();
      await page.screenshot({ animations: 'disabled', path: join(runDir, 'finished-edition.png') });
      await setFirstStatus('Reading');
      await nav('Library');
      await page.getByLabel('Search entire library').fill('NoMatchingEditionSearch');
      await page.getByRole('heading', { name: 'No matching books', exact: true }).waitFor();
      await page.getByLabel('Search entire library').fill('Quiet Shelf');
      await page.locator('.book-card').waitFor();
      assert.equal(await page.locator('.book-card').count(), 1);
      await page.getByLabel('Search entire library').fill('');
      await button('Filters').click();
      await page
        .getByLabel('Location (includes children)')
        .selectOption({ label: 'Study / Bookcase 1 / Shelf 2' });
      assert.equal(await page.locator('.book-card').count(), 1);
      await button('Reset').click();
    },
  );
  await check(
    'occupied location deletion, empty removal and copy archive cancellation',
    async () => {
      await nav('Locations');
      await selectPlace('Shelf 2');
      await button('Remove location').click();
      const confirm = page.getByRole('dialog', { name: 'Please confirm', exact: true });
      await button('Continue', confirm).click();
      await page.getByRole('alert').filter({ hasText: 'contains copies' }).waitFor();
      assert.equal((await snapshot()).locations.length, 4);
      await button('Dismiss').click();
      for (const parent of ['Study', 'Bookcase 1']) {
        await selectPlace(parent);
        await button('Remove location').click();
        await button('Continue', confirm).click();
        await page.getByRole('alert').filter({ hasText: 'contains copies' }).waitFor();
        assert.equal((await snapshot()).locations.length, 4);
        await button('Dismiss').click();
      }
      await selectPlace('Shelf 1');
      await button(/^Rename /).click();
      await dialog().getByLabel('Name *', { exact: true }).fill('Shelf 1 renamed');
      await button('Save', dialog()).click();
      await saved();
      await selectPlace('Shelf 1 renamed');
      await button(/^Rename /).click();
      await dialog().getByLabel('Name *', { exact: true }).fill('Shelf 1');
      await button('Save', dialog()).click();
      await saved();
      await button('Add Room').click();
      await dialog().getByLabel('Name *', { exact: true }).fill('Temporary empty room');
      await button('Save', dialog()).click();
      await saved();
      await selectPlace('Temporary empty room');
      await button('Remove location').click();
      await button('Continue', confirm).click();
      await until((s) => s.locations.length === 4, 'empty location removed');
      await openFirst();
      await button('Copies', page.locator('main .tabs')).click();
      await button('Archive', page.getByRole('article', { name: 'Copy #2', exact: true })).click();
      await button('Cancel', confirm).click();
      assert.equal((await snapshot()).books.length, 2);
      await button('Archive', page.getByRole('article', { name: 'Copy #2', exact: true })).click();
      await button('Continue', confirm).click();
      await until((s) => s.books.length === 1, 'copy archived without deleting its edition');
      await nav('Trash');
      await page.getByLabel('Select all', { exact: true }).check();
      await button('Restore from Trash').click();
      await button('Continue', confirm).click();
      await until((s) => s.books.length === 2, 'physical copy restored');
    },
  );
  await check('grid, table, search, filters, sorting and bulk tag', async () => {
    await nav('Library');
    await page.getByLabel('table view').click();
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.getByLabel('Sort books').selectOption('author');
    await button('Filters').click();
    await page
      .locator('main')
      .getByLabel(/^Author/)
      .selectOption('Verification Author');
    await page.getByLabel(/^Reading status/).selectOption('Reading');
    assert.equal(await page.locator('tbody tr').count(), 1);
    await button('Reset').click();
    await page.getByLabel('Search entire library').fill('quotation');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1);
    await page.getByLabel('Search entire library').fill('');
    await page
      .locator('.toolbar')
      .getByText('1 editions · 2 matching copies', { exact: true })
      .waitFor();
    await page.getByLabel('Select all', { exact: true }).check();
    await page.getByLabel('Bulk operation').selectOption('add_tag');
    await page.getByPlaceholder('Tag name').fill('Verified');
    await button('Apply').click();
    await until((s) => s.books.every((b) => b.terms.tag.includes('Verified')), 'bulk tag');
    await page.getByLabel('Bulk operation').selectOption('location_id');
    const shelf = (await snapshot()).locations.find((l) => l.name === 'Shelf 1');
    await page.getByLabel('New location').selectOption(shelf.id);
    await button('Apply').click();
    await until(
      (s) => s.books.every((b) => b.location_id === shelf.id),
      'bulk move physical copies',
    );
    await page.getByLabel('grid view').click();
    await page.locator('.book-card').first().click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await page.keyboard.press('Escape');
  });
  await check('JSON and CSV catalogue export use real file writes', async () => {
    await nav('Export CSV/JSON');
    for (const format of ['JSON', 'CSV']) {
      const path = join(runDir, `catalogue.${format.toLowerCase()}`);
      await fileChoice('save', path);
      await button(format).click();
      for (let i = 0; i < 30; i++) {
        try {
          await stat(path);
          break;
        } catch {
          await sleep(100);
        }
      }
      const text = await readFile(path, 'utf8');
      if (format === 'JSON') {
        const exported = JSON.parse(text);
        assert.equal(exported.books.length, 2);
        assert.deepEqual(exported.books[0].transfer.location, ['Study', 'Bookcase 1', 'Shelf 1']);
      } else assert(text.includes('Verification Author'));
    }
  });
  await check(
    'JSON export imports into a clean library with shared editions; CSV round trip',
    async () => {
      const originalData = dataDir;
      await close();
      dataDir = join(runDir, 'clean-import-library');
      await launch();
      assert.equal((await snapshot()).books.length, 0);
      await nav('Import CSV/JSON');
      await fileChoice('open', join(runDir, 'catalogue.json'));
      await button('Import CSV/JSON…').click();
      await page.getByLabel(/I reviewed the decisions. Import 2 physical copies/).check();
      await button('Confirm import').click();
      let imported = await until((s) => s.books.length === 2, 'JSON imported');
      assert.equal(imported.books[0].edition_id, imported.books[1].edition_id);
      assert(
        imported.books.every(
          (b) =>
            b.title === 'Verification — The Quiet Shelf' &&
            b.publisher === 'Verification Press' &&
            b.pages === 200,
        ),
      );
      assert.deepEqual(imported.books.map((b) => b.condition).sort(), ['Poor', 'Very Good']);
      assert.equal(imported.locations.length, 3);
      assert(imported.locations.some((l) => l.extra.kind === 'Shelf'));
      assert(
        imported.books.some(
          (b) => b.copy_extra.inventory_code === 'Copy #1' && b.copy_extra.currency === 'TRY',
        ),
      );
      assert(
        imported.books.some(
          (b) => b.copy_extra.inventory_code === 'Copy #2' && b.copy_extra.currency === 'USD',
        ),
      );
      await fileChoice('open', join(runDir, 'catalogue.csv'));
      await button('Import CSV/JSON…').click();
      await button('Validate & preview').click();
      await page.getByRole('heading', { name: 'Review import', exact: true }).waitFor();
      for (const choice of await page
        .getByLabel('Create a separate edition', { exact: true })
        .all())
        await choice.check();
      await page.getByLabel(/I reviewed the decisions. Import 2 physical copies/).check();
      await button('Confirm import').click();
      imported = await until((s) => s.books.length === 4, 'CSV round trip');
      assert(
        imported.books.every(
          (b) => b.title === 'Verification — The Quiet Shelf' && b.pages === 200,
        ),
      );
      await close();
      dataDir = originalData;
      await launch();
    },
  );
  await check('CSV mapping, invalid-row preview and transactional import', async () => {
    await nav('Import CSV/JSON');
    const csv = join(runDir, 'import.csv');
    await writeFile(
      csv,
      'Name,Writer,Pages\nVerification Imported,Second Author,120\n,Invalid Author,bad\n',
    );
    await fileChoice('open', csv);
    await button('Import CSV/JSON…').click();
    await page.getByLabel(/^Name ·/).selectOption('title');
    await page.getByLabel(/^Writer ·/).selectOption('authors');
    await button('Validate & preview').click();
    await page.getByText('This entire group will be skipped', { exact: false }).waitFor();
    await page.getByLabel(/I reviewed the decisions. Import 1 physical copies/).check();
    await button('Confirm import').click();
    await until((s) => s.books.length === 3, 'import committed');
  });
  await check('cancel protects unsaved edits and deletion', async () => {
    await button('Quick add').click();
    await dialog().getByLabel('Title *', { exact: true }).fill('Unsaved verification draft');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'Please confirm', exact: true }).waitFor();
    assert.equal(await page.locator(':focus').innerText(), 'Cancel');
    await page.keyboard.press('Enter');
    assert.equal(
      await dialog().getByLabel('Title *', { exact: true }).inputValue(),
      'Unsaved verification draft',
    );
    await page.evaluate(() =>
      window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'main' }),
    );
    await page.getByText('Discard unsaved changes and close MyLibrary?', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(
      await dialog().getByLabel('Title *', { exact: true }).inputValue(),
      'Unsaved verification draft',
    );
    await page.keyboard.press('Escape');
    await button(
      'Cancel',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    assert.equal(
      await dialog().getByLabel('Title *', { exact: true }).inputValue(),
      'Unsaved verification draft',
    );
    await page.keyboard.press('Escape');
    await button(
      'Continue',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    await saved();
    await nav('Library');
    await page.getByLabel('Select all', { exact: true }).check();
    await button('Move to Trash').click();
    await button(
      'Cancel',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    assert.equal((await snapshot()).books.length, 3);
    await page.getByLabel('Select all', { exact: true }).uncheck();
  });
  await check('complete backup, reversible Trash and protected restore', async () => {
    const archive = join(runDir, 'library-backup.zip');
    await nav('Create Backup');
    await fileChoice('save', archive);
    await button('Create Backup…').click();
    await page.getByText(`Backup saved to ${archive}`, { exact: true }).waitFor();
    assert((await stat(archive)).size > 1000);
    await nav('Import CSV/JSON');
    const manifest = join(runDir, 'manifest.json');
    await writeFile(manifest, JSON.stringify({ application: 'MyLibrary', format: 1, schema: 1 }));
    for (const wrongFile of [archive, manifest]) {
      await fileChoice('open', wrongFile);
      await button('Import CSV/JSON…').click();
      await page.getByRole('alert').filter({ hasText: 'Use Restore Backup instead' }).waitFor();
      assert.equal((await snapshot()).books.length, 3);
      await button('Dismiss').click();
    }

    await nav('Library');
    await page.getByLabel('Select all', { exact: true }).check();
    await button('Move to Trash').click();
    await button(
      'Continue',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    await until((s) => s.books.length === 0, 'trashed copies');
    await nav('Trash');
    await page.getByLabel('Select all', { exact: true }).check();
    await button('Restore from Trash').click();
    await button(
      'Continue',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    await until((s) => s.books.length === 3, 'trash recovery');
    await nav('Create Backup');
    await nav('Restore Backup');
    await fileChoice('open', archive);
    await button('Choose Backup ZIP…').click();
    await page.getByLabel('Type RESTORE to confirm replacing your current library').fill('RESTORE');
    await button('Validate & restore').click();
    await page.getByText(/Restore completed/).waitFor();
    const s = await snapshot();
    assert.equal(s.books.length, 3);
    assert.equal(s.entries.length, 3);
    assert.equal(s.loans.length, 2);
    assert.equal(s.attachments.length, 1);
    assertCopyDetails(s);
    assert((await readdir(join(dataDir, 'backups'))).some((n) => n.startsWith('before-restore-')));
    await stat(join(dataDir, coverPath));
  });
  await check('settings, dark theme and integrity screen', async () => {
    await nav('Settings');
    await page.getByLabel(/^Theme/).selectOption('dark');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.getByLabel('Default currency').fill('USD');
    await button('Save defaults').click();
    await until(
      (s) => s.settings.some((p) => p.key === 'currency' && p.value === 'USD'),
      'settings saved',
    );
    await button('Run integrity check').click();
    await page
      .getByText('Database integrity and relationships are healthy.', { exact: true })
      .waitFor();
    await page.screenshot({ animations: 'disabled', path: join(runDir, 'settings-dark.png') });
    await nav('Library');
    await page.screenshot({ animations: 'disabled', path: join(runDir, 'library-dark.png') });
    const placeholder = page.locator('.cover span').filter({ hasText: 'Verification Imported' });
    assert(
      await placeholder.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      'Placeholder title must wrap within its cover',
    );
  });
  await check(
    'desktop visual system, single navigation, adaptive layout and reduced motion',
    async () => {
      await nav('Dashboard');
      assert.equal(await page.locator('.stats .stat').count(), 4);
      assert.equal(await button('Locations', page.locator('.topbar')).count(), 0);
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'dashboard-populated-dark.png'),
      });
      await nav('Settings');
      await page.getByLabel(/^Theme/).selectOption('light');
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      for (const route of [
        'Dashboard',
        'Library',
        'Locations',
        'Import CSV/JSON',
        'Export CSV/JSON',
        'Create Backup',
        'Restore Backup',
        'Settings',
      ]) {
        await nav(route);
        await page.screenshot({
          animations: 'disabled',
          path: join(runDir, `design-${route.replaceAll(/[^a-z]/gi, '-')}.png`),
        });
        assert(
          (await page
            .locator('.sidebar')
            .getByTitle(route, { exact: true })
            .getAttribute('aria-current')) === 'page',
        );
      }
      const layout = await page.context().newCDPSession(page);
      await layout.send('Emulation.setDeviceMetricsOverride', {
        width: 900,
        height: 620,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await nav('Locations');
      assert(await button('Locations', page.locator('.sidebar')).locator('span').isVisible());
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'design-locations-narrow.png'),
      });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await nav('Dashboard');
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'design-dashboard-narrow.png'),
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(
        await page
          .locator('.dashboard-heading')
          .evaluate((el) => window.getComputedStyle(el).animationName),
        'none',
      );
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await layout.send('Emulation.setDeviceMetricsOverride', {
        width: 1800,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'design-dashboard-wide.png'),
      });
      await layout.send('Emulation.clearDeviceMetricsOverride');
      await layout.detach();
      await openFirst();
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'design-book-detail.png'),
      });
      await nav('Settings');
      await page.getByLabel(/^Theme/).selectOption('dark');
    },
  );
  await check('restart preserves books, covers, settings and related records', async () => {
    await close();
    await launch();
    const s = await snapshot();
    assert.equal(s.books.length, 3);
    assert.equal(s.entries.length, 3);
    assert.equal(s.loans.length, 2);
    assert.equal(s.attachments.length, 1);
    assertCopyDetails(s);
    assert.equal(s.books.find((b) => b.id === originalId).cover, coverPath);
    assert.equal(s.settings.find((p) => p.key === 'currency').value, 'USD');
    await nav('Library');
    await page
      .getByRole('img', { name: 'Cover of Verification — The Quiet Shelf' })
      .first()
      .waitFor();
    assert(
      await page
        .getByRole('img', { name: 'Cover of Verification — The Quiet Shelf' })
        .first()
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    );
    await page.screenshot({
      animations: 'disabled',
      path: join(runDir, 'library-after-restart.png'),
    });
  });
  await check('explicit native window close discards only the unsaved draft', async () => {
    await button('Quick add').click();
    await dialog().getByLabel('Title *', { exact: true }).fill('Discarded window-close draft');
    await page.evaluate(() =>
      window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'main' }),
    );
    const confirmation = page.getByRole('dialog', { name: 'Please confirm', exact: true });
    await confirmation.waitFor();
    assert.equal(await page.locator(':focus').innerText(), 'Cancel');
    const closed = page.waitForEvent('close');
    await button('Continue', confirmation).click();
    await closed;
    await close();
    await launch();
    assert.equal((await snapshot()).books.length, 3);
  });
  await check(
    'empty-copy location creation preserves draft and immediately refreshes choices',
    async () => {
      await close();
      dataDir = join(runDir, 'inline-locations-library');
      await launch();
      await button('Quick add').click();
      await dialog().getByLabel('Title *', { exact: true }).fill('Verification — The Quiet Shelf');
      await page.keyboard.press('Control+s');
      await saved();
      await openFirst();
      await button('Copies', page.locator('main .tabs')).click();
      await button('Add Copy').click();
      await dialog().getByLabel('Copy identifier / inventory code').fill('My unsaved copy');
      await button('Location', dialog()).click();
      await dialog()
        .getByText(/No locations yet/)
        .waitFor();
      await button('Add Room', dialog()).click();
      await page.keyboard.press('Escape');
      await page
        .getByRole('dialog', { name: 'Add locations', exact: true })
        .waitFor({ state: 'detached' });
      assert.equal(
        await page.getByRole('dialog', { name: 'Please confirm', exact: true }).count(),
        0,
      );
      assert(
        await page.getByRole('dialog', { name: 'Add Physical Copy', exact: true }).isVisible(),
      );
      for (const [kind, name, path] of [
        ['Room', 'Study', 'Study'],
        ['Bookcase', 'Bookcase 1', 'Study → Bookcase 1'],
        ['Shelf', 'Shelf 1', 'Study → Bookcase 1 → Shelf 1'],
      ]) {
        await button('Add ' + kind, dialog()).click();
        await dialog().getByLabel('Name *', { exact: true }).fill(name);
        await button('Save', dialog()).click();
        await page
          .getByRole('dialog', { name: 'Add locations', exact: true })
          .waitFor({ state: 'detached' });
        await dialog().getByLabel('Room → Bookcase → Shelf').selectOption({ label: path });
      }
      await page.screenshot({
        animations: 'disabled',
        path: join(runDir, 'inline-location-creation.png'),
      });
      await button('Identity', dialog()).click();
      assert.equal(
        await dialog().getByLabel('Copy identifier / inventory code').inputValue(),
        'My unsaved copy',
      );
      await button('Save physical copy', dialog()).click();
      await saved();
      const s = await snapshot();
      const copy = s.books.find((b) => b.copy_extra.inventory_code === 'My unsaved copy');
      assert.equal(s.locations.find((l) => l.id === copy.location_id).name, 'Shelf 1');
      assert.equal(s.books.length, 2);
      await close();
      await launch();
      assert.equal(
        (await snapshot()).books.find((b) => b.id === copy.id).location_id,
        copy.location_id,
      );
      await nav('Locations');
      await selectPlace('Shelf 1');
      await page
        .getByRole('button', { name: /Verification — The Quiet Shelf · My unsaved copy/ })
        .click();
      await button('Copies', page.locator('main .tabs')).click();
      await button(
        'Archive',
        page.getByRole('article', { name: 'My unsaved copy', exact: true }),
      ).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await until((state) => state.books.length === 1, 'inline copy archived');
      await nav('Locations');
      await selectPlace('Shelf 1');
      await button('Remove location').click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await page.getByRole('alert').filter({ hasText: 'contains copies' }).waitFor();
      assert.equal((await snapshot()).locations.length, 3);
      await button('Dismiss').click();
    },
  );
  await check('same-title distinct editions remain separate library entries', async () => {
    await nav('Library');
    assert.equal(await page.locator('.book-card').count(), 1);
    await button('Quick add').click();
    await dialog().getByLabel('Title *', { exact: true }).fill('Verification — The Quiet Shelf');
    await page.keyboard.press('Control+s');
    await saved();
    await nav('Library');
    assert.equal(await page.locator('.book-card').count(), 2);
    const s = await snapshot();
    assert.equal(new Set(s.books.map((b) => b.edition_id)).size, 2);
    assert.equal(new Set(s.books.map((b) => b.title)).size, 1);
  });
  await check('English/Turkish language switch preserves data and survives restart', async () => {
    const before = await snapshot();
    await nav('Settings');
    await page.getByLabel('Application language', { exact: true }).selectOption('tr');
    await page.getByRole('heading', { name: 'Ayarlar', exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), 'tr');
    await page.getByText('12.345,67', { exact: true }).waitFor();
    await page.getByText('08.10.2026', { exact: true }).waitFor();
    await page.getByText('₺1.250,50', { exact: true }).waitFor();
    assertDomainUnchanged(await snapshot(), before);
    await nav('Konumlar');
    await page.getByRole('heading', { name: 'Konumlar', exact: true }).waitFor();
    await nav('Kütüphane');
    assert.equal(await page.locator('.book-card').count(), 2);
    await button('Sonuçları dışa aktar').waitFor();
    await page.screenshot({ path: join(runDir, 'turkish-library.png') });
    await close();
    await launch('tr');
    await nav('Ayarlar');
    assert.equal(await page.getByLabel('Uygulama dili', { exact: true }).inputValue(), 'tr');
    await button('Şimdi denetle').click();
    await page.getByRole('status').filter({ hasText: 'ağ isteği gönderilmedi' }).waitFor();
    await page.getByLabel('Uygulama dili', { exact: true }).selectOption('en');
    await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
    assertDomainUnchanged(await snapshot(), before);
  });
  await check(
    'frozen V1 library migrates in real desktop with records and managed paths intact',
    async () => {
      await close();
      dataDir = join(runDir, 'v1-migration');
      await mkdir(join(dataDir, 'covers'), { recursive: true });
      await mkdir(join(dataDir, 'attachments'), { recursive: true });
      execFileSync('python', [
        '-X',
        'utf8',
        '-c',
        'import sqlite3,sys,pathlib; c=sqlite3.connect(sys.argv[1]); c.executescript(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8-sig")); c.executescript(pathlib.Path(sys.argv[3]).read_text(encoding="utf-8-sig")); c.close()',
        join(dataDir, 'library.sqlite3'),
        join(root, 'src-tauri/tests/fixtures/v1-schema.sql'),
        join(root, 'src-tauri/tests/fixtures/v1-library.sql'),
      ]);
      await writeFile(
        join(dataDir, 'covers/fixture.png'),
        await readFile(join(runDir, 'test-cover.png')),
      );
      await writeFile(join(dataDir, 'attachments/fixture.txt'), 'synthetic receipt');
      await launch();
      const s = await snapshot();
      assert.equal(s.books.length, 2);
      assert.equal(s.locations.length, 3);
      assert.equal(s.loans.length, 1);
      assert.equal(s.entries.length, 3);
      assert.equal(s.books.find((b) => b.id === 'copy1').current_page, 50);
      await nav('Library');
      assert.equal(await page.locator('.book-card').count(), 1);
      await page.getByText('2 copies', { exact: true }).waitFor();
      await page.locator('.book-card').click();
      await button('Copies', page.locator('main .tabs')).click();
      assert.equal(await page.locator('.copy-card').count(), 2);
      await nav('Locations');
      await selectPlace('Shelf 1');
      await page.getByRole('button', { name: /V1 preserved/ }).waitFor();
      const platform = await page.evaluate(() =>
        window.__TAURI_INTERNALS__.invoke('database', { action: 'platform', payload: {} }),
      );
      assert.equal(platform.schema, 2);
      assert.equal(resolve(platform.paths.data), resolve(dataDir));
      await nav('Settings');
      await button('Open data folder').click();
      await page.locator('.loading').waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('alert').count(), 0);
      await page.getByLabel('Application language', { exact: true }).selectOption('tr');
      await page.getByRole('heading', { name: 'Ayarlar', exact: true }).waitFor();
      assert.equal((await snapshot()).settings.find((v) => v.key === 'language').value, 'French');
      await close();
      await launch('tr');
      assertDomainUnchanged(await snapshot(), s);
      await nav('Ayarlar');
      await page.getByLabel('Uygulama dili', { exact: true }).selectOption('en');
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
    },
  );
  await check(
    'M2-B edition decisions, copy independence, cancel, weak/collision signals and import plans',
    async () => {
      await close();
      dataDir = join(runDir, 'm2b-library');
      await launch();
      await nav('Settings');
      await button('Create field').click();
      await dialog().getByLabel('Name *', { exact: true }).fill('M2B custom');
      await button('Save', dialog()).click();
      await saved();
      await nav('Locations');
      await button('Add Room').click();
      await dialog().getByLabel('Name *', { exact: true }).fill('M2B Study');
      await button('Save', dialog()).click();
      await saved();
      const incomingLocation = (await snapshot()).locations[0].id;
      const start = async (isbn = '9780306406157', title = 'M2B original') => {
        await button('Add book').click();
        await dialog().getByLabel('Title *', { exact: true }).fill(title);
        await dialog().getByLabel('Authors (separate with ;)').fill('Synthetic Writer');
        await dialog()
          .getByLabel(isbn.length === 10 ? 'ISBN-10' : 'ISBN-13', { exact: true })
          .fill(isbn);
      };
      const resolver = () =>
        page.getByRole('dialog', { name: 'Review edition and physical copy', exact: true });
      await start();
      await button('Publication', dialog()).click();
      await dialog().getByLabel('Pages', { exact: true }).fill('300');
      await dialog().getByLabel('Publisher', { exact: true }).fill('Original publisher');
      await button('Save book', dialog()).click();
      await saved();
      const first = (await snapshot()).books[0];
      await start('0306406152', 'Incoming different title');
      await button('Custom Fields', dialog()).click();
      await dialog().getByLabel('M2B custom', { exact: true }).fill('Independent custom value');
      await button('Reading', dialog()).click();
      await dialog()
        .getByLabel(/^Reading status/)
        .selectOption('Reading');
      await dialog().getByLabel('Current page', { exact: true }).fill('42');
      await dialog()
        .getByLabel(/^Rating/)
        .selectOption('4.5');
      await dialog().getByLabel('Favorite', { exact: true }).check();
      await button('Ownership', dialog()).click();
      await dialog().getByLabel('Acquisition source', { exact: true }).fill('Second store');
      await dialog().getByLabel('Acquisition date', { exact: true }).fill('2026-02-03');
      await dialog().getByLabel('Purchase price', { exact: true }).fill('25');
      await dialog().getByLabel('Currency', { exact: true }).fill('TRY');
      await button('Physical', dialog()).click();
      await dialog()
        .getByLabel(/^Condition/)
        .and(dialog().locator('select'))
        .selectOption('Poor');
      await button('Location', dialog()).click();
      await dialog().getByLabel('Barcode / copy identifier', { exact: true }).fill('M2B-BARCODE');
      await dialog()
        .getByLabel(/^Physical location/)
        .selectOption(incomingLocation);
      await dialog().getByLabel('Shelf position', { exact: true }).fill('B7');
      await dialog().getByLabel('Location note', { exact: true }).fill('Independent location note');
      await button('Save book', dialog()).click();
      await resolver().waitFor();
      assert.equal((await snapshot()).books.length, 1);
      assert.equal(await resolver().locator('input:checked').count(), 0);
      await page.keyboard.press('Escape');
      assert.equal(
        await dialog().getByLabel('Barcode / copy identifier', { exact: true }).inputValue(),
        'M2B-BARCODE',
      );
      await button('Save book', dialog()).click();
      await resolver().waitFor();
      await resolver()
        .getByLabel('Add as new physical copy of this edition', { exact: true })
        .check();
      await resolver()
        .getByText(/Edition metadata is shared by ALL/)
        .waitFor();
      assert.equal(await resolver().locator('input[type=checkbox]:checked').count(), 0);
      const metrics = await page.context().newCDPSession(page);
      await metrics.send('Emulation.setDeviceMetricsOverride', {
        width: 900,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
      });
      assert(await resolver().evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
      assert(
        await resolver()
          .locator('input[type=radio]')
          .first()
          .evaluate((el) => el.getBoundingClientRect().width <= 24),
      );
      await page.screenshot({ animations: 'disabled', path: join(runDir, 'm2b-resolver.png') });
      await metrics.send('Emulation.clearDeviceMetricsOverride');
      await metrics.detach();
      await button('Confirm and save physical copy', resolver()).click();
      await saved();
      let state = await until((s) => s.books.length === 2, 'new independent copy');
      assert.deepEqual(
        state.books.find((b) => b.id === first.id),
        first,
      );
      const second = state.books.find((b) => b.id !== first.id);
      assert.equal(second.edition_id, first.edition_id);
      assert.equal(second.title, first.title);
      assert.equal(second.current_page, 42);
      assert.equal(second.rating, 4.5);
      assert.equal(second.favorite, true);
      assert.equal(second.status, 'Reading');
      assert.equal(second.condition, 'Poor');
      assert.equal(second.location_id, incomingLocation);
      assert.equal(second.source, 'Second store');
      assert.equal(second.acquisition_date, '2026-02-03');
      assert.equal(second.copy_extra.purchase_price, '25');
      assert.equal(second.copy_extra.currency, 'TRY');
      assert.equal(second.copy_extra.shelf_position, 'B7');
      assert.equal(second.copy_extra.location_note, 'Independent location note');
      assert.equal(second.custom[state.fields[0].id], 'Independent custom value');
      await start();
      await button('Save book', dialog()).click();
      await resolver().waitFor();
      await resolver().getByLabel('Create a separate edition', { exact: true }).check();
      await button('Confirm and save physical copy', resolver()).click();
      await saved();
      state = await snapshot();
      assert.equal(new Set(state.books.map((b) => b.edition_id)).size, 2);
      await start('9791090636071');
      await button('Location', dialog()).click();
      await dialog().getByLabel('Barcode / copy identifier', { exact: true }).fill('M2B-BARCODE');
      await button('Save book', dialog()).click();
      await resolver().waitFor();
      await resolver().getByText('Physical copy identifier collision', { exact: true }).waitFor();
      await resolver().getByText('Possible similar record', { exact: true }).waitFor();
      assert.equal(
        await resolver()
          .getByLabel('Add as new physical copy of this edition', { exact: true })
          .count(),
        0,
      );
      await button('Cancel', resolver()).click();
      await resolver().waitFor({ state: 'hidden' });
      await button('Cancel', dialog()).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await saved();
      assert.equal((await snapshot()).books.length, 3);
      const file = join(runDir, 'm2b-import.json');
      await writeFile(
        file,
        JSON.stringify([
          {
            ...first,
            title: 'Imported different title',
            id: '',
            edition_id: '',
            transfer: { edition_key: 'incoming' },
            barcode: 'IMPORT',
            status: 'Paused',
            rating: 2.5,
          },
        ]),
      );
      await nav('Import CSV/JSON');
      await fileChoice('open', file);
      await button('Import CSV/JSON…').click();
      await page.getByRole('heading', { name: 'Review import', exact: true }).waitFor();
      await page.getByLabel(/I reviewed the decisions/).check();
      assert(await button('Confirm import').isDisabled());
      await page
        .getByLabel('Add as new physical copy of this edition', { exact: true })
        .first()
        .check();
      await page.getByLabel(/I reviewed the decisions/).check();
      await button('Confirm import').click();
      state = await until((s) => s.books.length === 4, 'explicit import existing');
      assert(state.books.every((b) => b.title === 'M2B original'));
      assert.equal(state.books.find((b) => b.barcode === 'IMPORT').status, 'Paused');
      await fileChoice('open', file);
      await button('Import CSV/JSON…').click();
      await page.getByLabel('Create a separate edition', { exact: true }).check();
      await page.getByLabel(/I reviewed the decisions/).check();
      await button('Confirm import').click();
      state = await until((s) => s.books.length === 5, 'explicit import separate');
      assert.equal(new Set(state.books.map((b) => b.edition_id)).size, 3);
      await start('9780306406157', 'Explicitly selected title');
      await button('Save book', dialog()).click();
      await resolver().waitFor();
      await resolver()
        .locator('article.panel')
        .filter({ hasText: 'Original publisher' })
        .filter({ has: page.getByText('M2B original', { exact: true }) })
        .getByLabel('Add as new physical copy of this edition', { exact: true })
        .check();
      await resolver()
        .getByLabel('Use incoming value for all copies — Title', { exact: true })
        .check();
      await button('Confirm and save physical copy', resolver()).click();
      await saved();
      state = await until((s) => s.books.length === 6, 'explicit one-field reconciliation');
      const updated = state.books.filter((b) => b.title === 'Explicitly selected title');
      assert(updated.length >= 2);
      assert.equal(new Set(updated.map((b) => b.edition_id)).size, 1);
      assert(updated.every((b) => b.pages === 300 && b.publisher === 'Original publisher'));
      await close();
      await launch();
      assertDomainUnchanged(await snapshot(), state);
    },
  );
  await check(
    'M2-B grouped imports, skip, incoming conflicts, archived target and legacy IPC safety',
    async () => {
      const invoke = (action, payload) =>
        page.evaluate(
          ({ action, payload }) =>
            window.__TAURI_INTERNALS__.invoke('database', { action, payload }),
          { action, payload },
        );
      let state = await snapshot();
      const base = state.books[0];
      const draft = { ...base, id: '', edition_id: '', barcode: '', custom: {}, copy_extra: {} };
      await assert.rejects(invoke('save', draft), /duplicate.required/);
      await assert.rejects(
        invoke('save', { ...draft, id: 'nonexistent-copy' }),
        /no longer exists/,
      );
      await assert.rejects(invoke('import', [draft]), /duplicate.required/);
      assertDomainUnchanged(await snapshot(), state);
      await invoke('save', { ...base, condition: 'Good' });
      assert.equal((await snapshot()).books.find((b) => b.id === base.id).condition, 'Good');
      const file = join(runDir, 'm2b-groups.json');
      const rows = [
        {
          ...draft,
          transfer: { edition_key: 'pair' },
          barcode: 'PAIR-A',
          status: 'Paused',
          rating: 1.5,
        },
        {
          ...draft,
          transfer: { edition_key: 'pair' },
          barcode: 'PAIR-B',
          status: 'Finished',
          rating: 5,
        },
      ];
      const review = async (values) => {
        await writeFile(file, JSON.stringify(values));
        await nav('Import CSV/JSON');
        await fileChoice('open', file);
        await button('Import CSV/JSON…').click();
        await page.getByRole('heading', { name: 'Review import', exact: true }).waitFor();
      };
      const confirm = async () => {
        await page.getByLabel(/I reviewed the decisions/).check();
        await button('Confirm import').click();
        await page.locator('.loading').waitFor({ state: 'hidden' });
      };
      state = await snapshot();
      await review(rows);
      assert(
        (await page
          .getByLabel('Add as new physical copy of this edition', { exact: true })
          .count()) >= 2,
      );
      await page.getByLabel(/I reviewed the decisions/).check();
      assert(await button('Confirm import').isDisabled());
      await page
        .getByLabel('Add as new physical copy of this edition', { exact: true })
        .first()
        .check();
      await confirm();
      let after = await until(
        (s) => s.books.length === state.books.length + 2,
        'group adds two copies',
      );
      const pair = after.books.filter((b) => ['PAIR-A', 'PAIR-B'].includes(b.barcode));
      assert.equal(new Set(pair.map((b) => b.edition_id)).size, 1);
      assert(pair.some((b) => b.rating === 5 && b.status === 'Finished'));
      assert(pair.some((b) => b.rating === 1.5 && b.status === 'Paused'));
      for (const old of state.books)
        assert.deepEqual(
          after.books.find((b) => b.id === old.id),
          old,
        );
      state = after;
      await review(rows.map((b) => ({ ...b, barcode: b.barcode + '-SEPARATE' })));
      await page.getByLabel('Create a separate edition', { exact: true }).check();
      await confirm();
      after = await until(
        (s) => s.books.length === state.books.length + 2,
        'separate group adds one edition',
      );
      const separate = after.books.filter((b) => b.barcode.endsWith('-SEPARATE'));
      assert.equal(new Set(separate.map((b) => b.edition_id)).size, 1);
      assert(!state.books.some((b) => b.edition_id === separate[0].edition_id));
      state = after;
      await review(rows);
      await page.getByLabel('Skip this incoming edition group', { exact: true }).check();
      await page.getByLabel(/I reviewed the decisions/).check();
      assert(await button('Confirm import').isDisabled());
      await button('Back / cancel').click();
      assertDomainUnchanged(await snapshot(), state);
      await review(rows.map((b, i) => ({ ...b, transfer: { edition_key: 'distinct-' + i } })));
      assert.equal(await page.getByText(/The same ISBN also occurs in incoming row/).count(), 2);
      const skips = page.getByLabel('Skip this incoming edition group', { exact: true });
      await skips.nth(0).check();
      await page.getByLabel('Create a separate edition', { exact: true }).nth(1).check();
      await confirm();
      after = await until(
        (s) => s.books.length === state.books.length + 1,
        'one incoming group skipped',
      );
      for (const old of state.books)
        assert.deepEqual(
          after.books.find((b) => b.id === old.id),
          old,
        );
      state = after;
      // Archive every copy of this ISBN in the disposable library, then use visible UI to attach.
      await invoke('trash', { ids: state.books.map((b) => b.id) });
      await button('Add book').click();
      await dialog().getByLabel('Title *', { exact: true }).fill('New copy of archived edition');
      await dialog().getByLabel('ISBN-13', { exact: true }).fill('9780306406157');
      await button('Save book', dialog()).click();
      const resolver = page.getByRole('dialog', {
        name: 'Review edition and physical copy',
        exact: true,
      });
      await resolver.waitFor();
      assert((await resolver.getByText(/\d+ archived/).count()) >= 2);
      assert.equal(await resolver.locator('input:checked').count(), 0);
      await resolver
        .getByLabel('Add as new physical copy of this edition', { exact: true })
        .first()
        .check();
      await button('Confirm and save physical copy', resolver).click();
      await saved();
      after = await until((s) => s.books.length === 1, 'active copy of archived edition');
      assert(state.books.some((b) => b.edition_id === after.books[0].edition_id));
      const archived = await invoke('snapshot', { query: '', trash: true });
      assert.equal(archived.books.length, state.books.length);
      await close();
      await launch();
      assertDomainUnchanged(await snapshot(), after);
    },
  );

  await check('M2-C focused wedge input, batch queue and fresh duplicate decisions', async () => {
    await close();
    dataDir = join(runDir, 'm2c-library');
    await launch();
    await page.evaluate(() => {
      window.__scannerMetadataCalls = [];
      const original = window.fetch.bind(window);
      window.fetch = (url, options) => {
        const command = decodeURIComponent(String(url)).replace('http://ipc.localhost/', '');
        if (['isbn_lookup', 'google_books_lookup', 'isbn_cover'].includes(command)) {
          window.__scannerMetadataCalls.push(command);
          return Promise.resolve(
            new Response(JSON.stringify('metadata.unavailable'), {
              headers: { 'Content-Type': 'application/json', 'Tauri-Response': 'error' },
            }),
          );
        }
        return original(url, options);
      };
    });
    const scan = () => page.getByRole('dialog', { name: 'Scan books', exact: true });
    const input = () => scan().getByLabel('Scanner input', { exact: true });
    const rows = () => scan().locator('.scan-queue > li');
    const focused = async (control) => {
      // Focus is scheduled after native dialog opening / prior dialog cleanup.
      for (let i = 0; i < 20; i++) {
        if (await control.evaluate((el) => document.activeElement === el)) return;
        await sleep(50);
      }
      assert.fail('Expected control to receive focus after dialog transition');
    };
    const accept = async (raw, suffix = 'Enter') => {
      await input().focus();
      await input().pressSequentially(raw);
      await input().press(suffix);
    };
    await button('Scan books').click();
    await focused(input());
    await input().press('Enter');
    assert.equal(await rows().count(), 0);
    await input().press('Tab');
    assert(!(await input().evaluate((el) => document.activeElement === el)));
    await scan().getByLabel('Batch', { exact: true }).check();
    await accept(']E00306406152');
    assert.equal(await rows().count(), 1);
    assert.equal(await input().inputValue(), '');
    await focused(input());
    await accept('9780306406157');
    await accept('9780306406157');
    assert.equal(await rows().count(), 3);
    assert.equal(
      await scan()
        .getByText(/Repeated ISBN/)
        .count(),
      3,
    );
    await accept('036000291452');
    assert.equal(await rows().count(), 4);
    assert(await button('Review & add', rows().nth(3)).isDisabled());
    await button('Remove scan', rows().nth(3)).click();
    await accept('4006381333931');
    assert(await button('Review & add', rows().nth(3)).isDisabled());
    await button('Remove scan', rows().nth(3)).click();
    assert.equal((await snapshot()).books.length, 0);
    // No scanner collector reacts to typing in another focused control.
    await button('Review & add', rows().nth(0)).click();
    const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
    await editor.waitFor();
    assert.equal(await scan().getByLabel('Scanner input', { exact: true }).count(), 0);
    assert.equal(await editor.getByLabel('ISBN-13', { exact: true }).inputValue(), '9780306406157');
    assert.equal(await editor.getByLabel('ISBN-10', { exact: true }).inputValue(), '0306406152');
    await button('Cancel', editor).click();
    await editor.waitFor({ state: 'hidden' });
    assert.equal(await rows().count(), 3);
    await focused(input());
    await button('Review & add', rows().nth(0)).click();
    await editor.getByLabel('Title *', { exact: true }).fill('M2C first edition');
    await button('Save book', editor).click();
    await editor.waitFor({ state: 'hidden' });
    let state = await until((s) => s.books.length === 1, 'first scan saved');
    const original = state.books[0];
    assert.equal(await rows().nth(0).getByText('Added to library', { exact: true }).count(), 1);
    await focused(input());
    // A repeated scan now sees the freshly created edition through the real backend.
    await button('Review & add', rows().nth(1)).click();
    await editor.getByLabel('Title *', { exact: true }).fill('M2C incoming copy');
    await button('Save book', editor).click();
    const resolver = page.getByRole('dialog', {
      name: 'Review edition and physical copy',
      exact: true,
    });
    await resolver.waitFor();
    assert.equal((await snapshot()).books.length, 1);
    assert.equal(await resolver.locator('input:checked').count(), 0);
    await resolver.getByLabel('Add as new physical copy of this edition', { exact: true }).check();
    await button('Confirm and save physical copy', resolver).click();
    await editor.waitFor({ state: 'hidden' });
    state = await until((s) => s.books.length === 2, 'second scan attached explicitly');
    assert(state.books.every((b) => b.edition_id === original.edition_id));
    assert.deepEqual(
      state.books.find((b) => b.id === original.id),
      original,
    );
    await button('Review & add', rows().nth(2)).click();
    await editor.getByLabel('Title *', { exact: true }).fill('M2C separate edition');
    await button('Save book', editor).click();
    await resolver.waitFor();
    await resolver.getByLabel('Create a separate edition', { exact: true }).check();
    await button('Confirm and save physical copy', resolver).click();
    await editor.waitFor({ state: 'hidden' });
    state = await until((s) => s.books.length === 3, 'third scan separate');
    assert.equal(new Set(state.books.map((b) => b.edition_id)).size, 2);
    await accept('9791090636071');
    await button('Review & add', rows().nth(3)).click();
    assert.equal(await editor.getByLabel('ISBN-10', { exact: true }).inputValue(), '');
    await button('Cancel', editor).click();
    await editor.waitFor({ state: 'hidden' });
    await input().press('Escape');
    const confirmation = page.getByRole('dialog', { name: 'Please confirm', exact: true });
    await confirmation.waitFor();
    await focused(button('Cancel', confirmation));
    await button('Cancel', confirmation).click();
    assert.equal(await rows().count(), 4);
    await button('Close scanning', scan()).click();
    await button('Continue', confirmation).click();
    await scan().waitFor({ state: 'hidden' });
    await focused(button('Scan books'));
    assert.deepEqual(await page.evaluate(() => window.__scannerMetadataCalls), []);
    assertDomainUnchanged(await snapshot(), state);
  });
  await check(
    'M2-C suffix persistence, single seeds, bounded paste and copy barcode fields',
    async () => {
      const scan = () => page.getByRole('dialog', { name: 'Scan books', exact: true });
      await nav('Settings');
      await page.getByLabel('Scanner terminator', { exact: true }).selectOption('tab');
      await until(
        (s) => s.settings.some((p) => p.key === 'scanner_terminator' && p.value === 'tab'),
        'tab setting',
      );
      await close();
      await launch();
      await button('Scan books').click();
      let input = scan().getByLabel('Scanner input', { exact: true });
      await input.fill(']C19791090636071');
      await input.press('Enter');
      assert.equal(await scan().locator('.scan-queue > li').count(), 0);
      await input.press('Tab');
      assert.equal(await scan().locator('.scan-queue > li').count(), 1);
      await button('Review & add', scan()).click();
      const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
      assert.equal(
        await editor.getByLabel('ISBN-13', { exact: true }).inputValue(),
        '9791090636071',
      );
      assert.equal(await editor.getByLabel('ISBN-10', { exact: true }).inputValue(), '');
      await button('Location', editor).click();
      await button('Scan copy barcode', editor).click();
      const barcode = page.getByRole('dialog', { name: 'Scan copy barcode', exact: true });
      await barcode.getByLabel('Scanner input', { exact: true }).fill(']C1COPY-M2C');
      await barcode.getByLabel('Scanner input', { exact: true }).press('Tab');
      await barcode.waitFor({ state: 'hidden' });
      assert.equal(
        await editor.getByLabel('Barcode / copy identifier', { exact: true }).inputValue(),
        'COPY-M2C',
      );
      await button('General', editor).click();
      await editor.getByLabel('Title *', { exact: true }).fill('M2C barcode edition');
      await button('Save book', editor).click();
      await editor.waitFor({ state: 'hidden' });
      await button('Close scanning', scan()).click();
      await nav('Library');
      await page.locator('.book-title').filter({ hasText: 'M2C barcode edition' }).click();
      await button('Edit physical copy').click();
      const copyEditor = dialog();
      await button('Scan copy barcode', copyEditor).click();
      const before = await snapshot();
      await barcode.getByLabel('Scanner input', { exact: true }).fill(']E0COPY-EDITED');
      await barcode.getByLabel('Scanner input', { exact: true }).press('Tab');
      await barcode.waitFor({ state: 'hidden' });
      assert.equal(
        await copyEditor.getByLabel('Barcode', { exact: true }).inputValue(),
        'COPY-EDITED',
      );
      assertDomainUnchanged(await snapshot(), before);
      await button('Save physical copy', copyEditor).click();
      await copyEditor.waitFor({ state: 'hidden' });
      const after = await until(
        (s) => s.books.some((b) => b.barcode === 'COPY-EDITED'),
        'barcode save',
      );
      const old = before.books.find((b) => b.barcode === 'COPY-M2C');
      const updated = after.books.find((b) => b.id === old.id);
      assert.equal(updated.edition_id, old.edition_id);
      assert.equal(updated.isbn13, old.isbn13);
      await nav('Settings');
      await page.getByLabel('Scanner terminator', { exact: true }).selectOption('either');
      await until(
        (s) => s.settings.some((p) => p.key === 'scanner_terminator' && p.value === 'either'),
        'either setting',
      );
      await button('Scan books').click();
      await scan().getByLabel('Batch', { exact: true }).check();
      input = scan().getByLabel('Scanner input', { exact: true });
      // Explicit paste event, no clipboard monitoring. Overlength valid-prefix pastes must reject.
      const paste = async (text) =>
        input.evaluate((el, text) => {
          const data = new window.DataTransfer();
          data.setData('text/plain', text);
          el.dispatchEvent(
            new window.ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: data,
            }),
          );
        }, text);
      await paste('9780306406157' + ' '.repeat(500));
      await input.press('Enter');
      assert(await button('Review & add', scan().locator('.scan-queue > li').nth(0)).isDisabled());
      await paste(']E00306406152\r\n');
      await input.press('Tab');
      assert.equal(await scan().locator('.scan-queue > li').count(), 2);
      assert(
        !(await button('Review & add', scan().locator('.scan-queue > li').nth(1)).isDisabled()),
      );
      await page.setViewportSize({ width: 900, height: 760 });
      assert(await scan().evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
      await page.screenshot({ path: join(runDir, 'scanner-batch.png'), animations: 'disabled' });
      await button('Close scanning', scan()).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await page.setViewportSize({ width: 1400, height: 950 });
      const persisted = await snapshot();
      await close();
      await launch();
      assertDomainUnchanged(await snapshot(), persisted);
    },
  );

  await check(
    'M2-C copy collision stays copy-level and Turkish scanner labels resolve',
    async () => {
      const before = await snapshot();
      await button('Add book').click();
      const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
      await editor
        .getByLabel('Title *', { exact: true })
        .pressSequentially('M2C barcode collision only');
      await button('Location', editor).click();
      await button('Scan copy barcode', editor).click();
      const barcode = page.getByRole('dialog', { name: 'Scan copy barcode', exact: true });
      await barcode.getByLabel('Scanner input', { exact: true }).fill(']C1COPY-EDITED');
      await barcode.getByLabel('Scanner input', { exact: true }).press('Enter');
      await barcode.waitFor({ state: 'hidden' });
      await button('General', editor).click();
      assert.equal(await editor.getByLabel('ISBN-13', { exact: true }).inputValue(), '');
      assert.equal(await editor.getByLabel('ISBN-10', { exact: true }).inputValue(), '');
      await button('Save book', editor).click();
      const resolver = page.getByRole('dialog', {
        name: 'Review edition and physical copy',
        exact: true,
      });
      await resolver.waitFor();
      await resolver.getByText('Physical copy identifier collision', { exact: true }).waitFor();
      assert.equal(
        await resolver
          .getByLabel('Add as new physical copy of this edition', { exact: true })
          .count(),
        0,
      );
      assertDomainUnchanged(await snapshot(), before);
      await button('Cancel', resolver).click();
      await button('Cancel', editor).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await editor.waitFor({ state: 'hidden' });
      assertDomainUnchanged(await snapshot(), before);
      await nav('Settings');
      await page.getByLabel('Application language', { exact: true }).selectOption('tr');
      await page.getByRole('heading', { name: 'Ayarlar', exact: true }).waitFor();
      await button('Kitap tara').click();
      const scan = page.getByRole('dialog', { name: 'Kitap tara', exact: true });
      await scan.getByLabel('Tarayıcı girişi', { exact: true }).fill('0306406152');
      await scan.getByLabel('Tarayıcı girişi', { exact: true }).press('Enter');
      await button('İncele ve ekle', scan).waitFor();
      assert(!(await scan.innerText()).includes('scanner.'));
      await button('Taramayı kapat', scan).click();
      await button(
        'Devam',
        page.getByRole('dialog', { name: 'Lütfen onaylayın', exact: true }),
      ).click();
      await scan.waitFor({ state: 'hidden' });
      await page.getByLabel('Uygulama dili', { exact: true }).selectOption('en');
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
      assertDomainUnchanged(await snapshot(), before);
    },
  );

  await check('M2-D packaged local WASM, explicit capture and draft-only ISBN queue', async () => {
    await close();
    dataDir = join(runDir, 'm2d-library');
    await launch();
    report.cameraEnvironment = await page.evaluate(() => ({
      secure: window.isSecureContext,
      mediaDevices: !!navigator.mediaDevices?.getUserMedia,
    }));
    assert.equal(report.cameraEnvironment.secure, true);
    assert.equal(report.cameraEnvironment.mediaDevices, true);
    const localAssets = [];
    page.context().on('response', (response) => {
      if (/cameraDecoder\.worker-|zxing_reader-/.test(response.url()))
        localAssets.push({ url: response.url(), status: response.status() });
    });
    await page.evaluate(() => {
      window.__cameraTest = {
        mode: 'valid',
        calls: 0,
        stopped: 0,
        commands: [],
        pending: null,
        image: null,
      };
      Object.defineProperty(window, 'BarcodeDetector', { configurable: true, value: undefined });
      const invoke = window.__TAURI_INTERNALS__.invoke;
      window.__TAURI_INTERNALS__.invoke = (command, args, options) => {
        window.__cameraTest.commands.push({ command, action: args?.action });
        return invoke(command, args, options);
      };
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (constraints.audio !== false) throw new Error('Camera must not request audio');
        const test = window.__cameraTest;
        test.calls++;
        if (test.mode === 'denied') throw new DOMException('synthetic denial', 'NotAllowedError');
        if (test.mode === 'pending')
          await new Promise((resolve) => {
            test.pending = resolve;
          });
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 180;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, 360, 180);
        if (test.mode !== 'blank' && test.image) {
          canvas.width = test.image.width;
          canvas.height = test.image.height;
          context.putImageData(
            new window.ImageData(
              new Uint8ClampedArray(test.image.data),
              canvas.width,
              canvas.height,
            ),
            0,
            0,
          );
        }
        const stream = canvas.captureStream(5);
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            test.stopped++;
            stop();
          };
        }
        return stream;
      };
    });
    const image = ean13Image('9780306406157');
    await page.evaluate(
      (image) => {
        window.__cameraTest.image = image;
      },
      { ...image, data: Array.from(image.data) },
    );
    await button('Scan books').click();
    const scan = page.getByRole('dialog', { name: 'Scan books', exact: true });
    await scan.getByLabel('Batch', { exact: true }).check();
    assert.equal(await page.evaluate(() => window.__cameraTest.calls), 0);
    const before = await snapshot();
    await button('Scan with camera', scan).click();
    await scan.locator('.scan-queue > li').getByText('9780306406157', { exact: true }).waitFor();
    assert.equal(
      await page.getByRole('dialog', { name: 'Scan a book ISBN with camera', exact: true }).count(),
      0,
    );
    assert.equal(await page.evaluate(() => window.__cameraTest.stopped), 1);
    assertDomainUnchanged(await snapshot(), before);
    await button('Scan with camera', scan).click();
    await page.waitForFunction(() => document.querySelectorAll('.scan-queue > li').length === 2);
    assert.equal(await page.evaluate(() => window.__cameraTest.stopped), 2);
    assertDomainUnchanged(await snapshot(), before);
    assert(
      localAssets.some((asset) => asset.url.endsWith('.wasm') && asset.status === 200),
      'Packaged local WASM was loaded',
    );
    assert(localAssets.every((asset) => asset.url.startsWith('http://tauri.localhost/')));
    report.cameraAssets = localAssets;
    assert(
      !(await page.evaluate(() => window.__cameraTest.commands)).some(
        (c) =>
          ['isbn_lookup', 'google_books_lookup', 'isbn_cover'].includes(c.command) ||
          ['save', 'create_decided'].includes(c.action),
      ),
    );
    // Make library state change AFTER scanning; Save must discover this current Edition.
    await page.evaluate(() =>
      window.__TAURI_INTERNALS__.invoke('database', {
        action: 'create_decided',
        payload: {
          book: {
            title: 'M2D current Edition',
            isbn13: '9780306406157',
            contributors: [],
            terms: {},
            extra: {},
            copy_extra: {},
            custom: {},
            status: 'Unread',
          },
          decision: null,
        },
      }),
    );
    await scan
      .locator('.scan-queue > li')
      .first()
      .getByRole('button', { name: 'Review & add', exact: true })
      .click();
    const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
    await editor.getByLabel('Title *', { exact: true }).fill('M2D camera draft');
    await button('Save book', editor).click();
    const resolver = page.getByRole('dialog', {
      name: 'Review edition and physical copy',
      exact: true,
    });
    await resolver.getByText('M2D current Edition', { exact: true }).waitFor();
    assert.equal((await snapshot()).books.length, 1);
    await button('Cancel', resolver).click();
    await button('Cancel', editor).click();
    await button(
      'Continue',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    await editor.waitFor({ state: 'hidden' });
    await button('Close scanning', scan).click();
    await button(
      'Continue',
      page.getByRole('dialog', { name: 'Please confirm', exact: true }),
    ).click();
    await scan.waitFor({ state: 'hidden' });
  });
  await check(
    'M2-D denial, pending cancellation, invalid barcode, focus and Turkish UI',
    async () => {
      await button('Scan books').click();
      const scan = page.getByRole('dialog', { name: 'Scan books', exact: true });
      const camera = () =>
        page.getByRole('dialog', { name: 'Scan a book ISBN with camera', exact: true });
      const open = button('Scan with camera', scan);
      await page.evaluate(() => {
        window.__cameraTest.mode = 'denied';
      });
      await open.click();
      await camera()
        .getByText('Camera permission was denied. Check camera privacy settings, then retry.', {
          exact: true,
        })
        .waitFor();
      await button('Cancel camera', camera()).click();
      await camera().waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.textContent === 'Scan with camera');
      await page.evaluate(() => {
        window.__cameraTest.mode = 'pending';
      });
      await open.click();
      await camera().getByText('Waiting for camera permission…', { exact: true }).waitFor();
      await page.waitForFunction(() => !!window.__cameraTest.pending);
      await page.keyboard.press('Escape');
      await camera().waitFor({ state: 'hidden' });
      const stopped = await page.evaluate(() => window.__cameraTest.stopped);
      await page.evaluate(() => {
        window.__cameraTest.mode = 'blank';
        window.__cameraTest.pending();
      });
      await page.waitForFunction((count) => window.__cameraTest.stopped === count + 1, stopped);
      const nonbook = ean13Image('4006381333931');
      await page.evaluate(
        (image) => {
          window.__cameraTest.mode = 'valid';
          window.__cameraTest.image = image;
        },
        { ...nonbook, data: Array.from(nonbook.data) },
      );
      await open.click();
      await camera()
        .getByText('This is not a supported book ISBN. Try a 978 or 979 book barcode.', {
          exact: true,
        })
        .waitFor();
      assert.equal(await scan.locator('.scan-queue > li').count(), 0);
      const invalidStopped = await page.evaluate(() => window.__cameraTest.stopped);
      await button('Cancel camera', camera()).click();
      assert.equal(await page.evaluate(() => window.__cameraTest.stopped), invalidStopped + 1);
      const book979 = ean13Image('9791090636071');
      await page.evaluate(
        (image) => {
          window.__cameraTest.image = image;
        },
        {
          ...book979,
          data: Array.from(book979.data),
        },
      );
      await open.click();
      await scan.getByText('9791090636071', { exact: true }).waitFor();
      await page.waitForFunction(() => document.activeElement?.textContent === 'Review & add');
      assert.equal((await snapshot()).books.length, 1, 'Single camera result is not saved');
      await button('Close scanning', scan).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await scan.waitFor({ state: 'hidden' });
      await nav('Settings');
      await page.getByLabel('Application language', { exact: true }).selectOption('tr');
      await page.getByRole('heading', { name: 'Ayarlar', exact: true }).waitFor();
      await button('Kitap tara').click();
      const turkish = page.getByRole('dialog', { name: 'Kitap tara', exact: true });
      await page.evaluate(() => {
        window.__cameraTest.mode = 'blank';
      });
      await button('Kamerayla tara', turkish).click();
      const camTr = page.getByRole('dialog', {
        name: 'Kitap ISBN’sini kamerayla tara',
        exact: true,
      });
      await camTr
        .getByText('Kamerayı bir kitabın EAN-13 barkoduna doğrultun.', { exact: true })
        .waitFor();
      await camTr.getByLabel('Canlı kamera önizlemesi', { exact: true }).waitFor();
      assert(!(await camTr.innerText()).includes('camera.'));
      await button('Kamerayı iptal et', camTr).click();
      await button('Taramayı kapat', turkish).click();
      await page.getByLabel('Uygulama dili', { exact: true }).selectOption('en');
      await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
      assert(
        !(await page.evaluate(() => window.__cameraTest.commands)).some((c) =>
          ['isbn_lookup', 'google_books_lookup', 'isbn_cover'].includes(c.command),
        ),
      );
    },
  );
  await check(
    'M2-F opt-in camera lookup follows capture cleanup and preserves cancellation',
    async () => {
      await nav('Dashboard');
      await page.evaluate(() => {
        window.__scanLookup = { calls: [], mode: 'both', pending: [] };
        // Native Tauri defines invoke as non-writable; intercept its IPC transport instead.
        window.__scanOriginalFetch = window.fetch.bind(window);
        window.fetch = async (url, options) => {
          const command = decodeURIComponent(String(url)).replace('http://ipc.localhost/', '');
          if (!['isbn_lookup', 'google_books_lookup'].includes(command))
            return window.__scanOriginalFetch(url, options);
          const args = JSON.parse(options.body);
          const test = window.__scanLookup;
          test.calls.push({
            command,
            isbn: args.isbn,
            cameraOpen: !!document.querySelector('video'),
            stopped: window.__cameraTest.stopped,
          });
          if (test.mode === 'delayed') await new Promise((resolve) => test.pending.push(resolve));
          const failed =
            test.mode === 'offline' ||
            (test.mode === 'partial' && command === 'google_books_lookup');
          // Native 429 maps to this stable error, not raw JSON.
          const value = failed
            ? 'metadata.unavailable'
            : command === 'isbn_lookup'
              ? { title: 'M2F synthetic ' + args.isbn, subjects: [{ name: 'Fiction' }] }
              : {
                  items: [
                    {
                      volumeInfo: {
                        title: 'M2F Google',
                        industryIdentifiers: [{ type: 'ISBN_13', identifier: args.isbn }],
                      },
                    },
                  ],
                };
          return new Response(JSON.stringify(value), {
            headers: {
              'Content-Type': 'application/json',
              'Tauri-Response': failed ? 'error' : 'ok',
            },
          });
        };
        window.__cameraTest.mode = 'valid';
      });
      const before = await snapshot();
      await button('Scan books').click();
      const scan = page.getByRole('dialog', { name: 'Scan books', exact: true });
      assert(await scan.getByLabel('Scan ISBN only', { exact: true }).isChecked());
      await scan.getByLabel('Scan and look up book details', { exact: true }).focus();
      await page.keyboard.press('Space');
      const stopped = await page.evaluate(() => window.__cameraTest.stopped);
      await button('Scan with camera', scan).click();
      const preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
      await preview.waitFor();
      const calls = await page.evaluate(() => window.__scanLookup.calls);
      assert.equal(calls.length, 2);
      assert(calls.every((c) => !c.cameraOpen && c.stopped > stopped));
      assert.equal(await scan.locator('.scan-queue > li').count(), 1);
      assert(await scan.getByLabel('Scan ISBN only', { exact: true }).isDisabled());
      const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
      assert.equal(await editor.getByLabel('Title *', { exact: true }).inputValue(), '');
      assert.equal(await editor.getByLabel('ISBN-10', { exact: true }).inputValue(), '');
      await button('Cancel', preview).click();
      await button('Cancel', editor).click();
      await editor.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.textContent === 'Review & add');
      assert.equal(await scan.getByText('Ready for review', { exact: true }).count(), 1);
      assertDomainUnchanged(await snapshot(), before);
      await button('Remove scan', scan).click();
      await page.evaluate(() => {
        window.__cameraTest.mode = 'blank';
      });
      await button('Scan with camera', scan).click();
      const camera = page.getByRole('dialog', {
        name: 'Scan a book ISBN with camera',
        exact: true,
      });
      await button('Cancel camera', camera).click();
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 2);
      await button('Close scanning', scan).click();
    },
  );
  await check(
    'M2-F USB single opt-in, 979, partial failure, retry and section remount',
    async () => {
      await page.evaluate(() => {
        window.__scanLookup.calls = [];
        window.__scanLookup.mode = 'partial';
      });
      const before = await snapshot();
      await button('Scan books').click();
      const scan = page.getByRole('dialog', { name: 'Scan books', exact: true });
      await scan.getByLabel('Scan and look up book details', { exact: true }).check();
      const input = scan.getByLabel('Scanner input', { exact: true });
      for (const value of ['9780306406158', '4006381333931']) {
        await input.fill(value);
        await input.press('Enter');
        assert(await button('Review & add', scan).isDisabled());
        assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 0);
        await button('Remove scan', scan).click();
      }
      await input.fill('9791090636071');
      await input.press('Enter');
      const preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
      const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
      await preview.waitFor();
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 2);
      assert.equal(await editor.getByLabel('ISBN-10', { exact: true }).inputValue(), '');
      await button('Cancel', preview).click();
      await button('Publication', editor).click();
      await button('General', editor).click();
      await sleep(100);
      assert.equal(await preview.count(), 0);
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 2);
      await editor.getByLabel('Title *', { exact: true }).fill('Manual M2F protected');
      await button('Look up ISBN online…', editor).click();
      await preview.waitFor();
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 4);
      await button('Cancel', preview).click();
      assert.equal(
        await editor.getByLabel('Title *', { exact: true }).inputValue(),
        'Manual M2F protected',
      );
      await button('Cancel', editor).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await editor.waitFor({ state: 'hidden' });
      assertDomainUnchanged(await snapshot(), before);
      await button('Remove scan', scan).click();
      await button('Close scanning', scan).click();
    },
  );
  await check(
    'M2-F batch is offline until review; repeated rows, latest duplicates and delayed dismissal',
    async () => {
      await page.evaluate(() => {
        window.__scanLookup.calls = [];
        window.__scanLookup.mode = 'both';
      });
      const before = await snapshot();
      await button('Scan books').click();
      const scan = page.getByRole('dialog', { name: 'Scan books', exact: true });
      await scan.getByLabel('Batch', { exact: true }).check();
      await scan.getByLabel('Scan and look up book details', { exact: true }).check();
      const input = scan.getByLabel('Scanner input', { exact: true });
      for (const value of ['9791090636071', '9791090636071', '4006381333931']) {
        await input.fill(value);
        await input.press('Enter');
      }
      const rows = scan.locator('.scan-queue > li');
      assert.equal(await rows.count(), 3);
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 0);
      const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
      const preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
      await button('Review & add', rows.nth(0)).click();
      await preview.waitFor();
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 2);
      await preview
        .getByRole('group', { name: 'Title', exact: true })
        .getByRole('radio', { name: /Open Library/ })
        .check();
      await button('Apply selected fields', preview).click();
      assertDomainUnchanged(await snapshot(), before);
      await button('Save book', editor).click();
      await editor.waitFor({ state: 'hidden' });
      const saved = await until(
        (s) => s.books.length === before.books.length + 1,
        'M2F explicit Save',
      );
      assert.equal(await rows.nth(0).getByText('Added to library', { exact: true }).count(), 1);
      assert.equal(await rows.nth(1).getByText('Ready for review', { exact: true }).count(), 1);
      await button('Review & add', rows.nth(1)).click();
      await preview.waitFor();
      assert.equal(await page.evaluate(() => window.__scanLookup.calls.length), 4);
      await button('Apply selected fields', preview).click();
      await button('Save book', editor).click();
      const resolver = page.getByRole('dialog', {
        name: 'Review edition and physical copy',
        exact: true,
      });
      await resolver.waitFor();
      assert.equal(await resolver.locator('input:checked').count(), 0);
      assert.equal((await snapshot()).books.length, saved.books.length);
      await button('Cancel', resolver).click();
      await button('Cancel', editor).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await editor.waitFor({ state: 'hidden' });
      await page.evaluate(() => {
        window.__scanLookup.mode = 'delayed';
      });
      await button('Review & add', rows.nth(1)).click();
      await page.waitForFunction(() => window.__scanLookup.pending.length === 2);
      assert(await button('Save book', editor).isDisabled());
      await button('Cancel', editor).click();
      await editor.waitFor({ state: 'hidden' });
      await page.evaluate(() => {
        window.__scanLookup.pending.splice(0).forEach((resolve) => resolve());
      });
      await sleep(150);
      assert.equal(await preview.count(), 0);
      assert.equal(await editor.count(), 0);
      assertDomainUnchanged(await snapshot(), saved);
      await page.evaluate(() => {
        window.__scanLookup.mode = 'offline';
      });
      await button('Review & add', rows.nth(1)).click();
      await preview.waitFor();
      await button('Cancel', preview).click();
      assert(!(await button('Save book', editor).isDisabled()));
      await editor
        .getByLabel('Title *', { exact: true })
        .fill('Manual despite unavailable providers');
      await button('Cancel', editor).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await editor.waitFor({ state: 'hidden' });
      assert.equal(await rows.nth(1).getByText('Ready for review', { exact: true }).count(), 1);
      await button('Close scanning', scan).click();
      await button(
        'Continue',
        page.getByRole('dialog', { name: 'Please confirm', exact: true }),
      ).click();
      await scan.waitFor({ state: 'hidden' });
      await nav('Settings');
      await page.getByLabel('Application language', { exact: true }).selectOption('tr');
      await button('Kitap tara').click();
      const tr = page.getByRole('dialog', { name: 'Kitap tara', exact: true });
      assert(await tr.getByLabel('Yalnız ISBN tara', { exact: true }).isChecked());
      await tr.getByLabel('Tara ve kitap bilgilerini ara', { exact: true }).focus();
      await page.keyboard.press('Space');
      assert(await tr.getByLabel('Tara ve kitap bilgilerini ara', { exact: true }).isChecked());
      await button('Taramayı kapat', tr).click();
      await page.getByLabel('Uygulama dili', { exact: true }).selectOption('en');
      assertDomainUnchanged(await snapshot(), saved);
    },
  );
  // Release this fixture before the existing M2-E fetch-level provider fixture.
  await page.evaluate(() => {
    if (window.__scanOriginalFetch) window.fetch = window.__scanOriginalFetch;
  });
  await check(
    'M2-E selected series and genres persist only after separate Save and survive restart',
    async () => {
      await nav('Dashboard');
      const before = await snapshot();
      await page.evaluate(() => {
        window.__enrichmentFetch = window.fetch.bind(window);
        window.fetch = async (url, options) => {
          const command = decodeURIComponent(String(url)).replace('http://ipc.localhost/', '');
          if (['isbn_lookup', 'google_books_lookup'].includes(command)) {
            const value =
              command === 'isbn_lookup'
                ? { subjects: [{ name: '[series:Persistence cycle]' }, { name: 'Poetry' }] }
                : { items: [] };
            return new Response(JSON.stringify(value), {
              headers: { 'Content-Type': 'application/json', 'Tauri-Response': 'ok' },
            });
          }
          return window.__enrichmentFetch(url, options);
        };
      });
      await button('Quick add').click();
      const editor = page.getByRole('dialog', { name: 'Quick add', exact: true });
      await editor.getByLabel('Title *', { exact: true }).fill('M2E synthetic persistence');
      await editor.getByLabel('Genres (separate with ;)', { exact: true }).fill('Manual genre');
      await editor.getByLabel('ISBN-13', { exact: true }).fill('9791090636071');
      await button('Look up ISBN online…', editor).click();
      const preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
      await preview.getByRole('radio', { name: 'Persistence cycle', exact: true }).check();
      await preview.getByRole('checkbox', { name: 'Poetry', exact: true }).check();
      await button('Apply selected fields', preview).click();
      assertDomainUnchanged(await snapshot(), before);
      await editor.getByLabel('ISBN-13', { exact: true }).fill('');
      await button('Save book', editor).click();
      await editor.waitFor({ state: 'hidden' });
      const saved = (await snapshot()).books.find((b) => b.title === 'M2E synthetic persistence');
      assert(saved);
      assert.equal(saved.series, 'Persistence cycle');
      assert.equal(saved.series_order, null);
      assert.deepEqual(saved.terms.genre, ['Manual genre', 'Poetry']);
      assert(saved.id && saved.edition_id);
      await close();
      await launch();
      const restored = (await snapshot()).books.find((b) => b.id === saved.id);
      assert.equal(restored.series, saved.series);
      assert.equal(restored.series_order, null);
      assert.deepEqual(restored.terms.genre, saved.terms.genre);
      assert.equal(restored.edition_id, saved.edition_id);
    },
  );
  assert.deepEqual(report.errors, [], 'No frontend runtime errors');
  assert.deepEqual(report.network, [], 'Core workflows must not make network requests');
  assert.equal(
    report.blockedNativeRequests,
    report.nativeGuardVerified ? 2 : 0,
    'Unexpected native HTTP outside guard self-test',
  );
  report.passed = true;
  report.executableSha256 = createHash('sha256')
    .update(await readFile(exe))
    .digest('hex');
  console.log(`PASS all desktop checks; report: ${join(runDir, 'report.json')}`);
} catch (error) {
  report.passed = false;
  report.failure = error.stack || String(error);
  console.error(report.failure);
  if (page) {
    report.visibleText = await page
      .locator('body')
      .innerText()
      .catch(() => '<unavailable>');
    await page
      .screenshot({ animations: 'disabled', path: join(runDir, 'failure.png') })
      .catch(() => {});
  }
  process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString();
  await writeFile(join(runDir, 'report.json'), JSON.stringify(report, null, 2));
  await close();
  await new Promise((resolve) => nativeGuard.close(resolve));
  console.log(`Verification artifacts: ${runDir}`);
}
