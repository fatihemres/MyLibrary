import { useState } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { Download, Upload, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import {
  exportCsv,
  importFields,
  mappedBook,
  parseCsv,
  parseJson,
  preview,
} from '../services/transfer';
import { today, type Book, type Snapshot } from '../domain/types';
import { Field } from '../components/common';
export async function exportBooks(books: Book[], format: 'csv' | 'json', data?: Snapshot) {
  const path = await save({
    defaultPath: `mylibrary-${today()}.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  });
  if (path)
    await api('write_text', {
      path,
      text:
        format === 'csv'
          ? exportCsv(books)
          : JSON.stringify(
              {
                format: 'MyLibrary catalogue',
                version: 1,
                books: books.map((b) => {
                  const location: string[] = [];
                  let id = b.location_id;
                  const seen = new Set<string>();
                  while (id && !seen.has(id)) {
                    seen.add(id);
                    const item = data?.locations.find((l) => l.id === id);
                    if (!item) break;
                    location.unshift(item.name);
                    id = item.parent_id || '';
                  }
                  return {
                    ...b,
                    transfer: {
                      location,
                      fields: data?.fields.filter((f) => f.id in b.custom) || [],
                    },
                  };
                }),
              },
              null,
              2,
            ),
    });
}
export function DataPage({
  section,
  data,
  onAction,
  onReload,
}: {
  section: string;
  data: Snapshot;
  onAction: (f: () => Promise<unknown>) => void;
  onReload: () => Promise<void>;
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
      filters: [{ name: 'Library data', extensions: ['csv', 'json'] }],
    });
    if (typeof path !== 'string') return;
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
      setMessage(`Imported ${count} copies. Existing books were preserved.`);
      setRows([]);
      setJsonBooks(null);
      setStage(false);
      setConfirmed(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  };
  return section === 'Backup' ? (
    <>
      <div className="hero-panel">
        <ShieldCheck size={34} />
        <div>
          <h2>A safe copy of your library.</h2>
          <p>
            Portable archives include the SQLite database, covers, attachments and settings. Keep a
            copy on another drive for protection from disk failure.
          </p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>Create a backup</h2>
          <p>
            Uses SQLite’s online backup API for a consistent snapshot, including while the
            application is open.
          </p>
          <button
            className="primary"
            onClick={() =>
              onAction(async () => {
                const path = await save({
                  defaultPath: `mylibrary-backup-${today()}.zip`,
                  filters: [{ name: 'MyLibrary backup', extensions: ['zip'] }],
                });
                if (path) {
                  await api('backup', { path });
                  setMessage(`Backup saved to ${path}`);
                }
              })
            }
          >
            <Download size={17} />
            Save backup archive…
          </button>
          <h3>Automatic backups</h3>
          <Field label="While MyLibrary is open">
            <select
              value={data.settings.find((s) => s.key === 'backup_days')?.value || '0'}
              onChange={(e) => onAction(() => api('settings', { backup_days: e.target.value }))}
            >
              <option value="0">Off</option>
              <option value="1">Daily</option>
              <option value="7">Weekly</option>
              <option value="30">Every 30 days</option>
            </select>
          </Field>
          <p className="muted">
            Stored in the backups folder. Old backups are never removed automatically.
          </p>
          <button onClick={() => onAction(() => api('auto_backup'))}>
            Check scheduled backup now
          </button>
        </section>
        <section className="panel">
          <h2>Restore a backup</h2>
          <p>
            Restoring replaces the current library. The archive is validated first, then a mandatory
            safety backup preserves the current library.
          </p>
          <button
            onClick={() =>
              onAction(async () => {
                const path = await open({
                  multiple: false,
                  filters: [{ name: 'MyLibrary backup', extensions: ['zip'] }],
                });
                if (typeof path === 'string') {
                  setRestorePath(path);
                  setRestoreConfirm('');
                }
              })
            }
          >
            <Upload size={17} />
            Choose backup…
          </button>
          {restorePath && (
            <div className="notice">
              <p className="break">{restorePath}</p>
              <Field label="Type RESTORE to confirm replacing your current library">
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
                      setMessage(
                        `Restore completed. Your previous library is preserved at ${safety}`,
                      );
                      setRestorePath('');
                      await onReload();
                    } finally {
                      setBusy(false);
                    }
                  })
                }
              >
                Validate & restore
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
      <div className="two-col">
        <section className="panel">
          <h2>Bring your books home</h2>
          <p>
            Import CSV or JSON. Map columns, review errors and duplicates, then confirm. Each
            imported row becomes a separate physical copy; existing records are never overwritten.
          </p>
          <button className="primary" onClick={() => onAction(read)}>
            <Upload size={16} />
            Choose import file…
          </button>
          <small className="block">
            CSV: UTF-8, one book per row; multiple names/tags separated with semicolons. JSON
            catalogue exports contain book fields, not media or related notes/loans. Use Backup for
            a complete transfer.
          </small>
        </section>
        <section className="panel">
          <h2>Export your catalogue</h2>
          <p>
            Export all active books here, or use Library to export selected or filtered results.
          </p>
          <div className="inline">
            <button onClick={() => onAction(() => exportBooks(data.books, 'csv', data))}>
              <Download size={16} />
              CSV
            </button>
            <button onClick={() => onAction(() => exportBooks(data.books, 'json', data))}>
              JSON
            </button>
          </div>
          <small className="block">
            Exports use a new filename to avoid overwriting existing files. JSON preserves nested
            book fields; CSV is a portable catalogue subset.
          </small>
        </section>
      </div>
      {errors.length > 0 && <div className="alert">{errors.join('\n')}</div>}
      {!!rows.length && !stage && (
        <section className="panel">
          <h2>Map your columns</h2>
          <p>{rows.length} rows found. Unmapped columns will be ignored.</p>
          <div className="form-grid">
            {Object.entries(mapping).map(([column, value]) => (
              <Field
                key={column}
                label={`${column} · e.g. ${rows[0][column]?.slice(0, 50) || 'empty'}`}
              >
                <select
                  value={value}
                  onChange={(e) => setMapping({ ...mapping, [column]: e.target.value })}
                >
                  <option value="">Ignore</option>
                  {importFields.map((f) => (
                    <option key={f}>{f}</option>
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
            Validate & preview
          </button>
        </section>
      )}
      {stage && (
        <section className="panel">
          <h2>Review import</h2>
          <p>
            {checked.length} rows · {checked.filter((r) => r.errors.length).length} invalid ·{' '}
            {checked.filter((r) => r.duplicates.length).length} possible duplicates · {valid.length}{' '}
            ready
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
            Skip likely duplicates
          </label>
          <div className="table-scroll import-preview">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Title</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {checked.slice(0, 500).map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.book.title || '(missing)'}</td>
                    <td>
                      {r.errors.length
                        ? r.errors.join('; ')
                        : r.duplicates.length
                          ? 'Possible duplicate — separate copy'
                          : 'Ready'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checked.length > 500 && (
            <p>Showing the first 500 rows; all {checked.length} rows were validated.</p>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Import {valid.length} valid rows; skip invalid rows
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
              {busy ? 'Importing…' : 'Confirm import'}
            </button>
            <button
              onClick={() => {
                setStage(false);
                setConfirmed(false);
                if (jsonBooks) setJsonBooks(null);
              }}
            >
              Back / cancel
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
