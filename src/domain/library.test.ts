import { describe, it, expect } from 'vitest';
import { duplicates, emptyBook, locationName, progress, type Snapshot } from './types';
import { filterBooks } from './filter';
import {
  exportCsv,
  exportJson,
  mappedBook,
  parseCsv,
  parseJson,
  preview,
  validateBook,
} from '../services/transfer';
describe('library domain', () => {
  it('calculates progress safely', () => {
    const b = emptyBook();
    expect(progress(b)).toBe(0);
    b.pages = 200;
    b.current_page = 50;
    expect(progress(b)).toBe(25);
    b.current_page = 300;
    expect(progress(b)).toBe(100);
  });
  it('warns on normalized ISBN and preserves intentional copies', () => {
    const a = { ...emptyBook(), id: 'a', title: 'One', isbn13: '978-1234567890' };
    const b = { ...emptyBook(), id: 'b', title: 'Two', isbn13: '9781234567890' };
    expect(duplicates(b, [a])).toHaveLength(1);
    expect(duplicates(a, [a])).toHaveLength(0);
  });
  it('matches title plus author, not unrelated same-title books', () => {
    const a = {
      ...emptyBook(),
      id: 'a',
      title: ' Home ',
      contributors: [{ name: 'Jane', role: 'Author' }],
    };
    expect(duplicates({ ...a, id: 'b' }, [a])).toHaveLength(1);
    expect(
      duplicates({ ...a, id: 'b', contributors: [{ name: 'John', role: 'Author' }] }, [a]),
    ).toHaveLength(0);
  });
  it('builds location paths and terminates cycles defensively', () => {
    const places = [
      { id: 'r', name: 'Study' },
      { id: 'b', name: 'Bookcase 2', parent_id: 'r' },
      { id: 's', name: 'Shelf 4', parent_id: 'b' },
    ];
    expect(locationName('s', places)).toBe('Study / Bookcase 2 / Shelf 4');
    expect(locationName('a', [{ id: 'a', name: 'A', parent_id: 'a' }])).toBe('A');
  });
  it('combines relational, year, loan and hierarchical location filters', () => {
    const a = {
      ...emptyBook(),
      id: 'a',
      title: 'Zulu',
      location_id: 's',
      status: 'Reading',
      publication_year: 2001,
      terms: { genre: ['History'], tag: ['Keep'] },
    };
    const b = { ...emptyBook(), id: 'b', title: 'Alpha', publication_year: 1990 };
    const d = {
      books: [a, b],
      searchIds: null,
      loans: [{ copy_id: 'a', returned_date: '' }],
      locations: [
        { id: 'r', name: 'Room' },
        { id: 's', name: 'Shelf', parent_id: 'r' },
      ],
    } as Snapshot;
    expect(
      filterBooks(
        d,
        { genre: 'History', minYear: '2000', lent: 'yes', location_id: 'r' },
        'title',
        false,
      ).map((b) => b.id),
    ).toEqual(['a']);
    expect(filterBooks(d, {}, 'title', false).map((b) => b.id)).toEqual(['b', 'a']);
    expect(filterBooks({ ...d, searchIds: ['b'] }, {}, 'title', true).map((b) => b.id)).toEqual([
      'b',
    ]);
  });
});
describe('catalogue transfer', () => {
  it('round trips its JSON catalogue with edition grouping and portable locations', () => {
    const one = {
      ...emptyBook(),
      id: 'copy1',
      edition_id: 'edition1',
      title: 'Shared edition',
      location_id: 'shelf',
      copy_extra: { inventory_code: 'Copy #1', purchase_price: 12 },
    };
    const two = {
      ...one,
      id: 'copy2',
      condition: 'Poor',
      copy_extra: { inventory_code: 'Copy #2', purchase_price: 25 },
    };
    const data = {
      locations: [
        { id: 'room', name: 'Study', extra: { kind: 'Room' } },
        { id: 'case', name: 'Case', parent_id: 'room', extra: { kind: 'Bookcase' } },
        { id: 'shelf', name: 'Shelf', parent_id: 'case', extra: { kind: 'Shelf' } },
      ],
      fields: [],
    } as unknown as Snapshot;
    const text = exportJson([one, two], data);
    const imported = parseJson(text);
    expect(imported.map((b) => b.title)).toEqual(['Shared edition', 'Shared edition']);
    expect(imported[0].copy_extra.purchase_price).toBe(12);
    expect(imported[1].condition).toBe('Poor');
    const transfer = JSON.parse(text).books.map((b: { transfer: unknown }) => b.transfer);
    expect(transfer[0]).toMatchObject({
      edition_key: 'edition1',
      location: ['Study', 'Case', 'Shelf'],
      location_kinds: ['Room', 'Bookcase', 'Shelf'],
    });
    expect(transfer[1].edition_key).toBe(transfer[0].edition_key);
    expect(imported.every((b) => b.id === '' && b.edition_id === '')).toBe(true);
  });
  it('round trips CSV fields and multiple authors through the import mapper', () => {
    const book = {
      ...emptyBook(),
      title: 'A, book',
      pages: 210,
      contributors: [
        { role: 'Author', name: 'Ada' },
        { role: 'Author', name: 'Lin' },
      ],
      terms: { genre: ['History'], tag: ['Keep'] },
    };
    const parsed = parseCsv(exportCsv([book]));
    const copy = mappedBook(parsed.rows[0], Object.fromEntries(parsed.columns.map((c) => [c, c])));
    expect(validateBook(copy)).toEqual([]);
    expect(copy.title).toBe(book.title);
    expect(copy.pages).toBe(210);
    expect(copy.contributors).toEqual(book.contributors);
    expect(copy.terms.tag).toEqual(['Keep']);
  });
  it('directs backup manifests to Restore Backup without accepting them as books', () => {
    expect(() =>
      parseJson(JSON.stringify({ application: 'MyLibrary', format: 1, schema: 1 })),
    ).toThrow('Use Restore Backup instead');
  });
  it('exports CSV locations as portable paths and rejects malformed paths during preview', () => {
    const b = { ...emptyBook(), title: 'Portable CSV', location_id: 'source-shelf' };
    const data = {
      locations: [
        { id: 'room', name: 'Study' },
        { id: 'source-shelf', name: 'Shelf / special', parent_id: 'room' },
      ],
      fields: [],
    } as unknown as Snapshot;
    const parsed = parseCsv(exportCsv([b], data));
    expect(parsed.columns).not.toContain('location_id');
    const result = mappedBook(
      parsed.rows[0],
      Object.fromEntries(parsed.columns.map((c) => [c, c])),
    );
    expect(result.transfer?.location).toEqual(['Study', 'Shelf / special']);
    expect(result.location_id).toBe('');
    expect(
      validateBook(
        mappedBook(
          { title: 'A', location_path: 'bad' },
          { title: 'title', location_path: 'location_path' },
        ),
      ),
    ).toContain('Location path must be a JSON array of location names.');
  });
  it('maps arbitrary headers, quoted delimiters and multiple contributors', () => {
    const p = parseCsv('Book name,Writer,Pages\n"A, B",Jane; John,200');
    expect(p.errors).toEqual([]);
    const b = mappedBook(p.rows[0], { 'Book name': 'title', Writer: 'authors', Pages: 'pages' });
    expect(b.title).toBe('A, B');
    expect(b.contributors).toHaveLength(2);
    expect(b.pages).toBe(200);
  });
  it('validates without silently coercing invalid numbers', () => {
    const b = mappedBook({ Title: 'Book', Pages: 'bad' }, { Title: 'title', Pages: 'pages' });
    expect(validateBook(b)).toContain('pages must be a number');
    expect(validateBook({ ...emptyBook(), title: 'A', rating: 4.3 })).toContain(
      'Rating must be 0–5 in half-star increments',
    );
  });
  it('flags duplicates inside an import and validates every row', () => {
    const b = { ...emptyBook(), title: 'Book' };
    const result = preview([b, b, { ...b, title: '' }], []);
    expect(result[1].duplicates).toHaveLength(1);
    expect(result[2].errors).toContain('Title is required');
  });
  it('exports CSV with formula injection protection', () => {
    const text = exportCsv([{ ...emptyBook(), title: '=1+1' }]);
    expect(text).toContain("'=1+1");
  });
  it('round trips nested book data in JSON without reusing internal IDs', () => {
    const b = {
      ...emptyBook(),
      id: 'old',
      edition_id: 'edition',
      title: 'Book',
      cover: 'covers/local.jpg',
      extra: { original_title: 'Original' },
    };
    const [copy] = parseJson(JSON.stringify({ books: [b] }));
    expect(copy.title).toBe('Book');
    expect(copy.id).toBe('');
    expect(copy.cover).toBe('');
    expect(copy.extra.original_title).toBe('Original');
    expect(() => parseJson('{}')).toThrow();
  });
});
