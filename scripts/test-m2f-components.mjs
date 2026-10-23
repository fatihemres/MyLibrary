/* global window */
// Real React development StrictMode in an isolated headless browser, no personal library.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const server = await createServer({
  configFile: false,
  appType: 'custom',
  root: process.cwd(),
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { entries: ['scripts/fixtures/m2f-editor.tsx'] },
  server: { host: '127.0.0.1', port: 0, watch: null },
});
server.middlewares.use('/m2f-test', async (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(
    await server.transformIndexHtml(
      '/m2f-test',
      '<div id="root"></div><script type="module" src="/scripts/fixtures/m2f-editor.tsx"></script>',
    ),
  );
});
let browser;
let passed = 0;
try {
  await server.listen();
  console.log('M2-F component server ready');
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  console.log('M2-F isolated browser ready');
  const errors = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  const origin = server.resolvedUrls.local[0];
  await page.route('**/*', (route) =>
    route.request().url().startsWith(origin) ? route.continue() : route.abort(),
  );
  const preview = page.getByRole('dialog', { name: 'Choose metadata to apply', exact: true });
  const editor = page.getByRole('dialog', { name: 'Add a book', exact: true });
  const count = () => page.evaluate(() => window.scanTest.calls.length);
  const done = (name) => {
    passed++;
    console.log('PASS ' + name);
  };
  await page.goto(origin + 'm2f-test');
  await preview.waitFor();
  assert.equal(await count(), 2);
  done('React StrictMode mounts start exactly one operation / two providers');
  await preview.getByRole('button', { name: 'Cancel', exact: true }).click();
  await editor.getByLabel('Title *', { exact: true }).fill('Latest draft');
  await editor.getByRole('button', { name: 'Publication', exact: true }).click();
  await editor.getByRole('button', { name: 'General', exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal(await count(), 2);
  assert.equal(await preview.count(), 0);
  assert.equal(await editor.getByLabel('Title *', { exact: true }).inputValue(), 'Latest draft');
  done('rerenders and section remount preserve edits without replay');
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Reopen editor', exact: true }).click();
  await preview.waitFor();
  assert.equal(await count(), 4);
  done('new editor opening gets one fresh intent');
  for (const mode of ['manual', 'quick', 'existing']) {
    await page.goto(origin + 'm2f-test?mode=' + mode);
    await page.getByRole('button', { name: 'Save book', exact: true }).waitFor();
    await page.waitForTimeout(100);
    assert.equal(await count(), 0);
    assert.equal(await preview.count(), 0);
    done(mode + ' editor never automatically looks up');
  }
  await page.goto(origin + 'm2f-test');
  await preview.waitFor();
  await preview.getByRole('button', { name: 'Cancel', exact: true }).click();
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.evaluate(() => {
    window.scanTest.delayed = true;
  });
  await page.getByRole('button', { name: 'Reopen editor', exact: true }).click();
  await page.waitForFunction(() => window.scanTest.pending.length === 2);
  assert(await editor.getByRole('button', { name: 'Save book', exact: true }).isDisabled());
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.evaluate(() => window.scanTest.pending.splice(0).forEach((resolve) => resolve()));
  await page.waitForTimeout(100);
  assert.equal(await preview.count(), 0);
  assert.equal(await editor.count(), 0);
  done('delayed StrictMode request cannot reopen a dismissed editor');
  await page.getByRole('button', { name: 'Reopen editor', exact: true }).click();
  await page.waitForFunction(() => window.scanTest.pending.length === 2);
  await editor.getByLabel('ISBN-13', { exact: true }).fill('9780306406157');
  await page.evaluate(() => window.scanTest.pending.splice(0).forEach((resolve) => resolve()));
  await page.waitForTimeout(100);
  assert.equal(await preview.count(), 0);
  assert.equal(await editor.getByLabel('Title *', { exact: true }).inputValue(), '');
  assert.equal(await editor.getByLabel('ISBN-13', { exact: true }).inputValue(), '9780306406157');
  assert(!(await editor.getByRole('button', { name: 'Save book', exact: true }).isDisabled()));
  assert.equal(await count(), 6);
  done('changed ISBN rejects stale results and releases Save without another lookup');
  assert.deepEqual(errors, []);
  console.log(`PASS ${passed}/${passed} M2-F browser component checks`);
} finally {
  await browser?.close();
  await server.close();
}
