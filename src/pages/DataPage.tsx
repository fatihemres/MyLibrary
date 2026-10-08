import { t, label as trLabel } from '../i18n';
import { useState } from 'react';
import { chooseFile as open, chooseDestination as save } from '../services/platform';
import { Download, Upload, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import {
  exportCsv,
  exportJson,
  importFields,
  mappedBook,
  parseCsv,
  parseJson,
  preview,
} from '../services/transfer';
import { today, type Book, type Snapshot } from '../domain/types';
import { ErrorText } from '../components/ErrorText';
import { Field } from '../components/common';
export async function exportBooks(books: Book[], format: 'csv' | 'json', data?: Snapshot) {
  const path = await save({
    defaultPath: `mylibrary-${today()}.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  });
  if (path)
    await api('write_text', {
      path,
      text: format === 'csv' ? exportCsv(books, data) : exportJson(books, data),
    });
}
export function DataPage({
  section,
  data,
  onAction,
  onReload,
  onNavigate,
}: {
  section: string;
  data: Snapshot;
  onAction: (f: () => Promise<unknown>) => void;
  onReload: () => Promise<void>;
  onNavigate: (route: string) => void;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [jsonBooks, setJsonBooks] = useState<Book[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [stage, setStage] = useState(false);
  const [restorePath, setRestorePath] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const books = jsonBooks || rows.map((r) => mappedBook(r, mapping));
  const checked = stage ? preview(books, data.books) : [];
  const valid = checked.filter(
    (r) => !r.errors.length && (!skipDuplicates || !r.duplicates.length),
  );
  const read = async () => {
    const path = await open({
      multiple: false,
      filters: [
        { name: t('ui.libraryRecordsCsvJson'), extensions: ['csv', 'json'] },
        { name: t('ui.allFiles'), extensions: ['*'] },
      ],
    });
    if (typeof path !== 'string') return;
    setRows([]);
    setJsonBooks(null);
    setStage(false);
    setErrors([]);
    if (path.toLowerCase().endsWith('.zip'))
      throw new Error(
        'This appears to be a MyLibrary backup. Use Restore Backup instead. Select the ZIP directly; do not extract it.',
      );
    const text = await api<string>('read_text', { path });
    setConfirmed(false);
    setStage(false);
    setMessage('');
    if (path.toLowerCase().endsWith('.json')) {
      setJsonBooks(parseJson(text));
      setRows([]);
      setErrors([]);
      setStage(true);
    } else {
      const parsed = parseCsv(text);
      setRows(parsed.rows);
      setJsonBooks(null);
      setErrors(parsed.errors);
      setMapping(
        Object.fromEntries(
          parsed.columns.map((c) => [
            c,
            importFields.includes(c.toLowerCase().replaceAll(' ', '_') as never)
              ? c.toLowerCase().replaceAll(' ', '_')
              : '',
          ]),
        ),
      );
    }
  };
  const importNow = async () => {
    setBusy(true);
    try {
      const count = await api<number>(
        'import',
        valid.map((r) => r.book),
      );
      setMessage(t('data.imported', { count }));
      setRows([]);
      setJsonBooks(null);
      setStage(false);
      setConfirmed(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  };
  return ['Create Backup', 'Restore Backup'].includes(section) ? (
    <>
      <div className="hero-panel">
        <ShieldCheck size={34} />
        <div>
          <h2>{t('ui.aSafeCopyOfYourLibrary')}</h2>
          <p>
            {t(
              'ui.backupArchivesPreserveYourCompleteLibraryCoversAttachmentsAndSettingsKeepACopyOnAnotherDriveForProtectionFromDiskFailure',
            )}{' '}
          </p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel" hidden={section !== 'Create Backup'}>
          <h2>{t('ui.createBackup')}</h2>
          <p>{t('ui.createsACompleteRecoveryArchiveIncludingWhileTheApplicationIsOpen')}</p>
          <button
            className="primary"
            onClick={() =>
              onAction(async () => {
                const path = await save({
                  defaultPath: `mylibrary-backup-${today()}.zip`,
                  filters: [{ name: t('ui.mylibraryBackup'), extensions: ['zip'] }],
                });
                if (path) {
                  await api('backup', { path });
                  setMessage(t('data.backupSaved', { path }));
                }
              })
            }
          >
            <Download size={17} />
            {t('ui.createBackupAlt')}{' '}
          </button>
          <h3>{t('ui.automaticBackups')}</h3>
          <Field label={t('ui.whileMylibraryIsOpen')}>
            <select
              value={data.settings.find((s) => s.key === 'backup_days')?.value || '0'}
              onChange={(e) => onAction(() => api('settings', { backup_days: e.target.value }))}
            >
              <option value="0">{t('ui.off')}</option>
              <option value="1">{t('ui.daily')}</option>
              <option value="7">{t('ui.weekly')}</option>
              <option value="30">{t('ui.every30Days')}</option>
            </select>
          </Field>
          <p className="muted">
            {t('ui.storedInTheBackupsFolderOldBackupsAreNeverRemovedAutomatically')}{' '}
          </p>
          <button onClick={() => onAction(() => api('auto_backup'))}>
            {t('ui.checkScheduledBackupNow')}{' '}
          </button>
        </section>
        <section className="panel" hidden={section !== 'Restore Backup'}>
          <h2>{t('ui.restoreBackup')}</h2>
          <p>
            {t(
              'ui.restoringReplacesTheCurrentLibraryTheArchiveIsValidatedFirstThenAMandatorySafetyBackupPreservesTheCurrentLibrarySelectTheOriginalZipDirectlyDoNotExtractItOrSelectManifestJson',
            )}{' '}
          </p>
          <button
            onClick={() =>
              onAction(async () => {
                const path = await open({
                  multiple: false,
                  filters: [{ name: t('ui.mylibraryBackup'), extensions: ['zip'] }],
                });
                if (typeof path === 'string') {
                  setRestorePath(path);
                  setRestoreConfirm('');
                }
              })
            }
          >
            <Upload size={17} />
            {t('ui.chooseBackupZip')}{' '}
          </button>
          {restorePath && (
            <div className="notice">
              <p className="break">{restorePath}</p>
              <Field label={t('ui.typeRestoreToConfirmReplacingYourCurrentLibrary')}>
                <input value={restoreConfirm} onChange={(e) => setRestoreConfirm(e.target.value)} />
              </Field>
              <button
                className="danger"
                disabled={restoreConfirm !== 'RESTORE' || busy}
                onClick={() =>
                  onAction(async () => {
                    setBusy(true);
                    try {
                      const safety = await api<string>('restore', { path: restorePath });
                      setMessage(t('data.restored', { path: safety }));
                      setRestorePath('');
                      await onReload();
                    } finally {
                      setBusy(false);
                    }
                  })
                }
              >
                {t('ui.validateRestore')}{' '}
              </button>
            </div>
          )}
        </section>
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
    </>
  ) : (
    <>
      <div className="notice">
        {t('ui.dataExchangeAddsCatalogueRecordsToALibraryToRecoverAFullLibraryFromABackupZipUse')}{' '}
        <button onClick={() => onNavigate('Restore Backup')}>{t('ui.restoreBackup')}</button>.
      </div>
      <div className="two-col">
        <section className="panel" hidden={section !== 'Import CSV/JSON'}>
          <h2>{t('ui.importCsvJson')}</h2>
          <p>
            {t(
              'ui.importCsvOrJsonMapColumnsReviewErrorsAndDuplicatesThenConfirmEachImportedRowBecomesASeparatePhysicalCopyExistingRecordsAreNeverOverwritten',
            )}{' '}
          </p>
          <button className="primary" onClick={() => onAction(read)}>
            <Upload size={16} />
            {t('ui.importCsvJsonAlt')}{' '}
          </button>
          <small className="block">
            {t(
              'ui.csvUtf8OneBookPerRowMultipleNamesTagsSeparatedWithSemicolonsJsonCatalogueExportsContainBookFieldsNotMediaOrRelatedNotesLoansUseRestoreBackupForACompleteTransfer',
            )}{' '}
          </small>
        </section>
        <section className="panel" hidden={section !== 'Export CSV/JSON'}>
          <h2>{t('ui.exportCsvJson')}</h2>
          <p>{t('ui.exportAllActiveBooksHereOrUseLibraryToExportSelectedOrFilteredResults')} </p>
          <div className="inline">
            <button onClick={() => onAction(() => exportBooks(data.books, 'csv', data))}>
              <Download size={16} />
              {t('ui.csv')}{' '}
            </button>
            <button onClick={() => onAction(() => exportBooks(data.books, 'json', data))}>
              {t('ui.json')}{' '}
            </button>
          </div>
          <small className="block">
            {t(
              'ui.exportsUseANewFilenameToAvoidOverwritingExistingFilesJsonPreservesNestedBookFieldsCsvIsAPortableCatalogueSubset',
            )}{' '}
          </small>
        </section>
      </div>
      {errors.length > 0 && <div className="alert">{errors.join('\n')}</div>}
      {!!rows.length && !stage && (
        <section className="panel">
          <h2>{t('ui.mapYourColumns')}</h2>
          <p>
            {rows.length} {t('ui.rowsFoundUnmappedColumnsWillBeIgnored')}
          </p>
          <div className="form-grid">
            {Object.entries(mapping).map(([column, value]) => (
              <Field
                key={column}
                label={t('data.columnExample', {
                  column,
                  example: rows[0][column]?.slice(0, 50) || t('data.empty'),
                })}
              >
                <select
                  value={value}
                  onChange={(e) => setMapping({ ...mapping, [column]: e.target.value })}
                >
                  <option value="">{t('ui.ignore')}</option>
                  {importFields.map((f) => (
                    <option key={f} value={f}>
                      {trLabel(f.replaceAll('_', ' '))}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <button
            className="primary"
            disabled={!Object.values(mapping).includes('title') || !!errors.length}
            onClick={() => {
              setStage(true);
              setConfirmed(false);
            }}
          >
            {t('ui.validatePreview')}{' '}
          </button>
        </section>
      )}
      {stage && (
        <section className="panel">
          <h2>{t('ui.reviewImport')}</h2>
          <p>
            {checked.length} {t('ui.rows')} {checked.filter((r) => r.errors.length).length}{' '}
            {t('ui.invalid')} {checked.filter((r) => r.duplicates.length).length}{' '}
            {t('ui.possibleDuplicates')} {valid.length} {t('ui.readyAlt')}{' '}
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => {
                setSkipDuplicates(e.target.checked);
                setConfirmed(false);
              }}
            />
            {t('ui.skipLikelyDuplicates')}{' '}
          </label>
          <div className="table-scroll import-preview">
            <table>
              <thead>
                <tr>
                  <th>{t('ui.row')}</th>
                  <th>{t('ui.title')}</th>
                  <th>{t('ui.review')}</th>
                </tr>
              </thead>
              <tbody>
                {checked.slice(0, 500).map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.book.title || t('data.missing')}</td>
                    <td>
                      {r.errors.length ? (
                        <ErrorText message={r.errors.join('; ')} />
                      ) : r.duplicates.length ? (
                        t('ui.possibleDuplicateSeparateCopy')
                      ) : (
                        t('ui.ready')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checked.length > 500 && (
            <p>
              {t('ui.showingTheFirst500RowsAll')} {checked.length} {t('ui.rowsWereValidated')}
            </p>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {t('ui.import')} {valid.length} {t('ui.validRowsSkipInvalidRows')}{' '}
            {skipDuplicates
              ? ' and duplicates'
              : '; intentional duplicates will be separate copies'}
            .
          </label>
          <div className="inline">
            <button
              disabled={!confirmed || !valid.length || busy || !!errors.length}
              className="primary"
              onClick={() => onAction(importNow)}
            >
              {busy ? t('ui.importing') : t('ui.confirmImport')}
            </button>
            <button
              onClick={() => {
                setStage(false);
                setConfirmed(false);
                if (jsonBooks) setJsonBooks(null);
              }}
            >
              {t('ui.backCancel')}{' '}
            </button>
          </div>
        </section>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
    </>
  );
}
