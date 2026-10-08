import { ErrorText } from './ErrorText';
import { t, label as trLabel } from '../i18n';
import { commandPressed } from '../services/platform';
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
    <Field label={trLabel(label)}>
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
          ? t('ui.addPhysicalCopy')
          : mode === 'move'
            ? t('actions.moveKind', { kind: copyName(book) })
            : t('actions.editKind', { kind: copyName(book) })
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
          if (commandPressed(e) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            void submit();
          }
        }}
      >
        <div className="dialog-body">
          <p>
            <strong>{book.title}</strong>{' '}
            {t('ui.physicalCopyDetailsEditionInformationStaysUnchanged')}{' '}
          </p>
          <nav className="tabs">
            {['Identity', 'Location', 'Ownership', 'Physical', 'Notes'].map((t) => (
              <button
                type="button"
                key={t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {trLabel(t)}
              </button>
            ))}
          </nav>
          {error && (
            <div className="alert" role="alert">
              <ErrorText message={error} />
            </div>
          )}
          <div className="form-grid">
            {tab === 'Identity' && (
              <>
                <Field label={t('ui.copyIdentifierInventoryCode')}>
                  <input
                    autoFocus
                    value={String(value.copy_extra.inventory_code || '')}
                    placeholder={t('ui.automaticCopyIfLeftBlank')}
                    onChange={(e) => extra('inventory_code', e.target.value)}
                  />
                </Field>
                {input('barcode', 'Barcode')}
                <Field label={t('ui.copyState')}>
                  <select
                    value={String(value.copy_extra.copy_state || 'Owned')}
                    onChange={(e) => extra('copy_state', e.target.value)}
                  >
                    <option value="Owned">{t('ui.owned')}</option>
                    <option value="Missing">{t('ui.missing')}</option>
                  </select>
                </Field>
                <p className="muted">
                  {t(
                    'ui.lentStatusFollowsTheLoanRecordArchiveUsesTrashAndKeepsThisCopySHistoryManageAttachmentsFromViewCopyAttachments',
                  )}{' '}
                </p>
              </>
            )}
            {tab === 'Location' && (
              <>
                <Field label={t('ui.roomBookcaseShelf')}>
                  <select
                    value={value.location_id}
                    onChange={(e) => set('location_id', e.target.value)}
                  >
                    <option value="">{t('ui.unassigned')}</option>
                    {data.locations.map((l) => (
                      <option value={l.id} key={l.id}>
                        {locationName(l.id, data.locations).replaceAll(' / ', ' → ')}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="muted">
                  {data.locations.length
                    ? t(
                        'ui.selectARoomToAddABookcaseOrABookcaseToAddAShelfSelectTheFinalShelfToAssignThisCopy',
                      )
                    : t('ui.noLocationsYetCreateYourFirstRoomBelowYourCopyDraftWillStayOpen')}
                </p>
                <section className="location-create-surface">
                  <h3>{t('ui.createALocation')}</h3>
                  <p className="muted">{t('ui.yourCopyStaysOpenWhileYouOrganizeItsHome')}</p>
                  <div className="inline wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setLocationRequest({ type: 'locations', locationKind: 'Room' })
                      }
                    >
                      {t('ui.addRoom')}{' '}
                    </button>
                    {['Bookcase', 'Shelf'].map((kind) => (
                      <button
                        type="button"
                        key={kind}
                        disabled={
                          selectedLocation?.extra?.kind !==
                          (kind === 'Bookcase' ? t('ui.room') : t('ui.bookcase'))
                        }
                        onClick={() =>
                          setLocationRequest({
                            type: 'locations',
                            locationKind: kind,
                            locationParent: selectedLocation,
                          })
                        }
                      >
                        {t('actions.addKind', { kind: trLabel(kind) })}
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
              <Field label={t('ui.condition')}>
                <select value={value.condition} onChange={(e) => set('condition', e.target.value)}>
                  {conditions.map((c) => (
                    <option key={c} value={c}>
                      {trLabel(c)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {(copyFields[tab] || [])
              .filter((f) => f.key !== 'spoiler_notes')
              .map((f) => (
                <Field key={f.key} label={trLabel(f.label)}>
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
                      <option value="">{t('ui.notSpecified')}</option>
                      {f.options?.map((o) => (
                        <option key={o} value={o}>
                          {trLabel(o)}
                        </option>
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
            {t('ui.cancel')}{' '}
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? t('ui.saving') : t('ui.savePhysicalCopy')}
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
