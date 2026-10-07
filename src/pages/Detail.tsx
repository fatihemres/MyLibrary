import { confirmAction } from '../components/Confirmation';
import { useState } from 'react';
import { ArrowLeft, Edit3, Plus, Star, Trash2 } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import {
  author,
  copyName,
  copyState,
  locationName,
  progress,
  today,
  type Book,
  type Snapshot,
} from '../domain/types';
import { CopyEditor } from '../components/CopyEditor';
import { copyFields, editionFields } from '../domain/fields';
import type { RecordRequest } from '../components/RecordDialog';
import { Cover, Empty } from '../components/common';
import { api, upload } from '../services/api';
export function Detail({
  book: b,
  data,
  onBack,
  onEdit,
  onRecord,
  onAction,
  onOpen,
  onReload,
}: {
  book: Book;
  data: Snapshot;
  onBack: () => void;
  onEdit: () => void;
  onRecord: (r: RecordRequest) => void;
  onAction: (f: () => Promise<unknown>) => void;
  onOpen: (b: Book) => void;
  onReload: () => Promise<void>;
}) {
  const [tab, setTab] = useState('Overview');
  const [copyEditor, setCopyEditor] = useState<{
    book: Book;
    mode: 'add' | 'edit' | 'move';
  } | null>(null);
  const entries = data.entries.filter((e) => e.copy_id === b.id);
  const loans = data.loans.filter((l) => l.copy_id === b.id);
  const copies = data.books.filter((v) => v.edition_id === b.edition_id);
  const [page, setPage] = useState(String(b.current_page));
  const info = (label: string, value: unknown) =>
    value !== undefined && value !== null && value !== '' ? (
      <div className="info" key={label}>
        <dt>{label}</dt>
        <dd>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</dd>
      </div>
    ) : null;
  return (
    <>
      <button className="back" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to library
      </button>
      <div className="detail-hero">
        <Cover book={b} large />
        <div>
          <div className="eyebrow">
            {b.series
              ? `${b.series}${b.series_order !== null ? ` · Volume ${b.series_order}` : ''}`
              : 'YOUR COLLECTION'}
          </div>
          <h1>{b.title}</h1>
          {b.subtitle && <p className="subtitle">{b.subtitle}</p>}
          <p className="detail-author">{author(b) || 'Author not specified'}</p>
          <div className="inline">
            <span className="badge">{b.status}</span>
            {b.rating !== null && <span className="rating">{b.rating} / 5 ★</span>}
            <button
              aria-label={b.favorite ? 'Remove favorite' : 'Mark favorite'}
              className="icon"
              onClick={() => onAction(() => api('save', { ...b, favorite: !b.favorite }))}
            >
              <Star size={19} fill={b.favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="muted">
            {locationName(b.location_id, data.locations) || 'No location assigned'}
            {b.copy_extra.shelf_position ? ` · Position ${b.copy_extra.shelf_position}` : ''}
          </p>
          <div className="inline">
            <button className="primary" onClick={onEdit}>
              <Edit3 size={16} />
              Edit book
            </button>
            <button onClick={() => setCopyEditor({ book: b, mode: 'add' })}>
              <Plus size={16} />
              Add Physical Copy
            </button>
            <button
              onClick={() => onRecord({ type: 'loan', book: b })}
              disabled={
                !!b.deleted_at ||
                b.copy_extra.copy_state === 'Missing' ||
                loans.some((l) => !l.returned_date)
              }
            >
              Lend book
            </button>
          </div>
          <p className="block">
            <strong>{copyName(b)}</strong> · {copyState(b, data.loans)}{' '}
            <button onClick={() => setCopyEditor({ book: b, mode: 'edit' })}>
              Edit physical copy
            </button>
          </p>
        </div>
      </div>
      <nav className="tabs">
        {[
          'Overview',
          'Publication',
          'Reading',
          'Notes',
          'Quotes',
          'Copies',
          'Lending',
          'Attachments',
          'Details',
        ].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <div className="detail-content">
        {tab === 'Overview' && (
          <div className="two-col">
            <section className="panel">
              <h2>About this book</h2>
              <p className="prose">
                {String(
                  b.extra.synopsis || b.extra.personal_description || 'No description added yet.',
                )}
              </p>
              <div className="chips">
                {Object.entries(b.terms).flatMap(([kind, terms]) =>
                  terms.map((t) => (
                    <span className="badge" key={`${kind}-${t}`}>
                      {t}
                    </span>
                  )),
                )}
              </div>
              {b.copy_extra.personal_notes && (
                <>
                  <h3>Personal notes</h3>
                  <p className="prose">{String(b.copy_extra.personal_notes)}</p>
                </>
              )}
              {b.copy_extra.spoiler_notes && (
                <details>
                  <summary>Spoiler notes</summary>
                  <p className="prose">{String(b.copy_extra.spoiler_notes)}</p>
                </details>
              )}
            </section>
            <section className="panel">
              <h2>At a glance</h2>
              <dl>
                {info('Publisher', b.publisher)}
                {info('Published', b.publication_year)}
                {info('Language', b.language)}
                {info('Pages', b.pages)}
                {info('Condition', b.condition)}
                {info('Acquired', b.acquisition_date)}
                {info('Copies', copies.length)}
              </dl>
            </section>
          </div>
        )}
        {tab === 'Publication' && (
          <section className="panel">
            <dl className="details-grid">
              {info('Title', b.title)}
              {info('Subtitle', b.subtitle)}
              {info('Publisher', b.publisher)}
              {info('Publication year', b.publication_year)}
              {info('ISBN-10', b.isbn10)}
              {info('ISBN-13', b.isbn13)}
              {info('Language', b.language)}
              {info('Pages', b.pages)}
              {b.contributors.map((p, i) => info(`${p.role} ${i + 1}`, p.name))}
              {Object.values(editionFields)
                .flat()
                .map((f) => info(f.label, b.extra[f.key]))}
            </dl>
          </section>
        )}
        {tab === 'Reading' && (
          <>
            <div className="panel">
              <h2>Your reading journey</h2>
              <div className="progress">
                <span style={{ width: `${progress(b)}%` }} />
              </div>
              <p>
                {b.current_page} / {b.pages ?? '?'} pages · {progress(b)}%
              </p>
              <div className="inline">
                <input
                  aria-label="Current page"
                  type="number"
                  min="0"
                  max={b.pages ?? undefined}
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                />
                <button
                  onClick={() =>
                    onAction(() =>
                      api('save', {
                        ...b,
                        current_page: Number(page),
                        status: b.status === 'Unread' ? 'Reading' : b.status,
                        copy_extra: {
                          ...b.copy_extra,
                          date_started: b.copy_extra.date_started || today(),
                        },
                      }),
                    )
                  }
                >
                  Update progress
                </button>
                <button
                  onClick={() =>
                    onAction(() =>
                      api('save', {
                        ...b,
                        status: 'Finished',
                        current_page: b.pages ?? b.current_page,
                        copy_extra: {
                          ...b.copy_extra,
                          date_finished: today(),
                          times_read:
                            Number(b.copy_extra.times_read || 0) +
                            (b.status === 'Finished' ? 0 : 1),
                        },
                      }),
                    )
                  }
                >
                  Mark finished
                </button>
                <button onClick={() => onRecord({ type: 'reading', book: b })}>
                  Log reading session
                </button>
              </div>
              <dl className="details-grid">
                {copyFields.Reading.map((f) => info(f.label, b.copy_extra[f.key]))}
              </dl>
            </div>
            {entries
              .filter((e) => e.kind === 'reading')
              .map((e) => (
                <article className="panel" key={e.id}>
                  <h3>{e.title || 'Reading session'}</h3>
                  <p className="prose">{e.content}</p>
                  <small>
                    {String(e.extra.started || e.created_at.slice(0, 10))} —{' '}
                    {String(e.extra.finished || '')} · {String(e.extra.minutes || '—')} minutes
                  </small>
                  <button onClick={() => onRecord({ type: 'reading', book: b, entry: e })}>
                    Edit
                  </button>
                </article>
              ))}
          </>
        )}
        {['Notes', 'Quotes'].includes(tab) && (
          <>
            <div className="section-heading">
              <h2>{tab}</h2>
              <button
                onClick={() => onRecord({ type: tab === 'Notes' ? 'note' : 'quote', book: b })}
              >
                <Plus size={16} />
                Add {tab === 'Notes' ? 'note' : 'quote'}
              </button>
            </div>
            {!entries.some((e) => e.kind === (tab === 'Notes' ? 'note' : 'quote')) && (
              <Empty title={`No ${tab.toLowerCase()} yet`} />
            )}
            <div className="entry-grid">
              {entries
                .filter((e) => e.kind === (tab === 'Notes' ? 'note' : 'quote'))
                .map((e) => (
                  <article className="panel" key={e.id}>
                    <h3>
                      {e.title || e.extra.note_type || 'Saved quotation'}{' '}
                      {e.extra.favorite ? '★' : ''}
                    </h3>
                    <p className={e.kind === 'quote' ? 'quote prose' : 'prose'}>{e.content}</p>
                    {e.extra.note && <p>{String(e.extra.note)}</p>}
                    <small>
                      {e.page !== null ? `Page ${e.page} · ` : ''}
                      {e.created_at.slice(0, 10)}
                    </small>
                    <div className="inline">
                      <button
                        onClick={() =>
                          onRecord({ type: e.kind as 'note' | 'quote', book: b, entry: e })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="danger-text"
                        onClick={async () => {
                          if (
                            await confirmAction('Delete this entry? This action cannot be undone.')
                          )
                            onAction(() => api('delete_entry', { id: e.id }));
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}
        {tab === 'Copies' && (
          <section className="panel">
            <h2>
              {copies.length} physical {copies.length === 1 ? 'copy' : 'copies'}
            </h2>
            <p>
              These copies share bibliographic metadata. Ownership, reading, location and loans are
              independent.
            </p>
            <button className="primary" onClick={() => setCopyEditor({ book: b, mode: 'add' })}>
              Add Copy
            </button>
            {!copies.length && (
              <p>Add your first physical copy to record its shelf, condition and acquisition.</p>
            )}
            {copies.map((c) => {
              const loan = data.loans.find((l) => l.copy_id === c.id && !l.returned_date);
              return (
                <article className="panel copy-card" key={c.id} aria-label={copyName(c)}>
                  <div className="section-heading">
                    <h3>{copyName(c)}</h3>
                    <span className="badge">{copyState(c, data.loans)}</span>
                  </div>
                  <p>
                    {locationName(c.location_id, data.locations) || 'Unassigned'}
                    {c.copy_extra.shelf_position
                      ? ` · Position ${c.copy_extra.shelf_position}`
                      : ''}
                  </p>
                  <p>
                    {c.condition} · {c.acquisition_date || 'Acquisition date not recorded'}{' '}
                    {c.source && ` · ${c.source}`}
                  </p>
                  <p className="muted">
                    {String(c.copy_extra.location_note || '')}
                    {c.copy_extra.purchase_price !== undefined
                      ? ` · ${c.copy_extra.purchase_price} ${c.copy_extra.currency || ''}`
                      : ''}
                  </p>
                  <div className="inline wrap">
                    <button
                      onClick={() => {
                        onOpen(c);
                        setTab('Overview');
                      }}
                    >
                      View copy / book
                    </button>
                    <button onClick={() => setCopyEditor({ book: c, mode: 'edit' })}>Edit</button>
                    <button onClick={() => setCopyEditor({ book: c, mode: 'move' })}>Move</button>
                    {loan ? (
                      <button
                        onClick={() =>
                          onAction(() => api('return', { id: loan.id, date: today() }))
                        }
                      >
                        Mark returned
                      </button>
                    ) : (
                      <button
                        disabled={c.copy_extra.copy_state === 'Missing'}
                        onClick={() => onRecord({ type: 'loan', book: c })}
                      >
                        Loan
                      </button>
                    )}
                    <button
                      className="danger-text"
                      onClick={async () => {
                        if (
                          await confirmAction(
                            `Archive ${copyName(c)}? Its history and attachments will be kept in Trash.`,
                          )
                        )
                          onAction(async () => {
                            await api('trash', { ids: [c.id] });
                            if (c.id === b.id) {
                              const next = copies.find((other) => other.id !== c.id);
                              if (next) onOpen(next);
                              else onBack();
                            }
                          });
                      }}
                    >
                      Archive
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        {tab === 'Lending' && (
          <section className="panel">
            <h2>Lending history</h2>
            {!loans.length && <p>No loans recorded.</p>}
            {loans.map((l) => (
              <div className="list-row" key={l.id}>
                <div>
                  <strong>{l.borrower}</strong>
                  <small className="block">
                    {l.contact} {l.notes}
                  </small>
                </div>
                <span>
                  {l.loan_date} → {l.due_date || 'No due date'}
                </span>
                <span>
                  {l.returned_date
                    ? `Returned ${l.returned_date}`
                    : l.due_date && l.due_date < today()
                      ? 'Overdue'
                      : 'On loan'}
                </span>
                {!l.returned_date && (
                  <button
                    onClick={() => onAction(() => api('return', { id: l.id, date: today() }))}
                  >
                    Return today
                  </button>
                )}
              </div>
            ))}
          </section>
        )}
        {tab === 'Attachments' && (
          <section className="panel">
            <h2>Files & receipts</h2>
            <label className="button">
              Add attachment
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAction(() => upload(file, b.id));
                }}
              />
            </label>
            {data.attachments
              .filter((a) => a.copy_id === b.id)
              .map((a) => (
                <div className="list-row" key={a.id}>
                  <span>{a.name}</span>
                  <small>{a.created_at.slice(0, 10)}</small>
                  <button
                    onClick={() =>
                      onAction(async () => {
                        const path = await save({ defaultPath: a.name });
                        if (path) await api('export_attachment', { id: a.id, path });
                      })
                    }
                  >
                    Save a copy…
                  </button>
                </div>
              ))}
          </section>
        )}
        {tab === 'Details' && (
          <>
            <section className="panel">
              <dl className="details-grid">
                {info('Library ID', b.id)}
                {info('Edition ID', b.edition_id)}
                {info('Barcode', b.barcode)}
                {info('Created', b.created_at)}
                {info('Updated', b.updated_at)}
                {info('Location', locationName(b.location_id, data.locations))}
                {info('Acquisition source', b.source)}
                {Object.values(copyFields)
                  .flat()
                  .map((f) => info(f.label, b.copy_extra[f.key]))}
                {data.fields.map((f) => info(f.name, b.custom[f.id]))}
              </dl>
            </section>
            <button
              className="danger-text"
              onClick={async () => {
                if (
                  await confirmAction(
                    'Move this copy to Trash? Its records and files will be retained.',
                  )
                )
                  onAction(async () => {
                    await api('trash', { ids: [b.id] });
                    onBack();
                  });
              }}
            >
              <Trash2 size={16} />
              Move copy to Trash
            </button>
          </>
        )}
      </div>
      {copyEditor && (
        <CopyEditor
          {...copyEditor}
          data={data}
          onClose={() => setCopyEditor(null)}
          onSaved={onReload}
        />
      )}
    </>
  );
}
