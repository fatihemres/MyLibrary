/* global window, document */
// End-to-end checks against the real Windows executable and Rust/SQLite backend.
// Only OS file pickers are substituted with deterministic paths in the isolated test folder.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';

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
};
let processHandle, browser, page;
const acceptDialogs = true;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function check(name, fn) {
  await fn();
  report.checks.push(name);
  console.log(`PASS ${name}`);
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
async function launch() {
  const port = await freePort();
  processHandle = spawn(exe, [], {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
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
  await page.getByRole('heading', { name: 'Your library, at a glance.' }).waitFor();
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
    await page.screenshot({ path: join(runDir, 'dashboard-navigation.png') });
  });
  await check('hierarchical rooms, bookcases, shelves and renaming through UI', async () => {
    await button('Toggle sidebar').click();
    const layout = await page.context().newCDPSession(page);
    await layout.send('Emulation.setDeviceMetricsOverride', {
      width: 900,
      height: 620,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert(await button('Locations', page.locator('.topbar')).isVisible());
    const locationButton = await button('Locations', page.locator('.topbar')).boundingBox();
    assert(locationButton.x >= 0 && locationButton.x + locationButton.width <= 900);
    await button('Locations', page.locator('.topbar')).click();
    await page
      .getByText('No locations yet. Create your first room with Add Room above.', { exact: true })
      .waitFor();
    await page.screenshot({ path: join(runDir, 'locations-empty.png') });
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
    await page.screenshot({ path: join(runDir, 'locations-hierarchy.png') });
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
      await page.screenshot({ path: join(runDir, 'copy-location-assignment.png') });
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
      await page.screenshot({ path: join(runDir, 'physical-copies.png') });
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
    assert.equal(await page.locator('tbody tr').count(), 2);
    await page.getByLabel('Sort books').selectOption('author');
    await button('Filters').click();
    await page.getByLabel(/^Author/).selectOption('Verification Author');
    await page.getByLabel(/^Reading status/).selectOption('Reading');
    assert.equal(await page.locator('tbody tr').count(), 1);
    await button('Reset').click();
    await page.getByLabel('Search entire library').fill('quotation');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1);
    await page.getByLabel('Search entire library').fill('');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 2);
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
      await page.getByLabel(/Import 2 valid rows/).check();
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
      await page.getByLabel(/Import 2 valid rows/).check();
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
    await page.getByText(/2 rows · 1 invalid/).waitFor();
    await page.getByLabel(/Import 1 valid rows/).check();
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
    await page.screenshot({ path: join(runDir, 'settings-dark.png') });
    await nav('Library');
    await page.screenshot({ path: join(runDir, 'library-dark.png') });
    const placeholder = page.locator('.cover span').filter({ hasText: 'Verification Imported' });
    assert(
      await placeholder.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      'Placeholder title must wrap within its cover',
    );
  });
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
    await page.screenshot({ path: join(runDir, 'library-after-restart.png') });
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
      await page.screenshot({ path: join(runDir, 'inline-location-creation.png') });
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
  assert.deepEqual(report.errors, [], 'No frontend runtime errors');
  assert.deepEqual(report.network, [], 'Core workflows must not make network requests');
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
    await page.screenshot({ path: join(runDir, 'failure.png') }).catch(() => {});
  }
  process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString();
  await writeFile(join(runDir, 'report.json'), JSON.stringify(report, null, 2));
  await close();
  console.log(`Verification artifacts: ${runDir}`);
}
