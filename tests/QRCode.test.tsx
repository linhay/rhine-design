import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QRCode } from '../components';
import { qrMatrix } from '../components/qr-matrix';

function decode(matrix: boolean[][]) {
  const scale = 8, width = (matrix.length + 8) * scale;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  matrix.forEach((row, y) => row.forEach((dark, x) => { if (dark) for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
    const index = (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4;
    pixels[index] = pixels[index + 1] = pixels[index + 2] = 0;
  } }));
  return jsQR(pixels, width, width);
}

describe('independently decoded QR Model 2', () => {
  it.each(['', 'RHINE', '莱茵设计 🌿', 'https://example.com/a?b=1', 'a'.repeat(12), 'b'.repeat(24), 'c'.repeat(40), 'd'.repeat(60), 'e'.repeat(78)])('round trips UTF-8 byte input %j with jsQR rather than a matching home-made decoder', value => {
    const matrix = qrMatrix(value)!;
    expect(decode(matrix)?.data).toBe(value);
  });
  it('decodes every supported ASCII byte length across all five versions', () => {
    for (let length = 0; length <= 78; length += 1) { const value = Array.from({ length }, (_, index) => String.fromCharCode(33 + (index * 17 + length) % 90)).join(''); expect(decode(qrMatrix(value)!)?.data, `length ${length}`).toBe(value); }
  });
  it('retains M error correction for a damaged data module', () => {
    const matrix = qrMatrix('RHINE')!;
    matrix[matrix.length - 1][matrix.length - 1] = !matrix[matrix.length - 1][matrix.length - 1];
    expect(decode(matrix)?.data).toBe('RHINE');
  });
  it('rejects an intentionally destroyed symbol', () => {
    const matrix = qrMatrix('RHINE')!.map(row => row.map(() => false));
    expect(decode(matrix)).toBeNull();
  });
  it('limits byte length, not the JavaScript character count', () => {
    expect(qrMatrix('a'.repeat(79))).toBeNull();
    expect(qrMatrix('中'.repeat(27))).toBeNull();
    render(<QRCode label="过长" value={'中'.repeat(27)} />);
    expect(screen.getByRole('alert')).toHaveTextContent('78 字节');
  });
  it('renders an opaque white quiet zone and opaque dark modules independent of theme', () => {
    render(<QRCode label="示例码" value="RHINE" />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('viewBox', '-4 -4 29 29');
    expect(svg.querySelector('rect')).toHaveAttribute('fill', '#fff');
    expect(svg.querySelector('rect + rect')).toHaveAttribute('fill', '#000');
  });
});
