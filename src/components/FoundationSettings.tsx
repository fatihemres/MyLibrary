import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { t, languages, setLanguage, number, date, currency } from '../i18n';
import { api } from '../services/api';
import { platformInfo, type PlatformInfo } from '../services/platform';
import { checkUpdates } from '../services/updates';
import { Field } from './common';

export function FoundationSettings({
  onAction,
}: {
  onAction: (f: () => Promise<unknown>) => void;
}) {
  const { i18n } = useTranslation();
  const [platform, setPlatform] = useState<PlatformInfo>();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let live = true;
    platformInfo()
      .then((p) => {
        if (live) setPlatform(p);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="two-col">
      <section className="panel">
        <h2>{t('foundation.region')}</h2>
        <Field label={t('foundation.language')}>
          <select
            aria-label={t('foundation.language')}
            value={i18n.resolvedLanguage || 'en'}
            onChange={(e) => {
              const ui_language = e.target.value;
              onAction(async () => {
                await api('settings', { ui_language });
                await setLanguage(ui_language);
              });
            }}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <p>{t('foundation.languageHelp')}</p>
        <dl className="details-grid">
          <div>
            <dt>{t('foundation.number')}</dt>
            <dd>{number(12345.67)}</dd>
          </div>
          <div>
            <dt>{t('foundation.date')}</dt>
            <dd>{date('2026-10-08')}</dd>
          </div>
          <div>
            <dt>{t('foundation.currency')}</dt>
            <dd>{currency(1250.5, 'TRY')}</dd>
          </div>
        </dl>
      </section>
      <section className="panel">
        <h2>{t('foundation.updates')}</h2>
        <p>
          {t('foundation.current')}: {platform?.version || '2.0.0-alpha.1'}
        </p>
        <Field label={t('foundation.channel')}>
          <select disabled value="stable">
            <option value="stable">{t('foundation.stable')}</option>
          </select>
        </Field>
        <label>
          <input type="checkbox" checked={false} disabled /> {t('foundation.autoCheck')}
        </label>
        <p>{t('foundation.disabled')}</p>
        <button
          onClick={() =>
            onAction(async () => {
              await checkUpdates(platform?.version || '2.0.0-alpha.1');
              setChecked(true);
            })
          }
        >
          {t('foundation.checkNow')}
        </button>
        {checked && <p role="status">{t('foundation.checkResult')}</p>}
      </section>
      {platform && (
        <section className="panel span2">
          <h2>{t('foundation.platform')}</h2>
          <p>
            {platform.os} · {platform.arch} · MyLibrary {platform.version}
          </p>
          <dl>
            {(['cache', 'temporary', 'backups'] as const).map((kind) => (
              <div key={kind}>
                <dt>{t(`foundation.${kind}`)}</dt>
                <dd className="code break" dir="ltr">
                  {platform.paths[kind]}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
