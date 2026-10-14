import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { ean13Image } from '../../scripts/fixtures/ean13.mjs';
import { initializeReader, decodeReader } from '../services/cameraReader';
import { CameraSession, captureError, type CameraPorts } from '../services/cameraSession';
import {
  CameraDecoder,
  WorkerCameraDecoder,
  type CameraBarcodeDecoder,
} from '../services/cameraDecoder';
import { cameraIsbn, boundedFrame, type CameraBarcodeResult } from './camera';
import { queueScan, SCAN_QUEUE_LIMIT } from './scanner';
import { CameraScan } from '../components/CameraScan';
import { setLanguage, t } from '../i18n';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';

const valid = { rawText: '9780306406157', format: 'ean_13' };
const frame = () => ean13Image(valid.rawText) as ImageData;
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function harness(result: CameraBarcodeResult[] = [valid]) {
  const track = Object.assign(new EventTarget(), { readyState: 'live', stop: vi.fn() });
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  const decoder: CameraBarcodeDecoder = {
    initialize: vi.fn(async () => {}),
    decode: vi.fn(async () => result),
    dispose: vi.fn(),
  };
  let callback: (() => void) | undefined;
  const ports: CameraPorts = {
    supported: () => true,
    authorize: vi.fn(async () => {}),
    capture: vi.fn(async () => stream),
    attach: vi.fn(async () => {}),
    clear: vi.fn(),
    frame,
    schedule: vi.fn((fn) => {
      callback = fn;
      return 1;
    }),
    cancel: vi.fn(() => {
      callback = undefined;
    }),
    status: vi.fn(),
    accepted: vi.fn(),
  };
  return {
    track,
    stream,
    decoder,
    ports,
    session: new CameraSession(decoder, ports),
    tick: async () => {
      const fn = callback;
      callback = undefined;
      fn?.();
      await flush();
    },
  };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('camera format and actual offline reader', () => {
  it.each(['9780306406157', '9791090636071'])(
    'validates %s with existing ISBN semantics',
    (rawText) => {
      const isbn = cameraIsbn({ rawText, format: 'ean_13' });
      expect(isbn.isbn13).toBe(rawText);
      if (rawText.startsWith('979')) expect(isbn.isbn10).toBeUndefined();
    },
  );
  it.each([
    '9780306406158',
    '4006381333931',
    '036000291452',
    '0306406152',
    ']E09780306406157',
    '9780306406157\n',
    'x'.repeat(129),
  ])('rejects %j without transport rewriting', (rawText) => {
    expect(() => cameraIsbn({ rawText, format: 'ean_13' })).toThrow();
  });
  it.each(['qr_code', 'code_128', 'upc_a', 'upc_e', 'ean_8', 'ISBN'])(
    'rejects format %s even for ISBN text',
    (format) => {
      expect(() => cameraIsbn({ ...valid, format })).toThrow();
    },
  );
  it('bounds frames before decoding', () => {
    expect(boundedFrame(frame())).toBe(true);
    expect(boundedFrame({ ...frame(), width: 641 })).toBe(false);
    expect(boundedFrame({ ...frame(), height: 481 })).toBe(false);
  });
  it('runs the actual reader offline on 978, 979 and non-book EAN-13', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network forbidden'));
    const binary = await readFile('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm');
    await initializeReader({
      wasmBinary: binary.buffer.slice(
        binary.byteOffset,
        binary.byteOffset + binary.byteLength,
      ) as ArrayBuffer,
      locateFile: () => 'file:///synthetic/zxing_reader.wasm',
    });
    for (const digits of ['9780306406157', '9791090636071', '4006381333931']) {
      const result = await decodeReader(ean13Image(digits) as ImageData);
      expect(result).toEqual([{ rawText: digits, format: 'ean_13' }]);
      if (digits.startsWith('97')) expect(cameraIsbn(result[0]).isbn13).toBe(digits);
      else expect(() => cameraIsbn(result[0])).toThrow();
    }
    expect(network).not.toHaveBeenCalled();
  });
});

describe('camera session is explicit, bounded and releases resources', () => {
  it('does nothing before explicit start; accepts once only after cleanup', async () => {
    const h = harness();
    expect(h.ports.capture).not.toHaveBeenCalled();
    h.ports.accepted = vi.fn(() => {
      expect(h.track.stop).toHaveBeenCalledOnce();
      expect(h.decoder.dispose).toHaveBeenCalledOnce();
    });
    await h.session.start();
    await h.tick();
    await h.tick();
    expect(h.ports.accepted).toHaveBeenCalledOnce();
    expect(h.ports.clear).toHaveBeenCalledOnce();
  });
  it('unsupported/insecure context never captures', async () => {
    const h = harness();
    h.ports.supported = () => false;
    await h.session.start();
    expect(h.ports.status).toHaveBeenLastCalledWith('camera.unsupported');
    expect(h.ports.capture).not.toHaveBeenCalled();
  });
  it.each([
    'NotAllowedError',
    'NotFoundError',
    'NotReadableError',
    'OverconstrainedError',
    'AbortError',
  ])('handles %s normally', async (name) => {
    const h = harness();
    h.ports.capture = vi.fn(async () => {
      throw { name };
    });
    await h.session.start();
    expect(h.ports.status).toHaveBeenLastCalledWith(captureError({ name }));
    expect(h.decoder.dispose).toHaveBeenCalledOnce();
  });
  it('stops a late permission grant without attaching it', async () => {
    const h = harness(),
      pending = deferred<MediaStream>();
    h.ports.capture = () => pending.promise;
    const start = h.session.start();
    await flush();
    h.session.stop();
    pending.resolve(h.stream);
    await start;
    expect(h.track.stop).toHaveBeenCalledOnce();
    expect(h.ports.attach).not.toHaveBeenCalled();
  });
  it('decoder initialization failure never asks for camera', async () => {
    const h = harness();
    h.decoder.initialize = async () => {
      throw new Error();
    };
    await h.session.start();
    expect(h.ports.capture).not.toHaveBeenCalled();
    expect(h.decoder.dispose).toHaveBeenCalledOnce();
  });
  it('runtime decoder failure stops tracks', async () => {
    const h = harness();
    h.decoder.decode = async () => {
      throw new Error();
    };
    await h.session.start();
    await h.tick();
    expect(h.track.stop).toHaveBeenCalledOnce();
    expect(h.ports.status).toHaveBeenLastCalledWith('camera.decoder');
  });
  it('no-result frames continue without acceptance; cancel/unmount cleanup is idempotent', async () => {
    const h = harness([]);
    await h.session.start();
    await h.tick();
    await h.tick();
    expect(h.ports.accepted).not.toHaveBeenCalled();
    expect(h.decoder.decode).toHaveBeenCalledTimes(2);
    h.session.stop();
    h.session.stop();
    expect(h.track.stop).toHaveBeenCalledOnce();
    expect(h.decoder.dispose).toHaveBeenCalledOnce();
    expect(h.ports.cancel).toHaveBeenCalled();
  });
  it('invalid symbols stay visible without queue insertion or repeated announcements', async () => {
    const h = harness([{ ...valid, rawText: '4006381333931' }]);
    await h.session.start();
    await h.tick();
    await h.tick();
    expect(h.ports.accepted).not.toHaveBeenCalled();
    expect(
      vi.mocked(h.ports.status).mock.calls.filter(([key]) => key === 'camera.invalid'),
    ).toHaveLength(1);
    h.session.stop();
  });
  it('ignores stale decode and has one frame in flight', async () => {
    const h = harness(),
      pending = deferred<CameraBarcodeResult[]>();
    h.decoder.decode = vi.fn(() => pending.promise);
    await h.session.start();
    await h.tick();
    await h.tick();
    expect(h.decoder.decode).toHaveBeenCalledOnce();
    h.session.stop();
    pending.resolve([valid]);
    await flush();
    expect(h.ports.accepted).not.toHaveBeenCalled();
  });
  it('device removal stops everything', async () => {
    const h = harness();
    await h.session.start();
    h.track.dispatchEvent(new Event('ended'));
    expect(h.track.stop).toHaveBeenCalledOnce();
    expect(h.ports.status).toHaveBeenLastCalledWith('camera.ended');
  });
  it('explicit reopening preserves duplicate queue entries and enforces the existing bound', async () => {
    let queue: ReturnType<typeof queueScan> = [];
    for (let i = 0; i < 2; i++) {
      const h = harness();
      h.ports.accepted = (isbn) => {
        queue = queueScan(queue, isbn.isbn13, 'enter');
      };
      await h.session.start();
      await h.tick();
    }
    expect(queue).toHaveLength(2);
    expect(queue[0].id).not.toBe(queue[1].id);
    const full = Array.from({ length: SCAN_QUEUE_LIMIT }, (_, id) => ({ ...queue[0], id }));
    expect(() => queueScan(full, valid.rawText, 'enter')).toThrow('scanner.queueFull');
  });
});

describe('decoder fallback and worker disposal', () => {
  it('a failed capability query falls back to local WASM', async () => {
    class Native {
      static async getSupportedFormats(): Promise<string[]> {
        throw new Error();
      }
      async detect() {
        return [];
      }
    }
    const h = harness(),
      decoder = new CameraDecoder(Native, () => h.decoder);
    await decoder.initialize();
    expect(h.decoder.initialize).toHaveBeenCalledOnce();
    decoder.dispose();
  });
  it('worker timeout terminates computation and rejects pending initialization', async () => {
    vi.useFakeTimers();
    const worker = { postMessage: vi.fn(), terminate: vi.fn() };
    const decoder = new WorkerCameraDecoder(() => worker as unknown as Worker);
    const rejected = expect(decoder.initialize()).rejects.toThrow('camera.decoder');
    await vi.advanceTimersByTimeAsync(15000);
    await rejected;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('unsupported native format uses WASM, without OS checks', async () => {
    class Native {
      static async getSupportedFormats() {
        return ['qr_code'];
      }
      async detect() {
        return [];
      }
    }
    const h = harness(),
      decoder = new CameraDecoder(Native, () => h.decoder);
    await decoder.initialize();
    expect(h.decoder.initialize).toHaveBeenCalledOnce();
    decoder.dispose();
  });
  it('native no-result is normal; failure falls back once', async () => {
    let fail = false;
    class Native {
      static async getSupportedFormats() {
        return ['ean_13'];
      }
      async detect() {
        if (fail) throw new Error();
        return [];
      }
    }
    const h = harness(),
      decoder = new CameraDecoder(Native, () => h.decoder);
    await decoder.initialize();
    expect(await decoder.decode(frame())).toEqual([]);
    expect(h.decoder.initialize).not.toHaveBeenCalled();
    fail = true;
    expect(await decoder.decode(frame())).toEqual([valid]);
    expect(h.decoder.initialize).toHaveBeenCalledOnce();
    decoder.dispose();
  });
  it('native constructor failure falls back', async () => {
    class Native {
      constructor() {
        throw new Error();
      }
      static async getSupportedFormats() {
        return ['ean_13'];
      }
      async detect() {
        return [];
      }
    }
    const h = harness(),
      decoder = new CameraDecoder(Native, () => h.decoder);
    await decoder.initialize();
    expect(h.decoder.initialize).toHaveBeenCalledOnce();
    decoder.dispose();
  });
  it('terminates worker and rejects pending work on disposal', async () => {
    const worker = { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null, onerror: null };
    const decoder = new WorkerCameraDecoder(() => worker as unknown as Worker);
    const init = decoder.initialize();
    const rejection = expect(init).rejects.toThrow('camera.decoder');
    decoder.dispose();
    await rejection;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});

it('cancel during decoder initialization never opens the camera later', async () => {
  const h = harness(),
    pending = deferred<void>();
  h.decoder.initialize = () => pending.promise;
  const start = h.session.start();
  h.session.stop();
  pending.resolve();
  await start;
  expect(h.ports.capture).not.toHaveBeenCalled();
  expect(h.decoder.dispose).toHaveBeenCalledOnce();
});
it('preview initialization failure stops every track and clears preview', async () => {
  const h = harness();
  const second = Object.assign(new EventTarget(), { readyState: 'live', stop: vi.fn() });
  h.stream.getTracks = () => [h.track, second] as unknown as MediaStreamTrack[];
  h.ports.attach = async () => {
    throw new Error();
  };
  await h.session.start();
  expect(h.track.stop).toHaveBeenCalledOnce();
  expect(second.stop).toHaveBeenCalledOnce();
  expect(h.ports.clear).toHaveBeenCalledOnce();
  expect(h.decoder.dispose).toHaveBeenCalledOnce();
});
it('actual reader rejects oversized frames before invoking WASM', async () => {
  await expect(decodeReader({ ...frame(), width: 641 })).rejects.toThrow('camera.decoder');
});

it('EN/TR camera keys have parity, localized labels and no capture during render', async () => {
  const keys = Object.keys(en).filter((key) => key.startsWith('camera.'));
  expect(keys).toEqual(Object.keys(tr).filter((key) => key.startsWith('camera.')));
  for (const locale of ['en', 'tr']) {
    await setLanguage(locale);
    for (const key of keys) expect(t(key)).not.toBe(key);
    const html = renderToStaticMarkup(<CameraScan onClose={() => {}} onAccepted={() => {}} />);
    expect(html).toContain(t('camera.preview'));
    expect(html).toContain('role="status"');
    expect(html).toContain(t('camera.cancel'));
  }
  await setLanguage('en');
});
