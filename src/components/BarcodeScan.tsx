import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { t } from '../i18n';
import { scannerPayload, scannerTerminator } from '../domain/scanner';
import type { Snapshot } from '../domain/types';
import { Modal } from './common';
import { ScannerInput } from './ScannerInput';

export function BarcodeScan({
  data,
  onApply,
  onOpenChange,
}: {
  data: Snapshot;
  onApply: (barcode: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const change = (value: boolean) => {
    setOpen(value);
    onOpenChange(value);
  };
  const terminator = scannerTerminator(
    data.settings.find((s) => s.key === 'scanner_terminator')?.value,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('');
          change(true);
        }}
      >
        <ScanLine size={16} />
        {t('scanner.copyAction')}
      </button>
      {open && (
        <Modal title={t('scanner.copyAction')} onClose={() => change(false)}>
          <div className="dialog-body">
            <p>{t('scanner.copyHelp')}</p>
            <ScannerInput
              terminator={terminator}
              onScan={(raw) => {
                try {
                  onApply(scannerPayload(raw, terminator).payload);
                  change(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'scanner.invalid');
                }
              }}
            />
            {error && <p role="alert">{t(error)}</p>}
          </div>
          <footer>
            <button type="button" onClick={() => change(false)}>
              {t('ui.cancel')}
            </button>
          </footer>
        </Modal>
      )}
    </>
  );
}
