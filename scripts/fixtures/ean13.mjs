// Synthetic, offline EAN-13 image generation for unit and isolated desktop tests only.
export function ean13Image(digits) {
  if (!/^[0-9]{13}$/.test(digits)) throw new Error('Expected 13 digits');
  const left = [
    '0001101',
    '0011001',
    '0010011',
    '0111101',
    '0100011',
    '0110001',
    '0101111',
    '0111011',
    '0110111',
    '0001011',
  ];
  const parity = [
    'LLLLLL',
    'LLGLGG',
    'LLGGLG',
    'LLGGGL',
    'LGLLGG',
    'LGGLLG',
    'LGGGLL',
    'LGLGLG',
    'LGLGGL',
    'LGGLGL',
  ];
  const right = (n) => left[n].replace(/[01]/g, (x) => (x === '0' ? '1' : '0'));
  let bits = '000000000000101';
  for (let i = 1; i <= 6; i++)
    bits +=
      parity[Number(digits[0])][i - 1] === 'L'
        ? left[Number(digits[i])]
        : right(Number(digits[i])).split('').reverse().join('');
  bits += '01010';
  for (let i = 7; i < 13; i++) bits += right(Number(digits[i]));
  bits += '101000000000000';
  const width = bits.length * 3,
    height = 180;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 15; y < height - 15; y++)
    for (let x = 0; x < width; x++) {
      if (bits[Math.floor(x / 3)] === '1') {
        const i = (y * width + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
    }
  return { width, height, data };
}
