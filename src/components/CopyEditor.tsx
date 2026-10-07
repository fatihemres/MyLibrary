import { useRef, useState } from 'react';
import {
  conditions,
  copyName,
  locationName,
  type Book,
  type Snapshot,
  type Extra,
} from '../domain/types';
import { copyFields } from '../domain/fields';
import { api } from '../services/api';
import { Field, Modal } from './common';
import { confirmAction } from './Confirmation';
import { useUnsaved } from './useUnsaved';
import { RecordDialog, type RecordRequest } from './RecordDialog';

export function CopyEditor({
  book,
  data,
  mode,
  onClose,
  onSaved,
}: {
  book: Book;
  data: Snapshot;
  mode: 'add' | 'edit' | 'move';
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState<Book>(() => ({
    ...book,
    ...(mode === 'add'
      ? {
          id: '',
          barcode: '',
          location_id: '',
          source: '',
          acquisition_date: '',
          condition: 'Good',
          copy_extra: {
            currency: data.settings.find((s) => s.key === 'currency')?.value || 'TRY',
            copy_state: 'Owned',
          } as Extra,
        }
      : { copy_extra: { ...book.copy_extra, inventory_code: copyName(book) } }),
  }));
  const baseline = useRef(JSON.stringify(value));
  const dirty = baseline.current !== JSON.stringify(value);
  useUnsaved(dirty);
  const [tab, setTab] = useState(mode === 'move' ? 'Location' : 'Identity');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locationRequest, setLocationRequest] = useState<RecordRequest | null>(null);
  const selectedLocation = data.locations.find((l) => l.id === value.location_id);
  const set = (key: string, v: string) => setValue((old) => ({ ...old, [key]: v }));
  const extra = (key: string, v: string | number | boolean) =>
    setValue((old) => ({ ...old, copy_extra: { ...old.copy_extra, [key]: v } }));
  const close = async () => {
    if (!busy && (!dirty || (await confirmAction('Discard unsaved physical copy changes?'))))
      onClose();
  };
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api(mode === 'add' ? 'add_copy' : 'save_copy', value);
      await onSaved();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const input = (key: string, label: string, type = 'text') => (
    <Field label={label}>
      <input
        type={type}
        value={String(value[key as keyof Book] || '')}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  return (
    <Modal
      title={
        mode === 'add'
          ? 'Add Physical Copy'
          : mode === 'move'
            ? `Move ${copyName(book)}`
            : `Edit ${copyName(book)}`
      }
      onClose={() => void close()}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            void submit();
          }
        }}
      >
        <div className="dialog-body">
          <p>
            <strong>{book.title}</strong> · Physical copy details. Edition information stays
            unchanged.
          </p>
          <nav className="tabs">
            {['Identity', 'Location', 'Ownership', 'Physical', 'Notes'].map((t) => (
              <button
                type="button"
                key={t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          <div className="form-grid">
            {tab === 'Identity' && (
              <>
                <Field label="Copy identifier / inventory code">
                  <input
                    autoFocus
                    value={String(value.copy_extra.inventory_code || '')}
                    placeholder="Automatic Copy # if left blank"
                    onChange={(e) => extra('inventory_code', e.target.value)}
                  />
                </Field>
                {input('barcode', 'Barcode')}
                <Field label="Copy state">
                  <select
                    value={String(value.copy_extra.copy_state || 'Owned')}
                    onChange={(e) => extra('copy_state', e.target.value)}
                  >
                    <option>Owned</option>
                    <option>Missing</option>
                  </select>
                </Field>
                <p className="muted">
                  Lent status follows the loan record. Archive uses Trash and keeps this copy’s
                  history. Manage attachments from View copy → Attachments.
                </p>
              </>
            )}
            {tab === 'Location' && (
              <>
                <Field label="Room → Bookcase → Shelf">
                  <select
                    value={value.location_id}
                    onChange={(e) => set('location_id', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {data.locations.map((l) => (
                      <option value={l.id} key={l.id}>
                        {locationName(l.id, data.locations).replaceAll(' / ', ' → ')}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="muted">
                  {data.locations.length
                    ? 'Select a room to add a bookcase, or a bookcase to add a shelf. Select the final shelf to assign this copy.'
                    : 'No locations yet. Create your first room below. Your copy draft will stay open.'}
                </p>
                <section className="location-create-surface">
                  <h3>Create a location</h3>
                  <p className="muted">Your copy stays open while you organize its home.</p>
                  <div className="inline wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setLocationRequest({ type: 'locations', locationKind: 'Room' })
                      }
                    >
                      Add Room
                    </button>
                    {['Bookcase', 'Shelf'].map((kind) => (
                      <button
                        type="button"
                        key={kind}
                        disabled={
                          selectedLocation?.extra?.kind !==
                          (kind === 'Bookcase' ? 'Room' : 'Bookcase')
                        }
                        onClick={() =>
                          setLocationRequest({
                            type: 'locations',
                            locationKind: kind,
                            locationParent: selectedLocation,
                          })
                        }
                      >
                        Add {kind}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
            {tab === 'Ownership' && (
              <>
                {input('acquisition_date', 'Acquisition date', 'date')}
                {input('source', 'Acquisition source')}
              </>
            )}
            {tab === 'Physical' && (
              <Field label="Condition">
                <select value={value.condition} onChange={(e) => set('condition', e.target.value)}>
                  {conditions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            )}
            {(copyFields[tab] || [])
              .filter((f) => f.key !== 'spoiler_notes')
              .map((f) => (
                <Field key={f.key} label={f.label}>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={String(value.copy_extra[f.key] || '')}
                      onChange={(e) => extra(f.key, e.target.value)}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={String(value.copy_extra[f.key] || '')}
                      onChange={(e) => extra(f.key, e.target.value)}
                    >
                      <option value="">Not specified</option>
                      {f.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={!!value.copy_extra[f.key]}
                      onChange={(e) => extra(f.key, e.target.checked)}
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      min={f.type === 'number' ? 0 : undefined}
                      step={f.type === 'number' ? 'any' : undefined}
                      value={String(value.copy_extra[f.key] ?? '')}
                      onChange={(e) => extra(f.key, e.target.value)}
                    />
                  )}
                </Field>
              ))}
          </div>
        </div>
        <footer>
          <button type="button" onClick={() => void close()} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save physical copy'}
          </button>
        </footer>
      </form>
      {locationRequest && (
        <RecordDialog
          request={locationRequest}
          data={data}
          onClose={() => setLocationRequest(null)}
          onSaved={async () => {
            await onSaved();
            setLocationRequest(null);
          }}
        />
      )}
    </Modal>
  );
}
