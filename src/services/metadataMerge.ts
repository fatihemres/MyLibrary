import type { Book } from '../domain/types';
import type { MetadataResult, ProviderId } from './metadata';
export const metadataKeys = [
  'title',
  'subtitle',
  'authors',
  'publisher',
  'publication_year',
  'pages',
  'language',
  'synopsis',
  'isbn10',
  'isbn13',
] as const;
export type MetadataKey = (typeof metadataKeys)[number];
export type Selection = Partial<Record<MetadataKey, ProviderId | 'current'>>;
export function candidateValues(r: MetadataResult): Record<MetadataKey, string> {
  const year = r.publicationDate?.match(/\b([1-9]\d{3})\b/)?.[1] || '';
  return {
    title: r.title || '',
    subtitle: r.subtitle || '',
    authors: r.authors.join('; '),
    publisher: r.publishers.join('; '),
    publication_year: year,
    pages: r.pages === undefined ? '' : String(r.pages),
    language: r.languages.join(', '),
    synopsis: r.description || '',
    isbn10: r.identifiers.isbn10[0] || '',
    isbn13: r.identifiers.isbn13[0] || '',
  };
}
export function currentValues(b: Book): Record<MetadataKey, string> {
  return {
    title: b.title,
    subtitle: b.subtitle,
    authors: b.contributors
      .filter((p) => p.role === 'Author')
      .map((p) => p.name)
      .join('; '),
    publisher: b.publisher,
    publication_year: b.publication_year === null ? '' : String(b.publication_year),
    pages: b.pages === null ? '' : String(b.pages),
    language: b.language,
    synopsis: String(b.extra.synopsis || ''),
    isbn10: b.isbn10,
    isbn13: b.isbn13,
  };
}
export function defaultSelection(book: Book, results: MetadataResult[]): Selection {
  const current = currentValues(book);
  return Object.fromEntries(
    metadataKeys.map((key) => [
      key,
      current[key].trim()
        ? 'current'
        : results.find((r) => candidateValues(r)[key] !== '')?.provider || 'current',
    ]),
  );
}
export function applySelection(book: Book, results: MetadataResult[], selection: Selection): Book {
  const next = structuredClone(book);
  for (const key of metadataKeys) {
    const result = results.find((r) => r.provider === selection[key]);
    if (!result) continue;
    const value = candidateValues(result)[key];
    if (value === '') continue;
    if (key === 'authors')
      next.contributors = [
        ...next.contributors.filter((p) => p.role !== 'Author'),
        ...result.authors.map((name) => ({ name, role: 'Author' })),
      ];
    else if (key === 'synopsis') next.extra.synopsis = value;
    else if (key === 'pages' || key === 'publication_year') next[key] = Number(value);
    else next[key] = value;
  }
  return next;
}
