import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Book } from '../domain/types';
import { t } from '../i18n';
import { lookupIsbn } from '../domain/isbn';
import { lookupMetadata, type ProviderOutcome } from '../services/metadata';
import {
  applySelection,
  candidateValues,
  currentValues,
  defaultSelection,
  metadataKeys,
  type Selection,
} from '../services/metadataMerge';
import { api, lookupCover } from '../services/api';
import { Modal } from './common';
const coverErrors = new Set([
  'metadata.coverMissing',
  'metadata.coverRefused',
  'metadata.coverRateLimited',
  'metadata.coverServer',
  'metadata.coverTimeout',
  'metadata.coverNetwork',
  'metadata.coverUnsafeRedirect',
  'metadata.coverTooLarge',
  'metadata.coverInvalid',
  'metadata.coverBusy',
  'metadata.coverFailed',
  'metadata.invalidIsbn',
]);
export async function acquireMetadataCover(
  isbn: string,
): Promise<{ image?: string; error?: string }> {
  try {
    const bytes = await lookupCover(isbn);
    return { image: await api<string>('cover', { name: 'isbn-cover.jpg', bytes }) };
  } catch (error) {
    // Only native stable keys may reach i18n; never expose provider/storage exceptions.
    return {
      error: typeof error === 'string' && coverErrors.has(error) ? error : 'metadata.coverFailed',
    };
  }
}
export function MetadataLookup({
  book,
  setBook,
  disabled,
  onPreviewChange,
}: {
  book: Book;
  setBook: Dispatch<SetStateAction<Book>>;
  disabled: boolean;
  onPreviewChange: (open: boolean) => void;
}) {
  const [outcomes, setOutcomes] = useState<ProviderOutcome[] | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cover, setCover] = useState(false);
  const active = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const latestBook = useRef(book);
  latestBook.current = book;
  const requested = useRef('');
  const results = outcomes?.flatMap((o) => (o.result ? [o.result] : [])) || [];
  const current = currentValues(book);
  const lookup = async () => {
    if (active.current || disabled) return;
    setError('');
    try {
      requested.current = lookupIsbn(book.isbn10, book.isbn13).isbn13;
    } catch (e) {
      setError(String(e).replace(/^Error: /, ''));
      return;
    }
    active.current = true;
    setBusy(true);
    try {
      const found = await lookupMetadata(book.isbn10, book.isbn13);
      // Switching editor sections/closing during a request must not open a
      // detached preview or leave the parent Save action blocked.
      if (!mounted.current) return;
      setSelection(
        defaultSelection(
          latestBook.current,
          found.flatMap((o) => (o.result ? [o.result] : [])),
        ),
      );
      setCover(false);
      setOutcomes(found);
      onPreviewChange(true);
    } finally {
      active.current = false;
      setBusy(false);
    }
  };
  const apply = async () => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError('');
    let image: string | undefined;
    if (cover) {
      const acquired = await acquireMetadataCover(requested.current);
      image = acquired.image;
      if (acquired.error) setError(acquired.error);
    }
    setBook((previous) => ({
      ...applySelection(previous, results, selection),
      ...(image ? { cover: image } : {}),
    }));
    setOutcomes(null);
    onPreviewChange(false);
    setBusy(false);
    active.current = false;
  };
  return (
    <div className="span2">
      <button
        type="button"
        disabled={disabled || busy || !(book.isbn10.trim() || book.isbn13.trim())}
        onClick={() => void lookup()}
      >
        {t(busy ? 'metadata.loading' : 'ui.lookUpIsbnOnline')}
      </button>
      <small className="block">{t('metadata.privacy')}</small>
      {error && <p role="alert">{t(error)}</p>}
      {outcomes && (
        <Modal
          wide
          title={t('ui.chooseMetadataToApply')}
          onClose={() => {
            if (!busy) {
              setOutcomes(null);
              onPreviewChange(false);
            }
          }}
        >
          <div className="dialog-body">
            <p>{t('metadata.instructions')}</p>
            <div role="status">
              {outcomes.map((o) => (
                <p key={o.provider}>
                  <strong>{t(`metadata.${o.provider}`)}</strong>:{' '}
                  {t(o.error || (o.result ? 'metadata.found' : 'metadata.noMatch'))}
                </p>
              ))}
            </div>
            {results.length > 0 && (
              <div className="metadata-choices">
                {metadataKeys.map((key) => {
                  const available = results.filter((r) => candidateValues(r)[key] !== '');
                  if (!available.length) return null;
                  return (
                    <fieldset key={key}>
                      <legend>{t(`metadata.field.${key}`)}</legend>
                      <label>
                        <input
                          type="radio"
                          name={`metadata-${key}`}
                          checked={!selection[key] || selection[key] === 'current'}
                          onChange={() => setSelection((s) => ({ ...s, [key]: 'current' }))}
                        />
                        <span>
                          <strong>{t('metadata.keep')}</strong>
                          <span className="block metadata-value">
                            {current[key] || t('metadata.empty')}
                          </span>
                        </span>
                      </label>
                      {available.map((r) => (
                        <label key={r.provider}>
                          <input
                            type="radio"
                            name={`metadata-${key}`}
                            checked={selection[key] === r.provider}
                            onChange={() => setSelection((s) => ({ ...s, [key]: r.provider }))}
                          />
                          <span>
                            <strong>{t(`metadata.${r.provider}`)}</strong>
                            <span className="block metadata-value">{candidateValues(r)[key]}</span>
                            {key === 'publication_year' && <small>{r.publicationDate}</small>}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  );
                })}
              </div>
            )}
            {results.map((r) => (
              <div key={r.provider}>
                {r.subjects.length > 0 && (
                  <p>
                    <strong>
                      {t(`metadata.${r.provider}`)} · {t('metadata.subjects')}
                    </strong>
                    <br />
                    {r.subjects.join('; ')}
                  </p>
                )}
                {r.covers.length > 0 && (
                  <p>
                    {t('metadata.coverCandidates', {
                      provider: t(`metadata.${r.provider}`),
                      count: r.covers.length,
                    })}
                  </p>
                )}
              </div>
            ))}
            {results.some((r) => r.provider === 'openLibrary' && r.covers.length > 0) && (
              <label>
                <input
                  type="checkbox"
                  checked={cover}
                  onChange={(e) => setCover(e.target.checked)}
                />
                {t('ui.downloadAndUseTheOpenLibraryCoverAsAManagedLocalImage')}
              </label>
            )}
            {results.some((r) => r.provider === 'googleBooks' && r.covers.length > 0) && (
              <small className="block">{t('metadata.googleCoverDeferred')}</small>
            )}
          </div>
          <footer>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOutcomes(null);
                onPreviewChange(false);
              }}
            >
              {t('ui.cancel')}
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy || !results.length}
              onClick={() => void apply()}
            >
              {t(busy ? 'ui.applying' : 'ui.applySelectedFields')}
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
