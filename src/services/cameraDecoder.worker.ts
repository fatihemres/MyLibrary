import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { initializeReader, decodeReader } from './cameraReader';

let ready = false;
let busy = false;
self.onmessage = async (event: MessageEvent<{ type: string; frame?: ImageData }>) => {
  if (busy) {
    self.postMessage({ error: true });
    return;
  }
  busy = true;
  try {
    if (event.data.type === 'initialize' && !ready) {
      const local = new URL(wasmUrl, self.location.href);
      if (local.origin !== self.location.origin) throw new Error('camera.decoder');
      await initializeReader({
        locateFile: (path) => {
          if (path !== 'zxing_reader.wasm') throw new Error('camera.decoder');
          return local.href;
        },
        print: () => {},
        printErr: () => {},
      });
      ready = true;
      self.postMessage({ results: [] });
    } else if (event.data.type === 'decode' && ready && event.data.frame) {
      self.postMessage({ results: await decodeReader(event.data.frame) });
    } else throw new Error('camera.decoder');
  } catch {
    self.postMessage({ error: true });
  } finally {
    busy = false;
  }
};
