import { author, locationName, type Book, type Snapshot } from './types';
export type Filters = Record<string, string>;
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
            return b.acquisition_date.startsWith(v);
          case 'rating':
            return b.rating !== null && b.rating >= Number(v);
          case 'favorite':
            return b.favorite;
          case 'signed':
          case 'first_edition':
            return !!b.copy_extra[key];
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
  const value = (b: Book): string | number | null =>
    sort === 'author'
      ? author(b)
      : sort === 'location'
        ? locationName(b.location_id, data.locations)
        : (b[sort as keyof Book] as string | number | null);
  return result.sort((a, b) => {
    const av = value(a),
      bv = value(b);
    if (av === null) return 1;
    if (bv === null) return -1;
    const n =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return (desc ? -1 : 1) * n || a.id.localeCompare(b.id);
  });
}
