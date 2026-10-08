import { t, label as trLabel, number, date } from '../i18n';
import { author, progress, today, type Book, type Snapshot } from '../domain/types';
import { Cover, Empty } from '../components/common';
export function Dashboard({
  data,
  onOpen,
  onNavigate,
  onAdd,
}: {
  data: Snapshot;
  onOpen: (b: Book) => void;
  onNavigate: (view: string) => void;
  onAdd: () => void;
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
      <section className="panel" key={trLabel(String(label))}>
        <h2>{trLabel(String(label))}</h2>
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
          <p className="muted">{t('ui.addBooksToSeeThisBreakdown')}</p>
        )}
      </section>
    );
  };
  return (
    <>
      <div className="dashboard-heading">
        <h1>{t('ui.yourLibraryAtAGlance')}</h1>
        <p>{t('ui.pickUpWhereYouLeftOffOrFindYourNextRead')}</p>
      </div>
      <div className="stats">
        {[
          ['Total books', books.length, 'Library'],
          ['Finished', books.filter((b) => b.status === 'Finished').length, 'Finished'],
          ['Currently reading', reading.length, 'Currently Reading'],
          ['On loan', active.length, 'Loans'],
        ].map(([label, n, route]) => (
          <button
            className="stat"
            key={trLabel(String(label))}
            onClick={() => onNavigate(String(route))}
          >
            <span>{trLabel(String(label))}</span>
            <strong>{number(Number(n))}</strong>
          </button>
        ))}
      </div>
      <div className="secondary-stats" aria-label={t('ui.moreLibraryStatistics')}>
        {[
          ['Pages', books.reduce((n, b) => n + (b.pages || 0), 0), 'Library'],
          ['Unread', books.filter((b) => b.status === 'Unread').length, 'Unread'],
          ['Want to read', books.filter((b) => b.status === 'Want to Read').length, 'Want to Read'],
          ['Overdue', active.filter((l) => l.due_date && l.due_date < today()).length, 'Loans'],
          ['Favorites', books.filter((b) => b.favorite).length, 'Favorites'],
          [
            'Acquired this year',
            books.filter((b) => b.acquisition_date.startsWith(today().slice(0, 4))).length,
            'Library',
          ],
        ].map(([label, n, route]) => (
          <button key={trLabel(String(label))} onClick={() => onNavigate(String(route))}>
            <span>{trLabel(String(label))}</span>
            <strong>{number(Number(n))}</strong>
          </button>
        ))}
      </div>
      <div className="dashboard-primary">
        <section className="panel reading-feature">
          <div className="section-heading">
            <h2>{t('ui.onYourReadingTable')}</h2>
            <button className="text-button" onClick={() => onNavigate('Currently Reading')}>
              {t('ui.viewAll')}{' '}
            </button>
          </div>
          {!reading.length ? (
            <Empty title={t('ui.roomForYourNextRead')}>
              <p>{t('ui.markABookAsReadingToTrackItHere')}</p>
              <button onClick={() => onNavigate('Library')}>{t('ui.browseYourBooks')}</button>
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
                    {b.current_page} / {b.pages ?? '?'} {t('ui.pagesAlt')} {progress(b)}%
                  </small>
                </div>
              </button>
            ))
          )}
        </section>
        <section className="panel">
          <h2>{t('ui.recentlyAdded')}</h2>
          {recent.length ? (
            recent.map((b) => (
              <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
                <Cover book={b} />
                <span>
                  <strong>{b.title}</strong>
                  <small className="block">{author(b) || t('ui.unknownAuthor')}</small>
                </span>
                <span className="muted">{date(b.created_at)}</span>
              </button>
            ))
          ) : (
            <Empty title={t('ui.yourFirstChapterAwaits')}>
              <p>{t('ui.useAddBookToBegin')}</p>
              <button className="primary" onClick={onAdd}>
                {t('ui.addYourFirstBook')}{' '}
              </button>
            </Empty>
          )}
          {finished.length > 0 && <h3>{t('ui.recentlyFinished')}</h3>}
          {finished.map((b) => (
            <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
              <span>{b.title}</span>
              <span className="rating">
                {b.rating !== null ? `${b.rating} ★` : t('ui.finished')}
              </span>
            </button>
          ))}
        </section>
      </div>
      <details className="insights" open={books.length > 0}>
        <summary>
          {t('ui.collectionInsights')}{' '}
          <span className="muted">{t('ui.genresLanguagesAuthorsAndReadingHistory')}</span>
        </summary>
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
      </details>
    </>
  );
}
