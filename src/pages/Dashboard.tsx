import { author, progress, today, type Book, type Snapshot } from '../domain/types';
import { Cover, Empty } from '../components/common';
export function Dashboard({
  data,
  onOpen,
  onNavigate,
}: {
  data: Snapshot;
  onOpen: (b: Book) => void;
  onNavigate: (view: string) => void;
}) {
  const books = data.books;
  const active = data.loans.filter((l) => !l.returned_date);
  const reading = books.filter((b) => b.status === 'Reading');
  const recent = [...books].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const finished = books
    .filter((b) => b.status === 'Finished')
    .sort((a, b) =>
      String(b.copy_extra.date_finished || b.updated_at).localeCompare(
        String(a.copy_extra.date_finished || a.updated_at),
      ),
    )
    .slice(0, 4);
  const chart = (label: string, values: string[]) => {
    const count = new Map<string, number>();
    values.filter(Boolean).forEach((v) => count.set(v, (count.get(v) || 0) + 1));
    const items = [...count].sort((a, b) => b[1] - a[1]).slice(0, 7);
    return (
      <section className="panel" key={label}>
        <h2>{label}</h2>
        {items.length ? (
          items.map(([name, n]) => (
            <div className="chart-row" key={name}>
              <span title={name}>{name}</span>
              <div>
                <i style={{ width: `${(n / items[0][1]) * 100}%` }} />
              </div>
              <strong>{n}</strong>
            </div>
          ))
        ) : (
          <p className="muted">Add books to see this breakdown.</p>
        )}
      </section>
    );
  };
  return (
    <>
      <div className="dashboard-heading">
        <div className="eyebrow">A LITTLE ORDER. A WORLD OF STORIES.</div>
        <h1>Your library, at a glance.</h1>
        <p>A quiet home for the books you own, the words you keep, and what comes next.</p>
      </div>
      <div className="stats">
        {[
          ['Total books', books.length, 'Library'],
          ['Pages on your shelves', books.reduce((n, b) => n + (b.pages || 0), 0), 'Library'],
          ['Finished', books.filter((b) => b.status === 'Finished').length, 'Library'],
          ['Unread', books.filter((b) => b.status === 'Unread').length, 'Library'],
          ['Currently reading', reading.length, 'Currently Reading'],
          ['Want to read', books.filter((b) => b.status === 'Want to Read').length, 'Want to Read'],
          ['On loan', active.length, 'Loans'],
          ['Overdue', active.filter((l) => l.due_date && l.due_date < today()).length, 'Loans'],
          ['Favorites', books.filter((b) => b.favorite).length, 'Favorites'],
          [
            'Acquired this year',
            books.filter((b) => b.acquisition_date.startsWith(today().slice(0, 4))).length,
            'Library',
          ],
        ].map(([label, n, route]) => (
          <button className="stat" key={label} onClick={() => onNavigate(String(route))}>
            <span>{label}</span>
            <strong>{Number(n).toLocaleString()}</strong>
          </button>
        ))}
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="section-heading">
            <h2>On your reading table</h2>
            <button className="text-button" onClick={() => onNavigate('Currently Reading')}>
              View all →
            </button>
          </div>
          {!reading.length ? (
            <Empty title="Room for your next read">
              <p>Mark a book as Reading to track it here.</p>
            </Empty>
          ) : (
            reading.slice(0, 4).map((b) => (
              <button className="reading-row" key={b.id} onClick={() => onOpen(b)}>
                <Cover book={b} />
                <div>
                  <strong>{b.title}</strong>
                  <small>{author(b)}</small>
                  <div className="progress">
                    <span style={{ width: `${progress(b)}%` }} />
                  </div>
                  <small>
                    {b.current_page} / {b.pages ?? '?'} pages · {progress(b)}%
                  </small>
                </div>
              </button>
            ))
          )}
        </section>
        <section className="panel">
          <h2>Recently added</h2>
          {recent.length ? (
            recent.map((b) => (
              <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
                <span>
                  <strong>{b.title}</strong>
                  <small className="block">{author(b) || 'Unknown author'}</small>
                </span>
                <span className="muted">{b.created_at.slice(0, 10)}</span>
              </button>
            ))
          ) : (
            <Empty title="Your first chapter awaits">
              <p>Use Add book to begin.</p>
            </Empty>
          )}
          <h3>Recently finished</h3>
          {finished.map((b) => (
            <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
              <span>{b.title}</span>
              <span className="rating">{b.rating !== null ? `${b.rating} ★` : 'Finished'}</span>
            </button>
          ))}
        </section>
      </div>
      <div className="chart-grid">
        {chart(
          'Genres',
          books.flatMap((b) => b.terms.genre),
        )}
        {chart(
          'Languages',
          books.map((b) => b.language),
        )}
        {chart(
          'Authors',
          books.flatMap((b) =>
            b.contributors.filter((p) => p.role === 'Author').map((p) => p.name),
          ),
        )}
        {chart(
          'Publication decades',
          books
            .filter((b) => b.publication_year !== null)
            .map((b) => `${Math.floor(b.publication_year! / 10) * 10}s`),
        )}
        {chart(
          'Acquired by year',
          books.map((b) => b.acquisition_date.slice(0, 4)),
        )}
        {chart(
          'Finished by year',
          books
            .filter((b) => b.status === 'Finished')
            .map((b) => String(b.copy_extra.date_finished || '').slice(0, 4)),
        )}
        {chart(
          'Ratings',
          books.filter((b) => b.rating !== null).map((b) => `${b.rating} stars`),
        )}
      </div>
    </>
  );
}
