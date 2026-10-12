import { DuplicateResolver } from './DuplicateResolver';
import { BarcodeScan } from './BarcodeScan';
import { newBookDraft } from '../domain/scanner';
import type { Isbn } from '../domain/isbn';
import { hasSignals, type DuplicateReport, type DuplicateDecision } from '../domain/duplicates';
import { MetadataLookup } from './MetadataLookup';
import { ErrorText } from './ErrorText';
import { t, label as trLabel } from '../i18n';
import { commandPressed } from '../services/platform';
import { confirmAction } from './Confirmation';
import { useEffect, useRef, useState } from 'react';
import { Plus, Save, Upload, X } from 'lucide-react';
import {
  conditions,
  locationName,
  roles,
  statuses,
  type Book,
  type Snapshot,
} from '../domain/types';
import { copyFields, editionFields, type Field as FieldDef } from '../domain/fields';
import { api, upload } from '../services/api';
import { validateBook } from '../services/transfer';
import { Cover, Field, Modal } from './common';
import { useUnsaved } from './useUnsaved';
export function BookEditor({
  initial,
  seed,
  protectSession = false,
  data,
  quick,
  onClose,
  onSaved,
}: {
  initial?: Book;
  seed?: Isbn;
  protectSession?: boolean;
  data: Snapshot;
  quick: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [book, setBook] = useState<Book>(() =>
    initial ? structuredClone(initial) : newBookDraft(data, seed),
  );
  const baseline = useRef(JSON.stringify(book));
  useUnsaved(protectSession || baseline.current !== JSON.stringify(book));
  const [tab, setTab] = useState('General');
  const [full, setFull] = useState(!quick);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState<DuplicateReport | null>(null);
  const persist = async (decision?: DuplicateDecision) => {
    if (initial) await api('save', book);
    else await api('create_decided', { book, decision });
    await onSaved();
    onClose();
  };
  const close = async () => {
    if (busy || duplicateReport || scannerOpen) return;
    if (
      baseline.current !== JSON.stringify(book) &&
      !(await confirmAction('Discard your unsaved changes?'))
    )
      return;
    onClose();
  };
  const update = <K extends keyof Book>(key: K, value: Book[K]) =>
    setBook((b) => ({ ...b, [key]: value }));
  const save = async () => {
    if (busy || metadataOpen || duplicateReport || scannerOpen) return;
    const errors = validateBook(book);
    if (errors.length) {
      setError(errors.join('. '));
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (!initial) {
        const report = await api<DuplicateReport>('duplicate_report', book);
        if (hasSignals(report)) {
          setDuplicateReport(report);
          return;
        }
      }
      await persist();
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
      if (commandPressed(e) && e.key.toLowerCase() === 's') {
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
      <Field key={f.key} label={trLabel(f.label)}>
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
            <option value="">{t('ui.notSpecified')}</option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {trLabel(o)}
              </option>
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
    <Field label={trLabel(label)}>
      <input
        autoFocus={key === 'title'}
        required={key === 'title'}
        aria-invalid={(key === 'title' && !!error && !book.title.trim()) || undefined}
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
    <Field label={t('fields.separate', { field: trLabel(label) })}>
      <input
        value={book.terms[kind]?.join('; ') || ''}
        onChange={(e) =>
          update('terms', { ...book.terms, [kind]: e.target.value.split(';').map((t) => t.trim()) })
        }
      />
    </Field>
  );
  const location = (
    <Field label={t('ui.physicalLocation')}>
      <select value={book.location_id} onChange={(e) => update('location_id', e.target.value)}>
        <option value="">{t('ui.notAssigned')}</option>
        {data.locations.map((l) => (
          <option key={l.id} value={l.id}>
            {locationName(l.id, data.locations)}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <Modal
      wide
      title={initial ? t('ui.editBookCopy') : full ? t('ui.addABook') : t('ui.quickAdd')}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="editor-intro">
          <span>{t('ui.onlyTheTitleIsRequiredEverythingElseCanComeLater')}</span>
          {initial && data.books.filter((b) => b.edition_id === initial.edition_id).length > 1 && (
            <strong>{t('ui.sharedEditionBibliographicEditsUpdateAllCopies')}</strong>
          )}
        </div>
        {full && (
          <nav className="tabs" aria-label={t('ui.editorSections')}>
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
                {trLabel(t)}
              </button>
            ))}
          </nav>
        )}
        <div className="editor-body">
          {error && (
            <div className="alert" role="alert">
              <ErrorText message={error} />
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
                  {t('ui.chooseCover')}{' '}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => void image(e.target.files?.[0])}
                  />
                </label>
                <small>{t('ui.orDropAnImageHere')}</small>
                {book.cover && (
                  <button type="button" onClick={() => update('cover', '')}>
                    {t('ui.removeCover')}{' '}
                  </button>
                )}
              </div>
              <div className="form-grid">
                {simple('title', 'Title *')}
                {full && simple('subtitle', 'Subtitle')}
                <Field label={t('ui.authorsSeparateWith')}>
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
                <MetadataLookup
                  book={book}
                  setBook={setBook}
                  disabled={busy}
                  onPreviewChange={setMetadataOpen}
                />
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
                  <p>{t('ui.peopleAreSharedRecordsSeparateRolesCanReferToTheSamePerson')}</p>
                  {book.contributors.map((p, i) => (
                    <div className="inline" key={i}>
                      <select
                        aria-label={t('ui.contributorRole')}
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
                          <option key={r} value={r}>
                            {trLabel(r)}
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label={t('ui.contributorName')}
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
                        aria-label={t('ui.removeContributor')}
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
                    {t('ui.addContributor')}{' '}
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
                  <Field label={t('ui.readingStatus')}>
                    <select value={book.status} onChange={(e) => update('status', e.target.value)}>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {trLabel(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {simple('current_page', 'Current page', 'number')}
                  <Field label={t('ui.rating')}>
                    <select
                      value={book.rating ?? ''}
                      onChange={(e) =>
                        update('rating', e.target.value === '' ? null : Number(e.target.value))
                      }
                    >
                      <option value="">{t('ui.unrated')}</option>
                      {Array.from({ length: 11 }, (_, i) => i / 2).map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('ui.favorite')}>
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
                  <BarcodeScan
                    data={data}
                    onApply={(value) => update('barcode', value)}
                    onOpenChange={setScannerOpen}
                  />
                  {extraFields(copyFields.Location, 'copy_extra')}
                </>
              )}
              {tab === 'Physical' && (
                <>
                  <Field label={t('ui.condition')}>
                    <select
                      value={book.condition}
                      onChange={(e) => update('condition', e.target.value)}
                    >
                      {conditions.map((c) => (
                        <option key={c} value={c}>
                          {trLabel(c)}
                        </option>
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
                    {t(
                      'ui.afterSavingAddUnlimitedIndividualNotesQuotesAndReadingSessionsOnTheBookDetailPage',
                    )}{' '}
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
                          <option value="">{t('ui.notSpecified')}</option>
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
                  <p>{t('ui.createYourOwnFieldsInSettingsCustomFields')}</p>
                ))}
            </div>
          )}
        </div>
        <footer>
          {!full && (
            <button type="button" onClick={() => setFull(true)}>
              {t('ui.openFullEditor')}{' '}
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={close}>
            {t('ui.cancel')}{' '}
          </button>
          <button className="primary" disabled={busy} type="submit">
            <Save size={16} />
            {busy ? t('ui.working') : t('ui.saveBook')}
          </button>
        </footer>
        <datalist id="people-list">
          {data.people.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
      </form>
      {duplicateReport && (
        <DuplicateResolver
          book={book}
          report={duplicateReport}
          onClose={() => setDuplicateReport(null)}
          onConfirm={persist}
        />
      )}
    </Modal>
  );
}
