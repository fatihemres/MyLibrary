/* global window */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const reportDir = '.cache/m3b-browser-' + Date.now();
await mkdir(reportDir, { recursive: true });
const evidence = { control: [], application: [], passed: false };
let phase = 'control';
const server = await createServer({
  configFile: false,
  appType: 'custom',
  root: process.cwd(),
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { entries: ['scripts/fixtures/m3b-wishlist.tsx'] },
  server: { host: '127.0.0.1', port: 0, watch: null },
});
server.middlewares.use('/m3b-control', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html><body>Script-free synthetic control</body></html>');
});
server.middlewares.use('/m3b-test', async (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(
    await server.transformIndexHtml(
      '/m3b-test',
      '<div id="root"></div><script type="module" src="/scripts/fixtures/m3b-wishlist.tsx"></script>',
    ),
  );
});
let browser;
let passed = 0;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const origin = server.resolvedUrls.local[0];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent', (event) => {
    if (!event.request.url.startsWith(origin)) {
      const url = new URL(event.request.url);
      evidence[phase].push({
        endpoint: url.origin + url.pathname,
        type: event.type,
        timestamp: event.timestamp,
        initiator: event.initiator,
      });
    }
  });
  const errors = [],
    network = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => {
    if (route.request().url().startsWith(origin)) return route.continue();
    network.push({ url: route.request().url(), type: route.request().resourceType(), phase });
    return route.abort();
  });
  await page.goto(origin + 'm3b-control');
  evidence.controlScripts = await page.locator('script[src]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const url = new URL(node.src);
      return url.origin + url.pathname;
    }),
  );
  phase = 'application';
  await page.goto(origin + 'm3b-test');
  const calls = () => page.evaluate(() => window.wishTest.calls);
  await page.getByRole('button', { name: 'Add a wish', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Manual wish');
  await page.getByLabel('ISBN-13', { exact: true }).fill('9780306406157');
  assert.equal((await calls()).filter((c) => c.endsWith('_lookup')).length, 0);
  await page.getByRole('button', { name: 'Look up ISBN', exact: true }).click();
  await page.getByRole('dialog', { name: 'Review Wishlist suggestions' }).waitFor();
  assert.equal((await calls()).filter((c) => c === 'isbn_lookup').length, 1);
  assert.equal((await calls()).filter((c) => c === 'google_books_lookup').length, 1);
  const preview = page.getByRole('dialog', { name: 'Review Wishlist suggestions' });
  assert.equal(await preview.getByLabel('Title', { exact: true }).inputValue(), '');
  await preview.getByLabel('Title', { exact: true }).selectOption('openLibrary');
  await preview.getByRole('button', { name: 'Apply selected fields' }).click();
  assert.equal(
    await page.getByLabel('Title', { exact: true }).inputValue(),
    'Synthetic suggested title',
  );
  assert.equal((await calls()).filter((c) => c === 'wishlist_save').length, 0);
  passed++;
  console.log('PASS explicit partial metadata lookup and Apply without Save');
  await page.getByLabel('Amount (decimal point)', { exact: true }).pressSequentially('12.34');
  assert.equal(
    await page.getByLabel('Amount (decimal point)', { exact: true }).inputValue(),
    '12.34',
  );
  await page.getByRole('button', { name: 'Save wish', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal((await calls()).filter((c) => c === 'wishlist_save').length, 1);
  assert.equal(await page.evaluate(() => window.wishTest.items[0].draft.target_minor), '1234');
  passed++;
  console.log('PASS typed precise amount and separate save');
  await page.getByRole('button', { name: 'Detailed list', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.wish-list .wish-card').first().waitFor();
  assert.equal(await page.locator('.wish-list .wish-card').count(), 1);
  await page.getByRole('button', { name: 'Cover gallery', exact: true }).click();
  await page.locator('.wish-gallery .wish-card').first().waitFor();
  assert.equal(await page.locator('.wish-gallery .wish-card').count(), 1);
  await page.getByRole('button', { name: 'Edit Synthetic suggested title', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Edit wish', exact: true })
    .getByLabel('Purchase status', { exact: true })
    .selectOption('On Order');
  await page.getByRole('dialog').getByLabel('Priority', { exact: true }).selectOption('Urgent');
  await page.getByLabel('Archived — clear this to reopen', { exact: true }).check();
  await page.getByRole('button', { name: 'Save wish', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByLabel('Archived', { exact: true }).check();
  await page.getByRole('button', { name: 'Edit Synthetic suggested title', exact: true }).click();
  await page.getByLabel('Archived — clear this to reopen', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save wish', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => window.wishTest.items[0].draft.archived), false);
  passed++;
  console.log('PASS keyboard list/gallery and archive/reopen');
  await page.getByRole('button', { name: 'Add a wish', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Not saved');
  await page.getByLabel('Amount (decimal point)', { exact: true }).fill('1.234');
  await page.getByRole('button', { name: 'Save wish', exact: true }).click();
  assert.equal(await page.evaluate(() => window.wishTest.items.length), 1);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Please confirm', exact: true })
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), 'Not saved');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Please confirm', exact: true })
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  passed++;
  console.log('PASS invalid precision blocks save and cancellation preserves/discards explicitly');
  await page.getByRole('button', { name: 'Add a wish', exact: true }).click();
  await page.getByLabel('ISBN-13', { exact: true }).fill('invalid');
  const count = (await calls()).filter((c) => c.endsWith('_lookup')).length;
  await page.getByRole('button', { name: 'Look up ISBN', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.equal((await calls()).filter((c) => c.endsWith('_lookup')).length, count);
  await page.getByLabel('ISBN-13', { exact: true }).fill('9791090636071');
  await page.evaluate(() => {
    window.wishTest.delayed = true;
  });
  await page.getByRole('button', { name: 'Look up ISBN', exact: true }).click();
  await page.waitForFunction(() => window.wishTest.pending.length === 2);
  await page.getByLabel('ISBN-13', { exact: true }).fill('9780306406157');
  await page.evaluate(() => {
    window.wishTest.pending.splice(0).forEach((f) => f());
  });
  await page.getByRole('button', { name: 'Look up ISBN', exact: true }).waitFor();
  assert.equal(await page.getByRole('dialog', { name: 'Review Wishlist suggestions' }).count(), 0);
  assert.equal(await page.getByLabel('ISBN-10', { exact: true }).inputValue(), '');
  passed++;
  console.log('PASS invalid ISBN never queries; 979 and identity changes invalidate stale results');
  await page.getByRole('button', { name: 'Look up ISBN', exact: true }).click();
  await page.waitForFunction(() => window.wishTest.pending.length === 2);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Please confirm', exact: true })
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await page.evaluate(() => {
    window.wishTest.pending.splice(0).forEach((f) => f());
  });
  await page.getByRole('button', { name: 'Add a wish', exact: true }).click();
  assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), '');
  assert.equal(await page.getByRole('dialog', { name: 'Review Wishlist suggestions' }).count(), 0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.wishTest.unexpected), []);
  passed++;
  console.log('PASS closing delayed request never reopens a detached preview');
  await page.goto(origin + 'm3b-test?language=tr');
  await page.getByRole('button', { name: 'İstek ekle', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Başlık', { exact: true }).fill('Türkçe istek');
  await page.getByRole('button', { name: 'İsteği kaydet', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => window.wishTest.items[0].draft.title), 'Türkçe istek');
  passed++;
  console.log('PASS Turkish keyboard workflow and original Unicode');
  assert.deepEqual(errors, []);
  // Attribution requires independent observation on our script-free control page.
  // Even independently identified injection remains blocked; no traffic is allowlisted.
  const controls = evidence.control.filter(
    (event) =>
      event.type === 'Script' &&
      event.initiator.type === 'parser' &&
      event.initiator.url === origin + 'm3b-control' &&
      new URL(event.endpoint).origin === 'http://me.kis.v2.scr.kaspersky-labs.com' &&
      new URL(event.endpoint).pathname === '/FD126C42-EBFA-4E12-B309-BB3FDD723AC1/main.js' &&
      evidence.controlScripts.includes(event.endpoint),
  );
  const injected = network.filter(
    ({ url, type }) =>
      type === 'script' &&
      controls.some((control) => control.endpoint === new URL(url).origin + new URL(url).pathname),
  );
  assert.deepEqual(
    network.filter((request) => !injected.includes(request)),
    [],
  );
  for (const event of evidence.application) {
    assert(
      controls.some((control) => control.endpoint === event.endpoint) &&
        event.type === 'Script' &&
        event.initiator.type === 'parser',
      'Unattributed application-page external request',
    );
  }
  evidence.injectedBlocked = injected.length;
  console.log(
    'Independently identified, blocked environmental script requests: ' + injected.length,
  );
  passed++;
  console.log(
    'PASS no runtime errors or application external requests; all external requests blocked',
  );
  console.log('PASS ' + passed + '/8 M3-B browser checks');
  evidence.passed = true;
} catch (error) {
  evidence.failure = String(error);
  throw error;
} finally {
  evidence.checksPassed = passed;
  await writeFile(reportDir + '/report.json', JSON.stringify(evidence, null, 2));
  console.log('Browser evidence: ' + reportDir);
  await browser?.close();
  await server.close();
}
