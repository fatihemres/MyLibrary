export interface Isbn {
  isbn13: string;
  isbn10?: string;
}
const check13 = (body: string) =>
  String((10 - ([...body].reduce((n, c, i) => n + Number(c) * (i % 2 ? 3 : 1), 0) % 10)) % 10);
const check10 = (body: string) => {
  const n = (11 - ([...body].reduce((sum, c, i) => sum + Number(c) * (10 - i), 0) % 11)) % 11;
  return n === 10 ? 'X' : String(n);
};
export function parseIsbn(input: string): Isbn {
  const value = input.replace(/[ -]/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(value) && check10(value.slice(0, 9)) === value[9]) {
    const body = '978' + value.slice(0, 9);
    return { isbn10: value, isbn13: body + check13(body) };
  }
  if (/^97[89]\d{10}$/.test(value) && check13(value.slice(0, 12)) === value[12]) {
    const body = value.slice(3, 12);
    return { isbn13: value, ...(value.startsWith('978') ? { isbn10: body + check10(body) } : {}) };
  }
  throw new Error('metadata.invalidIsbn');
}
export function lookupIsbn(isbn10: string, isbn13: string): Isbn {
  const a = isbn10.trim() ? parseIsbn(isbn10) : undefined;
  const b = isbn13.trim() ? parseIsbn(isbn13) : undefined;
  if (a && b && a.isbn13 !== b.isbn13) throw new Error('metadata.mismatchedIsbn');
  if (!a && !b) throw new Error('metadata.invalidIsbn');
  return (b || a)!;
}
