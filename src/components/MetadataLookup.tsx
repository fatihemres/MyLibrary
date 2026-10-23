import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Book } from '../domain/types';
import { t } from '../i18n';
import { lookupIsbn } from '../domain/isbn';
import { scheduleScanLookup, type ScanLookupIntent } from '../domain/scanner';
import { lookupMetadata, type ProviderOutcome } from '../services/metadata';
import {
  applySelection,
  canApplySeries,
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
  scanLookupIntent,
}: {
  book: Book;
  setBook: Dispatch<SetStateAction<Book>>;
  disabled: boolean;
  onPreviewChange: (open: boolean) => void;
  scanLookupIntent?: ScanLookupIntent;
}) {
  const [outcomes, setOutcomes] = useState<ProviderOutcome[] | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cover, setCover] = useState(false);
  const active = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const previewChange = useRef(onPreviewChange);
  previewChange.current = onPreviewChange;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      previewChange.current(false);
    };
  }, []);
  const latestBook = useRef(book);
  latestBook.current = book;
  const requested = useRef('');
  const requestedIdentity = useRef('');
  const results = outcomes?.flatMap((o) => (o.result ? [o.result] : [])) || [];
  const current = currentValues(book);
  const lookup = async (fromScan = false) => {
    if (active.current || disabled) return;
    setError('');
    try {
      requested.current = lookupIsbn(book.isbn10, book.isbn13).isbn13;
    } catch (e) {
      setError(String(e).replace(/^Error: /, ''));
      return;
    }
    active.current = true;
    const operation = generation.current;
    const identity = JSON.stringify([book.id, book.edition_id, book.isbn10, book.isbn13]);
    requestedIdentity.current = identity;
    setBusy(true);
    // A scan-started lookup blocks Save while loading, but the editor may still be closed.
    if (fromScan) previewChange.current(true);
    let presented = false;
    try {
      const found = await lookupMetadata(book.isbn10, book.isbn13);
      // Switching editor sections/closing during a request must not open a
      // detached preview or leave the parent Save action blocked.
      if (
        !mounted.current ||
        operation !== generation.current ||
        identity !==
          JSON.stringify([
            latestBook.current.id,
            latestBook.current.edition_id,
            latestBook.current.isbn10,
            latestBook.current.isbn13,
          ])
      )
        return;
      presented = true;
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
      if (mounted.current) {
        setBusy(false);
        if (fromScan && !presented) previewChange.current(false);
      }
    }
  };
  const startup = useRef(() => {});
  startup.current = () => {
    if (!disabled && !book.id && !book.edition_id && scanLookupIntent?.isbn13 === book.isbn13)
      void lookup(true);
  };
  useEffect(
    () => scheduleScanLookup(scanLookupIntent, () => startup.current()),
    [scanLookupIntent],
  );
  const apply = async () => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError('');
    const operation = generation.current;
    const identity = JSON.stringify([book.id, book.edition_id, book.isbn10, book.isbn13]);
    let image: string | undefined;
    if (cover) {
      const acquired = await acquireMetadataCover(requested.current);
      image = acquired.image;
      if (mounted.current && operation === generation.current && acquired.error)
        setError(acquired.error);
    }
    if (!mounted.current || operation !== generation.current) return;
    if (
      identity !== requestedIdentity.current ||
      identity !==
        JSON.stringify([
          latestBook.current.id,
          latestBook.current.edition_id,
          latestBook.current.isbn10,
          latestBook.current.isbn13,
        ])
    ) {
      setOutcomes(null);
      onPreviewChange(false);
      setBusy(false);
      active.current = false;
      return;
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
            {results.length > 0 && (
              <div className="metadata-choices">
                <fieldset>
                  <legend>{t('metadata.field.series')}</legend>
                  <p>{t('metadata.seriesHelp')}</p>
                  <label>
                    <input
                      type="radio"
                      name="metadata-series"
                      checked={!selection.series}
                      onChange={() => setSelection((s) => ({ ...s, series: undefined }))}
                    />
                    <span>
                      <strong>{t('metadata.keep')}</strong>
                      <span className="block metadata-value">
                        {book.series || t('metadata.empty')}
                      </span>
                    </span>
                  </label>
                  {results.map((r) => (
                    <div key={r.provider} role="group" aria-label={t(`metadata.${r.provider}`)}>
                      <strong>{t(`metadata.${r.provider}`)}</strong>
                      {!r.seriesSuggestions.length && <p>{t('metadata.noSeries')}</p>}
                      {r.seriesSuggestions.map((candidate) => (
                        <label key={candidate.value}>
                          <input
                            type="radio"
                            name="metadata-series"
                            disabled={!canApplySeries(book, candidate.value)}
                            checked={
                              selection.series?.provider === candidate.provider &&
                              selection.series?.value === candidate.value
                            }
                            onChange={() => setSelection((s) => ({ ...s, series: candidate }))}
                          />
                          <span className="metadata-value">
                            {candidate.value}
                            {!canApplySeries(book, candidate.value) && (
                              <small className="block">{t('metadata.seriesOrderConflict')}</small>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                  {results.flatMap((r) => r.seriesSuggestions).length > 1 && (
                    <p>{t('metadata.seriesAlternatives')}</p>
                  )}
                </fieldset>
                <fieldset>
                  <legend>{t('metadata.field.series_order')}</legend>
                  <p>
                    {t('metadata.keep')}: {book.series_order ?? t('metadata.empty')}
                  </p>
                  <p>{t('metadata.noSeriesOrder')}</p>
                </fieldset>
                <fieldset>
                  <legend>{t('metadata.genreSuggestions')}</legend>
                  <p>{t('metadata.genreHelp')}</p>
                  <p>
                    {t('metadata.keep')}:{' '}
                    {(book.terms.genre || []).join('; ') || t('metadata.empty')}
                  </p>
                  {results.map((r) => (
                    <div key={r.provider} role="group" aria-label={t(`metadata.${r.provider}`)}>
                      <strong>{t(`metadata.${r.provider}`)}</strong>
                      {!r.genreSuggestions.length && <p>{t('metadata.noGenres')}</p>}
                      {r.genreSuggestions.map((candidate) => (
                        <label key={candidate.value}>
                          <input
                            type="checkbox"
                            checked={
                              !!selection.genres?.some(
                                (g) =>
                                  g.provider === candidate.provider && g.value === candidate.value,
                              )
                            }
                            onChange={(event) =>
                              setSelection((s) => ({
                                ...s,
                                genres: event.target.checked
                                  ? [...(s.genres || []), candidate]
                                  : (s.genres || []).filter(
                                      (g) =>
                                        g.provider !== candidate.provider ||
                                        g.value !== candidate.value,
                                    ),
                              }))
                            }
                          />
                          <span className="metadata-value">{candidate.value}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </fieldset>
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
