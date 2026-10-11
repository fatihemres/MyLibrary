import { DuplicateChoices } from '../components/DuplicateResolver';
import { requiresDecision, type ImportGroup, type DuplicateDecision } from '../domain/duplicates';
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
  validateBook,
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
  const [groups, setGroups] = useState<ImportGroup[]>([]);
  const [plan, setPlan] = useState<Record<string, DuplicateDecision>>({});
  const [reviewPage, setReviewPage] = useState(0);
  const books = jsonBooks || rows.map((r) => mappedBook(r, mapping));
  const checked = stage ? books.map((book) => ({ errors: validateBook(book) })) : [];
  const invalidGroup = (g: ImportGroup) => g.rows.some((i) => checked[i]?.errors.length);
  const ready = groups.length > 0 && groups.every((g) => invalidGroup(g) || !!plan[g.group]);
  const count = groups
    .filter((g) => !invalidGroup(g) && plan[g.group]?.action !== 'skip')
    .reduce((n, g) => n + g.rows.length, 0);
  const review = async (values: Book[]) => {
    const next = await api<ImportGroup[]>('import_preview', values);
    setGroups(next);
    setReviewPage(0);
    setPlan(
      Object.fromEntries(
        next
          .filter((g) => !requiresDecision(g))
          .map((g) => [g.group, { action: 'separate', reviewed: false }]),
      ),
    );
    setConfirmed(false);
    setStage(true);
  };
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
      const parsed = parseJson(text);
      setJsonBooks(parsed);
      setRows([]);
      setErrors([]);
      await review(parsed);
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
      const count = await api<number>('import_decided', {
        books,
        plan: groups.map((g) => ({
          group: g.group,
          decision: invalidGroup(g) ? { action: 'skip', reviewed: true } : plan[g.group],
        })),
      });
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
            onClick={() => onAction(() => review(books))}
          >
            {t('ui.validatePreview')}{' '}
          </button>
        </section>
      )}
      {stage && (
        <section className="panel">
          <h2>{t('ui.reviewImport')}</h2>
          <p>{t('duplicate.importHelp')}</p>
          {groups.slice(reviewPage * 20, (reviewPage + 1) * 20).map((g) => (
            <section className="panel" key={g.group}>
              <h3>
                {g.book.title || t('data.missing')} ·{' '}
                {t('duplicate.copies', { count: g.rows.length })}
              </h3>
              <small>
                {t('ui.rows')}: {g.rows.map((i) => i + 1).join(', ')}
              </small>
              {invalidGroup(g) ? (
                <div className="alert">
                  <ErrorText message={g.rows.flatMap((i) => checked[i]?.errors || []).join('; ')} />{' '}
                  · {t('duplicate.invalidSkipped')}
                </div>
              ) : (
                <>
                  {!!g.incoming.length && (
                    <p className="notice">
                      {t('duplicate.incomingConflict', { rows: g.incoming.join(', ') })}
                    </p>
                  )}
                  {!!g.incomingWeak.length && (
                    <p className="notice">
                      {t('duplicate.incomingWeak', { rows: g.incomingWeak.join(', ') })}
                    </p>
                  )}
                  {g.incomingCollision && (
                    <p className="notice">{t('duplicate.incomingCollision')}</p>
                  )}
                  <DuplicateChoices
                    book={g.book}
                    report={g.report}
                    value={plan[g.group]}
                    allowSkip
                    onChange={(d) => {
                      setPlan((old) => ({ ...old, [g.group]: d }));
                      setConfirmed(false);
                    }}
                  />
                </>
              )}
            </section>
          ))}
          {groups.length > 20 && (
            <nav className="inline" aria-label={t('duplicate.pages')}>
              <button
                disabled={reviewPage === 0 || busy}
                onClick={() => setReviewPage((p) => p - 1)}
              >
                {t('duplicate.previous')}
              </button>
              <span>
                {t('duplicate.page', {
                  page: reviewPage + 1,
                  total: Math.ceil(groups.length / 20),
                })}
              </span>
              <button
                disabled={(reviewPage + 1) * 20 >= groups.length || busy}
                onClick={() => setReviewPage((p) => p + 1)}
              >
                {t('duplicate.next')}
              </button>
            </nav>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            {t('duplicate.confirmImport', { count })}
          </label>
          <div className="inline">
            <button
              disabled={!confirmed || !ready || !count || busy || !!errors.length}
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
