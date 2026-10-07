export type Extra = Record<string, string | number | boolean>;
export interface Person {
  id?: string;
  name: string;
  role: string;
}
export interface Entity {
  id: string;
  name: string;
  kind?: string;
  parent_id?: string;
  extra?: Extra;
}
export interface Book {
  id: string;
  edition_id: string;
  copy_number?: number;
  title: string;
  subtitle: string;
  isbn10: string;
  isbn13: string;
  barcode: string;
  publisher: string;
  series: string;
  series_order: number | null;
  publication_year: number | null;
  pages: number | null;
  language: string;
  cover: string;
  location_id: string;
  source: string;
  status: string;
  rating: number | null;
  favorite: boolean;
  current_page: number;
  acquisition_date: string;
  condition: string;
  extra: Extra;
  copy_extra: Extra;
  contributors: Person[];
  terms: Record<string, string[]>;
  custom: Record<string, string>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  transfer?: {
    edition_key?: string;
    location?: string[];
    location_kinds?: string[];
    fields?: Entity[];
    error?: string;
  };
}
export interface Entry {
  id: string;
  copy_id: string;
  kind: string;
  title: string;
  content: string;
  page: number | null;
  extra: Extra;
  created_at: string;
  updated_at: string;
}
export interface Loan {
  id: string;
  copy_id: string;
  borrower: string;
  contact: string;
  loan_date: string;
  due_date: string;
  returned_date: string;
  notes: string;
}
export interface Attachment {
  id: string;
  copy_id: string;
  name: string;
  path: string;
  created_at: string;
}
export interface Snapshot {
  books: Book[];
  searchIds: string[] | null;
  people: Entity[];
  publishers: Entity[];
  series: Entity[];
  locations: Entity[];
  sources: Entity[];
  fields: Entity[];
  terms: Entity[];
  loans: Loan[];
  entries: Entry[];
  attachments: Attachment[];
  settings: { key: string; value: string }[];
  dataDir: string;
}
export const statuses = [
  'Unread',
  'Want to Read',
  'Reading',
  'Paused',
  'Finished',
  'Abandoned',
  'Reference Only',
];
export const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable', 'Poor'];
export const copyName = (book: Book) =>
  String(book.copy_extra.inventory_code || `Copy #${book.copy_number || 1}`);
export const copyState = (book: Book, loans: Loan[]) => {
  if (book.deleted_at) return 'Archived';
  const loan = loans.find((l) => l.copy_id === book.id && !l.returned_date);
  return loan ? `Lent to ${loan.borrower}` : String(book.copy_extra.copy_state || 'Owned');
};
export function withinLocation(id: string, parent: string, locations: Entity[]) {
  const seen = new Set<string>();
  while (id && !seen.has(id)) {
    if (id === parent) return true;
    seen.add(id);
    id = locations.find((l) => l.id === id)?.parent_id || '';
  }
  return false;
}
export const roles = ['Author', 'Translator', 'Editor', 'Illustrator', 'Narrator', 'Contributor'];
export const emptyBook = (): Book => ({
  id: '',
  edition_id: '',
  title: '',
  subtitle: '',
  isbn10: '',
  isbn13: '',
  barcode: '',
  publisher: '',
  series: '',
  series_order: null,
  publication_year: null,
  pages: null,
  language: '',
  cover: '',
  location_id: '',
  source: '',
  status: 'Unread',
  rating: null,
  favorite: false,
  current_page: 0,
  acquisition_date: '',
  condition: 'Good',
  extra: {},
  copy_extra: {},
  contributors: [],
  terms: { genre: [], subgenre: [], category: [], tag: [], collection: [] },
  custom: {},
  created_at: '',
  updated_at: '',
});
export const author = (b: Book) =>
  b.contributors
    .filter((p) => p.role === 'Author')
    .map((p) => p.name)
    .join(', ');
export const progress = (b: Book) =>
  b.pages && b.pages > 0 ? Math.min(100, Math.round((b.current_page / b.pages) * 100)) : 0;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function locationName(id: string, locations: Entity[]): string {
  const names: string[] = [];
  const seen = new Set<string>();
  while (id && !seen.has(id)) {
    seen.add(id);
    const l = locations.find((x) => x.id === id);
    if (!l) break;
    names.unshift(l.name);
    id = l.parent_id || '';
  }
  return names.join(' / ');
}
export function duplicates(b: Book, books: Book[]): Book[] {
  const clean = (s: string) => s.replace(/[-\s]/g, '').toLowerCase();
  return books.filter(
    (x) =>
      (!b.id || x.id !== b.id) &&
      ((b.isbn13 && clean(x.isbn13) === clean(b.isbn13)) ||
        (b.isbn10 && clean(x.isbn10) === clean(b.isbn10)) ||
        (b.barcode && x.barcode === b.barcode) ||
        (b.title.trim() &&
          x.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
          author(x).toLowerCase() === author(b).toLowerCase())),
  );
}
