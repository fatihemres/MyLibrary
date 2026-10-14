import { describe, expect, it } from 'vitest';
import { rollup } from 'rollup';
import { localReaderOnly } from './local-reader-policy';

const pinned = '/node_modules/zxing-wasm/dist/es/share.js';
const upstream = '`https://fastly.jsdelivr.net/npm/zxing-wasm@3.1.5/dist/${n[1]}/${e}`';
const reader = `export function locate(e,n) { return ${upstream}; }`;

async function build({
  moduleId = pinned,
  source = reader,
  secondary = 'export const url = "./zxing_reader.wasm";',
  includeReader = true,
  worker = true,
  banner = '',
} = {}) {
  const modules: Record<string, string> = {
    entry: `${includeReader ? `import {locate} from '${moduleId}'; console.log(locate);` : ''}
      export const dependency = () => import('secondary');`,
    [moduleId]: source,
    secondary,
  };
  const bundle = await rollup({
    input: 'entry',
    plugins: [
      {
        name: 'synthetic-offline-modules',
        resolveId: (id) => (Object.hasOwn(modules, id) ? id : null),
        load: (id) => modules[id],
      },
      localReaderOnly(worker),
    ],
  });
  try {
    return await bundle.generate({ format: 'es', chunkFileNames: 'dependency-[hash].js', banner });
  } finally {
    await bundle.close();
  }
}

describe('local reader worker build policy', () => {
  it('rewrites the single pinned default, allowing a complete local dependency graph', async () => {
    const { output } = await build();
    const chunks = output.filter((part) => part.type === 'chunk');
    expect(chunks).toHaveLength(2);
    expect(chunks.some((part) => part.fileName.startsWith('dependency-'))).toBe(true);
    const code = chunks.map((part) => part.code).join('\n');
    expect(code).toContain('Local WASM configuration required');
    expect(code).toContain('./zxing_reader.wasm');
    expect(code).not.toMatch(/https?:|jsdelivr|fastly|blob:/i);
  });
  it('rejects a missing upstream pattern in the expected module', async () => {
    await expect(
      build({ source: 'export function locate() { return "./reader.wasm"; }' }),
    ).rejects.toThrow('pinned reader asset policy');
  });
  it('rejects multiple upstream patterns', async () => {
    await expect(
      build({ source: `${reader}\nexport const other = (e,n) => ${upstream};` }),
    ).rejects.toThrow('pinned reader asset policy');
  });
  it('rejects relocated reader layout even with entirely local output', async () => {
    await expect(
      build({
        moduleId: '/node_modules/zxing-wasm/dist/changed/share.js',
        source: 'export function locate() { return "./reader.wasm"; }',
      }),
    ).rejects.toThrow('Expected pinned reader module');
  });
  it('rejects a worker graph that never encounters the reader', async () => {
    await expect(build({ includeReader: false })).rejects.toThrow('Expected pinned reader module');
  });
  it.each([
    'http://cdn.example.com/reader.wasm',
    'https://cdn.example.com/reader.wasm',
    '//cdn.example.com/reader.wasm',
    '//éxample.com/reader.wasm',
    '//%63dn.example.com/reader.wasm',
    'blob:local-worker',
    'FASTLY',
    'jsdelivr',
    'unpkg',
  ])('rejects %s in a secondary dependency chunk', async (url) => {
    await expect(
      build({ secondary: `export const url = ${JSON.stringify(url)};` }),
    ).rejects.toThrow('Remote URL in camera worker');
  });
  it.each([
    ['TAB', '//\texample.com/a'],
    ['LF', '//\nexample.com/a'],
    ['CR', '//\rexample.com/a'],
    ['mixed', '//\t\r\nexample.com/a'],
    ['repeated', '//\t\t\n\n\r\rexample.com/a'],
    ['Unicode', '//\t\néxample.com/a'],
    ['encoded', '//\r\t%65xample.com/a'],
  ])('rejects URL-parser ignored controls: %s', async (_label, url) => {
    expect(new URL(url, 'https://local.invalid/').hostname).not.toBe('local.invalid');
    const quoted = JSON.stringify(url);
    await expect(build({ secondary: `export const url = ${quoted};` })).rejects.toThrow(
      'Remote URL in camera worker',
    );
    // Template cooked values follow the same inspection boundary.
    await expect(
      build({ secondary: 'export const url = `' + quoted.slice(1, -1) + '`;' }),
    ).rejects.toThrow('Remote URL in camera worker');
  });
  it.each([String.raw`\u0009`, String.raw`\u000a`, String.raw`\u000d`])(
    'rejects source Unicode escape %s after AST decoding',
    async (escape) => {
      await expect(
        build({ secondary: 'export const url = "//' + escape + 'example.com/a";' }),
      ).rejects.toThrow('Remote URL in camera worker');
    },
  );
  it('does not inspect comments containing control escape examples', async () => {
    const banner = String.raw`// Examples only: "//\texample.com/a" "//\nexample.com/a" "//\rexample.com/a"`;
    const { output } = await build({ banner });
    expect(output.some((part) => part.type === 'chunk' && part.code.includes(banner))).toBe(true);
  });
  it('does not rewrite harmless local runtime strings during inspection', async () => {
    const local = './\t\n\rreader.wasm';
    const { output } = await build({ secondary: `export const url = ${JSON.stringify(local)};` });
    expect(
      output.some((part) => part.type === 'chunk' && part.code.includes(JSON.stringify(local))),
    ).toBe(true);
  });
  it('rejects a protocol-relative template with a computed hostname', async () => {
    await expect(
      build({ secondary: 'export const url = `//${globalThis.host}/reader.wasm`;' }),
    ).rejects.toThrow('Remote URL in camera worker');
  });
  it('rejects a split protocol-relative URL prefix', async () => {
    await expect(
      build({ secondary: 'export const url = "//" + globalThis.host + "/reader.wasm";' }),
    ).rejects.toThrow('Remote URL in camera worker');
  });
  it('rejects escaped protocol-relative slashes and hostname', async () => {
    await expect(
      build({ secondary: 'export const url = "\\u002f\\u002f\\u00e9xample.com/reader.wasm";' }),
    ).rejects.toThrow('Remote URL in camera worker');
  });
  it('rejects escaped remote string tokens', async () => {
    await expect(
      build({
        secondary: 'export const url = "\\x68ttps:\\u002f\\u002fcdn.example.com/reader.wasm";',
      }),
    ).rejects.toThrow('Remote URL in camera worker');
  });
  it('allows comment syntax and local worker/WASM tokens', async () => {
    await expect(
      build({
        secondary:
          '// //example.com and https://cdn.example.com/ not executable\n/* blob: unpkg */\nexport const url = "./reader.wasm";',
      }),
    ).resolves.toBeDefined();
  });
  it('leaves unrelated main-app provider URLs outside the worker audit', async () => {
    await expect(
      build({
        worker: false,
        includeReader: false,
        secondary:
          'export const urls = ["https://openlibrary.org/", "https://www.googleapis.com/books/v1/volumes"];',
      }),
    ).resolves.toBeDefined();
  });
  it('retains the pinned transform for the main/dev plugin without requiring the reader', async () => {
    const { output } = await build({ worker: false });
    expect(
      output.some(
        (part) => part.type === 'chunk' && part.code.includes('Local WASM configuration required'),
      ),
    ).toBe(true);
  });
});
