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
          placeholder={`Search ${section.toLowerCase()}…`}
          aria-label={`Search ${section}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {kind === 'loan' ? (
          <select aria-label="Loan status" value={mode} onChange={(e) => setMode(e.target.value)}>
            {['All', 'Active', 'Overdue', 'Returned'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        ) : kind === 'quote' ? (
          <select aria-label="Quote filter" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>All</option>
            <option>Favorites</option>
          </select>
        ) : null}
        <span className="spacer" />
        <button
          className="primary"
          disabled={!data.books.length}
          onClick={() => onRecord({ type: kind })}
        >
          <Plus size={16} />
          Add {kind}
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
                  {l.loan_date} → {l.due_date || 'No due date'}
                </span>
                <span
                  className={`badge ${!l.returned_date && l.due_date && l.due_date < today() ? 'overdue' : ''}`}
                >
                  {l.returned_date
                    ? `Returned ${l.returned_date}`
                    : l.due_date && l.due_date < today()
                      ? 'Overdue'
                      : 'On loan'}
                </span>
                {!l.returned_date && (
                  <>
                    <button onClick={() => onRecord({ type: 'loan', loan: l })}>Edit</button>
                    <button
                      onClick={() => onAction(() => api('return', { id: l.id, date: today() }))}
                    >
                      Return today
                    </button>
                  </>
                )}
              </div>
            ))}
          </section>
        ) : (
          <Empty title="No loans to show">
            <p>Lend a book to start a history of where it has been.</p>
          </Empty>
        )
      ) : entries.length ? (
        <div className="entry-grid">
          {entries.map((e) => (
            <article className="panel" key={e.id}>
              <div className="eyebrow">
                {kind === 'quote' ? 'WORDS TO KEEP' : String(e.extra.note_type || 'NOTE')}{' '}
                {e.extra.favorite ? '★' : ''}
              </div>
              <h3>{e.title}</h3>
              <p className={kind === 'quote' ? 'quote prose' : 'prose'}>{e.content}</p>
              {e.extra.note && <p>{String(e.extra.note)}</p>}
              <button className="text-button" onClick={() => onOpen(books.get(e.copy_id)!)}>
                {books.get(e.copy_id)?.title}
              </button>
              <small className="block">
                {e.page !== null ? `Page ${e.page} · ` : ''}
                {e.created_at.slice(0, 10)}
              </small>
              <button onClick={() => onRecord({ type: kind, entry: e })}>Edit</button>
            </article>
          ))}
        </div>
      ) : (
        <Empty title={`No ${section.toLowerCase()} to show`}>
          <p>Keep the passages and ideas that stay with you.</p>
        </Empty>
      )}
    </>
  );
}
