import { useEffect, useRef, useState } from 'react';
import { Plus, Save, Upload, X } from 'lucide-react';
import {
  author,
  conditions,
  duplicates,
  emptyBook,
  locationName,
  roles,
  statuses,
  type Book,
  type Snapshot,
} from '../domain/types';
import { copyFields, editionFields, type Field as FieldDef } from '../domain/fields';
import { api, lookup, upload } from '../services/api';
import { validateBook } from '../services/transfer';
import { Cover, Field, Modal } from './common';
import {useUnsaved} from './useUnsaved';
export function BookEditor({
  initial,
  data,
  quick,
  onClose,
  onSaved,
}: {
  initial?: Book;
  data: Snapshot;
  quick: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [book, setBook] = useState<Book>(() =>
    initial
      ? structuredClone(initial)
      : {
          ...emptyBook(),
          language: data.settings.find((x) => x.key === 'language')?.value || '',
          location_id: data.settings.find((x) => x.key === 'default_location')?.value || '',
          copy_extra: { currency: data.settings.find((x) => x.key === 'currency')?.value || 'TRY' },
        },
  );
  const baseline = useRef(JSON.stringify(book));
  useUnsaved(baseline.current!==JSON.stringify(book));
  const [tab, setTab] = useState('General');
  const [full, setFull] = useState(!quick);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicateOk, setDuplicateOk] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<string[]>([]);
  const dup = duplicates(book, data.books);
  const close = () => {
    if (
      baseline.current !== JSON.stringify(book) &&
      !window.confirm('Discard your unsaved changes?')
    )
      return;
    onClose();
  };
  const update = <K extends keyof Book>(key: K, value: Book[K]) =>
    setBook((b) => ({ ...b, [key]: value }));
  const save = async () => {
    if(busy)return;
    const errors = validateBook(book);
    if (errors.length) {
      setError(errors.join('. '));
      return;
    }
    if (dup.length && !duplicateOk) {
      setError('Possible duplicate found. Confirm that this is an intentional copy below.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('save', book);
      await onSaved();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const image = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      update('cover', await upload(file));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const extraFields = (fields: FieldDef[], scope: 'extra' | 'copy_extra') =>
    fields.map((f) => (
      <Field key={f.key} label={f.label}>
        {f.type === 'textarea' ? (
          <textarea
            value={String(book[scope][f.key] ?? '')}
            onChange={(e) => update(scope, { ...book[scope], [f.key]: e.target.value })}
          />
        ) : f.type === 'select' ? (
          <select
            value={String(book[scope][f.key] ?? '')}
            onChange={(e) => update(scope, { ...book[scope], [f.key]: e.target.value })}
          >
            <option value="">Not specified</option>
            {f.options?.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            type={f.type || 'text'}
            step={f.type === 'number' ? 'any' : undefined}
            checked={f.type === 'checkbox' ? !!book[scope][f.key] : undefined}
            value={f.type === 'checkbox' ? undefined : String(book[scope][f.key] ?? '')}
            onChange={(e) =>
              update(scope, {
                ...book[scope],
                [f.key]: f.type === 'checkbox' ? e.target.checked : e.target.value,
              })
            }
          />
        )}
      </Field>
    ));
  const simple = (key: keyof Book, label: string, type = 'text') => (
    <Field label={label}>
      <input
        type={type}
        step={key === 'rating' ? '0.5' : key === 'series_order' ? 'any' : undefined}
        value={String(book[key] ?? '')}
        onChange={(e) =>
          update(
            key,
            (type === 'number'
              ? e.target.value === ''
                ? null
                : Number(e.target.value)
              : e.target.value) as never,
          )
        }
      />
    </Field>
  );
  const terms = (kind: string, label: string) => (
    <Field label={`${label} (separate with ;)`}>
      <input
        value={book.terms[kind]?.join('; ') || ''}
        onChange={(e) =>
          update('terms', { ...book.terms, [kind]: e.target.value.split(';').map((t) => t.trim()) })
        }
      />
    </Field>
  );
  const location = (
    <Field label="Physical location">
      <select value={book.location_id} onChange={(e) => update('location_id', e.target.value)}>
        <option value="">Not assigned</option>
        {data.locations.map((l) => (
          <option key={l.id} value={l.id}>
            {locationName(l.id, data.locations)}
          </option>
        ))}
      </select>
    </Field>
  );
  const getMetadata = async () => {
    setBusy(true);
    setError('');
    try {
      const v = await lookup(book.isbn13 || book.isbn10);
      setMetadata(v);
      setSelectedMetadata([]);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const applyMetadata = () => {
    if (!metadata) return;
    const next = structuredClone(book);
    for (const key of selectedMetadata) {
      const val = metadata[key];
      if (key === 'title' && typeof val === 'string') next.title = val;
      if (key === 'subtitle' && typeof val === 'string') next.subtitle = val;
      if (key === 'number_of_pages' && typeof val === 'number') next.pages = val;
      if (key === 'authors' && Array.isArray(val))
        next.contributors = [
          ...next.contributors.filter((p) => p.role !== 'Author'),
          ...val.map((v) => ({ name: String(v.name), role: 'Author' })),
        ];
      if (key === 'publishers' && Array.isArray(val))
        next.publisher = val.map((v) => String(v.name)).join('; ');
      if (key === 'publish_date' && typeof val === 'string') {
        const match = val.match(/\b\d{4}\b/);
        if (match) next.publication_year = Number(match[0]);
      }
    }
    setBook(next);
    setMetadata(null);
  };
  return (
    <Modal
      wide
      title={initial ? 'Edit book & copy' : full ? 'Add a book' : 'Quick add'}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="editor-intro">
          <span>Only the title is required. Everything else can come later.</span>
          {initial && data.books.filter((b) => b.edition_id === initial.edition_id).length > 1 && (
            <strong>Shared edition: bibliographic edits update all copies.</strong>
          )}
        </div>
        {full && (
          <nav className="tabs" aria-label="Editor sections">
            {[
              'General',
              'Publication',
              'Contributors',
              'Classification',
              'Reading',
              'Ownership',
              'Location',
              'Physical',
              'Notes',
              'Custom Fields',
            ].map((t) => (
              <button
                type="button"
                className={tab === t ? 'active' : ''}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
        )}
        <div className="editor-body">
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          {(tab === 'General' || !full) && (
            <div className="general-editor">
              <div
                className="cover-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void image(e.dataTransfer.files[0]);
                }}
              >
                <Cover book={book} large />
                <label className="button">
                  <Upload size={15} />
                  Choose cover
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => void image(e.target.files?.[0])}
                  />
                </label>
                <small>Or drop an image here</small>
                {book.cover && (
                  <button type="button" onClick={() => update('cover', '')}>
                    Remove cover
                  </button>
                )}
              </div>
              <div className="form-grid">
                {simple('title', 'Title *')}
                {full && simple('subtitle', 'Subtitle')}
                <Field label="Authors (separate with ;)">
                  <input
                    list="people-list"
                    value={book.contributors
                      .filter((p) => p.role === 'Author')
                      .map((p) => p.name)
                      .join('; ')}
                    onChange={(e) =>
                      update('contributors', [
                        ...book.contributors.filter((p) => p.role !== 'Author'),
                        ...e.target.value
                          .split(';')
                          .map((name) => ({ name: name.trim(), role: 'Author' })),
                      ])
                    }
                  />
                </Field>
                {simple('isbn13', 'ISBN-13')}
                {simple('isbn10', 'ISBN-10')}
                {!full && terms('genre', 'Genres')}
                {!full && location}
                <div className="span2">
                  <button
                    type="button"
                    disabled={busy || !(book.isbn13 || book.isbn10)}
                    onClick={() => void getMetadata()}
                  >
                    Look up ISBN online…
                  </button>
                  <small className="block">
                    Optional: sends only the ISBN to Open Library. Review before applying.
                  </small>
                </div>
                {full && extraFields(editionFields.General, 'extra')}
              </div>
            </div>
          )}
          {full && tab !== 'General' && (
            <div className="form-grid">
              {tab === 'Publication' && (
                <>
                  {simple('publisher', 'Publisher')}
                  {simple('publication_year', 'Publication year', 'number')}
                  {simple('pages', 'Pages', 'number')}
                  {simple('language', 'Language')}
                  {extraFields(editionFields.Publication, 'extra')}
                </>
              )}
              {tab === 'Contributors' && (
                <div className="span2">
                  <p>People are shared records. Separate roles can refer to the same person.</p>
                  {book.contributors.map((p, i) => (
                    <div className="inline" key={i}>
                      <select
                        aria-label="Contributor role"
                        value={p.role}
                        onChange={(e) =>
                          update(
                            'contributors',
                            book.contributors.map((v, j) =>
                              j === i ? { ...v, role: e.target.value } : v,
                            ),
                          )
                        }
                      >
                        {roles.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <input
                        aria-label="Contributor name"
                        list="people-list"
                        value={p.name}
                        onChange={(e) =>
                          update(
                            'contributors',
                            book.contributors.map((v, j) =>
                              j === i ? { ...v, name: e.target.value } : v,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        aria-label="Remove contributor"
                        onClick={() =>
                          update(
                            'contributors',
                            book.contributors.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      update('contributors', [...book.contributors, { name: '', role: 'Author' }])
                    }
                  >
                    <Plus size={16} />
                    Add contributor
                  </button>
                </div>
              )}
              {tab === 'Classification' && (
                <>
                  {['genre', 'subgenre', 'category', 'tag', 'collection'].map((k) => (
                    <div key={k}>{terms(k, k[0].toUpperCase() + k.slice(1))}</div>
                  ))}
                  {simple('series', 'Series')}
                  {simple('series_order', 'Series volume / order', 'number')}
                  {extraFields(editionFields.Classification, 'extra')}
                </>
              )}
              {tab === 'Reading' && (
                <>
                  <Field label="Reading status">
                    <select value={book.status} onChange={(e) => update('status', e.target.value)}>
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  {simple('current_page', 'Current page', 'number')}
                  <Field label="Rating">
                    <select
                      value={book.rating ?? ''}
                      onChange={(e) =>
                        update('rating', e.target.value === '' ? null : Number(e.target.value))
                      }
                    >
                      <option value="">Unrated</option>
                      {Array.from({ length: 11 }, (_, i) => i / 2).map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Favorite">
                    <input
                      type="checkbox"
                      checked={book.favorite}
                      onChange={(e) => update('favorite', e.target.checked)}
                    />
                  </Field>
                  {extraFields(copyFields.Reading, 'copy_extra')}
                </>
              )}
              {tab === 'Ownership' && (
                <>
                  {simple('acquisition_date', 'Acquisition date', 'date')}
                  {simple('source', 'Acquisition source')}
                  {extraFields(copyFields.Ownership, 'copy_extra')}
                </>
              )}
              {tab === 'Location' && (
                <>
                  {location}
                  {simple('barcode', 'Barcode / copy identifier')}
                  {extraFields(copyFields.Location, 'copy_extra')}
                </>
              )}
              {tab === 'Physical' && (
                <>
                  <Field label="Condition">
                    <select
                      value={book.condition}
                      onChange={(e) => update('condition', e.target.value)}
                    >
                      {conditions.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  {extraFields(copyFields.Physical, 'copy_extra')}
                </>
              )}
              {tab === 'Notes' && (
                <>
                  {extraFields(copyFields.Notes, 'copy_extra')}
                  <p className="muted span2">
                    After saving, add unlimited individual notes, quotes and reading sessions on the
                    book detail page.
                  </p>
                </>
              )}
              {tab === 'Custom Fields' &&
                (data.fields.length ? (
                  data.fields.map((f) => (
                    <Field key={f.id} label={f.name}>
                      {f.kind === 'dropdown' ? (
                        <select
                          value={book.custom[f.id] || ''}
                          onChange={(e) =>
                            update('custom', { ...book.custom, [f.id]: e.target.value })
                          }
                        >
                          <option value="">Not specified</option>
                          {String(f.extra?.options || '')
                            .split('|')
                            .map((o) => (
                              <option key={o}>{o.trim()}</option>
                            ))}
                        </select>
                      ) : f.kind === 'multiline' ? (
                        <textarea
                          value={book.custom[f.id] || ''}
                          onChange={(e) =>
                            update('custom', { ...book.custom, [f.id]: e.target.value })
                          }
                        />
                      ) : (
                        <input
                          type={
                            f.kind === 'checkbox'
                              ? 'checkbox'
                              : f.kind === 'date'
                                ? 'date'
                                : ['integer', 'decimal'].includes(f.kind || '')
                                  ? 'number'
                                  : 'text'
                          }
                          step={f.kind === 'decimal' ? 'any' : undefined}
                          checked={f.kind === 'checkbox' ? book.custom[f.id] === 'true' : undefined}
                          value={f.kind === 'checkbox' ? undefined : book.custom[f.id] || ''}
                          onChange={(e) =>
                            update('custom', {
                              ...book.custom,
                              [f.id]:
                                f.kind === 'checkbox' ? String(e.target.checked) : e.target.value,
                            })
                          }
                        />
                      )}
                    </Field>
                  ))
                ) : (
                  <p>Create your own fields in Settings → Custom fields.</p>
                ))}
            </div>
          )}
          {dup.length > 0 && (
            <div className="notice">
              <strong>Possible duplicate{dup.length > 1 ? 's' : ''}</strong>
              <p>
                {dup
                  .slice(0, 4)
                  .map((b) => `${b.title} (${author(b) || 'unknown author'})`)
                  .join(' · ')}
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={duplicateOk}
                  onChange={(e) => setDuplicateOk(e.target.checked)}
                />{' '}
                This is intentional; save as a separate record.
              </label>
              <small className="block">
                To share edition metadata, use “Add another copy” on the existing book instead.
              </small>
            </div>
          )}
        </div>
        <footer>
          {!full && (
            <button type="button" onClick={() => setFull(true)}>
              Open full editor
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={busy} type="submit">
            <Save size={16} />
            {busy ? 'Working…' : 'Save book'}
          </button>
        </footer>
        <datalist id="people-list">
          {data.people.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
      </form>
      {metadata && (
        <Modal title="Choose metadata to apply" onClose={() => setMetadata(null)}>
          <div className="dialog-body">
            <p>
              Selected fields replace the current form values. Nothing is saved until you save the
              book.
            </p>
            {['title', 'subtitle', 'authors', 'publishers', 'publish_date', 'number_of_pages']
              .filter((k) => metadata[k])
              .map((k) => (
                <label className="metadata-row" key={k}>
                  <input
                    type="checkbox"
                    checked={selectedMetadata.includes(k)}
                    onChange={(e) =>
                      setSelectedMetadata(
                        e.target.checked
                          ? [...selectedMetadata, k]
                          : selectedMetadata.filter((x) => x !== k),
                      )
                    }
                  />
                  <span>
                    <strong>{k.replaceAll('_', ' ')}</strong>
                    <br />
                    {Array.isArray(metadata[k])
                      ? (metadata[k] as { name: string }[]).map((v) => v.name).join(', ')
                      : String(metadata[k])}
                  </span>
                </label>
              ))}
          </div>
          <footer>
            <button onClick={() => setMetadata(null)}>Cancel</button>
            <button className="primary" onClick={applyMetadata}>
              Apply selected fields
            </button>
          </footer>
        </Modal>
      )}
    </Modal>
  );
}
