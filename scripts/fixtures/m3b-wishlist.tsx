import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Wishlist } from '../../src/pages/Wishlist';
import { ConfirmationHost } from '../../src/components/Confirmation';
import { setLanguage } from '../../src/i18n';
import type { WishlistDraft, WishlistItem } from '../../src/domain/wishlist';
import '../../src/styles.css';
const test = {
  calls: [] as string[],
  unexpected: [] as string[],
  items: [] as WishlistItem[],
  delayed: false,
  pending: [] as (() => void)[],
};
const host = window as unknown as {
  wishTest: typeof test;
  __TAURI_INTERNALS__: unknown;
  __TAURI_EVENT_PLUGIN_INTERNALS__: unknown;
};
host.wishTest = test;
host.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
host.__TAURI_INTERNALS__ = {
  metadata: { currentWindow: { label: 'synthetic' } },
  transformCallback: () => 0,
  unregisterCallback: () => {},
  invoke: async (
    command: string,
    args: { action?: string; payload?: { draft?: WishlistDraft; query?: string } },
  ) => {
    if (['plugin:event|listen', 'plugin:event|unlisten'].includes(command)) return 0;
    test.calls.push(command === 'database' ? String(args.action) : command);
    if (command === 'isbn_lookup' || command === 'google_books_lookup') {
      if (test.delayed) await new Promise<void>((resolve) => test.pending.push(resolve));
      if (command === 'google_books_lookup') throw new Error('metadata.unavailable');
      return { title: 'Synthetic suggested title', authors: [{ name: 'Synthetic author' }] };
    }
    if (command === 'database') {
      if (args.action === 'wishlist_list')
        return {
          items: structuredClone(test.items).filter(
            (i) => !args.payload?.query || i.draft.title.includes(args.payload.query),
          ),
          budget: [],
          missing_prices: 0,
        };
      if (args.action === 'wishlist_editions') return [];
      if (args.action === 'wishlist_save' && args.payload?.draft) {
        const d = structuredClone(args.payload.draft);
        d.id ||= crypto.randomUUID();
        d.updated_at = new Date().toISOString();
        test.items = [
          ...test.items.filter((i) => i.draft.id !== d.id),
          { draft: d, cover: '', history: [] },
        ];
        return { saved: true, id: d.id };
      }
    }
    test.unexpected.push(command + ':' + args?.action);
    throw new Error('Unexpected fixture IPC');
  },
};
await setLanguage(new URLSearchParams(location.search).get('language') || 'en');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Wishlist />
    <ConfirmationHost />
  </StrictMode>,
);
