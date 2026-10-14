import { boundedFrame, type CameraBarcodeResult } from '../domain/camera';

export interface CameraBarcodeDecoder {
  initialize(): Promise<void>;
  decode(frame: ImageData): Promise<readonly CameraBarcodeResult[]>;
  dispose(): void;
}
export class WorkerCameraDecoder implements CameraBarcodeDecoder {
  private worker?: Worker;
  private pending?: {
    resolve: (results: CameraBarcodeResult[]) => void;
    reject: (e: Error) => void;
  };
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  constructor(
    private readonly factory = () =>
      new Worker(new URL('./cameraDecoder.worker.ts', import.meta.url), { type: 'module' }),
  ) {}
  private request(message: object, transfer: Transferable[] = []): Promise<CameraBarcodeResult[]> {
    if (this.disposed || !this.worker || this.pending)
      return Promise.reject(new Error('camera.decoder'));
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
      this.timer = setTimeout(() => this.dispose(), 15000);
      try {
        this.worker!.postMessage(message, transfer);
      } catch {
        this.dispose();
      }
    });
  }
  async initialize() {
    if (this.disposed || this.worker) throw new Error('camera.decoder');
    this.worker = this.factory();
    this.worker.onerror = () => this.dispose();
    this.worker.onmessageerror = () => this.dispose();
    this.worker.onmessage = (event) => {
      const pending = this.pending;
      this.pending = undefined;
      clearTimeout(this.timer);
      if (event.data.error || !Array.isArray(event.data.results))
        pending?.reject(new Error('camera.decoder'));
      else pending?.resolve(event.data.results.slice(0, 1));
    };
    await this.request({ type: 'initialize' });
  }
  decode(frame: ImageData) {
    if (!boundedFrame(frame)) return Promise.reject(new Error('camera.decoder'));
    return this.request({ type: 'decode', frame }, [frame.data.buffer]);
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = undefined;
    this.pending?.reject(new Error('camera.decoder'));
    this.pending = undefined;
  }
}

interface NativeDetector {
  detect(frame: ImageData): Promise<{ rawValue: string; format: string }[]>;
}
interface NativeConstructor {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
}
export class CameraDecoder implements CameraBarcodeDecoder {
  private native?: NativeDetector;
  private fallback?: CameraBarcodeDecoder;
  private disposed = false;
  constructor(
    private readonly Native = (
      globalThis as typeof globalThis & { BarcodeDetector?: NativeConstructor }
    ).BarcodeDetector,
    private readonly factory: () => CameraBarcodeDecoder = () => new WorkerCameraDecoder(),
  ) {}
  private async wasm() {
    if (this.disposed) throw new Error('camera.decoder');
    const decoder = this.factory();
    this.fallback = decoder;
    await decoder.initialize();
    if (this.disposed) {
      decoder.dispose();
      throw new Error('camera.decoder');
    }
  }
  async initialize() {
    try {
      if (this.Native && (await this.Native.getSupportedFormats()).includes('ean_13')) {
        if (this.disposed) throw new Error('camera.decoder');
        this.native = new this.Native({ formats: ['ean_13'] });
        return;
      }
    } catch {
      /* Capability failure uses the fully local reader. */
    }
    await this.wasm();
  }
  async decode(frame: ImageData): Promise<CameraBarcodeResult[]> {
    if (this.disposed || !boundedFrame(frame)) throw new Error('camera.decoder');
    if (this.native) {
      try {
        const results = await this.native.detect(frame);
        if (this.disposed) return [];
        return results
          .slice(0, 1)
          .filter((r) => typeof r.rawValue === 'string' && r.rawValue.length <= 128)
          .map((r) => ({ rawText: r.rawValue, format: r.format }));
      } catch {
        this.native = undefined;
        await this.wasm();
      }
    }
    if (!this.fallback) throw new Error('camera.decoder');
    return [...(await this.fallback.decode(frame))];
  }
  dispose() {
    this.disposed = true;
    this.native = undefined;
    this.fallback?.dispose();
  }
}
