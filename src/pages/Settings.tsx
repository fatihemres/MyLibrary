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
      <div className="two-col">
        <section className="panel">
          <h2>General & appearance</h2>
          <Field label="Theme">
            <select
              value={prefs.theme || 'system'}
              onChange={(e) => onAction(() => api('settings', { theme: e.target.value }))}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
          <Field label="Default book language">
            <input value={language} onChange={(e) => setLanguage(e.target.value)} />
          </Field>
          <Field label="Default currency">
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </Field>
          <button onClick={() => onAction(() => api('settings', { language, currency }))}>
            Save defaults
          </button>
          <Field label="Default library location">
            <select
              value={prefs.default_location || ''}
              onChange={(e) =>
                onAction(() => api('settings', { default_location: e.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {data.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {locationName(l.id, data.locations)}
                </option>
              ))}
            </select>
          </Field>
          <p className="muted">
            The interface is in English. Default book language applies to newly added books.
          </p>
        </section>
        <section className="panel">
          <h2>Your data stays here</h2>
          <p className="code break">{data.dataDir}</p>
          <p>
            Database: library.sqlite3
            <br />
            Images: covers/
            <br />
            Files: attachments/
            <br />
            Safety archives: backups/
          </p>
          <button onClick={() => onAction(() => api('open_folder'))}>Open data folder</button>
          <h3>Database maintenance</h3>
          <p>Check the database and foreign-key relationships without changing your records.</p>
          <button onClick={() => onAction(async () => setResult(await api<string>('integrity')))}>
            Run integrity check
          </button>
          {result && <p role="status">{result}</p>}
          <p className="muted">
            Deleted books are retained in Trash. Automatic permanent purging is deliberately
            disabled.
          </p>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Custom fields</h2>
            <p>Make room for the details that matter to you.</p>
          </div>
          <button className="primary" onClick={() => onRecord({ type: 'custom_fields' })}>
            Create field
          </button>
        </div>
        {data.fields.map((f) => (
          <div className="list-row" key={f.id}>
            <strong>{f.name}</strong>
            <span>{f.kind}</span>
            <span>{String(f.extra?.options || '')}</span>
            <button onClick={() => onRecord({ type: 'custom_fields', entity: f })}>Edit</button>
          </div>
        ))}
        {!data.fields.length && (
          <p className="muted">Try “Recommended by”, “Bought in city”, or “Storage box”.</p>
        )}
      </section>
      <section className="panel">
        <h2>MyLibrary 1.0.0</h2>
        <p>
          A private catalogue for a physical collection. Built with Tauri, React, TypeScript and
          SQLite.
        </p>
        <p>
          No accounts, analytics, remote logging or background network requests. Optional ISBN
          lookup contacts Open Library only when requested. Local backups are not encrypted; store
          them somewhere private.
        </p>
      </section>
    </>
  );
}
