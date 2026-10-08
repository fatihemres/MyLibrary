import { invoke } from '@tauri-apps/api/core';
export interface MetadataResult {
  provider: string;
  title?: string;
  subtitle?: string;
  authors: string[];
  contributors: { name: string; role: string }[];
  publishers: string[];
  publicationDate?: string;
  identifiers: { isbn10: string[]; isbn13: string[] };
  languages: string[];
  pages?: number;
  description?: string;
  subjects: string[];
  covers: { url: string; provider: string }[];
  provenance: Record<string, string>;
}
export interface MetadataProvider {
  id: string;
  lookup(isbn: string): Promise<MetadataResult>;
}
const text = (v: unknown) => (typeof v === 'string' ? v : undefined);
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
const strings = (v: unknown) =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
const names = (v: unknown) =>
  Array.isArray(v) ? v.flatMap((item) => text(object(item).name) || []) : [];
export function normalizeOpenLibrary(input: unknown): MetadataResult {
  const v = object(input),
    identifiers = object(v.identifiers);
  const result: MetadataResult = {
    provider: 'openLibrary',
    title: text(v.title),
    subtitle: text(v.subtitle),
    authors: names(v.authors),
    contributors: [],
    publishers: names(v.publishers),
    publicationDate: text(v.publish_date),
    identifiers: { isbn10: strings(identifiers.isbn_10), isbn13: strings(identifiers.isbn_13) },
    languages:
      text(v.language)
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) || [],
    pages:
      typeof v.number_of_pages === 'number' &&
      Number.isInteger(v.number_of_pages) &&
      v.number_of_pages >= 0
        ? v.number_of_pages
        : undefined,
    description: text(v.description) || text(object(v.description).value),
    subjects: names(v.subjects),
    covers: Object.values(object(v.cover)).flatMap((value) => {
      if (typeof value !== 'string') return [];
      try {
        const u = new URL(value);
        return u.protocol === 'https:' && u.hostname === 'covers.openlibrary.org'
          ? [{ url: u.href, provider: 'openLibrary' }]
          : [];
      } catch {
        return [];
      }
    }),
    provenance: {},
  };
  for (const [field, value] of Object.entries(result)) {
    if (field !== 'provenance' && value !== undefined && (!Array.isArray(value) || value.length))
      result.provenance[field] = 'openLibrary';
  }
  return result;
}
// Adapter retains V1's explicit user-requested lookup; no new provider or network behavior.
export const openLibraryProvider: MetadataProvider = {
  id: 'openLibrary',
  lookup: async (isbn) => normalizeOpenLibrary(await invoke('isbn_lookup', { isbn })),
};
export function metadataFields(result: MetadataResult): Record<string, unknown> {
  return {
    title: result.title,
    subtitle: result.subtitle,
    authors: result.authors.map((name) => ({ name })),
    publishers: result.publishers.map((name) => ({ name })),
    publish_date: result.publicationDate,
    number_of_pages: result.pages,
    language: result.languages.join(', '),
    description: result.description,
    cover: result.covers.length ? { large: result.covers[0].url } : undefined,
  };
}
