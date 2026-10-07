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
const dataDir = join(runDir, 'library');
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
  });
  await check('hierarchical locations through UI', async () => {
    await nav('Locations');
    for (const [name, parent] of [
      ['Study', ''],
      ['Bookcase 2', 'Study'],
      ['Shelf 4', 'Bookcase 2'],
    ]) {
      await button('Add location').click();
      await dialog().getByLabel('Name *', { exact: true }).fill(name);
      if (parent) await dialog().getByLabel('Parent location').selectOption({ label: parent });
      await button('Save', dialog()).click();
      await saved();
    }
    const s = await snapshot();
    assert.equal(s.locations.length, 3);
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
      .selectOption({ label: 'Study / Bookcase 2 / Shelf 4' });
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
    await button('Study / Bookcase 2 / Shelf 4 1').click();
    await page.getByRole('heading', { name: 'Shelf 4', exact: true }).waitFor();
  });
  await check('additional physical copy remains independent', async () => {
    await openFirst();
    await button('Add another copy').click();
    const s = await until((s) => s.books.length === 2, 'second copy');
    assert.equal(s.books[0].edition_id, s.books[1].edition_id);
    const added = s.books.find((b) => b.id !== originalId);
    assert.equal(added.current_page, 0);
    assert.equal(added.status, 'Unread');
  });
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
    await page.getByLabel('grid view').click();
    await page.locator('.book-card').first().click({ button: 'right' });
    await page.getByRole('menu').waitFor();
    await page.keyboard.press('Escape');
  });
  await check('JSON and CSV catalogue export use real file writes', async () => {
    await nav('Import / Export');
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
        assert.deepEqual(exported.books[0].transfer.location, ['Study', 'Bookcase 2', 'Shelf 4']);
      } else assert(text.includes('Verification Author'));
    }
  });
  await check('CSV mapping, invalid-row preview and transactional import', async () => {
    const csv = join(runDir, 'import.csv');
    await writeFile(
      csv,
      'Name,Writer,Pages\nVerification Imported,Second Author,120\n,Invalid Author,bad\n',
    );
    await fileChoice('open', csv);
    await button('Choose import file…').click();
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
    await nav('Backup');
    await fileChoice('save', archive);
    await button('Save backup archive…').click();
    await page.getByText(`Backup saved to ${archive}`, { exact: true }).waitFor();
    assert((await stat(archive)).size > 1000);
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
    await nav('Backup');
    await fileChoice('open', archive);
    await button('Choose backup…').click();
    await page.getByLabel('Type RESTORE to confirm replacing your current library').fill('RESTORE');
    await button('Validate & restore').click();
    await page.getByText(/Restore completed/).waitFor();
    const s = await snapshot();
    assert.equal(s.books.length, 3);
    assert.equal(s.entries.length, 3);
    assert.equal(s.loans.length, 1);
    assert.equal(s.attachments.length, 1);
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
    assert.equal(s.loans.length, 1);
    assert.equal(s.attachments.length, 1);
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
