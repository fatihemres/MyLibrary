import type { Plugin } from 'vite';

const upstream = '`https://fastly.jsdelivr.net/npm/zxing-wasm@3.1.5/dist/${n[1]}/${e}`';

// Parse output tokens, not comments. Cooked values also expose JS escape sequences.
function prohibitedToken(text: string, template: boolean): boolean {
  // WHATWG URL parsing removes these controls. Inspect both representations;
  // never change the emitted/runtime token itself.
  return [text, text.replace(/[\t\n\r]/g, '')].some(
    (value) =>
      /https?:\/\/|blob:|jsdelivr|fastly|unpkg/i.test(value) ||
      /(?:^|\s)\/\/(?:\S|$)/.test(value) ||
      (template && value.endsWith('//')),
  );
}
function inspect(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  const item = node as Record<string, unknown>;
  if (item.type === 'Literal' && typeof item.value === 'string') {
    if (prohibitedToken(item.value, false)) throw new Error('Remote URL in camera worker');
  }
  if (item.type === 'TemplateElement') {
    const value = item.value as { cooked: string | null; raw: string };
    if (prohibitedToken(value.cooked ?? value.raw, true))
      throw new Error('Remote URL in camera worker');
  }
  for (const value of Object.values(item)) {
    if (Array.isArray(value)) value.forEach(inspect);
    else if (value && typeof value === 'object') inspect(value);
  }
}

// Main/dev transforms the same pinned default, but only the separate worker build
// must encounter the reader and audit its complete output graph. Main app URLs
// (including approved metadata endpoints) are outside this policy's scope.
export function localReaderOnly(workerBuild = false): Plugin {
  let transformed = 0;
  return {
    name: 'mylibrary-local-reader-only',
    enforce: 'pre',
    buildStart() {
      transformed = 0;
    },
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/zxing-wasm/dist/es/share.js')) return;
      if (code.split(upstream).length !== 2)
        throw new Error('Review the pinned reader asset policy');
      transformed++;
      return {
        code: code.replace(
          upstream,
          '(() => { throw new Error("Local WASM configuration required"); })()',
        ),
        map: null,
      };
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (!workerBuild) return;
        if (transformed !== 1)
          throw new Error('Expected pinned reader module was not transformed once');
        // Vite invokes this on the worker's own Rollup bundle, before copying its
        // chunks into main-build assets. Include every dependency chunk, any name.
        for (const output of Object.values(bundle))
          if (output.type === 'chunk') inspect(this.parse(output.code));
      },
    },
  };
}
