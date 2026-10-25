import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { lookupMetadata, type ProviderOutcome } from '../services/metadata';
import { candidateValues } from '../services/metadataMerge';
import type { WishlistDraft } from '../domain/wishlist';
import { t } from '../i18n';
import { Modal } from './common';
// Reuses the same bounded provider orchestration, without a Book/Copy adapter.
export function WishlistMetadata({
  draft,
  setDraft,
  onPreviewChange,
}: {
  draft: WishlistDraft;
  setDraft: Dispatch<SetStateAction<WishlistDraft>>;
  onPreviewChange: (open: boolean) => void;
}) {
  const [outcomes, setOutcomes] = useState<ProviderOutcome[] | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(draft);
  latest.current = draft;
  const mounted = useRef(false);
  const generation = useRef({ value: 0 }).current;
  const active = useRef(false);
  const preview = useRef(onPreviewChange);
  preview.current = onPreviewChange;
  const identity = JSON.stringify([draft.id, draft.isbn10, draft.isbn13]);
  const requested = useRef('');
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.value++;
      preview.current(false);
    };
  }, [generation]);
  useEffect(() => {
    generation.value++;
    setOutcomes(null);
    preview.current(false);
  }, [identity, generation]);
  const lookup = async () => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError('');
    const g = generation.value;
    requested.current = identity;
    try {
      const result = await lookupMetadata(draft.isbn10, draft.isbn13);
      if (
        mounted.current &&
        generation.value === g &&
        JSON.stringify([latest.current.id, latest.current.isbn10, latest.current.isbn13]) ===
          identity
      ) {
        setSelection({});
        setOutcomes(result);
        preview.current(true);
      }
    } catch (e) {
      if (mounted.current) setError(String(e).replace(/^Error: /, ''));
    } finally {
      active.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const close = () => {
    setOutcomes(null);
    preview.current(false);
  };
  const keys = ['title', 'authors', 'isbn10', 'isbn13'] as const;
  return (
    <>
      <button type="button" disabled={busy} onClick={() => void lookup()}>
        {t(busy ? 'wishlist.loading' : 'wishlist.lookup')}
      </button>
      <p className="muted">{t('wishlist.lookupHelp')}</p>
      {error && <p role="alert">{t(error)}</p>}
      {outcomes && (
        <Modal title={t('wishlist.metadataReview')} onClose={close} wide>
          <div className="dialog-body">
            {outcomes.map((o) => (
              <p key={o.provider}>
                {t(`metadata.${o.provider}`)}:{' '}
                {o.error ? t(o.error) : t(o.result ? 'wishlist.available' : 'wishlist.noResult')}
              </p>
            ))}
            {keys.map((key) => (
              <label className="field" key={key}>
                <span>{t(`wishlist.${key}`)}</span>
                <select
                  aria-label={t(`wishlist.${key}`)}
                  value={selection[key] || ''}
                  onChange={(e) => setSelection((s) => ({ ...s, [key]: e.target.value }))}
                >
                  <option value="">
                    {t('wishlist.keep')}: {key === 'authors' ? draft.author : draft[key]}
                  </option>
                  {outcomes
                    .filter((o) => o.result && candidateValues(o.result)[key])
                    .map((o) => (
                      <option key={o.provider} value={o.provider}>
                        {t(`metadata.${o.provider}`)}: {candidateValues(o.result!)[key]}
                      </option>
                    ))}
                </select>
              </label>
            ))}
          </div>
          <footer>
            <button type="button" onClick={close}>
              {t('ui.cancel')}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (
                  requested.current !==
                  JSON.stringify([latest.current.id, latest.current.isbn10, latest.current.isbn13])
                ) {
                  close();
                  return;
                }
                setDraft((old) => {
                  const next = { ...old };
                  for (const key of keys) {
                    const r = outcomes.find((o) => o.provider === selection[key])?.result;
                    if (r) {
                      const value = candidateValues(r)[key];
                      if (value) next[key === 'authors' ? 'author' : key] = value;
                    }
                  }
                  return next;
                });
                close();
              }}
            >
              {t('wishlist.apply')}
            </button>
          </footer>
        </Modal>
      )}
    </>
  );
}
