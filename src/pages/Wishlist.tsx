import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { api } from '../services/api';
import { chooseDestination } from '../services/platform';
import {
  amountText,
  amountToMinor,
  currencies,
  emptyWish,
  exportWishlist,
  wishPriorities,
  wishStatuses,
  type WishlistDraft,
  type WishlistItem,
  type WishlistSnapshot,
  type WishlistSave,
} from '../domain/wishlist';
import { Cover, Empty, Field, Modal } from '../components/common';
import { confirmAction } from '../components/Confirmation';
import { useUnsaved } from '../components/useUnsaved';
import { WishlistMetadata } from '../components/WishlistMetadata';
import './Wishlist.css';

function Amount({
  value,
  currency,
  onChange,
}: {
  value: string | null;
  currency: string;
  onChange: (value: string | null, currency: string) => void;
}) {
  const [input, setInput] = useState(() => amountText(value, currency));
  const [error, setError] = useState('');

  return (
    <div className="wish-amount">
      <input
        aria-label={t('wishlist.amount')}
        inputMode="decimal"
        value={input}
        aria-invalid={!!error}
        onChange={(e) => {
          setInput(e.target.value);
          try {
            onChange(amountToMinor(e.target.value, currency), currency);
            setError('');
          } catch {
            setError(t('wishlist.invalidAmount'));
          }
        }}
        onInvalid={() => setError(t('wishlist.invalidAmount'))}
        ref={(el) => el?.setCustomValidity(error)}
      />
      <select
        aria-label={t('wishlist.currency')}
        value={currency}
        onChange={(e) => {
          try {
            const minor = amountToMinor(input, e.target.value);
            onChange(minor, e.target.value);
            setError('');
          } catch {
            setError(t('wishlist.invalidAmount'));
          }
        }}
      >
        {Object.keys(currencies).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
export function WishlistExport() {
  const [notes, setNotes] = useState(false),
    [retailers, setRetailers] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div>
      <p>{t('wishlist.exportHelp')}</p>
      <label>
        <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
        {t('wishlist.includeNotes')}
      </label>
      <label>
        <input
          type="checkbox"
          checked={retailers}
          onChange={(e) => setRetailers(e.target.checked)}
        />
        {t('wishlist.includeRetailers')}
      </label>
      <button
        disabled={busy}
        onClick={() =>
          void (async () => {
            setBusy(true);
            setError('');
            try {
              const data = await api<WishlistSnapshot>('wishlist_list', { query: '' });
              const path = await chooseDestination({
                defaultPath: 'mylibrary-wishlist.json',
                filters: [{ name: 'JSON', extensions: ['json'] }],
              });
              if (path)
                await api('write_text', {
                  path,
                  text: exportWishlist(data.items, notes, retailers),
                });
            } catch (e) {
              setError(String(e));
            } finally {
              setBusy(false);
            }
          })()
        }
      >
        {t('wishlist.export')}
      </button>
      {error && <p role="alert">{t(error)}</p>}
    </div>
  );
}
export function Wishlist() {
  const [data, setData] = useState<WishlistSnapshot | null>(null),
    [query, setQuery] = useState(''),
    [priority, setPriority] = useState(''),
    [status, setStatus] = useState(''),
    [archived, setArchived] = useState(false),
    [gallery, setGallery] = useState(true);
  const [editor, setEditor] = useState<WishlistItem | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    const timer = setTimeout(() => {
      void api<WishlistSnapshot>('wishlist_list', { query })
        .then((d) => {
          if (live) {
            setData(d);
            setError('');
          }
        })
        .catch((e) => {
          if (live) setError(String(e));
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, revision]);
  const items =
    data?.items.filter(
      ({ draft: d }) =>
        d.archived === archived &&
        (!priority || d.priority === priority) &&
        (!status || d.status === status),
    ) || [];
  return (
    <section className="wishlist">
      <div className="wish-intro">
        <div>
          <p className="eyebrow">{t('wishlist.intent')}</p>
          <h2>{t('wishlist.heading')}</h2>
          <p>{t('wishlist.description')}</p>
        </div>
        <button
          className="primary"
          onClick={() => setEditor({ draft: emptyWish(), cover: '', history: [] })}
        >
          {t('wishlist.add')}
        </button>
      </div>
      <section className="panel" aria-label={t('wishlist.budget')}>
        <h3>{t('wishlist.budget')}</h3>
        <p className="muted">{t('wishlist.budgetHelp')}</p>
        <div className="wish-totals">
          {data?.budget.map((b) => (
            <strong key={b.currency}>
              {amountText(b.minor, b.currency)} {b.currency}
            </strong>
          ))}
          <span>{t('wishlist.missingPrices', { count: data?.missing_prices || 0 })}</span>
        </div>
      </section>
      <div className="wish-toolbar">
        <Field label={t('wishlist.search')}>
          <input value={query} maxLength={1024} onChange={(e) => setQuery(e.target.value)} />
        </Field>
        <Field label={t('wishlist.priority')}>
          <select
            aria-label={t('wishlist.priority')}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">{t('wishlist.all')}</option>
            {wishPriorities.map((v) => (
              <option key={v} value={v}>
                {t(`wishlist.${v}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('wishlist.status')}>
          <select
            aria-label={t('wishlist.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t('wishlist.all')}</option>
            {wishStatuses.map((v) => (
              <option key={v} value={v}>
                {t(`wishlist.${v}`)}
              </option>
            ))}
          </select>
        </Field>
        <label>
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          {t('wishlist.archived')}
        </label>
        <div role="group" aria-label={t('wishlist.view')}>
          <button aria-pressed={!gallery} onClick={() => setGallery(false)}>
            {t('wishlist.list')}
          </button>
          <button aria-pressed={gallery} onClick={() => setGallery(true)}>
            {t('wishlist.gallery')}
          </button>
        </div>
      </div>
      {error && <p role="alert">{t(error)}</p>}
      <p role="status">
        {loading ? t('wishlist.loading') : t('wishlist.count', { count: items.length })}
      </p>
      {!loading && !error && !items.length && (
        <Empty title={t('wishlist.empty')}>{t('wishlist.emptyHelp')}</Empty>
      )}
      <div className={gallery ? 'wish-gallery' : 'wish-list'}>
        {items.map((item) => (
          <article className="panel wish-card" key={item.draft.id}>
            <button
              className="wish-open"
              onClick={() => setEditor(item)}
              aria-label={t('wishlist.editTitle', { title: item.draft.title })}
            >
              <Cover book={{ title: item.draft.title, cover: item.cover }} large={gallery} />
              <div>
                <span className="eyebrow">
                  {t(`wishlist.${item.draft.priority}`)} · {t(`wishlist.${item.draft.status}`)}
                </span>
                <h3>{item.draft.title}</h3>
                <p>{item.draft.author}</p>
                <p>{item.draft.isbn13 || item.draft.isbn10}</p>
                <strong>
                  {item.draft.target_minor === null
                    ? t('wishlist.noPrice')
                    : `${amountText(item.draft.target_minor, item.draft.currency)} ${item.draft.currency}`}
                </strong>
              </div>
            </button>
            <div className="wish-retailers">
              {item.draft.retailers.map((r) => (
                <button
                  key={r.id}
                  title={r.name}
                  aria-label={r.name}
                  onClick={() =>
                    void api('wishlist_open_retailer', {
                      item: item.draft.id,
                      retailer: r.id,
                    }).catch((e) => setError(String(e)))
                  }
                >
                  {r.name} ↗
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {editor && (
        <WishlistEditor
          key={editor.draft.id || 'new'}
          item={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setRevision((v) => v + 1);
          }}
        />
      )}
    </section>
  );
}
function WishlistEditor({
  item,
  onClose,
  onSaved,
}: {
  item: WishlistItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(item.draft)),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false),
    [error, setError] = useState('');
  const [review, setReview] = useState<Extract<WishlistSave, { saved: false }> | null>(null);
  const [editionQuery, setEditionQuery] = useState(''),
    [editions, setEditions] = useState<
      { id: string; title: string; isbn10: string; isbn13: string }[]
    >([]);
  const form = useRef<HTMLFormElement>(null);
  const baseline = useRef(JSON.stringify(item.draft));
  const dirty = baseline.current !== JSON.stringify(draft);
  useUnsaved(dirty);
  useEffect(() => {
    setReview(null);
  }, [draft]);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      void api<typeof editions>('wishlist_editions', { query: editionQuery })
        .then((v) => {
          if (live) setEditions(v);
        })
        .catch((e) => {
          if (live) setError(String(e));
        });
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [editionQuery]);
  const set = <K extends keyof WishlistDraft>(key: K, value: WishlistDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const close = async () => {
    if (!busy && (!dirty || (await confirmAction(t('wishlist.discard'))))) onClose();
  };
  const save = async (token?: string) => {
    if (busy || preview || !form.current?.reportValidity()) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<WishlistSave>('wishlist_save', { draft, review_token: token });
      if (result.saved) onSaved();
      else setReview(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal wide title={t(draft.id ? 'wishlist.edit' : 'wishlist.add')} onClose={() => void close()}>
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="dialog-body">
          {error && (
            <p className="alert" role="alert">
              {t(error)}
            </p>
          )}
          <div className="form-grid">
            <Field label={t('wishlist.title')}>
              <input
                autoFocus
                required
                maxLength={500}
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>
            <Field label={t('wishlist.authors')}>
              <input
                maxLength={1000}
                value={draft.author}
                onChange={(e) => set('author', e.target.value)}
              />
            </Field>
            {(['isbn10', 'isbn13'] as const).map((k) => (
              <Field key={k} label={t(`wishlist.${k}`)}>
                <input maxLength={13} value={draft[k]} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
            <Field label={t('wishlist.preference')}>
              <select
                aria-label={t('wishlist.preference')}
                value={draft.preference}
                onChange={(e) => set('preference', e.target.value as WishlistDraft['preference'])}
              >
                {['Any', 'Specific'].map((v) => (
                  <option value={v} key={v}>
                    {t(`wishlist.${v}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('wishlist.editionDescription')}>
              <input
                maxLength={2000}
                value={draft.edition_description}
                onChange={(e) => set('edition_description', e.target.value)}
              />
            </Field>
            <Field label={t('wishlist.priority')}>
              <select
                aria-label={t('wishlist.priority')}
                value={draft.priority}
                onChange={(e) => set('priority', e.target.value as WishlistDraft['priority'])}
              >
                {wishPriorities.map((v) => (
                  <option key={v} value={v}>
                    {t(`wishlist.${v}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('wishlist.status')}>
              <select
                aria-label={t('wishlist.status')}
                value={draft.status}
                onChange={(e) => set('status', e.target.value as WishlistDraft['status'])}
              >
                {wishStatuses.map((v) => (
                  <option key={v} value={v}>
                    {t(`wishlist.${v}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('wishlist.target')}>
              <Amount
                value={draft.target_minor}
                currency={draft.currency}
                onChange={(amount, currency) =>
                  setDraft((d) => ({ ...d, target_minor: amount, currency }))
                }
              />
            </Field>
            <Field label={t('wishlist.notes')}>
              <textarea
                maxLength={20000}
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>
          </div>
          <WishlistMetadata draft={draft} setDraft={setDraft} onPreviewChange={setPreview} />
          <fieldset>
            <legend>{t('wishlist.editionLink')}</legend>
            <p>{t('wishlist.editionHelp')}</p>
            {draft.edition_id && (
              <p>
                {t('wishlist.linked')}: {draft.edition_id}{' '}
                <button type="button" onClick={() => set('edition_id', null)}>
                  {t('wishlist.unlink')}
                </button>
              </p>
            )}
            <Field label={t('wishlist.findEdition')}>
              <input
                value={editionQuery}
                onChange={(e) => setEditionQuery(e.target.value)}
                maxLength={1024}
              />
            </Field>
            {editions.map((e) => (
              <button type="button" key={e.id} onClick={() => set('edition_id', e.id)}>
                {t('wishlist.link')}: {e.title} · {e.isbn13 || e.isbn10}
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>{t('wishlist.retailers')}</legend>
            <p>{t('wishlist.retailerHelp')}</p>
            {draft.retailers.map((r, index) => (
              <div className="panel" key={r.id}>
                <div className="form-grid">
                  {(['name', 'url', 'notes'] as const).map((k) => (
                    <Field label={t(`wishlist.retailer.${k}`)} key={k}>
                      <input
                        required={k !== 'notes'}
                        type={k === 'url' ? 'url' : 'text'}
                        maxLength={k === 'name' ? 200 : k === 'url' ? 2048 : 2000}
                        value={r[k]}
                        onChange={(e) =>
                          set(
                            'retailers',
                            draft.retailers.map((x) =>
                              x.id === r.id ? { ...x, [k]: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </Field>
                  ))}
                  <Field label={t('wishlist.offer')}>
                    <Amount
                      value={r.offer_minor}
                      currency={r.currency}
                      onChange={(offer_minor, currency) =>
                        set(
                          'retailers',
                          draft.retailers.map((x) =>
                            x.id === r.id ? { ...x, offer_minor, currency } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      'retailers',
                      draft.retailers.filter((x) => x.id !== r.id),
                    )
                  }
                >
                  {t('wishlist.remove')}
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...draft.retailers];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    set('retailers', next);
                  }}
                >
                  {t('wishlist.moveUp')}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={draft.retailers.length >= 30}
              onClick={() =>
                set('retailers', [
                  ...draft.retailers,
                  {
                    id: crypto.randomUUID(),
                    name: '',
                    url: '',
                    offer_minor: null,
                    currency: draft.currency,
                    notes: '',
                  },
                ])
              }
            >
              {t('wishlist.addRetailer')}
            </button>
          </fieldset>
          {draft.id && (
            <label>
              <input
                type="checkbox"
                checked={draft.archived}
                onChange={(e) => set('archived', e.target.checked)}
              />
              {t('wishlist.archiveHelp')}
            </label>
          )}
          {item.history.length > 0 && (
            <details>
              <summary>{t('wishlist.history')}</summary>
              <ol>
                {item.history.map((h, i) => (
                  <li key={i}>
                    {t(`wishlist.${h.status}`)} — {h.created_at}
                  </li>
                ))}
              </ol>
            </details>
          )}
          {review && (
            <section role="alert" className="notice">
              <h3>{t('wishlist.duplicates')}</h3>
              <p>{t('wishlist.duplicateHelp')}</p>
              <ul>
                {review.review.map((r) => (
                  <li key={`${r.kind}:${r.id}`}>
                    {r.title} — {t(r.exact ? 'wishlist.exact' : 'wishlist.similar')} ·{' '}
                    {t(`wishlist.${r.kind}`)} {r.archived ? t('wishlist.archived') : ''}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy || preview}
                onClick={() => void save(review.review_token)}
              >
                {t('wishlist.saveSeparate')}
              </button>
            </section>
          )}
        </div>
        <footer>
          <button type="button" disabled={busy} onClick={() => void close()}>
            {t('ui.cancel')}
          </button>
          <button className="primary" disabled={busy || preview}>
            {t('wishlist.save')}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
