import { useId, useState } from 'react';
import { t } from '../i18n';
import { author, type Book } from '../domain/types';
import {
  fieldValue,
  sharedFields,
  type DuplicateDecision,
  type DuplicateReport,
  type SharedField,
} from '../domain/duplicates';
import { Modal } from './common';
import { ErrorText } from './ErrorText';

export function DuplicateChoices({
  book,
  report,
  value,
  onChange,
  reconcile = false,
  allowSkip = false,
}: {
  book: Book;
  report: DuplicateReport;
  value?: DuplicateDecision;
  onChange: (d: DuplicateDecision) => void;
  reconcile?: boolean;
  allowSkip?: boolean;
}) {
  const choiceName = useId();
  const target = report.strong.find((c) => c.book.edition_id === value?.target)?.book;
  const choose = (action: DuplicateDecision['action'], id?: string) =>
    onChange({ action, target: id, fields: [], reviewed: true });
  return (
    <div className="duplicate-choices">
      {!!report.strong.length && (
        <section>
          <h3>{t('duplicate.strong')}</h3>
          <p>{t('duplicate.isbnReason')}</p>
          {report.strong.map((c) => (
            <article className="panel" key={c.book.edition_id}>
              <strong>{c.book.title}</strong>
              <p>{author(c.book)}</p>
              <p>
                {[
                  c.book.isbn10,
                  c.book.isbn13,
                  c.book.publisher,
                  c.book.publication_year,
                  c.book.language,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p>
                {t('duplicate.copies', { count: c.count })} ·{' '}
                {t('duplicate.archived', { count: c.archived })}
              </p>
              <label className="check">
                <input
                  type="radio"
                  name={choiceName}
                  checked={value?.action === 'existing' && value.target === c.book.edition_id}
                  onChange={() => choose('existing', c.book.edition_id)}
                />
                {t('duplicate.addExisting')}
              </label>
            </article>
          ))}
        </section>
      )}
      {!!report.collisions.length && (
        <div className="notice">
          <h3>{t('duplicate.collision')}</h3>
          <p>{t('duplicate.collisionHelp')}</p>
          {report.collisions.map((c, i) => (
            <p key={i}>
              {c.book.title} ·{' '}
              {c.barcode ? c.book.barcode : String(c.book.copy_extra.inventory_code)}
            </p>
          ))}
        </div>
      )}
      {!!report.weak.length && (
        <div className="notice">
          <h3>{t('duplicate.weak')}</h3>
          <p>{t('duplicate.weakHelp')}</p>
          {report.weak.map((c) => (
            <p key={c.book.edition_id}>
              {c.book.title} · {author(c.book)} · {t('duplicate.copies', { count: c.count })}
            </p>
          ))}
        </div>
      )}
      <label className="check">
        <input
          type="radio"
          name={choiceName}
          checked={value?.action === 'separate'}
          onChange={() => choose('separate')}
        />
        {t('duplicate.separate')}
      </label>
      {allowSkip && (
        <label className="check">
          <input
            name={choiceName}
            type="radio"
            checked={value?.action === 'skip'}
            onChange={() => choose('skip')}
          />
          {t('duplicate.skip')}
        </label>
      )}
      {target && (
        <section>
          <h3>{t('duplicate.shared')}</h3>
          <p className="notice">{t('duplicate.sharedWarning')}</p>
          <p>{t(reconcile ? 'duplicate.selectionHelp' : 'duplicate.keepAll')}</p>
          {sharedFields.map((field) => (
            <div className="duplicate-field" key={field}>
              <strong>{t(`metadata.field.${field}`)}</strong>
              <div>
                <small>{t('duplicate.existing')}</small>
                <p>{fieldValue(target, field) || t('data.empty')}</p>
              </div>
              <div>
                <small>{t('duplicate.incoming')}</small>
                <p>{fieldValue(book, field) || t('data.empty')}</p>
              </div>
              {reconcile && fieldValue(target, field) !== fieldValue(book, field) && (
                <label className="check">
                  <input
                    type="checkbox"
                    aria-label={`${t('duplicate.useIncoming')} — ${t(`metadata.field.${field}`)}`}
                    checked={value?.fields?.includes(field) || false}
                    onChange={(e) =>
                      onChange({
                        ...value!,
                        fields: e.target.checked
                          ? [...(value?.fields || []), field]
                          : (value?.fields?.filter((f) => f !== field) as SharedField[]),
                      })
                    }
                  />
                  {t('duplicate.useIncoming')}
                </label>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
export function DuplicateResolver({
  book,
  report,
  onClose,
  onConfirm,
}: {
  book: Book;
  report: DuplicateReport;
  onClose: () => void;
  onConfirm: (d: DuplicateDecision) => Promise<void>;
}) {
  const [value, setValue] = useState<DuplicateDecision>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal
      wide
      title={t('duplicate.review')}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="dialog-body">
        <p>{t('duplicate.intro')}</p>
        {error && (
          <div role="alert" className="alert">
            <ErrorText message={error} />
          </div>
        )}
        <fieldset
          className="duplicate-review-fields"
          disabled={busy}
          aria-label={t('duplicate.review')}
        >
          <DuplicateChoices
            book={book}
            report={report}
            value={value}
            onChange={setValue}
            reconcile
          />
        </fieldset>
      </div>
      <footer>
        <button type="button" disabled={busy} onClick={onClose}>
          {t('ui.cancel')}
        </button>
        <button
          type="button"
          className="primary"
          disabled={!value || busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await onConfirm(value!);
            } catch (e) {
              setError(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('duplicate.confirm')}
        </button>
      </footer>
    </Modal>
  );
}
