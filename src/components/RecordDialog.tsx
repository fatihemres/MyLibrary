import { ErrorText } from './ErrorText';
import { t, label as trLabel } from '../i18n';
import { confirmAction } from './Confirmation';
import { useState } from 'react';
import {
  today,
  copyName,
  locationName,
  type Book,
  type Entity,
  type Entry,
  type Loan,
  type Snapshot,
} from '../domain/types';
import { api } from '../services/api';
import { Field, Modal } from './common';
import { useUnsaved } from './useUnsaved';
export type RecordRequest = {
  type: 'note' | 'quote' | 'reading' | 'loan' | 'people' | 'series' | 'locations' | 'custom_fields';
  book?: Book;
  entity?: Entity;
  entry?: Entry;
  loan?: Loan;
  locationKind?: string;
  locationParent?: Entity;
};
export function RecordDialog({
  request,
  data,
  onClose,
  onSaved,
}: {
  request: RecordRequest;
  data: Snapshot;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { type, book, entity, entry, loan } = request;
  const isEntry = ['note', 'quote', 'reading'].includes(type);
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...entity,
    ...entry,
    ...loan,
    copy_id: book?.id || entry?.copy_id || loan?.copy_id || '',
    extra: {
      ...(entity?.extra || entry?.extra || {}),
      ...(request.locationKind ? { kind: request.locationKind } : {}),
    },
    parent_id: entity?.parent_id || request.locationParent?.id || '',
    kind: entry?.kind || entity?.kind || (isEntry ? type : 'text'),
    loan_date: loan?.loan_date || today(),
    name: entity?.name || '',
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsaved(dirty);
  const set = (k: string, v: unknown) => {
    setDirty(true);
    setValues((prev) => ({ ...prev, [k]: v }));
  };
  const extra = (values.extra || {}) as Record<string, string | boolean>;
  const input = (key: string, label: string, inputType = 'text', inExtra = false) => (
    <Field key={key} label={trLabel(label)}>
      {inputType === 'textarea' ? (
        <textarea
          value={String((inExtra ? extra[key] : values[key]) ?? '')}
          onChange={(e) =>
            inExtra ? set('extra', { ...extra, [key]: e.target.value }) : set(key, e.target.value)
          }
        />
      ) : (
        <input
          type={inputType}
          value={
            inputType === 'checkbox'
              ? undefined
              : String((inExtra ? extra[key] : values[key]) ?? '')
          }
          checked={inputType === 'checkbox' ? !!extra[key] : undefined}
          onChange={(e) =>
            inExtra
              ? set('extra', {
                  ...extra,
                  [key]: inputType === 'checkbox' ? e.target.checked : e.target.value,
                })
              : set(
                  key,
                  inputType === 'number'
                    ? e.target.value
                      ? Number(e.target.value)
                      : null
                    : e.target.value,
                )
          }
        />
      )}
    </Field>
  );
  const close = async () => {
    if (!dirty || (await confirmAction('Discard unsaved changes?'))) onClose();
  };
  const submit = async () => {
    setBusy(true);
    try {
      await api(isEntry ? 'entry' : type === 'loan' ? 'loan' : 'entity', {
        ...values,
        table: type,
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={t(entity || entry || loan ? 'actions.editKind' : 'actions.addKind', {
        kind: trLabel(type.replace('_', ' ')),
      })}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="dialog-body form-grid">
          {error && (
            <div role="alert" className="alert span2">
              <ErrorText message={error} />
            </div>
          )}
          {(isEntry || type === 'loan') && (
            <Field label={t('ui.book')}>
              <select
                required
                disabled={!!entry || !!loan}
                value={String(values.copy_id)}
                onChange={(e) => set('copy_id', e.target.value)}
              >
                <option value="">{t('ui.chooseABook')}</option>
                {data.books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} · {copyName(b)} ·{' '}
                    {locationName(b.location_id, data.locations) || t('ui.unassigned')}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {isEntry && (
            <>
              {input('title', type === 'reading' ? 'Session title' : 'Title / chapter')}
              {input('content', type === 'quote' ? 'Quotation' : 'Content', 'textarea')}
              {input('page', 'Page reference', 'number')}
              {type === 'quote' && (
                <>
                  {input('note', 'Note', 'textarea', true)}
                  {input('favorite', 'Favorite', 'checkbox', true)}
                </>
              )}
              {type === 'note' && (
                <Field label={t('ui.noteType')}>
                  <select
                    value={String(extra.note_type || 'general')}
                    onChange={(e) => set('extra', { ...extra, note_type: e.target.value })}
                  >
                    {[
                      'general',
                      'character',
                      'research',
                      'interpretation',
                      'vocabulary',
                      'personal',
                    ].map((n) => (
                      <option key={n} value={n}>
                        {trLabel(n)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {type === 'reading' && (
                <>
                  {input('started', 'Started', 'date', true)}
                  {input('finished', 'Finished', 'date', true)}
                  {input('minutes', 'Minutes read', 'number', true)}
                </>
              )}
            </>
          )}
          {type === 'loan' && (
            <>
              {input('borrower', 'Borrower *')}
              {input('contact', 'Contact (optional)')}
              {input('loan_date', 'Loan date', 'date')}
              {input('due_date', 'Expected return', 'date')}
              {input('notes', 'Notes', 'textarea')}
            </>
          )}
          {['people', 'series', 'locations', 'custom_fields'].includes(type) &&
            input('name', type === 'people' ? 'Full name *' : 'Name *')}
          {type === 'people' && (
            <>
              {[
                ['sort_name', 'Sort name'],
                ['first_name', 'First name'],
                ['middle_name', 'Middle name'],
                ['last_name', 'Last name'],
                ['pen_name', 'Pen name'],
                ['nationality', 'Nationality'],
                ['website', 'Website'],
              ].map(([k, l]) => input(k, l, 'text', true))}
              {input('birth_date', 'Birth date', 'date', true)}
              {input('death_date', 'Death date', 'date', true)}
              {input('biography', 'Biography', 'textarea', true)}
              {input('notes', 'Notes', 'textarea', true)}
            </>
          )}
          {type === 'series' && input('notes', 'Series notes', 'textarea', true)}
          {type === 'locations' && (
            <>
              <Field label={t('ui.locationType')}>
                <select
                  value={String(extra.kind || 'Location')}
                  onChange={(e) => set('extra', { ...extra, kind: e.target.value })}
                >
                  {['Home', 'Room', 'Bookcase', 'Shelf', 'Location'].map((kind) => (
                    <option key={kind} value={kind}>
                      {trLabel(kind)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('ui.parentLocation')}>
                <select
                  value={String(values.parent_id || '')}
                  onChange={(e) => set('parent_id', e.target.value)}
                >
                  <option value="">{t('ui.topLevel')}</option>
                  {data.locations
                    .filter((l) => l.id !== entity?.id)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {locationName(l.id, data.locations)}
                      </option>
                    ))}
                </select>
              </Field>
              {input('notes', 'Notes', 'textarea', true)}
            </>
          )}
          {type === 'custom_fields' && (
            <>
              <Field label={t('ui.fieldType')}>
                <select
                  disabled={!!entity}
                  value={String(values.kind)}
                  onChange={(e) => set('kind', e.target.value)}
                >
                  {['text', 'multiline', 'integer', 'decimal', 'date', 'checkbox', 'dropdown'].map(
                    (k) => (
                      <option key={k} value={k}>
                        {trLabel(k)}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              {values.kind === 'dropdown' &&
                input('options', 'Options (separate with |)', 'text', true)}
              <p className="muted span2">
                {t('ui.fieldTypesStayFixedOnceCreatedToProtectExistingValues')}{' '}
              </p>
            </>
          )}
        </div>
        <footer>
          <button type="button" onClick={close}>
            {t('ui.cancel')}{' '}
          </button>
          <button className="primary" disabled={busy} type="submit">
            {busy ? t('ui.saving') : t('ui.save')}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
