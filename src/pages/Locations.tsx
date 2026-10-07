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
            aria-label={`${l.name} ${String(l.extra?.kind || 'Location')}`}
            className={selected === l.id ? 'active' : ''}
            style={{ paddingLeft: 12 + depth * 18 }}
            onClick={() => setSelected(l.id)}
          >
            <span>
              {depth > 0 && <span aria-hidden="true">└─ </span>}
              {l.name}
              <small className="block">{String(l.extra?.kind || 'Location')}</small>
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
      <p>
        Organize your library: Room → Bookcase → Shelf. Select a room to add a bookcase, then select
        the bookcase to add a shelf.
      </p>
      <div className="toolbar">
        <button className="primary" onClick={() => create('Room')}>
          Add Room
        </button>
        <button onClick={() => onRecord({ type: 'locations', locationKind: 'Home' })}>
          Create Home / Library
        </button>
        {['Bookcase', 'Shelf'].map((kind) => (
          <button
            key={kind}
            disabled={!place || place.extra?.kind !== (kind === 'Bookcase' ? 'Room' : 'Bookcase')}
            onClick={() =>
              onRecord({ type: 'locations', locationKind: kind, locationParent: place })
            }
          >
            Add {kind}
          </button>
        ))}
      </div>
      <div className="explorer">
        <section className="panel entity-list">
          <button className={!selected ? 'active' : ''} onClick={() => setSelected('')}>
            Unassigned
          </button>
          {tree('')}
          {!data.locations.length && (
            <p>No locations yet. Create your first room with Add Room above.</p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>{place ? locationName(place.id, data.locations) : 'Unassigned copies'}</h2>
            {place && (
              <div className="inline">
                <button onClick={() => onRecord({ type: 'locations', entity: place })}>
                  Rename {String(place.extra?.kind || 'location')}
                </button>
                <button
                  className="danger-text"
                  onClick={async () => {
                    if (
                      await confirmAction(
                        `Remove ${place.name}? Locations with copies or child locations cannot be removed.`,
                      )
                    )
                      onAction(async () => {
                        await api('delete_location', { id: place.id });
                        setSelected('');
                      });
                  }}
                >
                  Remove location
                </button>
              </div>
            )}
          </div>
          {place && (
            <p className="muted">
              {String(place.extra?.notes || 'Includes copies on shelves within this location.')}
            </p>
          )}
          <h3>{books.length} physical copies</h3>
          {books.map((b) => (
            <button className="list-row full" key={b.id} onClick={() => onOpen(b)}>
              <span>
                <strong>
                  {b.title} · {copyName(b)}
                </strong>
                <small className="block">
                  {locationName(b.location_id, data.locations) || 'Unassigned'}
                  {b.copy_extra.shelf_position ? ` · Position ${b.copy_extra.shelf_position}` : ''}
                </small>
              </span>
              <span>
                {b.condition} · {copyState(b, data.loans)}
              </span>
            </button>
          ))}
          {!books.length && (
            <Empty title="No copies here yet">
              <p>
                Assign a copy in its Copies tab, or select copies in Library and choose Move
                Location.
              </p>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
