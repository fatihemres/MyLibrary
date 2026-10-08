import { t, label as trLabel } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './common';

type Request = { message: string; resolve: (approved: boolean) => void };
let receive: ((request: Request) => void) | undefined;

/** Fail closed if the application is unavailable; never treat a Promise as approval. */
export function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (receive) receive({ message, resolve });
    else resolve(false);
  });
}

export function ConfirmationHost() {
  const [requests, setRequests] = useState<Request[]>([]);
  const cancel = useRef<HTMLButtonElement>(null);
  const request = requests[0];
  useEffect(() => {
    cancel.current?.focus();
  }, [request]);
  useEffect(() => {
    receive = (request) => setRequests((current) => [...current, request]);
    return () => {
      receive = undefined;
    };
  }, []);
  if (!request) return null;
  const answer = (approved: boolean) => {
    request.resolve(approved);
    setRequests((current) => current.slice(1));
  };
  return (
    <Modal title={t('ui.pleaseConfirm')} onClose={() => answer(false)}>
      <p>{trLabel(request.message)}</p>
      <footer className="modal-footer">
        <button ref={cancel} autoFocus onClick={() => answer(false)}>
          {t('ui.cancel')}{' '}
        </button>
        <button className="primary" onClick={() => answer(true)}>
          {t('ui.continue')}{' '}
        </button>
      </footer>
    </Modal>
  );
}
