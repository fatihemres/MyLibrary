import { metadataFields, openLibraryProvider } from './metadata';
import { invoke } from '@tauri-apps/api/core';
export const lookupCover = (isbn: string) => invoke<number[]>('isbn_cover', { isbn });
import type { Snapshot } from '../domain/types';
export const api = <T = unknown>(action: string, payload: unknown = {}): Promise<T> =>
  invoke('database', { action, payload });
export const snapshot = (query = '', trash = false) => api<Snapshot>('snapshot', { query, trash });
export const lookup = async (isbn: string) =>
  metadataFields(await openLibraryProvider.lookup(isbn));
export async function upload(file: File, copyId?: string) {
  return api<string>(copyId ? 'attachment' : 'cover', {
    name: file.name,
    bytes: Array.from(new Uint8Array(await file.arrayBuffer())),
    copy_id: copyId,
  });
}
