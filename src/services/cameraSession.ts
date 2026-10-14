import { CAMERA_INTERVAL, cameraIsbn } from '../domain/camera';
import type { Isbn } from '../domain/isbn';
import type { CameraBarcodeDecoder } from './cameraDecoder';

export interface CameraPorts {
  supported(): boolean;
  authorize(active: boolean): Promise<void>;
  capture(): Promise<MediaStream>;
  attach(stream: MediaStream): Promise<void>;
  clear(): void;
  frame(): ImageData | undefined;
  schedule(callback: () => void, delay: number): unknown;
  cancel(handle: unknown): void;
  status(key: string): void;
  accepted(isbn: Isbn): void;
}
export function captureError(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'camera.denied';
    case 'NotFoundError':
      return 'camera.noDevice';
    case 'NotReadableError':
      return 'camera.busy';
    case 'OverconstrainedError':
      return 'camera.constraints';
    default:
      return 'camera.captureError';
  }
}
// One instance per explicit opening/retry. No navigator access or persistence authority.
export class CameraSession {
  private stopped = false;
  private started = false;
  private stream?: MediaStream;
  private timer?: unknown;
  private listeners: { track: MediaStreamTrack; ended: () => void }[] = [];
  private lastStatus = '';
  constructor(
    private readonly decoder: CameraBarcodeDecoder,
    private readonly ports: CameraPorts,
  ) {}
  private status(key: string) {
    if (!this.stopped && key !== this.lastStatus) {
      this.lastStatus = key;
      this.ports.status(key);
    }
  }
  private fail(key: string) {
    if (this.stopped) return;
    this.status(key);
    this.stop();
  }
  async start() {
    if (this.started || this.stopped) return;
    this.started = true;
    if (!this.ports.supported()) {
      this.fail('camera.unsupported');
      return;
    }
    this.status('camera.loading');
    try {
      await this.decoder.initialize();
    } catch {
      this.fail('camera.decoder');
      return;
    }
    if (this.stopped) return;
    this.status('camera.requesting');
    try {
      await this.ports.authorize(true);
      if (this.stopped) {
        await this.ports.authorize(false);
        return;
      }
      const stream = await this.ports.capture();
      if (this.stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      if (!stream.getVideoTracks().some((track) => track.readyState === 'live'))
        throw new Error('no live track');
      for (const track of stream.getTracks()) {
        const ended = () => this.fail('camera.ended');
        track.addEventListener('ended', ended);
        this.listeners.push({ track, ended });
      }
      await this.ports.attach(stream);
      if (this.stopped) return;
      this.status('camera.scanning');
      this.schedule();
    } catch (error) {
      this.fail(captureError(error));
    }
  }
  private schedule() {
    if (!this.stopped) this.timer = this.ports.schedule(() => void this.tick(), CAMERA_INTERVAL);
  }
  private async tick() {
    this.timer = undefined;
    if (this.stopped) return;
    try {
      const frame = this.ports.frame();
      if (frame) {
        const results = await this.decoder.decode(frame);
        if (this.stopped) return;
        const result = results[0];
        if (result) {
          let isbn: Isbn | undefined;
          try {
            isbn = cameraIsbn(result);
          } catch {
            this.status('camera.invalid');
          }
          if (isbn) {
            this.stop(); // Release camera and worker BEFORE exposing the result to the queue.
            this.ports.accepted(isbn);
            return;
          }
        }
      }
      this.schedule();
    } catch {
      this.fail('camera.decoder');
    }
  }
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    if (this.timer !== undefined) this.ports.cancel(this.timer);
    this.listeners.forEach(({ track, ended }) => track.removeEventListener('ended', ended));
    this.listeners = [];
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.ports.clear();
    this.decoder.dispose();
    void this.ports.authorize(false).catch(() => {
      /* Expiring native lease also fails closed. */
    });
  }
}
