import { useRef, useState } from 'react';
import { t } from '../i18n';
import { queueScan, scannerTerminator, SCAN_QUEUE_LIMIT, type ScanItem } from '../domain/scanner';
import type { Snapshot } from '../domain/types';
import { Modal } from './common';
import { ScannerInput } from './ScannerInput';
import { BookEditor } from './BookEditor';
import { confirmAction } from './Confirmation';
import { useUnsaved } from './useUnsaved';

export function ScanBooks({
  data,
  onClose,
  onSaved,
}: {
  data: Snapshot;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [batch, setBatch] = useState(false);
  const [queue, setQueue] = useState<ScanItem[]>([]);
  const queueRef = useRef(queue);
  const [editing, setEditing] = useState<ScanItem | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const replace = (next: ScanItem[]) => {
    queueRef.current = next;
    setQueue(next);
  };
  const pending = queue.some((row) => !row.added);
  // While an editor is active its existing native-close confirmation protects both drafts.
  useUnsaved(pending && !editing);
  const close = async () => {
    if (editing || confirming) return;
    setConfirming(true);
    try {
      if (!pending || (await confirmAction(t('scanner.discard')))) onClose();
    } finally {
      setConfirming(false);
    }
  };
  const terminator = scannerTerminator(
    data.settings.find((s) => s.key === 'scanner_terminator')?.value,
  );
  return (
    <Modal title={t('scanner.books')} wide onClose={() => void close()}>
      <div className="dialog-body">
        <p>{t('scanner.help')}</p>
        <fieldset disabled={queue.length > 0 || confirming} className="inline">
          <legend>{t('scanner.mode')}</legend>
          <label>
            <input
              type="radio"
              name="scan-mode"
              checked={!batch}
              onChange={() => setBatch(false)}
            />
            {t('scanner.single')}
          </label>
          <label>
            <input type="radio" name="scan-mode" checked={batch} onChange={() => setBatch(true)} />
            {t('scanner.batch')}
          </label>
        </fieldset>
        {!editing && !confirming && (batch || queue.length === 0) && (
          <ScannerInput
            terminator={terminator}
            onScan={(raw) => {
              try {
                replace(queueScan(queueRef.current, raw, terminator));
                setError('');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'scanner.invalid');
              }
            }}
          />
        )}
        {error && <p role="alert">{t(error, { count: SCAN_QUEUE_LIMIT })}</p>}
        <p role="status">{t('scanner.count', { count: queue.length })}</p>
        <ol className="scan-queue">
          {queue.map((row) => (
            <li key={row.id} className="panel">
              <div>
                <strong>{row.isbn?.isbn13 || row.raw || t('scanner.empty')}</strong>
                {row.aim && (
                  <small className="block">{t('scanner.aim', { prefix: row.aim })}</small>
                )}
                <p>{t(row.added ? 'scanner.added' : row.error || 'scanner.pending')}</p>
                {row.isbn &&
                  queue.filter((other) => other.isbn?.isbn13 === row.isbn?.isbn13).length > 1 && (
                    <small>{t('scanner.repeated')}</small>
                  )}
              </div>
              <div className="inline wrap">
                <button
                  type="button"
                  disabled={!row.isbn || row.added || !!editing || confirming}
                  onClick={() => setEditing(row)}
                >
                  {t('scanner.review')}
                </button>
                <button
                  type="button"
                  disabled={!!editing || confirming}
                  onClick={() => replace(queueRef.current.filter((item) => item.id !== row.id))}
                >
                  {t('scanner.remove')}
                </button>
              </div>
            </li>
          ))}
        </ol>
        {!queue.length && <p className="muted">{t('scanner.emptyQueue')}</p>}
      </div>
      <footer>
        <button type="button" disabled={!!editing || confirming} onClick={() => void close()}>
          {t('scanner.close')}
        </button>
      </footer>
      {editing?.isbn && (
        <BookEditor
          key={editing.id}
          seed={editing.isbn}
          protectSession
          data={data}
          quick={false}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await onSaved();
            replace(
              queueRef.current.map((row) =>
                row.id === editing.id ? { ...row, added: true } : row,
              ),
            );
          }}
        />
      )}
    </Modal>
  );
}
