import { prepareZXingModule, readBarcodes, type ZXingModuleOverrides } from 'zxing-wasm/reader';
import { boundedFrame, type CameraBarcodeResult } from '../domain/camera';

// Shared by the worker and offline real-reader fixture tests. Overrides are mandatory.
export async function initializeReader(overrides: ZXingModuleOverrides) {
  await prepareZXingModule({ overrides, fireImmediately: true });
}
export async function decodeReader(frame: ImageData): Promise<CameraBarcodeResult[]> {
  if (!boundedFrame(frame)) throw new Error('camera.decoder');
  const results = await readBarcodes(frame, {
    formats: ['EAN-13'],
    maxNumberOfSymbols: 1,
    tryHarder: false,
  });
  return results
    .slice(0, 1)
    .filter((r) => r.isValid && r.text.length <= 128)
    .map((r) => ({
      rawText: r.text,
      format: r.format === 'EAN13' ? 'ean_13' : 'unsupported',
    }));
}
