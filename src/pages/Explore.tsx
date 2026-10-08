import { t, label as trLabel } from '../i18n';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { author, locationName, type Book, type Entity, type Snapshot } from '../domain/types';
import type { RecordRequest } from '../components/RecordDialog';
import { Empty } from '../components/common';
export function Explore({
  section,
  data,
  onOpen,
  onRecord,
}: {
  section: string;
  data: Snapshot;
  onOpen: (b: Book) => void;
  onRecord: (r: RecordRequest) => void;
}) {
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const kind =
    section === 'Authors'
      ? 'people'
      : section === 'Series'
        ? 'series'
        : section === 'Locations'
          ? 'locations'
          : null;
  const entities = kind
    ? data[kind]
    : data.terms.filter((t) => t.kind === (section === 'Genres' ? 'genre' : 'tag'));
  const entity = entities.find((e) => e.id === selected);
  const related = (e: Entity) =>
    data.books.filter((b) =>
      section === 'Authors'
        ? b.contributors.some((p) => p.id === e.id)
        : section === 'Series'
          ? b.series === e.name
          : section === 'Locations'
            ? locationName(b.location_id, data.locations).startsWith(
                locationName(e.id, data.locations),
              )
            : b.terms[e.kind || '']?.includes(e.name),
    );
  const books = entity
    ? related(entity).sort(
        (a, b) =>
          (a.series_order ?? Infinity) - (b.series_order ?? Infinity) ||
          a.title.localeCompare(b.title),
      )
    : [];
  const volumes = books
    .map((b) => b.series_order)
    .filter((n): n is number => n !== null && Number.isInteger(n) && n > 0);
  const max = Math.min(500, Math.max(0, ...volumes));
  const missing = Array.from({ length: max }, (_, i) => i + 1).filter((n) => !volumes.includes(n));
  return (
    <>
      <div className="toolbar">
        <input
          placeholder={t('actions.find', { section: trLabel(section) }) + '…'}
          aria-label={t('actions.find', { section: trLabel(section) })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="spacer" />
        {kind && (
          <button className="primary" onClick={() => onRecord({ type: kind })}>
            <Plus size={16} />
            {t('actions.addKind', {
              kind: trLabel(
                section === 'Authors' ? 'person' : section === 'Series' ? 'series' : 'location',
              ),
            })}
          </button>
        )}
      </div>
      <div className="explorer">
        <section className="panel entity-list">
          {entities
            .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
            .map((e) => (
              <button
                key={e.id}
                className={e.id === selected ? 'active' : ''}
                onClick={() => setSelected(e.id)}
              >
                <span>{section === 'Locations' ? locationName(e.id, data.locations) : e.name}</span>
                <small>{related(e).length}</small>
              </button>
            ))}
          {!entities.length && (
            <p className="muted">
              {kind
                ? t('ui.createARecordToGetStarted')
                : t('ui.addTheseClassificationsInTheBookEditor')}
            </p>
          )}
        </section>
        <section className="panel">
          {entity ? (
            <>
              <div className="section-heading">
                <h2>{entity.name}</h2>
                {kind && (
                  <button onClick={() => onRecord({ type: kind, entity })}>
                    {t('ui.editDetails')}
                  </button>
                )}
              </div>
              <dl className="details-grid">
                {Object.entries(entity.extra || {})
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div className="info" key={k}>
                      <dt>{trLabel(k.replaceAll('_', ' '))}</dt>
                      <dd className="prose">{String(v)}</dd>
                    </div>
                  ))}
              </dl>
              {section === 'Series' && missing.length > 0 && (
                <div className="notice">
                  {t('ui.missingIntegerVolumesUpTo')} {max}: {missing.join(', ')}
                  {t('ui.thisIsInferredFromYourCollectionNotACompletePublisherCatalogue')}{' '}
                </div>
              )}
              <h3>
                {books.length} {t('ui.copiesInYourLibrary')}
              </h3>
              {books.map((b) => (
                <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
                  <span>
                    {section === 'Series' && b.series_order !== null ? `${b.series_order}. ` : ''}
                    {b.title}
                    <small className="block">{author(b)}</small>
                  </span>
                  <span className="badge">{trLabel(b.status)}</span>
                </button>
              ))}
            </>
          ) : (
            <Empty title={t('actions.explore', { section: trLabel(section).toLocaleLowerCase() })}>
              <p>{t('ui.selectARecordToSeeItsDetailsAndBooks')}</p>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
