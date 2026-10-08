import { t, label as trLabel } from '../i18n';
import { useState } from 'react';
import {
  copyName,
  copyState,
  locationName,
  withinLocation,
  type Book,
  type Snapshot,
} from '../domain/types';
import type { RecordRequest } from '../components/RecordDialog';
import { confirmAction } from '../components/Confirmation';
import { api } from '../services/api';
import { Empty } from '../components/common';

export function Locations({
  data,
  onRecord,
  onOpen,
  onAction,
}: {
  data: Snapshot;
  onRecord: (r: RecordRequest) => void;
  onOpen: (b: Book) => void;
  onAction: (f: () => Promise<unknown>) => void;
}) {
  const [selected, setSelected] = useState('');
  const place = data.locations.find((l) => l.id === selected);
  const books = data.books.filter((b) =>
    selected ? withinLocation(b.location_id, selected, data.locations) : !b.location_id,
  );
  const create = (kind: string) =>
    onRecord({
      type: 'locations',
      locationKind: kind,
      locationParent: kind === 'Room' && place?.extra?.kind !== 'Home' ? undefined : place,
    });
  const tree = (parent: string, seen = new Set<string>(), depth = 0): React.ReactNode =>
    data.locations
      .filter((l) => (l.parent_id || '') === parent && !seen.has(l.id))
      .map((l) => (
        <div key={l.id}>
          <button
            aria-label={`${l.name} ${trLabel(String(l.extra?.kind || 'Location'))}`}
            className={selected === l.id ? 'active' : ''}
            style={{ paddingInlineStart: 12 + depth * 18 }}
            onClick={() => setSelected(l.id)}
          >
            <span>
              {depth > 0 && <span aria-hidden="true">└─ </span>}
              {l.name}
              <small className="block">{trLabel(String(l.extra?.kind || 'Location'))}</small>
            </span>
            <small>
              {data.books.filter((b) => withinLocation(b.location_id, l.id, data.locations)).length}
            </small>
          </button>
          {tree(l.id, new Set([...seen, l.id]), depth + 1)}
        </div>
      ));
  return (
    <>
      <p className="location-guidance">
        {t(
          'ui.organizeYourLibraryRoomBookcaseShelfSelectARoomToAddABookcaseThenSelectTheBookcaseToAddAShelf',
        )}{' '}
      </p>
      <div className="toolbar">
        <button className="primary" onClick={() => create('Room')}>
          {t('ui.addRoom')}{' '}
        </button>
        <button onClick={() => onRecord({ type: 'locations', locationKind: 'Home' })}>
          {t('ui.createHomeLibrary')}{' '}
        </button>
        {['Bookcase', 'Shelf'].map((kind) => (
          <button
            key={kind}
            disabled={
              !place ||
              place.extra?.kind !== (kind === 'Bookcase' ? t('ui.room') : t('ui.bookcase'))
            }
            onClick={() =>
              onRecord({ type: 'locations', locationKind: kind, locationParent: place })
            }
          >
            {t('actions.addKind', { kind: trLabel(kind) })}
          </button>
        ))}
      </div>
      <div className="explorer location-workspace">
        <section className="panel entity-list">
          <h2 className="tree-heading">{t('ui.yourLocations')}</h2>
          <button className={!selected ? 'active' : ''} onClick={() => setSelected('')}>
            {t('ui.unassigned')}{' '}
          </button>
          {tree('')}
          {!data.locations.length && (
            <p>{t('ui.noLocationsYetCreateYourFirstRoomWithAddRoomAbove')}</p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>{place ? locationName(place.id, data.locations) : t('ui.unassignedCopies')}</h2>
            {place && (
              <div className="inline">
                <button onClick={() => onRecord({ type: 'locations', entity: place })}>
                  {t('actions.renameKind', {
                    kind: trLabel(String(place.extra?.kind || 'location')),
                  })}
                </button>
                <button
                  className="danger-text"
                  onClick={async () => {
                    if (await confirmAction(t('confirm.location', { name: place.name })))
                      onAction(async () => {
                        await api('delete_location', { id: place.id });
                        setSelected('');
                      });
                  }}
                >
                  {t('ui.removeLocation')}{' '}
                </button>
              </div>
            )}
          </div>
          {place && (
            <p className="muted">
              {String(place.extra?.notes || t('ui.includesCopiesOnShelvesWithinThisLocation'))}
            </p>
          )}
          <h3>
            {books.length} {t('ui.physicalCopies')}
          </h3>
          {books.map((b) => (
            <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
              <span>
                <strong>
                  {b.title} · {copyName(b)}
                </strong>
                <small className="block">
                  {locationName(b.location_id, data.locations) || t('ui.unassigned')}
                  {b.copy_extra.shelf_position
                    ? t('copy.position', { position: b.copy_extra.shelf_position })
                    : ''}
                </small>
              </span>
              <span>
                {trLabel(b.condition)} · {copyState(b, data.loans)}
              </span>
            </button>
          ))}
          {!books.length && (
            <Empty title={t('ui.noCopiesHereYet')}>
              <p>
                {t('ui.assignACopyInItsCopiesTabOrSelectCopiesInLibraryAndChooseMoveLocation')}{' '}
              </p>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
