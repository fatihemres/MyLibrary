// Browser-only synthetic component fixture; never included in the app entry point.
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookEditor } from '../../src/components/BookEditor';
import { ConfirmationHost } from '../../src/components/Confirmation';
import { emptyBook, type Snapshot } from '../../src/domain/types';
import { parseIsbn } from '../../src/domain/isbn';
import { setLanguage } from '../../src/i18n';
const test = { calls: [] as string[], pending: [] as (() => void)[], delayed: false };
const host = window as unknown as {
  scanTest: typeof test;
  __TAURI_INTERNALS__: unknown;
  __TAURI_EVENT_PLUGIN_INTERNALS__: unknown;
};
host.scanTest = test;
host.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
host.__TAURI_INTERNALS__ = {
  metadata: { currentWindow: { label: 'synthetic' } },
  transformCallback: () => 0,
  unregisterCallback: () => {},
  invoke: async (command: string) => {
    if (!['isbn_lookup', 'google_books_lookup'].includes(command)) return 0;
    test.calls.push(command);
    if (test.delayed) await new Promise<void>((resolve) => test.pending.push(resolve));
    return command === 'isbn_lookup' ? { title: 'Synthetic title' } : { items: [] };
  },
};
const data: Snapshot = {
  books: [],
  searchIds: null,
  people: [],
  publishers: [],
  series: [],
  locations: [],
  sources: [],
  fields: [],
  terms: [],
  loans: [],
  entries: [],
  attachments: [],
  settings: [],
  dataDir: '',
};
function Harness() {
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useState(0);
  const mode = new URLSearchParams(location.search).get('mode');
  return (
    <>
      <button onClick={() => setOpen(true)}>Reopen editor</button>
      <button onClick={() => setTick((n) => n + 1)}>Rerender {tick}</button>
      {open && (
        <BookEditor
          data={data}
          quick={mode === 'quick'}
          seed={mode === 'quick' || mode === 'manual' ? undefined : parseIsbn('9791090636071')}
          initial={
            mode === 'existing'
              ? { ...emptyBook(), id: 'copy', edition_id: 'edition', isbn13: '9791090636071' }
              : undefined
          }
          lookupAfterScan={mode !== 'manual' && mode !== 'quick'}
          onClose={() => setOpen(false)}
          onSaved={async () => {
            throw new Error('Unexpected persistence');
          }}
        />
      )}
      <ConfirmationHost />
    </>
  );
}
await setLanguage('en');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
