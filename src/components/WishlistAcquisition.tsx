import { useEffect, useRef, useState } from 'react';
import { t, label } from '../i18n';
import { conditions, locationName, type Snapshot } from '../domain/types';
import type { WishlistItem } from '../domain/wishlist';
import { api, snapshot } from '../services/api';
import { Field, Modal } from './common';
import { confirmAction } from './Confirmation';
import { useUnsaved } from './useUnsaved';

export function WishlistAcquisition({
  item,
  onClose,
  onSaved,
  onOpenCopy,
}: {
  item: WishlistItem;
  onClose: () => void;
  onSaved: () => void;
  onOpenCopy?: (id: string) => void;
}) {
  const [request, setRequest] = useState(() => ({
    item: item.draft.id,
    updated_at: item.draft.updated_at,
    edition_id: null as string | null,
    title: item.draft.title,
    author: item.draft.author,
    isbn10: item.draft.isbn10,
    isbn13: item.draft.isbn13,
    physical: {
      barcode: '',
      inventory_code: '',
      location_id: '',
      source: '',
      acquisition_date: '',
      condition: 'Good',
    },
  }));
  const baseline = useRef(JSON.stringify(request));
  const choice = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    choice.current?.focus();
  }, []);
  const [mode, setMode] = useState(''),
    [query, setQuery] = useState('');
  const [editions, setEditions] = useState<
    { id: string; title: string; isbn10: string; isbn13: string }[]
  >([]);
  const [locations, setLocations] = useState<Snapshot['locations']>([]);
  const [review, setReview] = useState<{
    edition: { title: string; authors: string; isbn10: string; isbn13: string };
    review_token: string;
  } | null>(null);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [copy, setCopy] = useState('');
  const inFlight = useRef(false);
  const dirty = !copy && (mode !== '' || baseline.current !== JSON.stringify(request));
  useUnsaved(dirty);
  const close = async () => {
    if (!inFlight.current && (!dirty || (await confirmAction(t('wishlist.discard'))))) onClose();
  };
  const run = async (f: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await f();
    } catch (e) {
      setError(String(e));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const physical = (key: keyof typeof request.physical, value: string) =>
    setRequest((r) => ({ ...r, physical: { ...r.physical, [key]: value } }));
  return (
    <Modal wide title={t('acquisition.add')} onClose={() => void close()}>
      <form
        className="wishlist-acquisition"
        onSubmit={(e) => {
          e.preventDefault();
          if (!mode || (mode === 'existing' && !request.edition_id)) return;
          void run(async () => setReview(await api('wishlist_acquisition_review', { request })));
        }}
      >
        <div className="dialog-body">
          {error && (
            <p role="alert" className="alert">
              {t(error)}
            </p>
          )}
          {copy ? (
            <>
              <p role="status">{t('acquisition.success')}</p>
              {onOpenCopy && (
                <button type="button" autoFocus onClick={() => onOpenCopy(copy)}>
                  {t('acquisition.viewCopy')}
                </button>
              )}
            </>
          ) : review ? (
            <>
              <h3 tabIndex={-1} ref={(el) => el?.focus()}>
                {t('acquisition.confirmTitle')}
              </h3>
              <p>{t('acquisition.confirmHelp')}</p>
              <dl>
                <dt>{t('wishlist.title')}</dt>
                <dd>{review.edition.title}</dd>
                <dt>{t('wishlist.authors')}</dt>
                <dd>{review.edition.authors}</dd>
                <dt>ISBN</dt>
                <dd>{review.edition.isbn13 || review.edition.isbn10 || '—'}</dd>
                <dt>{t('acquisition.editionChoice')}</dt>
                <dd>{t(mode === 'existing' ? 'acquisition.existing' : 'acquisition.new')}</dd>
                <dt>{t('ui.condition')}</dt>
                <dd>{label(request.physical.condition)}</dd>
                <dt>{label('Acquisition date')}</dt>
                <dd>{request.physical.acquisition_date || '—'}</dd>
                <dt>{label('Acquisition source')}</dt>
                <dd>{request.physical.source || '—'}</dd>
                <dt>{t('ui.roomBookcaseShelf')}</dt>
                <dd>
                  {request.physical.location_id
                    ? locationName(request.physical.location_id, locations)
                    : t('ui.unassigned')}
                </dd>
                <dt>{t('ui.copyIdentifierInventoryCode')}</dt>
                <dd>{request.physical.inventory_code || t('ui.automaticCopyIfLeftBlank')}</dd>
                <dt>{label('Barcode')}</dt>
                <dd>{request.physical.barcode || '—'}</dd>
              </dl>
            </>
          ) : (
            <>
              <p>{t('acquisition.help')}</p>
              <p>
                <strong>{item.draft.title}</strong> · {item.draft.author} ·{' '}
                {item.draft.isbn13 || item.draft.isbn10}
              </p>
              {item.draft.edition_id && (
                <p>
                  {t('wishlist.linked')}: {item.draft.edition_id}
                </p>
              )}
              <Field label={t('acquisition.editionChoice')}>
                <select
                  ref={choice}
                  autoFocus
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setRequest((r) => ({ ...r, edition_id: null }));
                  }}
                  required
                >
                  <option value="">{t('ui.notSpecified')}</option>
                  <option value="existing">{t('acquisition.existing')}</option>
                  <option value="new">{t('acquisition.new')}</option>
                </select>
              </Field>
              {mode === 'existing' && (
                <fieldset>
                  <legend>{t('wishlist.findEdition')}</legend>
                  <p>{t('acquisition.existingHelp')}</p>
                  {item.draft.edition_id && (
                    <button
                      type="button"
                      onClick={() =>
                        setRequest((r) => ({ ...r, edition_id: item.draft.edition_id }))
                      }
                    >
                      {t('acquisition.useLinked')}
                    </button>
                  )}
                  <Field label={t('wishlist.search')}>
                    <input
                      maxLength={1024}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </Field>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => setEditions(await api('wishlist_editions', { query })))
                    }
                  >
                    {t('wishlist.findEdition')}
                  </button>
                  {editions.map((e) => (
                    <label key={e.id}>
                      <input
                        type="radio"
                        name="edition"
                        checked={request.edition_id === e.id}
                        onChange={() => setRequest((r) => ({ ...r, edition_id: e.id }))}
                      />
                      {e.title} · {e.isbn13 || e.isbn10} · {e.id}
                    </label>
                  ))}
                  {request.edition_id && (
                    <p>
                      {t('wishlist.linked')}: {request.edition_id}
                    </p>
                  )}
                </fieldset>
              )}
              {mode === 'new' && (
                <div className="form-grid">
                  {(['title', 'author', 'isbn10', 'isbn13'] as const).map((key) => (
                    <Field key={key} label={t(`wishlist.${key === 'author' ? 'authors' : key}`)}>
                      <input
                        required={key === 'title'}
                        maxLength={key.startsWith('isbn') ? 13 : key === 'title' ? 500 : 1000}
                        value={request[key]}
                        onChange={(e) => setRequest((r) => ({ ...r, [key]: e.target.value }))}
                      />
                    </Field>
                  ))}
                </div>
              )}
              <h3>{t('ui.addPhysicalCopy')}</h3>
              <p>{t('acquisition.owned')}</p>
              <div className="form-grid">
                <Field label={t('ui.copyIdentifierInventoryCode')}>
                  <input
                    maxLength={500}
                    value={request.physical.inventory_code}
                    onChange={(e) => physical('inventory_code', e.target.value)}
                  />
                </Field>
                <Field label={label('Barcode')}>
                  <input
                    maxLength={500}
                    value={request.physical.barcode}
                    onChange={(e) => physical('barcode', e.target.value)}
                  />
                </Field>
                <Field label={label('Acquisition date')}>
                  <input
                    type="date"
                    value={request.physical.acquisition_date}
                    onChange={(e) => physical('acquisition_date', e.target.value)}
                  />
                </Field>
                <Field label={label('Acquisition source')}>
                  <input
                    maxLength={500}
                    value={request.physical.source}
                    onChange={(e) => physical('source', e.target.value)}
                  />
                </Field>
                <Field label={t('ui.condition')}>
                  <select
                    value={request.physical.condition}
                    onChange={(e) => physical('condition', e.target.value)}
                  >
                    {conditions.map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('ui.roomBookcaseShelf')}>
                  <select
                    value={request.physical.location_id}
                    onFocus={() => {
                      if (!locations.length)
                        void run(async () => setLocations((await snapshot()).locations));
                    }}
                    onChange={(e) => physical('location_id', e.target.value)}
                  >
                    <option value="">{t('ui.unassigned')}</option>
                    {locations.map((l) => (
                      <option value={l.id} key={l.id}>
                        {locationName(l.id, locations)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}
        </div>
        <footer>
          <button type="button" disabled={busy} onClick={() => void close()}>
            {t(copy ? 'ui.closeDialog' : 'ui.cancel')}
          </button>
          {!copy &&
            (review ? (
              <>
                <button type="button" disabled={busy} onClick={() => setReview(null)}>
                  {t('acquisition.back')}
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await api<{ copy_id: string }>('wishlist_acquire', {
                        request,
                        review_token: review.review_token,
                      });
                      setCopy(result.copy_id);
                      onSaved();
                    })
                  }
                >
                  {t('acquisition.confirm')}
                </button>
              </>
            ) : (
              <button
                className="primary"
                disabled={busy || !mode || (mode === 'existing' && !request.edition_id)}
              >
                {t('acquisition.review')}
              </button>
            ))}
        </footer>
      </form>
    </Modal>
  );
}
