import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { isScanTerminator, SCAN_RAW_LIMIT, type Terminator } from '../domain/scanner';
import { Field } from './common';

/** Keyboard-wedge input: handlers belong only to this visible, focused input. */
export function ScannerInput({
  terminator,
  onScan,
}: {
  terminator: Terminator;
  onScan: (raw: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    // Modal.showModal() and the previous editor's focus restoration run in effects.
    // Focus after those finish, both on initial open and when returning to the queue.
    const frame = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  const submit = () => {
    if (!value) return;
    onScan(value);
    setValue('');
    input.current?.focus();
  };
  return (
    <section className="scanner-input">
      <Field label={t('scanner.input')}>
        <input
          ref={input}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          value={value}
          maxLength={SCAN_RAW_LIMIT + 1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setValue(e.target.value.slice(0, SCAN_RAW_LIMIT + 1))}
          onPaste={(e) => {
            // Do not let native maxLength silently turn a long paste into a valid prefix.
            e.preventDefault();
            const el = e.currentTarget;
            const next =
              value.slice(0, el.selectionStart ?? 0) +
              e.clipboardData.getData('text') +
              value.slice(el.selectionEnd ?? value.length);
            setValue(next.slice(0, SCAN_RAW_LIMIT + 1));
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
            if (isScanTerminator(e.key, terminator) && value) {
              e.preventDefault();
              e.stopPropagation();
              submit();
            } else if (e.key === 'Enter') {
              e.preventDefault(); // Never submit a surrounding editor form.
            }
          }}
        />
      </Field>
      <p className="muted" role="status">
        {t(focused ? 'scanner.ready' : 'scanner.paused')}
      </p>
      <small>{t('scanner.suffixHelp', { suffix: t(`scanner.${terminator}`) })}</small>
      <button type="button" disabled={!value} onClick={submit}>
        {t('scanner.capture')}
      </button>
    </section>
  );
}
