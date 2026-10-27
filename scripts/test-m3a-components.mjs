import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const reportDir = '.cache/m3a-browser-' + Date.now();
await mkdir(reportDir, { recursive: true });
const evidence = { control: [], application: [], passed: false };
let phase = 'control';
const server = await createServer({
  configFile: false,
  appType: 'custom',
  root: process.cwd(),
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { entries: ['scripts/fixtures/m3a-search.tsx'] },
  server: { host: '127.0.0.1', port: 0, watch: null },
});
server.middlewares.use('/m3a-control', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html><body>Script-free synthetic control</body></html>');
});
server.middlewares.use('/m3a-test', async (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(
    await server.transformIndexHtml(
      '/m3a-test',
      '<div id="root"></div><script type="module" src="/scripts/fixtures/m3a-search.tsx"></script>',
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
  await page.goto(origin + 'm3a-control');
  evidence.controlScripts = await page.locator('script[src]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const url = new URL(node.src);
      return url.origin + url.pathname;
    }),
  );
  phase = 'application';
  await page.goto(origin + 'm3a-test');
  await page.getByText('1 editions · 2 matching copies', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  assert.equal(await page.getByLabel('Year from', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Detailed', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Year from', { exact: true }).fill('2000');
  await page.getByText('1 editions · 1 matching copies · filtered', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Concise', exact: true }).click();
  assert.equal(await page.getByLabel('Year from', { exact: true }).inputValue(), '2000');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Active filters').getByText('Year from: 2000', { exact: true }).waitFor();
  passed++;
  console.log('PASS concise/detailed keyboard transition preserves active copy criteria');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Detailed', exact: true }).click();
  await page.getByLabel('Year to', { exact: true }).fill('1900');
  await page.getByRole('alert').waitFor();
  await page.getByText('0 editions · 0 matching copies · filtered', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByText('1 editions · 2 matching copies', { exact: true }).waitFor();
  passed++;
  console.log('PASS invalid ranges fail closed and explicit reset restores results');
  await page.goto(origin + 'm3a-test?language=tr');
  await page.getByRole('button', { name: 'Filtreler', exact: true }).click();
  await page.getByRole('button', { name: 'Ayrıntılı', exact: true }).click();
  await page.getByLabel('Edinme kaynağı', { exact: true }).selectOption('Synthetic shop');
  await page.getByRole('button', { name: 'Özet', exact: true }).click();
  assert.equal(
    await page.getByLabel('Edinme kaynağı', { exact: true }).inputValue(),
    'Synthetic shop',
  );
  passed++;
  console.log('PASS Turkish controls retain detailed source filter');
  assert.deepEqual(errors, []);
  // Attribution requires independent observation on our script-free control page.
  // Even independently identified injection remains blocked; no traffic is allowlisted.
  const controls = evidence.control.filter(
    (event) =>
      event.type === 'Script' &&
      event.initiator.type === 'parser' &&
      event.initiator.url === origin + 'm3a-control' &&
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
  console.log('PASS ' + passed + '/4 M3-A browser checks');
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
