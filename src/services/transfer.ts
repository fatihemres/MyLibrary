import Papa from 'papaparse';
import { emptyBook, duplicates, statuses, conditions, type Book } from '../domain/types';
export const importFields = [
  'title',
  'subtitle',
  'original_title',
  'authors',
  'translators',
  'editors',
  'isbn10',
  'isbn13',
  'barcode',
  'publisher',
  'publication_year',
  'pages',
  'language',
  'series',
  'series_order',
  'genre',
  'tag',
  'status',
  'rating',
  'current_page',
  'acquisition_date',
  'source',
  'condition',
  'synopsis',
  'personal_notes',
  'location_id',
] as const;
export function parseCsv(text: string) {
  const result = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
  });
  return {
    rows: result.data,
    columns: result.meta.fields || [],
    errors: result.errors.map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`),
  };
}
export function mappedBook(row: Record<string, string>, mapping: Record<string, string>): Book {
  const b = emptyBook();
  for (const [column, key] of Object.entries(mapping)) {
    const value = (row[column] || '').trim();
    if (!value || !key) continue;
    if (['authors', 'translators', 'editors'].includes(key)) {
      b.contributors.push(
        ...value
          .split(';')
          .filter(Boolean)
          .map((name) => ({
            name: name.trim(),
            role: key === 'authors' ? 'Author' : key === 'translators' ? 'Translator' : 'Editor',
          })),
      );
    } else if (['genre', 'tag'].includes(key)) {
      b.terms[key] = value
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (
      ['pages', 'publication_year', 'series_order', 'rating', 'current_page'].includes(key)
    ) {
      Object.assign(b, { [key]: Number(value) });
    } else if (['original_title', 'synopsis'].includes(key)) {
      b.extra[key] = value;
    } else if (key === 'personal_notes') {
      b.copy_extra[key] = value;
    } else {
      Object.assign(b, { [key]: value });
    }
  }
  return b;
}
export function validateBook(b: Book): string[] {
  const errors: string[] = [];
  if (!b.title?.trim()) errors.push('Title is required');
  for (const key of [
    'pages',
    'publication_year',
    'series_order',
    'rating',
    'current_page',
  ] as const) {
    if (b[key] !== null && !Number.isFinite(b[key])) errors.push(`${key} must be a number`);
  }
  if ((b.pages ?? 0) < 0 || b.current_page < 0) errors.push('Page counts cannot be negative');
  for(const key of ['pages','publication_year','current_page'] as const) {
    if(b[key]!==null&&!Number.isInteger(b[key]))errors.push(`${key} must be a whole number`);
  }
  if(!statuses.includes(b.status))errors.push('Unknown reading status');
  if(!conditions.includes(b.condition))errors.push('Unknown physical condition');
  if (b.pages !== null && b.current_page > b.pages) errors.push('Current page exceeds total pages');
  if (b.rating !== null && (b.rating < 0 || b.rating > 5 || (b.rating * 2) % 1))
    errors.push('Rating must be 0–5 in half-star increments');
  for(const [label,date] of [['Acquisition date',b.acquisition_date],['Start date',b.copy_extra.date_started],['Finish date',b.copy_extra.date_finished]]) {
    if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!Number.isFinite(Date.parse(String(date)))||new Date(String(date)).toISOString().slice(0,10)!==date))errors.push(`${label} must be a valid YYYY-MM-DD date`);
  }
  return errors;
}
export function preview(books: Book[], existing: Book[]) {
  return books.map((book, i) => ({
    book,
    row: i + 1,
    errors: validateBook(book),
    duplicates: duplicates(book, [...existing, ...books.slice(0, i)]),
  }));
}
export function exportCsv(books: Book[]) {
  return Papa.unparse(
    books.map((b) => ({
      title: b.title,
      subtitle: b.subtitle,
      authors: b.contributors.filter(p=>p.role==='Author').map(p=>p.name).join(';'),
      translators: b.contributors
        .filter((p) => p.role === 'Translator')
        .map((p) => p.name)
        .join(';'),
      isbn10: b.isbn10,
      isbn13: b.isbn13,
      barcode: b.barcode,
      publisher: b.publisher,
      publication_year: b.publication_year,
      pages: b.pages,
      language: b.language,
      series: b.series,
      series_order: b.series_order,
      genre: b.terms.genre.join(';'),
      tag: b.terms.tag.join(';'),
      status: b.status,
      rating: b.rating,
      current_page: b.current_page,
      acquisition_date: b.acquisition_date,
      source: b.source,
      condition: b.condition,
      location_id: b.location_id,
      synopsis: b.extra.synopsis || '',
      personal_notes: b.copy_extra.personal_notes || '',
    })),
    { escapeFormulae: true },
  );
}
export function parseJson(text: string): Book[] {
  const data: unknown = JSON.parse(text);
  const values = Array.isArray(data) ? data : (data as { books?: unknown[] })?.books;
  if (!Array.isArray(values))
    throw new Error('Expected a JSON array or an object containing books.');
  return values.map((v,index) => {
    const fail=(detail:string):never=>{throw new Error(`JSON row ${index+1}: ${detail}`);};
    if (!v || typeof v !== 'object'||Array.isArray(v)) return fail('Each book must be an object.');
    const record=v as Record<string,unknown>;
    const base=emptyBook();
    for(const [key,defaultValue] of Object.entries(base)){
      if(typeof defaultValue==='string'&&key in record&&typeof record[key]!=='string')fail(`${key} must be text.`);
    }
    for(const key of ['extra','copy_extra','custom','terms']){
      if(key in record&&(!record[key]||typeof record[key]!=='object'||Array.isArray(record[key])))fail(`${key} must be an object.`);
    }
    if(record.contributors!==undefined&&(!Array.isArray(record.contributors)||record.contributors.some(p=>!p||typeof p.name!=='string'||typeof p.role!=='string')))fail('Contributors must contain names and roles.');
    if(record.terms&&Object.values(record.terms).some(v=>!Array.isArray(v)||v.some(t=>typeof t!=='string')))fail('Classifications must be lists of text.');
    for(const key of ['extra','copy_extra'])if(record[key]&&Object.values(record[key]).some(v=>!['string','number','boolean'].includes(typeof v)))fail(`${key} contains an invalid value.`);
    if(record.custom&&Object.values(record.custom).some(v=>typeof v!=='string'))fail('Custom values must be text.');
    return { ...base, ...record,terms:{...base.terms,...record.terms as Book['terms']}, id: '', edition_id: '', cover: '' } as Book;
  });
}
