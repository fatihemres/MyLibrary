import { describe, it, expect } from 'vitest';
import { duplicates, emptyBook, locationName, progress, type Snapshot } from './types';
import { filterBooks } from './filter';
import {
  exportCsv,
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
