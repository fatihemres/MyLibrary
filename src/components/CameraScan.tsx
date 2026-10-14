import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { t } from '../i18n';
import { CAMERA_WIDTH, CAMERA_HEIGHT } from '../domain/camera';
import type { Isbn } from '../domain/isbn';
import { CameraDecoder } from '../services/cameraDecoder';
import { CameraSession } from '../services/cameraSession';
import { Modal } from './common';

export function CameraScan({
  onClose,
  onAccepted,
}: {
  onClose(): void;
  onAccepted(isbn: Isbn): void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const session = useRef<CameraSession | undefined>(undefined);
  const callbacks = useRef({ onClose, onAccepted });
  callbacks.current = { onClose, onAccepted };
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('camera.loading');
  useEffect(() => {
    const preview = video.current!;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const token =
      window.isSecureContext && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : '';
    const current = new CameraSession(new CameraDecoder(), {
      supported: () => !!token && !!navigator.mediaDevices?.getUserMedia && !!context,
      authorize: (active) =>
        token ? invoke('camera_session', { token, active }) : Promise.resolve(),
      capture: () =>
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        }),
      attach: async (stream) => {
        preview.srcObject = stream;
        await preview.play();
      },
      clear: () => {
        preview.pause();
        preview.srcObject = null;
        canvas.width = 0;
        canvas.height = 0;
      },
      frame: () => {
        if (preview.readyState < 2 || !preview.videoWidth || !preview.videoHeight) return;
        const scale = Math.min(
          1,
          CAMERA_WIDTH / preview.videoWidth,
          CAMERA_HEIGHT / preview.videoHeight,
        );
        canvas.width = Math.max(1, Math.floor(preview.videoWidth * scale));
        canvas.height = Math.max(1, Math.floor(preview.videoHeight * scale));
        context!.drawImage(preview, 0, 0, canvas.width, canvas.height);
        return context!.getImageData(0, 0, canvas.width, canvas.height);
      },
      schedule: (callback, delay) => setTimeout(callback, delay),
      cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      status: setStatus,
      accepted: (isbn) => callbacks.current.onAccepted(isbn),
    });
    session.current = current;
    const hide = () => {
      current.stop();
      callbacks.current.onClose();
    };
    const visibility = () => {
      if (document.hidden) hide();
    };
    window.addEventListener('pagehide', hide);
    document.addEventListener('visibilitychange', visibility);
    void current.start();
    return () => {
      current.stop();
      window.removeEventListener('pagehide', hide);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [attempt]);
  const close = () => {
    session.current?.stop();
    onClose();
  };
  const failed = ![
    'camera.loading',
    'camera.requesting',
    'camera.scanning',
    'camera.invalid',
  ].includes(status);
  return (
    <Modal title={t('camera.title')} onClose={close}>
      <div className="dialog-body camera-scan">
        <p>{t('camera.help')}</p>
        <video ref={video} muted playsInline aria-label={t('camera.preview')} />
        <p role="status" aria-live="polite">
          {t(status)}
        </p>
        {failed && (
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            {t('camera.retry')}
          </button>
        )}
      </div>
      <footer>
        <button type="button" onClick={close}>
          {t('camera.cancel')}
        </button>
      </footer>
    </Modal>
  );
}
