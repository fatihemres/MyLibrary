import { describe, expect, it, afterEach } from 'vitest';
import {
  t,
  label,
  setLanguage,
  initialLanguage,
  resolveLanguage,
  direction,
  number,
  date,
  currency,
} from '../i18n';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';
import { emptyBook } from './types';
import { normalizeOpenLibrary, metadataFields } from '../services/metadata';
import { checkUpdates, updatePolicy } from '../services/updates';
import { shortcutLabel } from '../services/platform';

afterEach(async () => {
  await setLanguage('en');
});
describe('V2 foundation acceptance', () => {
  it('I18N-001 loads English/Turkish with complete resource key parity', async () => {
    expect(Object.keys(tr).sort()).toEqual(Object.keys(en).sort());
    expect(Object.values(tr).every((v) => v.trim().length)).toBe(true);
    await setLanguage('en');
    expect(t('ui.library')).toBe('Library');
    await setLanguage('tr');
    expect(t('ui.library')).toBe('Kütüphane');
    expect(label('Finished')).toBe('Bitirildi');
  });
  it('I18N-002 falls back safely and keeps future RTL direction separate from supported translations', async () => {
    expect(resolveLanguage('tr-TR')).toBe('tr');
    expect(resolveLanguage('fr-FR')).toBe('en');
    await setLanguage('de');
    expect(t('ui.library')).toBe('Library');
    expect(t('missing.key', { defaultValue: 'Safe fallback' })).toBe('Safe fallback');
    expect(direction('ar-SA')).toBe('rtl');
    expect(direction('tr')).toBe('ltr');
  });
  it('I18N-003 persists UI selection without modifying book metadata', async () => {
    const data = {
      ...emptyBook(),
      title: 'Library',
      language: 'French',
      extra: { original_language: 'Russian' },
    };
    const before = structuredClone(data),
      values = new Map<string, string>();
    const storage = {
      setItem: (k: string, v: string) => {
        values.set(k, v);
      },
      getItem: (k: string) => values.get(k) || null,
    };
    await setLanguage('tr', storage);
    expect(initialLanguage(storage, 'en-US')).toBe('tr');
    expect(data).toEqual(before);
    expect(initialLanguage(undefined, 'tr-TR')).toBe('tr');
    expect(
      initialLanguage(
        {
          getItem: () => {
            throw new Error('denied');
          },
        },
        'en',
      ),
    ).toBe('en');
  });
  it('I18N-004 uses locale-aware dates, numbers, currency and plurals', async () => {
    await setLanguage('en');
    expect(number(1234.5)).toBe('1,234.5');
    expect(t('library.copyCount', { count: 1 })).toBe('1 copy');
    expect(t('library.copyCount', { count: 2 })).toBe('2 copies');
    await setLanguage('tr');
    expect(number(1234.5)).toBe('1.234,5');
    expect(date('2026-10-08')).toBe('08.10.2026');
    expect(currency(1250.5, 'TRY')).toContain('1.250,50');
    expect(t('library.copyCount', { count: 2 })).toBe('2 nüsha');
    expect(date('bad')).toBe('bad');
  });
  it('META-001 normalizes optional provider fields and rejects unsafe cover URLs', () => {
    const result = normalizeOpenLibrary({
      title: 'Book',
      authors: [{ name: 'Author' }],
      publishers: [{ name: 'Press' }],
      number_of_pages: 200,
      language: 'eng, tur',
      description: { value: 'Description' },
      identifiers: { isbn_13: ['9781234567890'] },
      cover: { large: 'https://covers.openlibrary.org/b/1.jpg', evil: 'file:///private' },
    });
    expect(result.authors).toEqual(['Author']);
    expect(result.languages).toEqual(['eng', 'tur']);
    expect(result.pages).toBe(200);
    expect(result.description).toBe('Description');
    expect(result.covers).toHaveLength(1);
    expect(metadataFields(result).cover).toEqual({
      large: 'https://covers.openlibrary.org/b/1.jpg',
    });
    expect(result.provenance.title).toBe('openLibrary');
    expect(normalizeOpenLibrary(null).authors).toEqual([]);
    expect(normalizeOpenLibrary({ number_of_pages: -1 }).pages).toBeUndefined();
  });
  it('PLATFORM-001 formats platform shortcuts without requiring a native runtime', () => {
    expect(shortcutLabel('S', true)).toBe('⌘ S');
    expect(shortcutLabel('S', false)).toBe('Ctrl S');
  });
  it('UPDATE-001 fails closed without network or unsigned installation', async () => {
    expect(updatePolicy.configured).toBe(false);
    expect(updatePolicy.automatic).toBe(false);
    expect(await checkUpdates('2.0.0-alpha.1')).toEqual({
      state: 'notConfigured',
      currentVersion: '2.0.0-alpha.1',
      latestVersion: null,
    });
  });
});
