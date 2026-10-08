import { label, locale, t } from '../i18n';
/** Technical detail remains available without exposing raw native errors as the primary Turkish UI. */
export function ErrorText({ message }: { message: string }) {
  if (locale() === 'en') return <>{message}</>;
  const translated = label(message);
  if (translated !== message) return <>{translated}</>;
  const numeric = message.match(/^(\w+) must be a (number|whole number)$/);
  if (numeric)
    return (
      <>
        {t(numeric[2] === 'number' ? 'errors.numeric' : 'errors.integer', {
          field: label(numeric[1].replaceAll('_', ' ')),
        })}
      </>
    );
  const invalidDate = message.match(/^(.+) must be a valid YYYY-MM-DD date$/);
  if (invalidDate) return <>{t('errors.date', { field: label(invalidDate[1]) })}</>;
  return (
    <>
      <span>{t('errors.operation')}</span>
      <details>
        <summary>{t('errors.details')}</summary>
        <pre dir="ltr" className="break">
          {message}
        </pre>
      </details>
    </>
  );
}
