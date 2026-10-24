import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Library } from '../../src/pages/Library';
import { emptyBook, type Snapshot } from '../../src/domain/types';
import { type Filters } from '../../src/domain/filter';
import { setLanguage } from '../../src/i18n';
const a = {
  ...emptyBook(),
  id: 'a',
  edition_id: 'one',
  title: 'İhsan Işık',
  status: 'Reading',
  publication_year: 2001,
  source: 'Synthetic shop',
};
const data: Snapshot = {
  books: [a, { ...a, id: 'b', status: 'Finished', publication_year: null }],
  searchIds: null,
  people: [],
  publishers: [],
  series: [],
  locations: [],
  sources: [{ id: 's', name: 'Synthetic shop' }],
  fields: [],
  terms: [],
  loans: [],
  entries: [],
  attachments: [],
  settings: [],
  dataDir: '',
};
function Harness() {
  const [filters, setFilters] = useState<Filters>({});
  return (
    <Library
      data={data}
      filters={filters}
      setFilters={setFilters}
      onOpen={() => {}}
      onBulk={() => {}}
      onExport={() => {}}
    />
  );
}
await setLanguage(new URLSearchParams(location.search).get('language') || 'en');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
