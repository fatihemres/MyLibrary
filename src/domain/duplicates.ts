import type { Book } from './types';
export interface EditionCandidate {
  book: Book;
  count: number;
  archived: number;
}
export interface DuplicateReport {
  strong: EditionCandidate[];
  weak: EditionCandidate[];
  collisions: { book: Book; barcode: boolean; inventory: boolean }[];
}
export const sharedFields = [
  'title',
  'subtitle',
  'authors',
  'publisher',
  'publication_year',
  'pages',
  'language',
  'isbn10',
  'isbn13',
  'synopsis',
] as const;
export type SharedField = (typeof sharedFields)[number];
export interface DuplicateDecision {
  action: 'separate' | 'existing' | 'skip';
  target?: string;
  fields?: SharedField[];
  reviewed: boolean;
}
export interface ImportGroup {
  group: string;
  rows: number[];
  book: Book;
  report: DuplicateReport;
  incoming: number[];
  incomingWeak: number[];
  incomingCollision: boolean;
}
export function hasSignals(r: DuplicateReport) {
  return !!(r.strong.length || r.weak.length || r.collisions.length);
}
export function requiresDecision(g: ImportGroup) {
  return !!(
    g.report.strong.length ||
    g.report.collisions.length ||
    g.incoming.length ||
    g.incomingCollision
  );
}
export function fieldValue(b: Book, field: SharedField): string {
  if (field === 'authors')
    return b.contributors
      .filter((p) => p.role === 'Author')
      .map((p) => p.name)
      .join('; ');
  if (field === 'synopsis') return String(b.extra.synopsis || '');
  return String(b[field] ?? '');
}
