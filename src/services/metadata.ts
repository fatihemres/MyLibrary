import { invoke } from '@tauri-apps/api/core';
import { parseIsbn, lookupIsbn } from '../domain/isbn';
export type ProviderId = 'openLibrary' | 'googleBooks';
export interface MetadataSuggestion {
  value: string;
  provider: ProviderId;
}
export interface MetadataResult {
  provider: ProviderId;
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
  seriesSuggestions: MetadataSuggestion[];
  genreSuggestions: MetadataSuggestion[];
  covers: { url: string; provider: ProviderId }[];
  provenance: Record<string, ProviderId>;
}
export interface MetadataProvider {
  id: ProviderId;
  lookup(isbn: string): Promise<MetadataResult | null>;
}
const text = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : undefined);
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const unique = (values: string[]) => [...new Set(values)];
const strings = (v: unknown) => unique(Array.isArray(v) ? v.flatMap((s) => text(s) || []) : []);
const names = (v: unknown) =>
  unique(Array.isArray(v) ? v.flatMap((item) => text(object(item).name) || []) : []);
// Small, deliberately incomplete vocabulary. Subjects are not classifications.
const genreLabels = new Set([
  'fiction',
  'literature',
  'poetry',
  'drama',
  'science fiction',
  'fantasy',
  'historical fiction',
  'detective and mystery stories',
  'mystery',
  'thriller',
  'horror',
  'romance',
  'short stories',
  'biography',
  'autobiography',
  'biography & autobiography',
  'comics & graphic novels',
  'juvenile fiction',
  'young adult fiction',
]);
export const suggestionKey = (value: string) =>
  value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
function boundedLabel(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 200 || /[\p{Cc}\p{Cf}]/u.test(value)) return;
  const label = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  return label && label.length <= 160 ? label : undefined;
}
function suggestions(
  values: unknown[],
  provider: ProviderId,
  series = false,
): MetadataSuggestion[] {
  const found = new Map<string, MetadataSuggestion>();
  for (const value of values.slice(0, 100)) {
    const label = boundedLabel(value);
    if (!label) continue;
    let candidate: string | undefined;
    if (series) {
      // jscmd=data preserves subject names. Require the documented brackets.
      // Community tags are suggestions, not proof of literary-series identity.
      const match = /^\[series:([^[\]]+)\]$/i.exec(label);
      candidate = boundedLabel(match?.[1]);
    } else {
      const parts = provider === 'googleBooks' ? label.split('/').map((p) => p.trim()) : [label];
      if (parts.length <= 4 && parts.every(Boolean) && genreLabels.has(suggestionKey(parts[0])))
        candidate = parts[0];
    }
    if (candidate && !found.has(suggestionKey(candidate)))
      found.set(suggestionKey(candidate), { value: candidate, provider });
    if (found.size >= (series ? 5 : 10)) break;
  }
  return [...found.values()];
}
function identifiers(ten: unknown, thirteen: unknown) {
  const valid = (v: unknown, length: number) =>
    strings(v).flatMap((s) => {
      try {
        const id = parseIsbn(s);
        const compact = s.replace(/[ -]/g, '').toUpperCase();
        return compact.length === length ? [length === 10 ? id.isbn10! : id.isbn13] : [];
      } catch {
        return [];
      }
    });
  return { isbn10: unique(valid(ten, 10)), isbn13: unique(valid(thirteen, 13)) };
}
function covers(v: unknown, provider: ProviderId) {
  return unique(
    Object.values(object(v)).flatMap((value) => {
      if (typeof value !== 'string') return [];
      try {
        const u = new URL(value);
        const host =
          provider === 'openLibrary'
            ? u.hostname === 'covers.openlibrary.org'
            : ['books.google.com', 'books.googleusercontent.com'].includes(u.hostname);
        return u.protocol === 'https:' && host && !u.username && !u.password && !u.port
          ? [u.href]
          : [];
      } catch {
        return [];
      }
    }),
  ).map((url) => ({ url, provider }));
}
function provenance(result: MetadataResult): MetadataResult {
  for (const [key, value] of Object.entries(result)) {
    if (['provider', 'provenance', 'identifiers'].includes(key)) continue;
    if (value !== undefined && (!Array.isArray(value) || value.length))
      result.provenance[key] = result.provider;
  }
  for (const key of ['isbn10', 'isbn13'] as const)
    if (result.identifiers[key].length) result.provenance[`identifiers.${key}`] = result.provider;
  return result;
}
const pages = (v: unknown) =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : undefined;
export function normalizeOpenLibrary(input: unknown): MetadataResult {
  const v = object(input),
    ids = object(v.identifiers);
  return provenance({
    provider: 'openLibrary',
    title: text(v.title),
    subtitle: text(v.subtitle),
    authors: names(v.authors),
    contributors: [],
    publishers: names(v.publishers),
    publicationDate: text(v.publish_date),
    identifiers: identifiers(ids.isbn_10, ids.isbn_13),
    languages: unique((text(v.language)?.split(',') || []).map((s) => s.trim()).filter(Boolean)),
    pages: pages(v.number_of_pages),
    description: text(v.description) || text(object(v.description).value),
    subjects: names(v.subjects),
    seriesSuggestions: suggestions(
      Array.isArray(v.subjects) ? v.subjects.slice(0, 100).map((s) => object(s).name) : [],
      'openLibrary',
      true,
    ),
    genreSuggestions: suggestions(
      Array.isArray(v.subjects) ? v.subjects.slice(0, 100).map((s) => object(s).name) : [],
      'openLibrary',
    ),
    covers: covers(v.cover, 'openLibrary'),
    provenance: {},
  });
}
export function normalizeGoogleBooks(input: unknown, requested: string): MetadataResult | null {
  const requestedId = parseIsbn(requested).isbn13;
  const items = object(input).items;
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    const v = object(object(item).volumeInfo);
    const rawIds = Array.isArray(v.industryIdentifiers) ? v.industryIdentifiers : [];
    const ids = identifiers(
      rawIds.filter((i) => object(i).type === 'ISBN_10').map((i) => object(i).identifier),
      rawIds.filter((i) => object(i).type === 'ISBN_13').map((i) => object(i).identifier),
    );
    if (![...ids.isbn10, ...ids.isbn13].some((id) => parseIsbn(id).isbn13 === requestedId))
      continue;
    // Keep only identifiers of the matched edition, not contradictory provider IDs.
    ids.isbn10 = ids.isbn10.filter((id) => parseIsbn(id).isbn13 === requestedId);
    ids.isbn13 = ids.isbn13.filter((id) => id === requestedId);
    return provenance({
      provider: 'googleBooks',
      title: text(v.title),
      subtitle: text(v.subtitle),
      authors: strings(v.authors),
      contributors: [],
      publishers: text(v.publisher) ? [text(v.publisher)!] : [],
      publicationDate: text(v.publishedDate),
      identifiers: ids,
      languages: text(v.language) ? [text(v.language)!] : [],
      pages: pages(v.pageCount),
      description: text(v.description),
      subjects: strings(v.categories),
      seriesSuggestions: [], // IDs/display numbers do not establish a series name.
      genreSuggestions: suggestions(Array.isArray(v.categories) ? v.categories : [], 'googleBooks'),
      covers: covers(v.imageLinks, 'googleBooks'),
      provenance: {},
    });
  }
  return null;
}
export const openLibraryProvider: MetadataProvider = {
  id: 'openLibrary',
  lookup: async (isbn) => {
    const input = await invoke<unknown>('isbn_lookup', { isbn: parseIsbn(isbn).isbn13 });
    return input && typeof input === 'object' && !Array.isArray(input)
      ? normalizeOpenLibrary(input)
      : null;
  },
};
export const googleBooksProvider: MetadataProvider = {
  id: 'googleBooks',
  lookup: async (isbn) =>
    normalizeGoogleBooks(
      await invoke('google_books_lookup', { isbn: parseIsbn(isbn).isbn13 }),
      isbn,
    ),
};
export interface ProviderOutcome {
  provider: ProviderId;
  result?: MetadataResult;
  error?: string;
}
export async function lookupMetadata(
  isbn10: string,
  isbn13: string,
  providers: MetadataProvider[] = [openLibraryProvider, googleBooksProvider],
): Promise<ProviderOutcome[]> {
  const isbn = lookupIsbn(isbn10, isbn13).isbn13;
  return Promise.all(
    providers.map(async (p) => {
      try {
        const result = await p.lookup(isbn);
        return { provider: p.id, ...(result ? { result } : {}) };
      } catch (e) {
        const key = String(e).replace(/^Error: /, '');
        return {
          provider: p.id,
          error: ['metadata.tooLarge', 'metadata.malformed'].includes(key)
            ? key
            : 'metadata.unavailable',
        };
      }
    }),
  );
}
// Compatibility adapter for existing callers; never passes raw provider JSON.
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
