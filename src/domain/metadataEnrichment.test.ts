import { describe, expect, it } from 'vitest';
import {
  normalizeOpenLibrary as ol,
  normalizeGoogleBooks as gb,
  lookupMetadata,
} from '../services/metadata';
import { applySelection, defaultSelection, canApplySeries } from '../services/metadataMerge';
import { emptyBook } from './types';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';
const isbn = '9780306406157';
const google = (extra: Record<string, unknown>) =>
  gb(
    {
      items: [
        {
          volumeInfo: {
            industryIdentifiers: [{ type: 'ISBN_13', identifier: isbn }],
            ...extra,
          },
        },
      ],
    },
    isbn,
  )!;
const subjects = (...names: unknown[]) => ({ subjects: names.map((name) => ({ name })) });

describe('M2-E source evidence and conservative normalization', () => {
  it('accepts bracketed community series tags without certifying identity or inventing order', () => {
    const result = ol({
      ...subjects(' [series:İnce Memed] ', '[series:Other cycle]'),
      series: ['Publisher classics'],
      series_order: 2,
    });
    expect(result.seriesSuggestions).toEqual([
      { value: 'İnce Memed', provider: 'openLibrary' },
      { value: 'Other cycle', provider: 'openLibrary' },
    ]);
    expect(result.provenance.seriesSuggestions).toBe('openLibrary');
    expect(result).not.toHaveProperty('series_order');
  });
  it('ignores the edition series field and title/volume guesses', () => {
    expect(
      ol({
        title: 'İnce Memed 2',
        subtitle: 'Volume 2',
        series: ['İnce Memed', 'Publisher classics'],
        series_order: 2,
      }).seriesSuggestions,
    ).toEqual([]);
    expect(
      ol(subjects('İnce Memed 2', 'Publisher classics', 'series:', '[series:]')).seriesSuggestions,
    ).toEqual([]);
  });
  it.each([
    'series:Cycle',
    'series:Publisher classics',
    '[series:Cycle',
    'series:Cycle]',
    '[[series:Cycle]]',
    '[series:]',
  ])('leaves unsupported subject syntax informational: %s', (name) => {
    const result = ol(subjects(name));
    expect(result.subjects).toEqual([name]);
    expect(result.seriesSuggestions).toEqual([]);
  });
  it('does not classify community tags using a publisher blacklist', () => {
    const result = ol({
      ...subjects('[series:Publisher classics]'),
      series: ['Publisher classics'],
    });
    expect(result.seriesSuggestions).toEqual([
      { value: 'Publisher classics', provider: 'openLibrary' },
    ]);
    const book = emptyBook();
    const selection = defaultSelection(book, [result]);
    expect(selection.series).toBeUndefined();
    expect(applySelection(book, [result], selection)).toEqual(book);
    expect(applySelection(book, [result], { series: result.seriesSuggestions[0] }).series).toBe(
      'Publisher classics',
    );
  });
  it('keeps the Turkish source text intact and discloses community-tag uncertainty in both languages', () => {
    expect(tr['metadata.field.series']).toBe('Seri \u00f6nerisi');
    expect(tr['metadata.seriesHelp']).toContain('Topluluk');
    expect(tr['metadata.seriesHelp']).toContain('yay\u0131nc\u0131');
    expect(en['metadata.seriesHelp']).toContain('community');
    expect(en['metadata.seriesHelp']).toContain('publisher');
    expect(tr['metadata.seriesHelp']).not.toMatch(/[\u00c3\u00c2\u00c4\u00c5\ufffd]/u);
  });
  it.each([2, 0, -1, NaN, Infinity, '2', {}, [], null])(
    'never applies Google order %s without confirmed identity',
    (order) => {
      const result = google({
        seriesInfo: {
          bookDisplayNumber: order,
          shortSeriesBookTitle: 'Book title',
          volumeSeries: [{ seriesId: 'opaque-id', orderNumber: order }],
        },
      });
      expect(result.seriesSuggestions).toEqual([]);
      const b = { ...emptyBook(), series: 'Manual series', series_order: 7 };
      expect(applySelection(b, [result], {})).toEqual(b);
    },
  );
  it('does not join a Google series ID/order to an unrelated Open Library series name', () => {
    const a = ol(subjects('[series:Explicit cycle]'));
    const b = google({ seriesInfo: { volumeSeries: [{ seriesId: 'unrelated', orderNumber: 2 }] } });
    const next = applySelection(emptyBook(), [a, b], { series: a.seriesSuggestions[0] });
    expect(next.series).toBe('Explicit cycle');
    expect(next.series_order).toBeNull();
  });
  it.each([undefined, null, {}, 'Fiction', 2, true])('handles malformed list %s', (value) => {
    expect(ol({ subjects: value }).seriesSuggestions).toEqual([]);
    expect(ol({ subjects: value }).genreSuggestions).toEqual([]);
    expect(google({ categories: value }).genreSuggestions).toEqual([]);
  });
  it('rejects malformed entries, control text, empty names and excessive lengths', () => {
    const result = ol(
      subjects(
        {},
        [],
        2,
        null,
        '',
        'series: ',
        '[series:broken',
        '[series:a\nname]',
        '[series:' + 'x'.repeat(161) + ']',
        'Fiction\u200b',
      ),
    );
    expect(result.seriesSuggestions).toEqual([]);
    expect(result.genreSuggestions).toEqual([]);
    expect(
      google({
        categories: [null, {}, [], 2, '', 'Fiction//History', 'Fiction/' + 'x'.repeat(200)],
      }).genreSuggestions,
    ).toEqual([]);
  });
  it('bounds scan and candidate counts and deduplicates normalized names', () => {
    expect(
      ol(subjects(...Array.from({ length: 20 }, (_, i) => '[series:Cycle ' + i + ']')))
        .seriesSuggestions,
    ).toHaveLength(5);
    expect(
      ol(subjects(...Array(100).fill('Unknown'), '[series:Beyond bound]')).seriesSuggestions,
    ).toEqual([]);
    expect(
      ol(subjects('[series:Cycle]', '[series:cycle]', '[series: Cycle ]')).seriesSuggestions,
    ).toHaveLength(1);
  });
  it('suggests exact genre labels but not people, places, periods, or substring guesses', () => {
    const result = ol(
      subjects(
        ' Fiction ',
        'fiction',
        'Science fiction',
        'Paris',
        '1900-1999',
        'Yaşar Kemal',
        'Science',
        'History and criticism',
        'Fictional characters',
      ),
    );
    expect(result.genreSuggestions.map((s) => s.value)).toEqual(['Fiction', 'Science fiction']);
    expect(result.genreSuggestions.every((s) => s.provider === 'openLibrary')).toBe(true);
    expect(result.subjects).toContain('Paris');
  });
  it('offers only recognized Google category roots, preserving provenance', () => {
    const result = google({
      categories: [
        'Fiction / Historical / General',
        'Fiction / Romance',
        'Poetry',
        'Travel / Europe',
        'Literary Criticism',
        'Science / Physics',
      ],
    });
    expect(result.genreSuggestions).toEqual([
      { value: 'Fiction', provider: 'googleBooks' },
      { value: 'Poetry', provider: 'googleBooks' },
    ]);
    expect(result.provenance.genreSuggestions).toBe('googleBooks');
  });
  it('limits genre suggestions to ten distinct labels', () => {
    expect(
      google({
        categories: [
          'Fiction',
          'Literature',
          'Poetry',
          'Drama',
          'Science fiction',
          'Fantasy',
          'Historical fiction',
          'Mystery',
          'Thriller',
          'Horror',
          'Romance',
        ],
      }).genreSuggestions,
    ).toHaveLength(10);
  });
  it('deduplicates Unicode and whitespace without rewriting manually entered values', () => {
    const result = ol(subjects('[series:Café]', '[series:Cafe\u0301]', 'Science fiction'));
    expect(result.seriesSuggestions).toHaveLength(1);
    const b = emptyBook();
    b.terms.genre = ['  Science   fiction  '];
    expect(applySelection(b, [result], { genres: result.genreSuggestions })).toEqual(b);
  });
  it('keeps successful suggestions during partial provider failure', async () => {
    const result = await lookupMetadata('', isbn, [
      { id: 'openLibrary', lookup: async () => ol(subjects('Fiction', '[series:Cycle]')) },
      {
        id: 'googleBooks',
        lookup: async () => {
          throw new Error('private provider payload');
        },
      },
    ]);
    expect(result[0].result?.genreSuggestions).toHaveLength(1);
    expect(result[0].result?.seriesSuggestions).toHaveLength(1);
    expect(result[1].error).toBe('metadata.unavailable');
  });
});
describe('M2-E explicit field application', () => {
  const open = ol(subjects('Fiction', 'Poetry', '[series:Cycle]', '[series:Alternative]'));
  const other = google({ categories: ['fiction', 'Drama'] });
  it('does not preselect enrichment even in an empty draft', () => {
    const b = emptyBook();
    const defaults = defaultSelection(b, [open, other]);
    expect(defaults.series).toBeUndefined();
    expect(defaults.genres).toBeUndefined();
    expect(applySelection(b, [open, other], defaults)).toEqual({ ...b, isbn13: isbn });
  });
  it('adds individual genres without replacing/reordering manual genres or other terms', () => {
    const b = emptyBook();
    b.terms.genre = ['My genre', ' FICTION '];
    b.terms.tag = ['Private tag'];
    const before = structuredClone(b);
    const next = applySelection(b, [open, other], {
      genres: [...open.genreSuggestions, other.genreSuggestions[0]],
    });
    expect(next).toEqual({
      ...b,
      terms: { ...b.terms, genre: ['My genre', ' FICTION ', 'Poetry'] },
    });
    expect(b).toEqual(before);
    expect(applySelection(next, [open], { genres: open.genreSuggestions })).toEqual(next);
  });
  it('keeps cross-provider attribution while merging identical genre values only once', () => {
    expect(other.genreSuggestions[0].provider).toBe('googleBooks');
    const next = applySelection(emptyBook(), [open, other], {
      genres: [open.genreSuggestions[0], other.genreSuggestions[0]],
    });
    expect(next.terms.genre).toEqual(['Fiction']);
  });
  it('ignores unoffered or mismatched-provider selections', () => {
    const b = emptyBook();
    expect(
      applySelection(b, [open], {
        series: { value: 'Fabricated', provider: 'openLibrary' },
        genres: [{ value: 'Fiction', provider: 'googleBooks' }],
      }),
    ).toEqual(b);
  });
  it('selects an explicit alternative independently, preserving Edition/Copy fields and cover', () => {
    const b = {
      ...emptyBook(),
      id: 'copy',
      edition_id: 'edition',
      series: 'Manual',
      cover: 'covers/synthetic.jpg',
      copy_extra: { inventory_code: 'C2' },
      location_id: 'location',
    };
    expect(applySelection(b, [open], { series: open.seriesSuggestions[1] })).toEqual({
      ...b,
      series: 'Alternative',
    });
  });
  it('rejects a different series with an existing order, even if the draft changed after selection', () => {
    const b = { ...emptyBook(), series: 'Manual', series_order: 2 };
    expect(canApplySeries(b, 'Cycle')).toBe(false);
    expect(applySelection(b, [open], { series: open.seriesSuggestions[0] })).toEqual(b);
    expect(canApplySeries({ ...b, series_order: null }, 'Cycle')).toBe(true);
  });
  it('allows a matching identity and preserves its manual order', () => {
    const b = { ...emptyBook(), series: ' cycle ', series_order: 2 };
    const next = applySelection(b, [open], { series: open.seriesSuggestions[0] });
    expect(next.series).toBe('Cycle');
    expect(next.series_order).toBe(2);
  });
  it('preserves latest unrelated edits and requires an explicit genre choice', () => {
    const b = {
      ...emptyBook(),
      title: 'Edited while awaiting lookup',
      terms: { genre: ['Latest manual'] },
    };
    expect(applySelection(b, [open], {})).toEqual(b);
    expect(applySelection(b, [open], { genres: [open.genreSuggestions[1]] })).toEqual({
      ...b,
      terms: { genre: ['Latest manual', 'Poetry'] },
    });
  });
  it('has English and Turkish labels for each enrichment message', () => {
    for (const key of [
      'field.series',
      'field.series_order',
      'seriesHelp',
      'noSeries',
      'seriesOrderConflict',
      'seriesAlternatives',
      'noSeriesOrder',
      'genreSuggestions',
      'genreHelp',
      'noGenres',
    ]) {
      const k = `metadata.${key}` as keyof typeof en;
      expect(en[k]).toBeTruthy();
      expect(tr[k]).toBeTruthy();
      expect(en[k]).not.toBe(tr[k]);
    }
  });
});
