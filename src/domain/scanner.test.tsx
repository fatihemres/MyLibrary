import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScannerInput } from '../components/ScannerInput';
import {
  isScanTerminator,
  newBookDraft,
  queueScan,
  scannerPayload,
  scannerTerminator,
  scanIsbn,
  SCAN_QUEUE_LIMIT,
  SCAN_RAW_LIMIT,
  type ScanItem,
} from './scanner';
import { parseIsbn } from './isbn';
import { setLanguage, t } from '../i18n';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';

describe('focused scanner transport, without a second ISBN algorithm', () => {
  it.each(['9780306406157', '0306406152', '9791090636071', '0-306-40615-2', '978 0 306 40615 7'])(
    'reuses canonical ISBN rules for %s',
    (value) => {
      expect(scanIsbn(value, 'enter').isbn).toEqual(parseIsbn(value));
    },
  );
  it('979 never invents an ISBN-10', () => {
    expect(scanIsbn('9791090636071', 'enter').isbn.isbn10).toBeUndefined();
  });
  it.each([']E0', ']C1'])('strips one transport identifier %s without interpreting it', (aim) => {
    const result = scanIsbn(aim + '0306406152\r\n', 'enter');
    expect(result.aim).toBe(aim);
    expect(result.payload).toBe('0306406152');
    expect(result.isbn.isbn13).toBe('9780306406157');
    expect(result.raw).toBe(aim + '0306406152\r\n');
  });
  it('does not strip a second AIM prefix', () => {
    expect(() => scanIsbn(']E0]C10306406152', 'enter')).toThrow('metadata.invalidIsbn');
    expect(scannerPayload(']E0]C1copy', 'enter').payload).toBe(']C1copy');
  });
  it.each(['9780306406158', '036000291452', '4006381333931', 'COPY-42'])(
    'does not reinterpret unsupported barcode %s as ISBN',
    (value) => {
      expect(() => scanIsbn(value, 'enter')).toThrow('metadata.invalidIsbn');
      expect(scannerPayload(value, 'enter').payload).toBe(value);
    },
  );
  it.each(['abc\nxyz', 'abc\txyz', '\u0000abc', 'abc\u007f', 'abc\u0085'])(
    'rejects embedded/control input %j',
    (value) => {
      expect(() => scannerPayload(value, 'either')).toThrow('scanner.controls');
    },
  );
  it('bounds raw and payload lengths and rejects empty input', () => {
    expect(scannerPayload('x'.repeat(128), 'enter').payload).toHaveLength(128);
    expect(() => scannerPayload('x'.repeat(129), 'enter')).toThrow('scanner.tooLong');
    expect(() => scannerPayload('\r'.repeat(SCAN_RAW_LIMIT + 1), 'enter')).toThrow(
      'scanner.tooLong',
    );
    for (const value of ['', ' ', '\r\n', ']E0'])
      expect(() => scannerPayload(value, 'enter')).toThrow('scanner.empty');
  });
  it('cleans only supported edge transport characters', () => {
    expect(scanIsbn('\r\n0306406152\r\n', 'enter').isbn.isbn13).toBe('9780306406157');
    expect(scanIsbn('0306406152\t', 'tab').isbn.isbn13).toBe('9780306406157');
    expect(() => scanIsbn('0306406152\t', 'enter')).toThrow('scanner.controls');
  });
  it.each(['enter', 'tab', 'either'] as const)('terminator %s remains explicit', (value) => {
    expect(isScanTerminator('Enter', value)).toBe(value !== 'tab');
    expect(isScanTerminator('Tab', value)).toBe(value !== 'enter');
    expect(isScanTerminator('Escape', value)).toBe(false);
  });
  it('invalid saved preferences fall back to Enter', () => {
    for (const value of [undefined, '', 'ENTER', 'space'])
      expect(scannerTerminator(value)).toBe('enter');
    expect(scannerTerminator('tab')).toBe('tab');
    expect(scannerTerminator('either')).toBe('either');
  });
});
describe('scanner session and new-record boundary', () => {
  it('all scanner messages resolve in both languages, including errors and plural counts', async () => {
    const keys = Object.keys(en).filter((key) => key.startsWith('scanner.'));
    expect(keys.length).toBeGreaterThan(25);
    for (const language of ['en', 'tr']) {
      await setLanguage(language);
      for (const key of keys) {
        expect((tr as Record<string, string>)[key]?.trim()).toBeTruthy();
        expect(t(key, { count: 2, suffix: 'Tab', prefix: ']E0' })).not.toBe(key);
      }
      expect(t('scanner.count', { count: 2 })).toContain('2');
    }
    await setLanguage('en');
  });
  it('retains repeated canonical ISBNs as independent items', () => {
    let queue: ScanItem[] = [];
    for (const value of ['0306406152', '9780306406157', ']E09780306406157'])
      queue = queueScan(queue, value, 'enter');
    expect(queue).toHaveLength(3);
    expect(new Set(queue.map((row) => row.id)).size).toBe(3);
    expect(new Set(queue.map((row) => row.isbn?.isbn13)).size).toBe(1);
    expect(queue.every((row) => !row.added)).toBe(true);
  });
  it('retains invalid items for removal/rescan without allocating unbounded input', () => {
    const queue = queueScan([], 'x'.repeat(10000), 'enter');
    expect(queue[0].error).toBe('scanner.tooLong');
    expect(queue[0].isbn).toBeUndefined();
    expect(queue[0].raw).toHaveLength(SCAN_RAW_LIMIT + 1);
  });
  it('preserves a full queue when another scan is rejected', () => {
    let queue: ScanItem[] = [];
    for (let i = 0; i < SCAN_QUEUE_LIMIT; i++) queue = queueScan(queue, '0306406152', 'enter');
    const before = structuredClone(queue);
    expect(() => queueScan(queue, '0306406152', 'enter')).toThrow('scanner.queueFull');
    expect(queue).toEqual(before);
  });
  it('ISBN-only seeds cannot carry identity and preserve user defaults', () => {
    const draft = newBookDraft(
      {
        settings: [
          { key: 'language', value: 'tr' },
          { key: 'currency', value: 'TRY' },
          { key: 'default_location', value: 'synthetic-shelf' },
        ],
      },
      { ...parseIsbn('0306406152'), ...{ id: 'foreign', edition_id: 'foreign', title: 'ignored' } },
    );
    expect(draft.id).toBe('');
    expect(draft.edition_id).toBe('');
    expect(draft.title).toBe('');
    expect(draft.isbn10).toBe('0306406152');
    expect(draft.isbn13).toBe('9780306406157');
    expect(draft.language).toBe('tr');
    expect(draft.location_id).toBe('synthetic-shelf');
    expect(draft.copy_extra.currency).toBe('TRY');
    expect(draft.barcode).toBe('');
  });
  it('renders a real labeled control, no submit form and no render-time scan', async () => {
    await setLanguage('en');
    let called = false;
    const html = renderToStaticMarkup(
      <ScannerInput
        terminator="enter"
        onScan={() => {
          called = true;
        }}
      />,
    );
    expect(html).toContain('Scanner input');
    expect(html).toContain('maxLength="137"');
    expect(html).toContain('type="button"');
    expect(html).not.toContain('<form');
    expect(called).toBe(false);
  });
});
