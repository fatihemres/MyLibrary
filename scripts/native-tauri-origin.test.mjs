import { describe, expect, it } from 'vitest';
import { isLocalTauriResource, isTrustedTauriPage } from './native-tauri-origin.mjs';

const allowed = [
  'http://tauri.localhost/',
  'http://tauri.localhost/some/path',
  'http://tauri.localhost/index.html?next=https://evil.example/#chapter',
  'http://tauri.localhost/some%20path',
  'HTTP://TAURI.LOCALHOST/',
  'http://tauri.localhost:80/',
  'http://tauri%2elocalhost/',
];
const rejected = [
  'http://tauri.localhost.evil.example/',
  'http://tauri.localhost@evil.example/',
  'http://tauri.localhost:password@evil.example/',
  'http://user@tauri.localhost/',
  'http://user:password@tauri.localhost/',
  'https://evil.example/http://tauri.localhost',
  'https://tauri.localhost/',
  'http://tauri.localhost:12345/',
  'http://tauri.localhost./',
  'http://tauri.localhost:invalid/',
  'http://evil.example/',
  'http://evil.example/?url=http://tauri.localhost',
  'blob:http://tauri.localhost/id',
  'tauri://localhost/',
  'http://localhost:1420/',
  'http://127.0.0.1:1420/',
  'javascript:alert(1)',
  'data:text/html,http://tauri.localhost',
  'about:blank',
  '//tauri.localhost/',
  '/some/path',
  'http:tauri.localhost',
  'http:/tauri.localhost/',
  'http:\\tauri.localhost\\',
  'http://tauri.localhost\\@evil.example/',
  'http://tauri.local\thost/',
  'http://tauri.localhost/\u0000',
  'http://tauri.localhost/\u007f',
  ' http://tauri.localhost/',
  'http://tauri.localhost/\n',
  'http://tauri.localhost/has space',
  'http://',
  'not a URL',
  '',
  null,
  undefined,
  123,
];

describe('native application-page origin boundary', () => {
  it.each(allowed)('accepts serialized same-origin URL %s', (value) => {
    expect(isTrustedTauriPage(value)).toBe(true);
    expect(isLocalTauriResource(value)).toBe(true);
  });
  it.each(rejected)('rejects deceptive or malformed URL %s', (value) => {
    expect(isTrustedTauriPage(value)).toBe(false);
    expect(isLocalTauriResource(value)).toBe(false);
  });
  it('skips misleading CDP pages before selecting the genuine application page', () => {
    const values = [rejected[0], rejected[1], 'blob:http://tauri.localhost/id', allowed[1]];
    const pages = values.map((value) => ({ url: () => value }));
    expect(pages.find((page) => isTrustedTauriPage(page.url()))).toBe(pages[3]);
    expect(pages.slice(0, 3).find((page) => isTrustedTauriPage(page.url()))).toBeUndefined();
  });
});

describe('native request evidence boundary', () => {
  it.each(['ipc', 'asset'])('recognizes exact %s origin only for resource accounting', (scheme) => {
    expect(isLocalTauriResource(`http://${scheme}.localhost/resource`)).toBe(true);
    expect(isTrustedTauriPage(`http://${scheme}.localhost/resource`)).toBe(false);
    for (const value of [
      `http://${scheme}.localhost.evil.example/`,
      `http://${scheme}.localhost@evil.example/`,
      `http://${scheme}.localhost:12345/`,
      `https://${scheme}.localhost/`,
    ])
      expect(isLocalTauriResource(value)).toBe(false);
  });
  it('keeps external lookalikes in the HTTP(S) network evidence', () => {
    const requests = [
      'http://tauri.localhost/',
      'http://ipc.localhost/database',
      'http://asset.localhost/cover',
      rejected[0],
      rejected[1],
      'http://ipc.localhost.evil.example/',
      'https://tauri.localhost/',
    ];
    expect(requests.filter((url) => /^https?:/.test(url) && !isLocalTauriResource(url))).toEqual(
      requests.slice(3),
    );
  });
});
