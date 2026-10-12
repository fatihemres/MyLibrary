import { parseIsbn, type Isbn } from './isbn';
import { emptyBook, type Book, type Snapshot } from './types';

export const SCAN_PAYLOAD_LIMIT = 128;
// One AIM identifier plus a few transport terminators; never retain an unbounded paste.
export const SCAN_RAW_LIMIT = 136;
export const SCAN_QUEUE_LIMIT = 1000;
export type Terminator = 'enter' | 'tab' | 'either';
export const scannerTerminator = (value?: string): Terminator =>
  value === 'tab' || value === 'either' ? value : 'enter';
export const isScanTerminator = (key: string, setting: Terminator) =>
  (key === 'Enter' && setting !== 'tab') || (key === 'Tab' && setting !== 'enter');

export function scannerPayload(raw: string, terminator: Terminator) {
  if (raw.length > SCAN_RAW_LIMIT) throw new Error('scanner.tooLong');
  const transport = raw.replace(
    terminator === 'enter' ? /^[\r\n]+|[\r\n]+$/g : /^[\r\n\t]+|[\r\n\t]+$/g,
    '',
  );
  const aim = transport.match(/^\][A-Za-z][A-Za-z0-9]/)?.[0];
  const payload = aim ? transport.slice(3) : transport;
  if (!payload.trim()) throw new Error('scanner.empty');
  if (payload.length > SCAN_PAYLOAD_LIMIT) throw new Error('scanner.tooLong');
  if (
    [...payload].some(
      (c) => c.charCodeAt(0) < 32 || (c.charCodeAt(0) >= 127 && c.charCodeAt(0) <= 159),
    )
  )
    throw new Error('scanner.controls');
  return { raw, aim, payload };
}
export function scanIsbn(raw: string, terminator: Terminator) {
  const transport = scannerPayload(raw, terminator);
  return { ...transport, isbn: parseIsbn(transport.payload) };
}
export interface ScanItem {
  id: number;
  raw: string;
  aim?: string;
  isbn?: Isbn;
  error?: string;
  added: boolean;
}
export function queueScan(queue: ScanItem[], raw: string, terminator: Terminator): ScanItem[] {
  if (queue.length >= SCAN_QUEUE_LIMIT) throw new Error('scanner.queueFull');
  const item: ScanItem = {
    id: queue.reduce((max, row) => Math.max(max, row.id), 0) + 1,
    raw: raw.slice(0, SCAN_RAW_LIMIT + 1),
    added: false,
  };
  try {
    Object.assign(item, scanIsbn(raw, terminator));
  } catch (error) {
    item.error = error instanceof Error ? error.message : 'scanner.invalid';
  }
  return [...queue, item];
}
/** A seed is ISBN-only, never an existing persisted Book or a foreign identity. */
export function newBookDraft(data: Pick<Snapshot, 'settings'>, seed?: Isbn): Book {
  const prefs = Object.fromEntries(data.settings.map((s) => [s.key, s.value]));
  const isbn = seed ? parseIsbn(seed.isbn13) : undefined;
  return {
    ...emptyBook(),
    isbn13: isbn?.isbn13 || '',
    isbn10: isbn?.isbn10 || '',
    language: prefs.language || '',
    location_id: prefs.default_location || '',
    copy_extra: { currency: prefs.currency || 'TRY' },
  };
}
