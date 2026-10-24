import { author, locationName, type Book, type Snapshot } from './types';
export type Filters = Record<string, string>;
export const filterLabels: Record<string, string> = {
  author: 'Author',
  publisher: 'Publisher',
  genre: 'Genre',
  tag: 'Tag',
  language: 'Language',
  series: 'Series',
  status: 'Reading status',
  condition: 'Condition',
  minYear: 'Year from',
  maxYear: 'Year to',
  acquisitionYear: 'Acquired in year',
  rating: 'Minimum rating',
  favorite: 'Favorites',
  signed: 'Signed copies',
  first_edition: 'First editions',
  lent: 'Lent out',
  location_id: 'Location',
  source: 'Acquisition source',
};
export const conciseFilters = new Set(['author', 'genre', 'status', 'location_id']);
export function visibleFilter(key: string, detailed: boolean, filters: Filters) {
  return detailed || conciseFilters.has(key) || Boolean(filters[key]);
}
/** A bounded conjunction, independent of presentation; never persisted as SQL or rules. */
export interface SearchCriteria {
  query: string;
  filters: Filters;
}
export function validateCriteria({ query, filters }: SearchCriteria): boolean {
  if (query.length > 1024 || query.trim().split(/\s+/).filter(Boolean).length > 32) return false;
  if (Object.keys(filters).length > Object.keys(filterLabels).length) return false;
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value !== 'string' || value.length > 512 || !Object.hasOwn(filterLabels, key))
      return false;
    if (!value) continue;
    if (['minYear', 'maxYear', 'acquisitionYear'].includes(key) && !/^[1-9]\d{0,3}$/.test(value))
      return false;
    if (key === 'acquisitionYear' && value.length !== 4) return false;
    if (key === 'rating' && !/^(?:[0-4](?:\.5)?|5)$/.test(value)) return false;
    if (
      ['favorite', 'signed', 'first_edition', 'lent'].includes(key) &&
      !['yes', 'no'].includes(value)
    )
      return false;
  }
  return !(filters.minYear && filters.maxYear && Number(filters.minYear) > Number(filters.maxYear));
}
export function navigationFilters(view: string): Filters {
  if (view === 'Finished' || view === 'Unread' || view === 'Want to Read') return { status: view };
  if (view === 'Currently Reading') return { status: 'Reading' };
  if (view === 'Favorites') return { favorite: 'yes' };
  return {};
}
// Filter copies first: every active criterion must match the same physical copy.
// Group only by the stored edition relationship, never by title or ISBN.
export function editionCards(matching: Book[], all: Book[], trash = false) {
  const groups = new Map<string, Book[]>();
  const totals = new Map<string, number>();
  const key = (b: Book) => (trash ? b.id : b.edition_id || b.id);
  all.forEach((b) => totals.set(key(b), (totals.get(key(b)) || 0) + 1));
  matching.forEach((b) => groups.set(key(b), [...(groups.get(key(b)) || []), b]));
  return [...groups.entries()].map(([id, copies]) => ({
    ...copies[0],
    copyCount: totals.get(id) || copies.length,
    matchingIds: copies.map((b) => b.id),
    readingLabel:
      new Set(copies.map((b) => b.status)).size === 1 ? copies[0].status : 'Mixed reading statuses',
  }));
}
export function filterBooks(data: Snapshot, filters: Filters, sort: string, desc: boolean) {
  if (!validateCriteria({ query: '', filters })) return [];
  const active = new Set(data.loans.filter((l) => !l.returned_date).map((l) => l.copy_id));
  const matches = data.searchIds ? new Set(data.searchIds) : null;
  const result = data.books.filter(
    (b) =>
      (!matches || matches.has(b.id)) &&
      Object.entries(filters).every(([key, v]) => {
        if (!v) return true;
        switch (key) {
          case 'author':
            return b.contributors.some((p) => p.name === v && p.role === 'Author');
          case 'genre':
          case 'tag':
            return b.terms[key]?.includes(v);
          case 'minYear':
            return b.publication_year !== null && b.publication_year >= Number(v);
          case 'maxYear':
            return b.publication_year !== null && b.publication_year <= Number(v);
          case 'acquisitionYear':
            return b.acquisition_date.slice(0, 4) === v;
          case 'rating':
            return b.rating !== null && b.rating >= Number(v);
          case 'favorite':
            return b.favorite === (v === 'yes');
          case 'signed':
          case 'first_edition':
            return !!b.copy_extra[key] === (v === 'yes');
          case 'lent':
            return active.has(b.id) === (v === 'yes');
          case 'location_id': {
            let id = b.location_id;
            const seen = new Set<string>();
            while (id && !seen.has(id)) {
              if (id === v) return true;
              seen.add(id);
              id = data.locations.find((l) => l.id === id)?.parent_id || '';
            }
            return false;
          }
          default:
            return String(b[key as keyof Book]) === v;
        }
      }),
  );
  if (
    ![
      'title',
      'isbn13',
      'publisher',
      'language',
      'status',
      'author',
      'location',
      'created_at',
      'publication_year',
      'rating',
      'pages',
      'acquisition_date',
      'updated_at',
      'series_order',
    ].includes(sort)
  )
    sort = 'title';
  const value = (b: Book): string | number | null =>
    sort === 'author'
      ? author(b)
      : sort === 'location'
        ? locationName(b.location_id, data.locations)
        : (b[sort as keyof Book] as string | number | null);
  return result.sort((a, b) => {
    const av = value(a),
      bv = value(b);
    if (av === null && bv === null) return a.id.localeCompare(b.id);
    if (av === null) return 1;
    if (bv === null) return -1;
    const n =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return (desc ? -1 : 1) * n || a.id.localeCompare(b.id);
  });
}
