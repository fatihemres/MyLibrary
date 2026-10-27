import type { Filters } from './filter';
import { describe, it, expect } from 'vitest';
import { emptyBook, type Snapshot } from './types';
import { filterBooks, editionCards, validateCriteria, visibleFilter } from './filter';
describe('M3-A bounded copy-aware criteria', () => {
  const a = {
    ...emptyBook(),
    id: 'a',
    edition_id: 'one',
    title: 'Same',
    status: 'Reading',
    location_id: 'shelf',
    rating: 4,
    publication_year: 2001,
    source: 'Shop',
    acquisition_date: '2024-02-01',
  };
  const b = {
    ...a,
    id: 'b',
    status: 'Finished',
    location_id: 'other',
    rating: null,
    publication_year: null,
  };
  const c = { ...a, id: 'c', edition_id: 'two' };
  const data = { books: [a, b, c], loans: [], locations: [] } as unknown as Snapshot;
  it('never combines criteria from different copies or groups titles', () => {
    expect(filterBooks(data, { status: 'Finished', location_id: 'shelf' }, 'title', false)).toEqual(
      [],
    );
    expect(
      editionCards(filterBooks(data, { status: 'Reading' }, 'title', false), data.books),
    ).toHaveLength(2);
  });
  it('combines acquisition and rating/year criteria with null rejection', () => {
    expect(
      filterBooks(
        data,
        { source: 'Shop', acquisitionYear: '2024', minYear: '2000', maxYear: '2002', rating: '4' },
        'title',
        false,
      ).map((b) => b.id),
    ).toEqual(['a', 'c']);
    expect(filterBooks(data, { acquisitionYear: '2023' }, 'title', false)).toEqual([]);
  });
  it.each<Filters>([
    { minYear: '2002', maxYear: '2000' },
    { rating: 'NaN' },
    { rating: '6' },
    { minYear: 'Infinity' },
    { acquisitionYear: '20' },
    { unknown: 'x' },
    { author: 'x'.repeat(513) },
  ])('rejects invalid criteria %j', (filters) => {
    expect(validateCriteria({ query: '', filters })).toBe(false);
    expect(filterBooks(data, filters, 'title', false)).toEqual([]);
  });
  it('bounds query complexity without accepting FTS syntax as rules', () => {
    expect(validateCriteria({ query: 'x'.repeat(1025), filters: {} })).toBe(false);
    expect(validateCriteria({ query: 'a '.repeat(33), filters: {} })).toBe(false);
    expect(validateCriteria({ query: '" OR *', filters: {} })).toBe(true);
  });
  it('keeps active detailed criteria visible without changing their values', () => {
    const filters = { source: 'Shop', minYear: '2000' };
    const original = { ...filters };
    expect(visibleFilter('source', false, filters)).toBe(true);
    expect(visibleFilter('tag', false, filters)).toBe(false);
    expect(visibleFilter('tag', true, filters)).toBe(true);
    expect(visibleFilter('author', false, {})).toBe(true);
    expect(filters).toEqual(original);
  });
  it('preserves sorting through existing table columns', () => {
    expect(filterBooks(data, {}, 'status', false).map((b) => b.id)).toEqual(['b', 'a', 'c']);
    expect(filterBooks(data, {}, 'status', true).map((b) => b.id)).toEqual(['a', 'c', 'b']);
  });
  it('preserves empty filters, empty FTS results and stable null ordering', () => {
    expect(filterBooks(data, { source: '' }, 'title', false)).toHaveLength(3);
    expect(filterBooks({ ...data, searchIds: [] }, {}, 'title', false)).toEqual([]);
    const nulls = {
      ...data,
      books: [
        { ...b, id: 'z' },
        { ...b, id: 'd' },
      ],
    };
    expect(filterBooks(nulls, {}, 'rating', true).map((b) => b.id)).toEqual(['d', 'z']);
  });
});
