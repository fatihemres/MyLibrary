import { confirmAction, ConfirmationHost } from './components/Confirmation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  LibraryBig,
  BookMarked,
  Heart,
  Users,
  Layers,
  Tags,
  MapPin,
  Quote,
  NotebookPen,
  Handshake,
  ArrowLeftRight,
  ShieldCheck,
  Settings as SettingsIcon,
  Search,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
} from 'lucide-react';
import type { Book, Snapshot } from './domain/types';
import { navigationFilters, type Filters } from './domain/filter';
import { api, snapshot } from './services/api';
import { BookEditor } from './components/BookEditor';
import { RecordDialog, type RecordRequest } from './components/RecordDialog';
import { Modal } from './components/common';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { Detail } from './pages/Detail';
import { Explore } from './pages/Explore';
import { Locations } from './pages/Locations';
import { Personal } from './pages/Personal';
import { DataPage, exportBooks } from './pages/DataPage';
import { Settings } from './pages/Settings';
const navigation = [
  {
    label: '',
    items: [
      ['Dashboard', LayoutDashboard],
      ['Locations', MapPin],
    ],
  },
  {
    label: 'COLLECTION',
    items: [
      ['Library', LibraryBig],
      ['Currently Reading', BookOpen],
      ['Want to Read', BookMarked],
      ['Favorites', Heart],
    ],
  },
  {
    label: 'EXPLORE',
    items: [
      ['Authors', Users],
      ['Series', Layers],
      ['Genres', BookMarked],
      ['Tags', Tags],
    ],
  },
  {
    label: 'PERSONAL',
    items: [
      ['Quotes', Quote],
      ['Notes', NotebookPen],
      ['Loans', Handshake],
    ],
  },
  {
    label: 'DATA EXCHANGE',
    items: [
      ['Import CSV/JSON', ArrowLeftRight],
      ['Export CSV/JSON', ArrowLeftRight],
    ],
  },
  {
    label: 'BACKUP & RECOVERY',
    items: [
      ['Create Backup', ShieldCheck],
      ['Restore Backup', ShieldCheck],
    ],
  },
  {
    label: 'YOUR DATA',
    items: [['Trash', Trash2]],
  },
] as const;
export default function App() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [route, setRoute] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [detail, setDetail] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ book?: Book; quick: boolean } | null>(null);
  const [record, setRecord] = useState<RecordRequest | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [exportSelection, setExportSelection] = useState<Book[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(timer);
  }, [query]);
  const reload = useCallback(async () => {
    const g = ++generation.current;
    const next = await snapshot(debounced, route === 'Trash');
    if (g === generation.current) setData(next);
  }, [debounced, route]);
  useEffect(() => {
    setLoading(true);
    reload()
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [reload]);
  const action = useCallback(
    async (f: () => Promise<unknown>) => {
      setBusy(true);
      setError('');
      try {
        await f();
        await reload();
      } catch (e) {
        setError(String(e));
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );
  useEffect(() => {
    const check = () =>
      api('auto_backup').catch((e) => setError(`Automatic backup failed: ${String(e)}`));
    void check();
    const timer = setInterval(() => void check(), 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  const theme = data?.settings.find((s) => s.key === 'theme')?.value || 'system';
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      (document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (!editor && !record) setEditor({ quick: false });
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editor, record]);
  const navigate = (view: string) => {
    setRoute(['Finished', 'Unread'].includes(view) ? 'Library' : view);
    setDetail(null);
    setQuery('');
    setFilters(navigationFilters(view));
  };
  const openBook = (b: Book) => setDetail(b.id);
  const selected = data?.books.find((b) => b.id === detail);
  const bulk = async (ids: string[], field: string, value: unknown) => {
    if (['trash', 'untrash'].includes(field)) {
      if (
        !(await confirmAction(
          field === 'trash'
            ? `Move ${ids.length} copies to Trash? Their records and files will be retained.`
            : `Restore ${ids.length} copies from Trash?`,
        ))
      )
        return;
      void action(() => api(field, { ids }));
    } else void action(() => api('bulk', { ids, field, value }));
  };
  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <ConfirmationHost />
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <BookOpen size={24} />
          </div>
          <div>
            <strong>MyLibrary</strong>
            <small>A home for your books</small>
          </div>
        </div>
        <button
          className="navigation-toggle"
          aria-label="Toggle sidebar"
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span>Navigation</span>
        </button>
        <nav aria-label="Main navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              {group.label && <h2>{group.label}</h2>}
              {group.items.map(([name, Icon]) => (
                <button
                  key={name}
                  title={name}
                  aria-label={name}
                  aria-current={route === name ? 'page' : undefined}
                  className={route === name ? 'active' : ''}
                  onClick={() => navigate(name)}
                >
                  <Icon size={18} />
                  <span>{name}</span>
                  {name === 'Library' && <small>{data?.books.length || 0}</small>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            title="Settings"
            aria-label="Settings"
            aria-current={route === 'Settings' ? 'page' : undefined}
            onClick={() => navigate('Settings')}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input
              ref={searchRef}
              aria-label="Search entire library"
              placeholder="Search your library…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setDetail(null);
                if (
                  !['Library', 'Currently Reading', 'Want to Read', 'Favorites', 'Trash'].includes(
                    route,
                  )
                ) {
                  setRoute('Library');
                  setFilters({});
                }
              }}
            />
            <kbd>Ctrl F</kbd>
          </div>
          <button disabled={!data} onClick={() => setEditor({ quick: true })}>
            Quick add
          </button>
          <button className="primary" disabled={!data} onClick={() => setEditor({ quick: false })}>
            <Plus size={17} />
            Add book
          </button>
        </header>
        <main data-page={selected ? 'Book detail' : route}>
          {error && (
            <div className="alert global-error" role="alert">
              <span>{error}</span>
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}
          {(loading || busy) && (
            <div className="loading" role="status">
              <RefreshCw size={14} /> {busy ? 'Saving your changes…' : 'Loading library…'}
            </div>
          )}
          {!data ? (
            <div className="empty">
              <BookOpen size={44} />
              <h1>{error ? 'Could not open your library' : 'Opening your library…'}</h1>
              <p>The desktop application is required for local database access.</p>
              {error && <button onClick={() => void action(reload)}>Retry</button>}
            </div>
          ) : (
            <>
              {!selected && route !== 'Dashboard' && (
                <div className="page-heading">
                  <h1>{route === 'Library' ? 'All books' : route}</h1>
                  <p className="muted">
                    {route === 'Locations'
                      ? 'A place for every copy. Organize rooms, bookcases and shelves.'
                      : route === 'Library'
                        ? 'Browse, find and care for your collection.'
                        : route === 'Settings'
                          ? 'Make MyLibrary work the way you do.'
                          : ['Create Backup', 'Restore Backup'].includes(route)
                            ? 'Protect your complete library and managed files.'
                            : ['Import CSV/JSON', 'Export CSV/JSON'].includes(route)
                              ? 'Exchange catalogue records while keeping your library safe.'
                              : 'Your library, organized in one place.'}
                  </p>
                </div>
              )}
              {selected ? (
                <Detail
                  key={selected.id}
                  book={selected}
                  data={data}
                  onBack={() => setDetail(null)}
                  onEdit={() => setEditor({ book: selected, quick: false })}
                  onRecord={setRecord}
                  onAction={(f) => void action(f)}
                  onOpen={openBook}
                  onReload={reload}
                />
              ) : route === 'Dashboard' ? (
                <Dashboard
                  data={data}
                  onOpen={openBook}
                  onNavigate={navigate}
                  onAdd={() => setEditor({ quick: false })}
                />
              ) : ['Library', 'Currently Reading', 'Want to Read', 'Favorites', 'Trash'].includes(
                  route,
                ) ? (
                <Library
                  key={route}
                  data={data}
                  filters={filters}
                  setFilters={setFilters}
                  onOpen={openBook}
                  onBulk={bulk}
                  onExport={setExportSelection}
                  trash={route === 'Trash'}
                />
              ) : route === 'Locations' ? (
                <Locations
                  data={data}
                  onOpen={openBook}
                  onRecord={setRecord}
                  onAction={(f) => void action(f)}
                />
              ) : ['Authors', 'Series', 'Genres', 'Tags'].includes(route) ? (
                <Explore
                  key={route}
                  section={route}
                  data={data}
                  onOpen={openBook}
                  onRecord={setRecord}
                />
              ) : ['Quotes', 'Notes', 'Loans'].includes(route) ? (
                <Personal
                  key={route}
                  section={route}
                  data={data}
                  onRecord={setRecord}
                  onOpen={openBook}
                  onAction={(f) => void action(f)}
                />
              ) : [
                  'Import CSV/JSON',
                  'Export CSV/JSON',
                  'Create Backup',
                  'Restore Backup',
                ].includes(route) ? (
                <DataPage
                  key={route}
                  section={route}
                  data={data}
                  onAction={(f) => void action(f)}
                  onReload={reload}
                  onNavigate={navigate}
                />
              ) : (
                <Settings data={data} onAction={(f) => void action(f)} onRecord={setRecord} />
              )}
            </>
          )}
        </main>
        <div className="statusbar">
          <span>MYLIBRARY · {data?.books.length ?? 0} copies</span>
          <span>{busy ? 'Working…' : 'Stored on this computer'}</span>
        </div>
      </div>
      {editor && data && (
        <BookEditor
          initial={editor.book}
          quick={editor.quick}
          data={data}
          onClose={() => setEditor(null)}
          onSaved={reload}
        />
      )}
      {record && data && (
        <RecordDialog
          request={record}
          data={data}
          onClose={() => setRecord(null)}
          onSaved={reload}
        />
      )}
      {exportSelection && (
        <Modal
          title={`Export ${exportSelection.length} copies`}
          onClose={() => setExportSelection(null)}
        >
          <div className="dialog-body">
            <p>
              JSON includes all book fields; CSV contains common catalogue columns. Use Backup for a
              complete archive including files, notes and loans.
            </p>
          </div>
          <footer>
            <button
              onClick={() =>
                void action(async () => {
                  await exportBooks(exportSelection, 'csv', data || undefined);
                  setExportSelection(null);
                })
              }
            >
              Export CSV
            </button>
            <button
              className="primary"
              onClick={() =>
                void action(async () => {
                  await exportBooks(exportSelection, 'json', data || undefined);
                  setExportSelection(null);
                })
              }
            >
              Export JSON
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
