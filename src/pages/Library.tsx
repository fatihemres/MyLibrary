import { useState } from 'react';
import { ArrowDownUp, Columns3, Grid2X2, List, SlidersHorizontal, Star } from 'lucide-react';
import {
  author,
  conditions,
  locationName,
  statuses,
  type Book,
  type Snapshot,
} from '../domain/types';
import { filterBooks, type Filters } from '../domain/filter';
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
  const [showFilters, setShowFilters] = useState(false);
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
  const books = filterBooks(data, filters, sort, desc);
  const ids = selected.filter((id) => books.some((b) => b.id === id));
  const setFilter = (key: string, value: string) => setFilters({ ...filters, [key]: value });
  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  const choices = (key: string, label: string, values: string[]) => (
    <Field label={label}>
      <select value={filters[key] || ''} onChange={(e) => setFilter(key, e.target.value)}>
        <option value="">Any</option>
        {[...new Set(values)]
          .filter(Boolean)
          .sort()
          .map((v) => (
            <option key={v}>{v}</option>
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
          {books.length} {books.length === 1 ? 'copy' : 'copies'}
          {Object.values(filters).some(Boolean) && ' · filtered'}
        </span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'selected' : ''}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
        <button
          onClick={() => {
            setFilters({});
            setSelected([]);
          }}
        >
          Reset
        </button>
        <span className="spacer" />
        <select
          aria-label="Sort books"
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
              {v}
            </option>
          ))}
        </select>
        <button
          title="Reverse sort order"
          aria-label="Reverse sort order"
          onClick={() => setDesc(!desc)}
        >
          <ArrowDownUp size={16} />
        </button>
        <div className="segmented">
          {['grid', 'table'].map((v) => (
            <button
              key={v}
              aria-label={`${v} view`}
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
          <button aria-label="Choose columns" onClick={() => setShowColumns(!showColumns)}>
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
              {c.replaceAll('_', ' ')}
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
            <Field key={key} label={['Year from', 'Year to', 'Acquired in year'][i]}>
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
          <Field label="Location (includes children)">
            <select
              value={filters.location_id || ''}
              onChange={(e) => setFilter('location_id', e.target.value)}
            >
              <option value="">Anywhere</option>
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
              {l}
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
          Select all
        </label>
        <span>{ids.length ? `${ids.length} selected` : ''}</span>
        <span className="spacer" />
        <button
          onClick={() => onExport(ids.length ? books.filter((b) => ids.includes(b.id)) : books)}
        >
          Export {ids.length ? 'selected' : 'results'}
        </button>
      </div>
      {ids.length > 0 && (
        <div className="bulkbar">
          <select
            aria-label="Bulk operation"
            value={bulkField}
            onChange={(e) => {
              setBulkField(e.target.value);
              setBulkValue('');
            }}
          >
            <option value="status">Reading status</option>
            <option value="location_id">Move location</option>
            <option value="favorite">Favorite</option>
            <option value="add_tag">Add tag</option>
            <option value="remove_tag">Remove tag</option>
          </select>
          {bulkField === 'status' ? (
            <select
              aria-label="New reading status"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            >
              <option value="">Choose status</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ) : bulkField === 'location_id' ? (
            <select
              aria-label="New location"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            >
              <option value="">Unassigned</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationName(l.id, data.locations)}
                </option>
              ))}
            </select>
          ) : bulkField === 'favorite' ? (
            <select
              aria-label="Favorite"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
            >
              <option value="">Choose</option>
              <option value="true">Favorite</option>
              <option value="false">Not favorite</option>
            </select>
          ) : (
            <input
              placeholder="Tag name"
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
            Apply
          </button>
          <span className="spacer" />
          <button
            className={trash ? '' : 'danger-text'}
            onClick={() => {
              onBulk(ids, trash ? 'untrash' : 'trash', null);
              setSelected([]);
            }}
          >
            {trash ? 'Restore from Trash' : 'Move to Trash'}
          </button>
        </div>
      )}
      {!books.length ? (
        <Empty
          title={
            trash
              ? 'Trash is empty'
              : data.books.length
                ? 'No matching books'
                : 'Your library starts here'
          }
        >
          <p>
            {data.books.length
              ? 'Try resetting your filters or changing your search.'
              : 'Add your first book or import an existing catalogue.'}
          </p>
        </Empty>
      ) : view === 'grid' ? (
        <div className="book-grid">
          {books.map((b) => (
            <article
              key={b.id}
              className={`book-card ${ids.includes(b.id) ? 'is-selected' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelected([b.id]);
              }}
            >
              <div className="card-cover">
                <button className="cover-button" onClick={() => onOpen(b)}>
                  <Cover book={b} />
                </button>
                <input
                  type="checkbox"
                  aria-label={`Select ${b.title}`}
                  checked={ids.includes(b.id)}
                  onChange={() => toggle(b.id)}
                />
                {b.favorite && <Star className="favorite" size={16} fill="currentColor" />}
              </div>
              <button className="book-title" onClick={() => onOpen(b)}>
                {b.title}
              </button>
              <p>{author(b) || 'Author not specified'}</p>
              <div className="card-bottom">
                <span className={`badge status-${b.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {b.status}
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
                    Title
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
                      {c.replaceAll('_', ' ')}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr
                  key={b.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelected([b.id]);
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${b.title}`}
                      checked={ids.includes(b.id)}
                      onChange={() => toggle(b.id)}
                    />
                  </td>
                  <td>
                    <button className="text-button" onClick={() => onOpen(b)}>
                      {b.title}
                    </button>
                  </td>
                  {columns.map((c) => (
                    <td key={c}>{cell(b, c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
