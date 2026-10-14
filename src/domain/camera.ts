import { parseIsbn, type Isbn } from './isbn';

export interface CameraBarcodeResult {
  rawText: string;
  format: string;
}
export const CAMERA_WIDTH = 640;
export const CAMERA_HEIGHT = 480;
export const CAMERA_INTERVAL = 200;
export function cameraIsbn(result: CameraBarcodeResult): Isbn {
  // Camera symbols have no keyboard terminators, AIM prefixes or manual formatting.
  if (result.format !== 'ean_13' || !/^[0-9]{13}$/.test(result.rawText))
    throw new Error('camera.invalid');
  return parseIsbn(result.rawText);
}
export function boundedFrame(frame: ImageData): boolean {
  return (
    Number.isInteger(frame.width) &&
    Number.isInteger(frame.height) &&
    frame.width > 0 &&
    frame.height > 0 &&
    frame.width <= CAMERA_WIDTH &&
    frame.height <= CAMERA_HEIGHT &&
    frame.data.length === frame.width * frame.height * 4
  );
}
