import { FoundationSettings } from '../components/FoundationSettings';
import { t, label as trLabel } from '../i18n';
import { useState } from 'react';
import type { Snapshot } from '../domain/types';
import { locationName } from '../domain/types';
import { Field } from '../components/common';
import type { RecordRequest } from '../components/RecordDialog';
import { api } from '../services/api';
export function Settings({
  data,
  onAction,
  onRecord,
}: {
  data: Snapshot;
  onAction: (f: () => Promise<unknown>) => void;
  onRecord: (r: RecordRequest) => void;
}) {
  const prefs = Object.fromEntries(data.settings.map((s) => [s.key, s.value]));
  const [currency, setCurrency] = useState(prefs.currency || 'TRY');
  const [language, setLanguage] = useState(prefs.language || '');
  const [result, setResult] = useState('');
  return (
    <>
      <FoundationSettings onAction={onAction} />
      <div className="two-col">
        <section className="panel">
          <h2>{t('ui.generalAppearance')}</h2>
          <Field label={t('ui.theme')}>
            <select
              value={prefs.theme || 'system'}
              onChange={(e) => onAction(() => api('settings', { theme: e.target.value }))}
            >
              <option value="system">{t('ui.system')}</option>
              <option value="light">{t('ui.light')}</option>
              <option value="dark">{t('ui.dark')}</option>
            </select>
          </Field>
          <Field label={t('ui.defaultBookLanguage')}>
            <input value={language} onChange={(e) => setLanguage(e.target.value)} />
          </Field>
          <Field label={t('ui.defaultCurrency')}>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </Field>
          <button onClick={() => onAction(() => api('settings', { language, currency }))}>
            {t('ui.saveDefaults')}{' '}
          </button>
          <Field label={t('ui.defaultLibraryLocation')}>
            <select
              value={prefs.default_location || ''}
              onChange={(e) =>
                onAction(() => api('settings', { default_location: e.target.value }))
              }
            >
              <option value="">{t('ui.unassigned')}</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationName(l.id, data.locations)}
                </option>
              ))}
            </select>
          </Field>
          <p className="muted">{t('foundation.languageHelp')} </p>
        </section>
        <section className="panel">
          <h2>{t('ui.yourDataStaysHere')}</h2>
          <p className="code break">{data.dataDir}</p>
          <p>
            {t('ui.databaseLibrarySqlite3')} <br />
            {t('ui.imagesCovers')} <br />
            {t('ui.filesAttachments')} <br />
            {t('ui.safetyArchivesBackups')}{' '}
          </p>
          <button onClick={() => onAction(() => api('open_folder'))}>
            {t('ui.openDataFolder')}
          </button>
          <h3>{t('ui.databaseMaintenance')}</h3>
          <p>{t('ui.checkTheDatabaseAndForeignKeyRelationshipsWithoutChangingYourRecords')}</p>
          <button onClick={() => onAction(async () => setResult(await api<string>('integrity')))}>
            {t('ui.runIntegrityCheck')}{' '}
          </button>
          {result && <p role="status">{result}</p>}
          <p className="muted">
            {t(
              'ui.deletedBooksAreRetainedInTrashAutomaticPermanentPurgingIsDeliberatelyDisabled',
            )}{' '}
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t('ui.customFieldsAlt')}</h2>
            <p>{t('ui.makeRoomForTheDetailsThatMatterToYou')}</p>
          </div>
          <button className="primary" onClick={() => onRecord({ type: 'custom_fields' })}>
            {t('ui.createField')}{' '}
          </button>
        </div>
        {data.fields.map((f) => (
          <div className="list-row" key={f.id}>
            <strong>{f.name}</strong>
            <span>{trLabel(f.kind || 'text')}</span>
            <span>{String(f.extra?.options || '')}</span>
            <button onClick={() => onRecord({ type: 'custom_fields', entity: f })}>
              {t('ui.edit')}
            </button>
          </div>
        ))}
        {!data.fields.length && (
          <p className="muted">{t('ui.tryRecommendedByBoughtInCityOrStorageBox')}</p>
        )}
      </section>
      <section className="panel">
        <h2>{t('foundation.version', { version: '2.0.0-alpha.1' })}</h2>
        <p>
          {t(
            'ui.aPrivateCatalogueForAPhysicalCollectionBuiltWithTauriReactTypescriptAndSqlite',
          )}{' '}
        </p>
        <p>
          {t(
            'ui.noAccountsAnalyticsRemoteLoggingOrBackgroundNetworkRequestsOptionalIsbnLookupContactsOpenLibraryOnlyWhenRequestedLocalBackupsAreNotEncryptedStoreThemSomewherePrivate',
          )}{' '}
        </p>
      </section>
    </>
  );
}
