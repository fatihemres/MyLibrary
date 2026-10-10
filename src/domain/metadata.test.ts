import { describe, it, expect, vi } from 'vitest';
import { parseIsbn, lookupIsbn } from './isbn';
import { emptyBook } from './types';
import {
  normalizeOpenLibrary as ol,
  normalizeGoogleBooks as gb,
  lookupMetadata,
  type MetadataProvider,
} from '../services/metadata';
import { defaultSelection, applySelection, metadataKeys } from '../services/metadataMerge';
const isbn = '9780306406157';
const item = (id = isbn, extra = {}) => ({
  volumeInfo: {
    title: 'Google title',
    industryIdentifiers: [{ type: 'ISBN_13', identifier: id }],
    ...extra,
  },
});
describe('M2-A ISBN boundary', () => {
  it.each([
    ['0306406152', isbn],
    ['080442957X', '9780804429573'],
    [' 0-8044-2957-x ', '9780804429573'],
    [isbn, isbn],
    ['9791090636071', '9791090636071'],
  ])('validates %s', (input, expected) => expect(parseIsbn(input).isbn13).toBe(expected));
  it.each([
    '0306406153',
    '0804429571',
    '9780306406158',
    '4006381333931',
    '036000291452',
    'X306406152',
    '978030640615X',
    '978\n0306406157',
  ])('rejects %s', (input) => expect(() => parseIsbn(input)).toThrow());
  it('converts only compatible prefixes and checks pairs', () => {
    expect(parseIsbn(isbn).isbn10).toBe('0306406152');
    expect(parseIsbn('9791090636071').isbn10).toBeUndefined();
    expect(lookupIsbn('0306406152', isbn).isbn13).toBe(isbn);
    expect(() => lookupIsbn('080442957X', isbn)).toThrow('metadata.mismatchedIsbn');
  });
});
describe('M2-A normalized providers', () => {
  it('normalizes Open Library with per-field provenance', () => {
    const r = ol({
      title: '  Title ',
      authors: [{ name: ' Author ' }, { name: 'Author' }, null],
      publishers: [{ name: 'Press' }],
      publish_date: '2001',
      identifiers: { isbn_10: ['0-306-40615-2'], isbn_13: [isbn, 'bad'] },
      number_of_pages: 10,
      description: { value: ' Text ' },
      language: 'eng, eng',
      subjects: [{ name: 'Science' }],
      cover: { large: 'https://covers.openlibrary.org/b/id/1-L.jpg' },
    });
    expect(r.title).toBe('Title');
    expect(r.authors).toEqual(['Author']);
    expect(r.languages).toEqual(['eng']);
    expect(r.identifiers.isbn13).toEqual([isbn]);
    expect(r.description).toBe('Text');
    expect(r.provenance['identifiers.isbn10']).toBe('openLibrary');
    expect(r.provenance.subjects).toBe('openLibrary');
    expect(r.provenance.provider).toBeUndefined();
    for (const field of [
      'title',
      'authors',
      'publishers',
      'publicationDate',
      'languages',
      'pages',
      'description',
      'subjects',
      'covers',
      'identifiers.isbn10',
      'identifiers.isbn13',
    ])
      expect(r.provenance[field]).toBe('openLibrary');
  });
  it.each([null, [], true, 'bad', {}])('handles missing/malformed containers %s', (value) => {
    expect(ol(value).authors).toEqual([]);
    expect(gb(value, isbn)).toBeNull();
  });
  it('rejects malformed fields, unsafe covers and invalid pages', () => {
    const r = ol({
      title: [],
      authors: ['wrong', { name: 42 }],
      publishers: { name: 'wrong' },
      number_of_pages: -1,
      description: { value: [] },
      cover: {
        one: 'http://covers.openlibrary.org/a',
        two: 'https://user@covers.openlibrary.org/a',
        three: 'https://evil.test/a',
        four: 'file:///a',
      },
    });
    expect(r.title).toBeUndefined();
    expect(r.authors).toEqual([]);
    expect(r.publishers).toEqual([]);
    expect(r.pages).toBeUndefined();
    expect(r.description).toBeUndefined();
    expect(r.covers).toEqual([]);
    expect(ol({ description: ' text ' }).description).toBe('text');
    for (const pages of [NaN, Infinity, 1.5, '42'])
      expect(ol({ number_of_pages: pages }).pages).toBeUndefined();
  });
  it('selects exact Google ISBN, not first/similar title', () => {
    const r = gb(
      {
        items: [
          {},
          item('9780804429573'),
          item(isbn, {
            authors: [' A ', 'A', 4],
            publisher: ' Press ',
            publishedDate: '2002-04',
            language: 'en',
            pageCount: 123,
            categories: ['Science', 'Science'],
            description: 'Description',
            imageLinks: { thumbnail: 'https://books.google.com/books/content?id=x' },
          }),
        ],
      },
      '0306406152',
    )!;
    expect(r.title).toBe('Google title');
    expect(r.authors).toEqual(['A']);
    expect(r.publishers).toEqual(['Press']);
    expect(r.publicationDate).toBe('2002-04');
    expect(r.languages).toEqual(['en']);
    expect(r.pages).toBe(123);
    expect(r.subjects).toEqual(['Science']);
    expect(r.covers).toHaveLength(1);
    expect(r.contributors).toEqual([]);
    expect(r.provenance.description).toBe('googleBooks');
    for (const field of [
      'title',
      'authors',
      'publishers',
      'publicationDate',
      'languages',
      'pages',
      'description',
      'subjects',
      'covers',
      'identifiers.isbn13',
    ])
      expect(r.provenance[field]).toBe('googleBooks');
    expect(gb({ items: [item('9780804429573'), item('9780306406158')] }, isbn)).toBeNull();
  });
  it('ignores invalid and contradictory Google identifiers', () => {
    const r = gb(
      {
        items: [
          item(isbn, {
            industryIdentifiers: [
              { type: 'ISBN_13', identifier: isbn },
              { type: 'ISBN_10', identifier: '080442957X' },
              { type: 'ISBN_10', identifier: 'bad' },
            ],
            pageCount: -1,
          }),
        ],
      },
      isbn,
    )!;
    expect(r.identifiers).toEqual({ isbn10: [], isbn13: [isbn] });
    expect(r.pages).toBeUndefined();
  });
  it('isolates provider failures and does not request invalid ISBN', async () => {
    const lookup = vi.fn(async () => ol({ title: 'Result' }));
    const good: MetadataProvider = { id: 'openLibrary', lookup };
    const bad: MetadataProvider = {
      id: 'googleBooks',
      lookup: async () => {
        throw new Error('offline');
      },
    };
    await expect(lookupMetadata('', 'bad', [good, bad])).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
    await expect(lookupMetadata('080442957X', isbn, [good])).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
    const result = await lookupMetadata('', isbn, [good, bad]);
    expect(result[0].result?.title).toBe('Result');
    expect(result[1].error).toBe('metadata.unavailable');
    expect(
      (await lookupMetadata('', isbn, [{ id: 'openLibrary', lookup: async () => null }]))[0].result,
    ).toBeUndefined();
  });
});
describe('M2-A explicit draft merge', () => {
  const open = ol({
    title: 'Open title',
    authors: [{ name: 'Open author' }],
    description: 'Synopsis',
    identifiers: { isbn_13: [isbn] },
    number_of_pages: 42,
  });
  const google = gb({ items: [item()] }, isbn)!;
  it('defaults manual fields to current and empty fields to a provider without mutation', () => {
    const b = { ...emptyBook(), title: 'Manual', isbn13: '9791090636071' };
    const before = structuredClone(b);
    const s = defaultSelection(b, [open, google]);
    expect(s.title).toBe('current');
    expect(s.isbn13).toBe('current');
    expect(s.pages).toBe('openLibrary');
    expect(b).toEqual(before);
    const manual = {
      ...b,
      subtitle: 'Manual subtitle',
      publisher: 'Manual publisher',
      publication_year: 1999,
      pages: 50,
      language: 'tr',
      isbn10: '0306406152',
      contributors: [{ name: 'Manual author', role: 'Author' }],
      extra: { synopsis: 'Manual synopsis' },
    };
    const keep = defaultSelection(manual, [open, google]);
    for (const key of metadataKeys) expect(keep[key]).toBe('current');
    expect(applySelection(manual, [open, google], keep)).toEqual(manual);
  });
  it('applies independent fields only, preserving non-author roles', () => {
    const b = {
      ...emptyBook(),
      title: 'Manual',
      contributors: [
        { name: 'Manual author', role: 'Author' },
        { name: 'Translator', role: 'Translator' },
      ],
      extra: { synopsis: 'Manual synopsis' },
    };
    const next = applySelection(b, [open, google], { title: 'googleBooks' });
    expect(next).toEqual({ ...b, title: 'Google title' });
    expect(b.title).toBe('Manual');
    const authors = applySelection(b, [open, google], { authors: 'openLibrary' });
    expect(authors.contributors).toEqual([
      { name: 'Translator', role: 'Translator' },
      { name: 'Open author', role: 'Author' },
    ]);
    expect(authors.extra.synopsis).toBe('Manual synopsis');
    expect(authors.isbn13).toBe('');
    expect(
      applySelection(b, [open], { synopsis: 'openLibrary', isbn13: 'openLibrary' }).extra.synopsis,
    ).toBe('Synopsis');
    expect(applySelection(b, [open], { isbn13: 'openLibrary' }).isbn13).toBe(isbn);
  });
});
