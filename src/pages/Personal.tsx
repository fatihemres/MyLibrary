import { t, label as trLabel, date } from '../i18n';
import { useState } from 'react';
import { copyName } from '../domain/types';
import { Plus } from 'lucide-react';
import { today, type Book, type Snapshot } from '../domain/types';
import type { RecordRequest } from '../components/RecordDialog';
import { Empty } from '../components/common';
import { api } from '../services/api';
export function Personal({
  section,
  data,
  onRecord,
  onOpen,
  onAction,
}: {
  section: string;
  data: Snapshot;
  onRecord: (r: RecordRequest) => void;
  onOpen: (b: Book) => void;
  onAction: (f: () => Promise<unknown>) => void;
}) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('All');
  const kind = section === 'Quotes' ? 'quote' : section === 'Notes' ? 'note' : 'loan';
  const q = query.toLowerCase();
  const books = new Map(data.books.map((b) => [b.id, b]));
  const loans = data.loans.filter(
    (l) =>
      books.has(l.copy_id) &&
      `${l.borrower} ${l.contact} ${l.notes} ${books.get(l.copy_id)?.title}`
        .toLowerCase()
        .includes(q) &&
      (mode === 'All' ||
        (mode === 'Active' && !l.returned_date) ||
        (mode === 'Returned' && !!l.returned_date) ||
        (mode === 'Overdue' && !l.returned_date && l.due_date && l.due_date < today())),
  );
  const entries = data.entries.filter(
    (e) =>
      books.has(e.copy_id) &&
      e.kind === kind &&
      `${e.title} ${e.content} ${e.extra.note || ''} ${books.get(e.copy_id)?.title}`
        .toLowerCase()
        .includes(q) &&
      (mode !== 'Favorites' || e.extra.favorite),
  );
  return (
    <>
      <div className="toolbar">
        <input
          placeholder={t('actions.search', { section: trLabel(section) }) + '…'}
          aria-label={t('actions.search', { section: trLabel(section) })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {kind === 'loan' ? (
          <select
            aria-label={t('ui.loanStatus')}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {['All', 'Active', 'Overdue', 'Returned'].map((m) => (
              <option key={m} value={m}>
                {trLabel(m)}
              </option>
            ))}
          </select>
        ) : kind === 'quote' ? (
          <select
            aria-label={t('ui.quoteFilter')}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="All">{t('ui.all')}</option>
            <option value="Favorites">{t('ui.favorites')}</option>
          </select>
        ) : null}
        <span className="spacer" />
        <button
          className="primary"
          disabled={!data.books.length}
          onClick={() => onRecord({ type: kind })}
        >
          <Plus size={16} />
          {t('actions.addKind', { kind: trLabel(kind) })}
        </button>
      </div>
      {kind === 'loan' ? (
        loans.length ? (
          <section className="panel">
            {loans.map((l) => (
              <div className="list-row" key={l.id}>
                <div>
                  <button className="text-button" onClick={() => onOpen(books.get(l.copy_id)!)}>
                    {books.get(l.copy_id)?.title}
                    {' · '}
                    {copyName(books.get(l.copy_id)!)}
                  </button>
                  <small className="block">
                    {l.borrower} · {l.contact}
                  </small>
                  <small className="block">{l.notes}</small>
                </div>
                <span>
                  {l.loan_date} → {l.due_date || t('ui.noDueDate')}
                </span>
                <span
                  className={`badge ${!l.returned_date && l.due_date && l.due_date < today() ? 'overdue' : ''}`}
                >
                  {l.returned_date
                    ? t('copy.returned', { date: date(l.returned_date) })
                    : l.due_date && l.due_date < today()
                      ? t('ui.overdue')
                      : t('ui.onLoan')}
                </span>
                {!l.returned_date && (
                  <>
                    <button onClick={() => onRecord({ type: 'loan', loan: l })}>
                      {t('ui.edit')}
                    </button>
                    <button
                      onClick={() => onAction(() => api('return', { id: l.id, date: today() }))}
                    >
                      {t('ui.returnToday')}{' '}
                    </button>
                  </>
                )}
              </div>
            ))}
          </section>
        ) : (
          <Empty title={t('ui.noLoansToShow')}>
            <p>{t('ui.lendABookToStartAHistoryOfWhereItHasBeen')}</p>
          </Empty>
        )
      ) : entries.length ? (
        <div className="entry-grid">
          {entries.map((e) => (
            <article className="panel" key={e.id}>
              <div className="eyebrow">
                {kind === 'quote' ? t('ui.wordsToKeep') : String(e.extra.note_type || 'NOTE')}{' '}
                {e.extra.favorite ? '★' : ''}
              </div>
              <h3>{e.title}</h3>
              <p className={kind === 'quote' ? 'quote prose' : 'prose'}>{e.content}</p>
              {e.extra.note && <p>{String(e.extra.note)}</p>}
              <button className="text-button" onClick={() => onOpen(books.get(e.copy_id)!)}>
                {books.get(e.copy_id)?.title}
              </button>
              <small className="block">
                {e.page !== null ? t('entry.page', { page: e.page }) : ''}
                {date(e.created_at)}
              </small>
              <button onClick={() => onRecord({ type: kind, entry: e })}>{t('ui.edit')}</button>
            </article>
          ))}
        </div>
      ) : (
        <Empty title={t('empty.show', { section: trLabel(section).toLocaleLowerCase() })}>
          <p>{t('ui.keepThePassagesAndIdeasThatStayWithYou')}</p>
        </Empty>
      )}
    </>
  );
}
