import { t, label as trLabel } from '../i18n';
import { useEffect, useState } from 'react';
import { ArrowDownUp, Columns3, Grid2X2, List, SlidersHorizontal, Star } from 'lucide-react';
import {
  author,
  conditions,
  locationName,
  statuses,
  type Book,
  type Snapshot,
} from '../domain/types';
import { editionCards, filterBooks, type Filters } from '../domain/filter';
import { Cover, Empty, Field } from '../components/common';
export function Library({
  data,
  filters,
  setFilters,
  onOpen,
  onBulk,
  onExport,
  trash = false,
}: {
  data: Snapshot;
  filters: Filters;
  setFilters: (f: Filters) => void;
  onOpen: (b: Book) => void;
  onBulk: (ids: string[], field: string, value: unknown) => void;
  onExport: (books: Book[]) => void;
  trash?: boolean;
}) {
  const [view, setView] = useState(localStorage.getItem('view') || 'grid');
  const [sort, setSort] = useState(localStorage.getItem('sort') || 'title');
  const [desc, setDesc] = useState(false);
  const [showFilters, setShowFilters] = useState(Object.values(filters).some(Boolean));
  const [selected, setSelected] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem('columns') || 'null') || [
          'author',
          'status',
          'publication_year',
          'rating',
          'location',
        ]
      );
    } catch {
      return ['author', 'status'];
    }
  });
  const [showColumns, setShowColumns] = useState(false);
  const [bulkValue, setBulkValue] = useState('');
  const [bulkField, setBulkField] = useState('status');
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<{ book: Book; x: number; y: number } | null>(null);
  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', close);
    };
  }, []);
  const books = filterBooks(data, filters, sort, desc);
  const cards = editionCards(books, data.books, trash);
  const matchingIds = (id: string) => cards.find((b) => b.id === id)?.matchingIds || [id];
  const copyLabel = (b: (typeof cards)[number]) => t('library.copyCount', { count: b.copyCount });
  const bookIds = new Set(books.map((b) => b.id));
  const ids = selected.filter((id) => bookIds.has(id));
  const pages = Math.max(1, Math.ceil(cards.length / 60));
  const currentPage = Math.min(page, pages);
  const visible = cards.slice((currentPage - 1) * 60, currentPage * 60);
  const setFilter = (key: string, value: string) => setFilters({ ...filters, [key]: value });
  const toggle = (id: string) => {
    const group = matchingIds(id);
    setSelected(
      group.every((v) => selected.includes(v))
        ? selected.filter((v) => !group.includes(v))
        : [...new Set([...selected, ...group])],
    );
  };
  const choices = (key: string, label: string, values: string[]) => (
    <Field label={trLabel(label)}>
      <select value={filters[key] || ''} onChange={(e) => setFilter(key, e.target.value)}>
        <option value="">{t('ui.any')}</option>
        {[...new Set(values)]
          .filter(Boolean)
          .sort()
          .map((v) => (
            <option key={v} value={v}>
              {['status', 'condition', 'lent'].includes(key) ? trLabel(v) : v}
            </option>
          ))}
      </select>
    </Field>
  );
  const cell = (b: Book, key: string) =>
    key === 'author'
      ? author(b)
      : key === 'location'
        ? locationName(b.location_id, data.locations)
        : key === 'genre'
          ? b.terms.genre.join(', ')
          : key === 'rating'
            ? b.rating === null
              ? '—'
              : `${b.rating} ★`
            : String(b[key as keyof Book] ?? '—');
  const available = [
    'author',
    'isbn13',
    'publisher',
    'publication_year',
    'pages',
    'genre',
    'language',
    'status',
    'rating',
    'location',
    'acquisition_date',
  ];
  return (
    <>
      <div className="toolbar">
        <span className="muted">
          {cards.length} {trash ? t('ui.copiesAlt') : t('library.editions')} · {books.length}{' '}
          {t('ui.matchingCopies')} {Object.values(filters).some(Boolean) && t('library.filtered')}
        </span>
        {filters.status && (
          <span className="badge">
            {t('ui.readingStatusAlt')} {trLabel(filters.status)}
          </span>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'selected' : ''}
        >
          <SlidersHorizontal size={16} />
          {t('ui.filters')}{' '}
        </button>
        <button
          onClick={() => {
            setFilters({});
            setSelected([]);
          }}
        >
          {t('ui.reset')}{' '}
        </button>
        <span className="spacer" />
        <select
          aria-label={t('ui.sortBooks')}
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            localStorage.setItem('sort', e.target.value);
          }}
        >
          {[
            ['title', 'Title'],
            ['author', 'Author'],
            ['created_at', 'Date added'],
            ['publication_year', 'Publication year'],
            ['rating', 'Rating'],
            ['pages', 'Page count'],
            ['acquisition_date', 'Acquisition date'],
            ['updated_at', 'Last updated'],
            ['series_order', 'Series order'],
          ].map(([k, v]) => (
            <option key={k} value={k}>
              {trLabel(v)}
            </option>
          ))}
        </select>
        <button
          title={t('ui.reverseSortOrder')}
          aria-label={t('ui.reverseSortOrder')}
          onClick={() => setDesc(!desc)}
        >
          <ArrowDownUp size={16} />
        </button>
        <div className="segmented">
          {['grid', 'table'].map((v) => (
            <button
              key={v}
              aria-label={t('library.view', { view: t(`library.${v}`) })}
              className={view === v ? 'active' : ''}
              onClick={() => {
                setView(v);
                localStorage.setItem('view', v);
              }}
            >
              {v === 'grid' ? <Grid2X2 size={17} /> : <List size={17} />}
            </button>
          ))}
        </div>
        {view === 'table' && (
          <button aria-label={t('ui.chooseColumns')} onClick={() => setShowColumns(!showColumns)}>
            <Columns3 size={16} />
          </button>
        )}
      </div>
      {showColumns && (
        <div className="panel inline wrap">
          {available.map((c) => (
            <label key={c}>
              <input
                type="checkbox"
                checked={columns.includes(c)}
                onChange={(e) => {
                  const next = e.target.checked ? [...columns, c] : columns.filter((v) => v !== c);
                  setColumns(next);
                  localStorage.setItem('columns', JSON.stringify(next));
                }}
              />
              {trLabel(c.replaceAll('_', ' '))}
            </label>
          ))}
        </div>
      )}
      {showFilters && (
        <div className="filter-grid panel">
          {choices(
            'author',
            'Author',
            data.people.map((p) => p.name),
          )}
          {choices(
            'publisher',
            'Publisher',
            data.publishers.map((p) => p.name),
          )}
          {choices(
            'genre',
            'Genre',
            data.terms.filter((t) => t.kind === 'genre').map((t) => t.name),
          )}
          {choices(
            'tag',
            'Tag',
            data.terms.filter((t) => t.kind === 'tag').map((t) => t.name),
          )}
          {choices(
            'language',
            'Language',
            data.books.map((b) => b.language),
          )}
          {choices(
            'series',
            'Series',
            data.series.map((s) => s.name),
          )}
          {choices('status', 'Reading status', statuses)}
          {choices('condition', 'Condition', conditions)}
          {['minYear', 'maxYear', 'acquisitionYear'].map((key, i) => (
            <Field key={key} label={trLabel(['Year from', 'Year to', 'Acquired in year'][i])}>
              <input
                type="number"
                value={filters[key] || ''}
                onChange={(e) => setFilter(key, e.target.value)}
              />
            </Field>
          ))}
          {choices('rating', 'Minimum rating', [
            '0',
            '0.5',
            '1',
            '1.5',
            '2',
            '2.5',
            '3',
            '3.5',
            '4',
            '4.5',
            '5',
          ])}
          <Field label={t('ui.locationIncludesChildren')}>
            <select
              value={filters.location_id || ''}
              onChange={(e) => setFilter('location_id', e.target.value)}
            >
              <option value="">{t('ui.anywhere')}</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationName(l.id, data.locations)}
                </option>
              ))}
            </select>
          </Field>
          {choices('lent', 'Lent out', ['yes', 'no'])}
          {[
            ['favorite', 'Favorites'],
            ['signed', 'Signed copies'],
            ['first_edition', 'First editions'],
          ].map(([k, l]) => (
            <label className="check" key={k}>
              <input
                type="checkbox"
                checked={!!filters[k]}
                onChange={(e) => setFilter(k, e.target.checked ? 'yes' : '')}
              />
              {trLabel(l)}
            </label>
          ))}
        </div>
      )}
      <div className="selectionbar">
        <label>
          <input
            type="checkbox"
            checked={books.length > 0 && ids.length === books.length}
            onChange={(e) => setSelected(e.target.checked ? books.map((b) => b.id) : [])}
          />{' '}
          {t('ui.selectAll')}{' '}
        </label>
        <span>{ids.length ? t('library.selected', { count: ids.length }) : ''}</span>
        {!trash && (
          <small className="muted">{t('ui.selectionIncludesMatchingCopiesOfEachEdition')}</small>
        )}
        <span className="spacer" />
        <button
          onClick={() => onExport(ids.length ? books.filter((b) => ids.includes(b.id)) : books)}
        >
          {t(ids.length ? 'actions.exportSelected' : 'actions.exportResults')}
        </button>
      </div>
      {ids.length > 0 && (
        <div className="bulkbar">
          <select
            aria-label={t('ui.bulkOperation')}
            value={bulkField}
            onChange={(e) => {
              setBulkField(e.target.value);
              setBulkValue('');
            }}
          >
            <option value="status">{t('ui.readingStatus')}</option>
            <option value="location_id">{t('ui.moveLocation')}</option>
            <option value="favorite">{t('ui.favorite')}</option>
            <option value="add_tag">{t('ui.addTag')}</option>
            <option value="remove_tag">{t('ui.removeTag')}</option>
          </select>
          {bulkField === 'status' ? (
            <select
              aria-label={t('ui.newReadingStatus')}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            >
              <option value="">{t('ui.chooseStatus')}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {trLabel(s)}
                </option>
              ))}
            </select>
          ) : bulkField === 'location_id' ? (
            <select
              aria-label={t('ui.newLocation')}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            >
              <option value="">{t('ui.unassigned')}</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationName(l.id, data.locations)}
                </option>
              ))}
            </select>
          ) : bulkField === 'favorite' ? (
            <select
              aria-label={t('ui.favorite')}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            >
              <option value="">{t('ui.choose')}</option>
              <option value="true">{t('ui.favorite')}</option>
              <option value="false">{t('ui.notFavorite')}</option>
            </select>
          ) : (
            <input
              placeholder={t('ui.tagName')}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            />
          )}
          <button
            disabled={!bulkValue && bulkField !== 'location_id'}
            onClick={() =>
              onBulk(ids, bulkField, bulkField === 'favorite' ? bulkValue === 'true' : bulkValue)
            }
          >
            {t('ui.apply')}{' '}
          </button>
          <span className="spacer" />
          <button
            className={trash ? '' : 'danger-text'}
            onClick={() => {
              onBulk(ids, trash ? 'untrash' : 'trash', null);
              setSelected([]);
            }}
          >
            {trash ? t('ui.restoreFromTrash') : t('ui.moveToTrash')}
          </button>
        </div>
      )}
      {!books.length ? (
        <Empty
          title={
            trash
              ? t('ui.trashIsEmpty')
              : data.books.length
                ? t('ui.noMatchingBooks')
                : t('ui.yourLibraryStartsHere')
          }
        >
          <p>
            {data.books.length
              ? t('ui.tryResettingYourFiltersOrChangingYourSearch')
              : t('ui.addYourFirstBookOrImportAnExistingCatalogue')}
          </p>
        </Empty>
      ) : view === 'grid' ? (
        <div className="book-grid">
          {visible.map((b) => (
            <article
              key={b.id}
              className={`book-card ${b.matchingIds.every((id) => ids.includes(id)) ? 'is-selected' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelected(b.matchingIds);
                setMenu({
                  book: b,
                  x: Math.min(e.clientX, window.innerWidth - 220),
                  y: Math.min(e.clientY, window.innerHeight - 200),
                });
              }}
            >
              <div className="card-cover">
                <button className="cover-button" onClick={() => onOpen(b)}>
                  <Cover book={b} />
                </button>
                <input
                  type="checkbox"
                  aria-label={t('library.select', { title: b.title })}
                  checked={b.matchingIds.every((id) => ids.includes(id))}
                  onChange={() => toggle(b.id)}
                />
                {b.favorite && <Star className="favorite" size={16} fill="currentColor" />}
              </div>
              <button className="book-title" onClick={() => onOpen(b)}>
                {b.title}
              </button>
              <p>{author(b) || t('ui.authorNotSpecified')}</p>
              <p>
                {copyLabel(b)}
                {b.matchingIds.length < b.copyCount
                  ? t('library.matching', { count: b.matchingIds.length })
                  : ''}
              </p>
              <div className="card-bottom">
                <span className={`badge status-${b.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {trLabel(b.readingLabel)}
                </span>
                {b.rating !== null && <span className="rating">{b.rating} ★</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th />
                <th>
                  <button
                    onClick={() => {
                      setSort('title');
                      setDesc(!desc);
                    }}
                  >
                    {t('ui.title')}{' '}
                  </button>
                </th>
                {columns.map((c) => (
                  <th key={c}>
                    <button
                      onClick={() => {
                        setSort(c === 'genre' ? 'title' : c);
                        setDesc(!desc);
                      }}
                    >
                      {trLabel(c.replaceAll('_', ' '))}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr
                  key={b.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelected(b.matchingIds);
                    setMenu({
                      book: b,
                      x: Math.min(e.clientX, window.innerWidth - 220),
                      y: Math.min(e.clientY, window.innerHeight - 200),
                    });
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={t('library.select', { title: b.title })}
                      checked={b.matchingIds.every((id) => ids.includes(id))}
                      onChange={() => toggle(b.id)}
                    />
                  </td>
                  <td>
                    <button className="text-button" onClick={() => onOpen(b)}>
                      {b.title}
                    </button>
                    <small className="block">{copyLabel(b)}</small>
                  </td>
                  {columns.map((c) => (
                    <td key={c}>{c === 'status' ? trLabel(b.readingLabel) : cell(b, c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {cards.length > 60 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            {t('ui.previous')}{' '}
          </button>
          <span>
            {t('ui.page')} {currentPage} {t('ui.of')} {pages} {t('ui.60PerPage')}{' '}
          </span>
          <button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>
            {t('ui.next')}{' '}
          </button>
        </div>
      )}
      {menu && (
        <div className="context-menu" role="menu" style={{ left: menu.x, top: menu.y }}>
          <button role="menuitem" onClick={() => onOpen(menu.book)}>
            {t('ui.openBookDetails')}{' '}
          </button>
          <button
            role="menuitem"
            onClick={() => onBulk(matchingIds(menu.book.id), 'favorite', !menu.book.favorite)}
          >
            {menu.book.favorite ? t('ui.removeFavorite') : t('ui.markFavorite')}
          </button>
          <button
            role="menuitem"
            onClick={() => onExport(books.filter((b) => matchingIds(menu.book.id).includes(b.id)))}
          >
            {t('ui.exportMatchingCopies')}{' '}
          </button>
          <button
            role="menuitem"
            className="danger-text"
            onClick={() => onBulk(matchingIds(menu.book.id), trash ? 'untrash' : 'trash', null)}
          >
            {trash ? t('ui.restoreFromTrash') : t('ui.moveToTrashAlt')}
          </button>
        </div>
      )}
    </>
  );
}
