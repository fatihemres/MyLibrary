import { t, label as trLabel, date, currency } from '../i18n';
import { confirmAction } from '../components/Confirmation';
import { useState } from 'react';
import { ArrowLeft, Edit3, Plus, Star, Trash2 } from 'lucide-react';
import { chooseDestination as save } from '../services/platform';
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
      <div className="info" key={trLabel(String(label))}>
        <dt>{trLabel(String(label))}</dt>
        <dd>{typeof value === 'boolean' ? (value ? t('ui.yes') : t('ui.no')) : String(value)}</dd>
      </div>
    ) : null;
  return (
    <>
      <button className="back" onClick={onBack}>
        <ArrowLeft size={16} />
        {t('ui.backToLibrary')}{' '}
      </button>
      <div className="detail-hero">
        <Cover book={b} large />
        <div>
          <div className="eyebrow">
            {b.series
              ? `${b.series}${b.series_order !== null ? t('copy.volume', { volume: b.series_order }) : ''}`
              : t('ui.yourCollection')}
          </div>
          <h1>{b.title}</h1>
          {b.subtitle && <p className="subtitle">{b.subtitle}</p>}
          <p className="detail-author">{author(b) || t('ui.authorNotSpecified')}</p>
          <div className="inline">
            <span className="badge">{trLabel(b.status)}</span>
            {b.rating !== null && <span className="rating">{b.rating} / 5 ★</span>}
            <button
              aria-label={b.favorite ? t('ui.removeFavorite') : t('ui.markFavorite')}
              className="icon"
              onClick={() => onAction(() => api('save', { ...b, favorite: !b.favorite }))}
            >
              <Star size={19} fill={b.favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="muted">
            {locationName(b.location_id, data.locations) || t('ui.noLocationAssigned')}
            {b.copy_extra.shelf_position
              ? t('copy.position', { position: b.copy_extra.shelf_position })
              : ''}
          </p>
          <div className="inline">
            <button className="primary" onClick={onEdit}>
              <Edit3 size={16} />
              {t('ui.editBook')}{' '}
            </button>
            <button onClick={() => setCopyEditor({ book: b, mode: 'add' })}>
              <Plus size={16} />
              {t('ui.addPhysicalCopy')}{' '}
            </button>
            <button
              onClick={() => onRecord({ type: 'loan', book: b })}
              disabled={
                !!b.deleted_at ||
                b.copy_extra.copy_state === 'Missing' ||
                loans.some((l) => !l.returned_date)
              }
            >
              {t('ui.lendBook')}{' '}
            </button>
          </div>
          <p className="block">
            <strong>{copyName(b)}</strong> · {copyState(b, data.loans)}{' '}
            <button onClick={() => setCopyEditor({ book: b, mode: 'edit' })}>
              {t('ui.editPhysicalCopy')}{' '}
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
            {trLabel(t)}
          </button>
        ))}
      </nav>
      <div className="detail-content">
        {tab === 'Overview' && (
          <div className="two-col">
            <section className="panel">
              <h2>{t('ui.aboutThisBook')}</h2>
              <p className="prose">
                {String(
                  b.extra.synopsis || b.extra.personal_description || t('ui.noDescriptionAddedYet'),
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
                  <h3>{t('ui.personalNotes')}</h3>
                  <p className="prose">{String(b.copy_extra.personal_notes)}</p>
                </>
              )}
              {b.copy_extra.spoiler_notes && (
                <details>
                  <summary>{t('ui.spoilerNotes')}</summary>
                  <p className="prose">{String(b.copy_extra.spoiler_notes)}</p>
                </details>
              )}
            </section>
            <section className="panel">
              <h2>{t('ui.atAGlance')}</h2>
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
              {b.contributors.map((p, i) => info(`${trLabel(p.role)} ${i + 1}`, p.name))}
              {Object.values(editionFields)
                .flat()
                .map((f) => info(f.label, b.extra[f.key]))}
            </dl>
          </section>
        )}
        {tab === 'Reading' && (
          <>
            <div className="panel">
              <h2>{t('ui.yourReadingJourney')}</h2>
              <div className="progress">
                <span style={{ width: `${progress(b)}%` }} />
              </div>
              <p>
                {b.current_page} / {b.pages ?? '?'} {t('ui.pagesAlt')} {progress(b)}%
              </p>
              <div className="inline">
                <input
                  aria-label={t('ui.currentPage')}
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
                  {t('ui.updateProgress')}{' '}
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
                  {t('ui.markFinished')}{' '}
                </button>
                <button onClick={() => onRecord({ type: 'reading', book: b })}>
                  {t('ui.logReadingSession')}{' '}
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
                  <h3>{e.title || t('ui.readingSession')}</h3>
                  <p className="prose">{e.content}</p>
                  <small>
                    {String(e.extra.started || date(e.created_at))} —{' '}
                    {String(e.extra.finished || '')} · {String(e.extra.minutes || '—')}{' '}
                    {t('ui.minutes')}{' '}
                  </small>
                  <button onClick={() => onRecord({ type: 'reading', book: b, entry: e })}>
                    {t('ui.edit')}{' '}
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
                {t(tab === 'Notes' ? 'actions.addNote' : 'actions.addQuote')}
              </button>
            </div>
            {!entries.some((e) => e.kind === (tab === 'Notes' ? 'note' : 'quote')) && (
              <Empty title={t('empty.section', { section: trLabel(tab).toLocaleLowerCase() })} />
            )}
            <div className="entry-grid">
              {entries
                .filter((e) => e.kind === (tab === 'Notes' ? 'note' : 'quote'))
                .map((e) => (
                  <article className="panel" key={e.id}>
                    <h3>
                      {e.title || e.extra.note_type || t('ui.savedQuotation')}{' '}
                      {e.extra.favorite ? '★' : ''}
                    </h3>
                    <p className={e.kind === 'quote' ? 'quote prose' : 'prose'}>{e.content}</p>
                    {e.extra.note && <p>{String(e.extra.note)}</p>}
                    <small>
                      {e.page !== null ? t('entry.page', { page: e.page }) : ''}
                      {date(e.created_at)}
                    </small>
                    <div className="inline">
                      <button
                        onClick={() =>
                          onRecord({ type: e.kind as 'note' | 'quote', book: b, entry: e })
                        }
                      >
                        {t('ui.edit')}{' '}
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
                        {t('ui.delete')}{' '}
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
              {copies.length} {t('ui.physicalAlt')}{' '}
              {copies.length === 1 ? t('copy.singular') : t('ui.copiesAlt')}
            </h2>
            <p>
              {t(
                'ui.theseCopiesShareBibliographicMetadataOwnershipReadingLocationAndLoansAreIndependent',
              )}{' '}
            </p>
            <button className="primary" onClick={() => setCopyEditor({ book: b, mode: 'add' })}>
              {t('ui.addCopy')}{' '}
            </button>
            {!copies.length && (
              <p>{t('ui.addYourFirstPhysicalCopyToRecordItsShelfConditionAndAcquisition')}</p>
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
                    {locationName(c.location_id, data.locations) || t('ui.unassigned')}
                    {c.copy_extra.shelf_position
                      ? t('copy.position', { position: c.copy_extra.shelf_position })
                      : ''}
                  </p>
                  <p>
                    {trLabel(c.condition)} ·{' '}
                    {c.acquisition_date || t('ui.acquisitionDateNotRecorded')}{' '}
                    {c.source && ` · ${c.source}`}
                  </p>
                  <p className="muted">
                    {String(c.copy_extra.location_note || '')}
                    {c.copy_extra.purchase_price !== undefined
                      ? ` · ${c.copy_extra.currency && /^[A-Z]{3}$/.test(String(c.copy_extra.currency)) ? currency(Number(c.copy_extra.purchase_price), String(c.copy_extra.currency)) : c.copy_extra.purchase_price}`
                      : ''}
                  </p>
                  <div className="inline wrap">
                    <button
                      onClick={() => {
                        onOpen(c);
                        setTab('Overview');
                      }}
                    >
                      {t('ui.viewCopyBook')}{' '}
                    </button>
                    <button onClick={() => setCopyEditor({ book: c, mode: 'edit' })}>
                      {t('ui.edit')}
                    </button>
                    <button onClick={() => setCopyEditor({ book: c, mode: 'move' })}>
                      {t('ui.move')}
                    </button>
                    {loan ? (
                      <button
                        onClick={() =>
                          onAction(() => api('return', { id: loan.id, date: today() }))
                        }
                      >
                        {t('ui.markReturned')}{' '}
                      </button>
                    ) : (
                      <button
                        disabled={c.copy_extra.copy_state === 'Missing'}
                        onClick={() => onRecord({ type: 'loan', book: c })}
                      >
                        {t('ui.loan')}{' '}
                      </button>
                    )}
                    <button
                      className="danger-text"
                      onClick={async () => {
                        if (await confirmAction(t('copy.archive', { name: copyName(c) })))
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
                      {t('ui.archive')}{' '}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        {tab === 'Lending' && (
          <section className="panel">
            <h2>{t('ui.lendingHistory')}</h2>
            {!loans.length && <p>{t('ui.noLoansRecorded')}</p>}
            {loans.map((l) => (
              <div className="list-row" key={l.id}>
                <div>
                  <strong>{l.borrower}</strong>
                  <small className="block">
                    {l.contact} {l.notes}
                  </small>
                </div>
                <span>
                  {l.loan_date} → {l.due_date || t('ui.noDueDate')}
                </span>
                <span>
                  {l.returned_date
                    ? t('copy.returned', { date: date(l.returned_date) })
                    : l.due_date && l.due_date < today()
                      ? t('ui.overdue')
                      : t('ui.onLoan')}
                </span>
                {!l.returned_date && (
                  <button
                    onClick={() => onAction(() => api('return', { id: l.id, date: today() }))}
                  >
                    {t('ui.returnToday')}{' '}
                  </button>
                )}
              </div>
            ))}
          </section>
        )}
        {tab === 'Attachments' && (
          <section className="panel">
            <h2>{t('ui.filesReceipts')}</h2>
            <label className="button">
              {t('ui.addAttachment')}{' '}
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
                    {t('ui.saveACopy')}{' '}
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
              {t('ui.moveCopyToTrash')}{' '}
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
