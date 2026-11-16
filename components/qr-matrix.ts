// QR Model 2, byte mode with explicit UTF-8 ECI, error correction M, versions 1–5.
// The public component deliberately limits input to 78 UTF-8 bytes.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let value = 1, index = 0; index < 255; index += 1) {
  EXP[index] = value;
  LOG[value] = index;
  value = (value << 1) ^ (value & 0x80 ? 0x11d : 0);
}
for (let index = 255; index < 512; index += 1) EXP[index] = EXP[index - 255];
const multiply = (left: number, right: number) => left && right ? EXP[LOG[left] + LOG[right]] : 0;

function errorCorrection(data: number[], length: number) {
  let polynomial = [1];
  for (let index = 0; index < length; index += 1) {
    const next = new Array(polynomial.length + 1).fill(0);
    for (let term = 0; term < polynomial.length; term += 1) {
      next[term] ^= polynomial[term];
      next[term + 1] ^= multiply(polynomial[term], EXP[index]);
    }
    polynomial = next;
  }
  const padded = data.concat(new Array(length).fill(0));
  for (let index = 0; index < data.length; index += 1) {
    const factor = padded[index];
    for (let term = 0; term < polynomial.length; term += 1) padded[index + term] ^= multiply(polynomial[term], factor);
  }
  return padded.slice(data.length);
}

const VERSIONS = [
  { version: 1, data: 16, blocks: 1, ecc: 10, alignment: 0 },
  { version: 2, data: 28, blocks: 1, ecc: 16, alignment: 18 },
  { version: 3, data: 44, blocks: 1, ecc: 26, alignment: 22 },
  { version: 4, data: 64, blocks: 2, ecc: 18, alignment: 26 },
  { version: 5, data: 86, blocks: 2, ecc: 24, alignment: 30 },
];
const bits = (value: number, length: number) => value.toString(2).padStart(length, '0');

function formatBits(mask: number) {
  // Error correction M has format indicator 00.
  let remainder = mask << 10;
  for (let index = 14; index >= 10; index -= 1) if (remainder & (1 << index)) remainder ^= 0x537 << (index - 10);
  return ((mask << 10) | remainder) ^ 0x5412;
}

function masked(row: number, column: number, mask: number) {
  switch (mask) {
    case 0: return (row + column) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return column % 3 === 0;
    case 3: return (row + column) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
    case 5: return (row * column) % 2 + (row * column) % 3 === 0;
    case 6: return ((row * column) % 2 + (row * column) % 3) % 2 === 0;
    default: return ((row + column) % 2 + (row * column) % 3) % 2 === 0;
  }
}

function penalty(matrix: boolean[][]) {
  const size = matrix.length;
  let score = 0;
  for (let direction = 0; direction < 2; direction += 1) for (let index = 0; index < size; index += 1) {
    const line = direction ? matrix.map(row => row[index]) : matrix[index];
    let run = 1;
    for (let position = 1; position < size; position += 1) {
      if (line[position] === line[position - 1]) run += 1;
      else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
    const text = line.map(Number).join('');
    for (let position = 0; position <= size - 11; position += 1) {
      if (['00001011101', '10111010000'].includes(text.slice(position, position + 11))) score += 40;
    }
  }
  for (let row = 0; row < size - 1; row += 1) for (let column = 0; column < size - 1; column += 1) {
    const color = matrix[row][column];
    if (color === matrix[row + 1][column] && color === matrix[row][column + 1] && color === matrix[row + 1][column + 1]) score += 3;
  }
  score += Math.floor(Math.abs(matrix.flat().filter(Boolean).length * 100 / (size * size) - 50) / 5) * 10;
  return score;
}

export function qrMatrix(value: string): boolean[][] | null {
  const bytes = [...new TextEncoder().encode(value)];
  if (bytes.length > 78) return null;
  const version = VERSIONS.find(item => 24 + bytes.length * 8 <= item.data * 8)!;
  let stream = '0111' + bits(26, 8) + '0100' + bits(bytes.length, 8) + bytes.map(byte => bits(byte, 8)).join('');
  stream += '0'.repeat(Math.min(4, version.data * 8 - stream.length));
  stream = stream.padEnd(Math.ceil(stream.length / 8) * 8, '0');
  const data = stream.match(/.{8}/g)!.map(word => Number.parseInt(word, 2));
  for (let padding = 0; data.length < version.data; padding += 1) data.push(padding % 2 ? 0x11 : 0xec);
  const blockSize = version.data / version.blocks;
  const blocks = Array.from({ length: version.blocks }, (_, index) => data.slice(index * blockSize, (index + 1) * blockSize));
  const ecc = blocks.map(block => errorCorrection(block, version.ecc));
  const words: number[] = [];
  for (let index = 0; index < blockSize; index += 1) blocks.forEach(block => words.push(block[index]));
  for (let index = 0; index < version.ecc; index += 1) ecc.forEach(block => words.push(block[index]));
  stream = words.map(word => bits(word, 8)).join('');

  const size = version.version * 4 + 17;
  const base = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const set = (row: number, column: number, dark: boolean) => {
    if (row < 0 || column < 0 || row >= size || column >= size) return;
    base[row][column] = dark; reserved[row][column] = true;
  };
  for (let index = 0; index < size; index += 1) { set(6, index, index % 2 === 0); set(index, 6, index % 2 === 0); }
  for (const [row, column] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let y = -1; y <= 7; y += 1) for (let x = -1; x <= 7; x += 1) {
      const inside = y >= 0 && y <= 6 && x >= 0 && x <= 6;
      set(row + y, column + x, inside && (y === 0 || x === 0 || y === 6 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)));
    }
  }
  if (version.alignment) for (let y = -2; y <= 2; y += 1) for (let x = -2; x <= 2; x += 1) {
    set(version.alignment + y, version.alignment + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
  }
  const drawFormat = (matrix: boolean[][], mask: number) => {
    const format = formatBits(mask);
    const put = (row: number, column: number, index: number) => {
      matrix[row][column] = Boolean((format >> index) & 1); reserved[row][column] = true;
    };
    for (let index = 0; index <= 5; index += 1) put(index, 8, index);
    put(7, 8, 6); put(8, 8, 7); put(8, 7, 8);
    for (let index = 9; index < 15; index += 1) put(8, 14 - index, index);
    for (let index = 0; index < 8; index += 1) put(8, size - 1 - index, index);
    for (let index = 8; index < 15; index += 1) put(size - 15 + index, 8, index);
    matrix[size - 8][8] = true; reserved[size - 8][8] = true;
  };
  drawFormat(base, 0);
  let best = base, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = base.map(row => [...row]);
    let cursor = 0, upward = true;
    for (let column = size - 1; column >= 1; column -= 2) {
      if (column === 6) column = 5;
      for (let step = 0; step < size; step += 1) {
        const row = upward ? size - 1 - step : step;
        for (let offset = 0; offset < 2; offset += 1) if (!reserved[row][column - offset]) {
          matrix[row][column - offset] = (stream[cursor++] === '1') !== masked(row, column - offset, mask);
        }
      }
      upward = !upward;
    }
    drawFormat(matrix, mask);
    const score = penalty(matrix);
    if (score < bestScore) { best = matrix; bestScore = score; }
  }
  return best;
}
