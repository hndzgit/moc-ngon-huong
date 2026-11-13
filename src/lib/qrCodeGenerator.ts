// src/lib/qrCodeGenerator.ts
// Self-contained ISO/IEC 18004 QR Code Matrix, SVG & Data URL Generator (Versions 1–10, Error Correction Level M)
// Zero external runtime or third-party API dependencies.

interface VersionSpec {
  version: number;
  totalDataCodewords: number;
  ecCodewordsPerBlock: number;
  group1Blocks: number;
  group1DataCodewords: number;
  group2Blocks: number;
  group2DataCodewords: number;
  alignmentPatterns: number[];
}

// ISO/IEC 18004 Table 9 — Error Correction Level M (15% recovery capacity)
const VERSION_SPECS_M: VersionSpec[] = [
  { version: 1, totalDataCodewords: 16, ecCodewordsPerBlock: 10, group1Blocks: 1, group1DataCodewords: 16, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [] },
  { version: 2, totalDataCodewords: 28, ecCodewordsPerBlock: 16, group1Blocks: 1, group1DataCodewords: 28, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [6, 18] },
  { version: 3, totalDataCodewords: 44, ecCodewordsPerBlock: 26, group1Blocks: 1, group1DataCodewords: 44, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [6, 22] },
  { version: 4, totalDataCodewords: 64, ecCodewordsPerBlock: 18, group1Blocks: 2, group1DataCodewords: 32, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [6, 26] },
  { version: 5, totalDataCodewords: 86, ecCodewordsPerBlock: 24, group1Blocks: 2, group1DataCodewords: 43, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [6, 30] },
  { version: 6, totalDataCodewords: 108, ecCodewordsPerBlock: 16, group1Blocks: 4, group1DataCodewords: 27, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [6, 34] },
  { version: 7, totalDataCodewords: 124, ecCodewordsPerBlock: 18, group1Blocks: 4, group1DataCodewords: 31, group2Blocks: 0, group2DataCodewords: 0, alignmentPatterns: [6, 22, 38] },
  { version: 8, totalDataCodewords: 154, ecCodewordsPerBlock: 22, group1Blocks: 2, group1DataCodewords: 38, group2Blocks: 2, group2DataCodewords: 39, alignmentPatterns: [6, 24, 42] },
  { version: 9, totalDataCodewords: 182, ecCodewordsPerBlock: 22, group1Blocks: 3, group1DataCodewords: 36, group2Blocks: 2, group2DataCodewords: 37, alignmentPatterns: [6, 26, 46] },
  { version: 10, totalDataCodewords: 216, ecCodewordsPerBlock: 26, group1Blocks: 4, group1DataCodewords: 43, group2Blocks: 1, group2DataCodewords: 44, alignmentPatterns: [6, 28, 50] },
];

// GF(256) with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomonEc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = buildGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < ecCount - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    rem[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return rem;
}

function encodeDataCodewords(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const bitCapacity = spec.totalDataCodewords * 8;
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Mode indicator for Byte mode: 0100
  pushBits(0b0100, 4);
  // Character count indicator: 8 bits for versions 1-9, 16 bits for version 10+
  const countBits = spec.version <= 9 ? 8 : 16;
  pushBits(bytes.length, countBits);

  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  // Terminator: up to 4 zero bits
  const terminatorLen = Math.min(4, bitCapacity - bits.length);
  pushBits(0, terminatorLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = new Uint8Array(spec.totalDataCodewords);
  const byteLen = bits.length / 8;
  for (let i = 0; i < byteLen; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    codewords[i] = b;
  }

  // Pad codewords alternating 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  for (let i = byteLen; i < spec.totalDataCodewords; i++) {
    codewords[i] = padBytes[(i - byteLen) % 2];
  }

  return codewords;
}

function interleaveCodewords(dataCodewords: Uint8Array, spec: VersionSpec): Uint8Array {
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.group1Blocks; i++) {
    const block = dataCodewords.slice(offset, offset + spec.group1DataCodewords);
    offset += spec.group1DataCodewords;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomonEc(block, spec.ecCodewordsPerBlock));
  }

  for (let i = 0; i < spec.group2Blocks; i++) {
    const block = dataCodewords.slice(offset, offset + spec.group2DataCodewords);
    offset += spec.group2DataCodewords;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomonEc(block, spec.ecCodewordsPerBlock));
  }

  const totalBlocks = spec.group1Blocks + spec.group2Blocks;
  const maxDataLen = Math.max(spec.group1DataCodewords, spec.group2DataCodewords);
  const result = new Uint8Array(spec.totalDataCodewords + totalBlocks * spec.ecCodewordsPerBlock);
  let outIdx = 0;

  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) {
        result[outIdx++] = dataBlocks[b][i];
      }
    }
  }

  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      result[outIdx++] = ecBlocks[b][i];
    }
  }

  return result;
}

// Compute 15-bit BCH format info for EC Level M (00) and mask (0..7)
function computeFormatBits(mask: number): number {
  // EC Level M indicator in QR format info is 00
  const data = (0b00 << 3) | (mask & 0b111);
  let rem = data << 10;
  const poly = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) {
      rem ^= poly << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

// Compute 18-bit BCH version info for versions >= 7
function computeVersionBits(version: number): number {
  let rem = version << 12;
  const poly = 0b1111100100101;
  for (let i = 17; i >= 12; i--) {
    if ((rem >>> i) & 1) {
      rem ^= poly << (i - 12);
    }
  }
  return (version << 12) | rem;
}

function applyMaskBit(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function evaluatePenalty(matrix: boolean[][]): number {
  const size = matrix.length;
  let penalty = 0;

  // Rule 1: 5+ consecutive same-colored modules in row/col
  const scoreRun = (runLen: number) => (runLen >= 5 ? 3 + (runLen - 5) : 0);
  for (let r = 0; r < size; r++) {
    let runColor = matrix[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        penalty += scoreRun(runLen);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    penalty += scoreRun(runLen);
  }

  for (let c = 0; c < size; c++) {
    let runColor = matrix[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        penalty += scoreRun(runLen);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    penalty += scoreRun(runLen);
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const color = matrix[r][c];
      if (
        matrix[r][c + 1] === color &&
        matrix[r + 1][c] === color &&
        matrix[r + 1][c + 1] === color
      ) {
        penalty += 3;
      }
    }
  }

  // Rule 3: Finder-like 1:1:3:1:1 patterns
  const matchesFinderLike = (arr: boolean[], idx: number) => {
    // 1011101 with 4 white on either side
    if (
      arr[idx] &&
      !arr[idx + 1] &&
      arr[idx + 2] &&
      arr[idx + 3] &&
      arr[idx + 4] &&
      !arr[idx + 5] &&
      arr[idx + 6]
    ) {
      const leftWhite =
        idx >= 4 && !arr[idx - 1] && !arr[idx - 2] && !arr[idx - 3] && !arr[idx - 4];
      const rightWhite =
        idx + 10 < arr.length &&
        !arr[idx + 7] &&
        !arr[idx + 8] &&
        !arr[idx + 9] &&
        !arr[idx + 10];
      return leftWhite || rightWhite;
    }
    return false;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 7; c++) {
      if (matchesFinderLike(matrix[r], c)) penalty += 40;
    }
  }
  for (let c = 0; c < size; c++) {
    const colArr = matrix.map((row) => row[c]);
    for (let r = 0; r <= size - 7; r++) {
      if (matchesFinderLike(colArr, r)) penalty += 40;
    }
  }

  // Rule 4: Balance of dark and light modules
  let darkCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) darkCount++;
    }
  }
  const total = size * size;
  const k = Math.abs(darkCount * 20 - total * 10) / total;
  penalty += Math.floor(k) * 10;

  return penalty;
}

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);

  // Choose smallest version that fits
  const spec = VERSION_SPECS_M.find((s) => {
    const headerBits = 4 + (s.version <= 9 ? 8 : 16);
    const maxBytes = Math.floor((s.totalDataCodewords * 8 - headerBits) / 8);
    return bytes.length <= maxBytes;
  });

  if (!spec) {
    throw new Error(`QR payload length (${bytes.length} bytes) exceeds Version 10 capacity.`);
  }

  const dataCodewords = encodeDataCodewords(bytes, spec);
  const allCodewords = interleaveCodewords(dataCodewords, spec);

  const size = 17 + 4 * spec.version;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const inRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (inRing || inCenter));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const alignCoords = spec.alignmentPatterns;
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      // Skip the 3 finder corners
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === alignCoords.length - 1) ||
        (i === alignCoords.length - 1 && j === 0)
      ) {
        continue;
      }
      const centerR = alignCoords[i];
      const centerC = alignCoords[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunctionModule(centerR + dr, centerC + dc, dist !== 1);
        }
      }
    }
  }

  // Dark module
  setFunctionModule(4 * spec.version + 9, 8, true);

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, false);
    setFunctionModule(size - 1 - i, 8, false);
  }

  // Write version info if version >= 7
  if (spec.version >= 7) {
    const vBits = computeVersionBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + size - 11;
      setFunctionModule(b, a, bit);
      setFunctionModule(a, b, bit);
    }
  }

  // Place data bits in upward/downward 2-column zig-zag
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let upward = true;

  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // Skip vertical timing pattern column
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = rightCol - dc;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const byte = allCodewords[bitIdx >>> 3];
            dark = ((byte >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Write format info helper
  const writeFormatInfo = (target: boolean[][], mask: number) => {
    const bits = computeFormatBits(mask);
    // Top-left format info
    for (let i = 0; i <= 5; i++) target[8][i] = ((bits >>> i) & 1) === 1;
    target[8][7] = ((bits >>> 6) & 1) === 1;
    target[8][8] = ((bits >>> 7) & 1) === 1;
    target[7][8] = ((bits >>> 8) & 1) === 1;
    for (let i = 9; i < 15; i++) target[14 - i][8] = ((bits >>> i) & 1) === 1;

    // Top-right and bottom-left format info
    for (let i = 0; i < 8; i++) target[8][size - 1 - i] = ((bits >>> i) & 1) === 1;
    for (let i = 8; i < 15; i++) target[size - 15 + i][8] = ((bits >>> i) & 1) === 1;
  };

  // Try all 8 masks and pick lowest penalty
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestMatrix: boolean[][] = modules;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((row, r) =>
      row.map((val, c) => (!isFunction[r][c] && applyMaskBit(mask, r, c) ? !val : val))
    );
    writeFormatInfo(candidate, mask);
    const penalty = evaluatePenalty(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestMatrix = candidate;
    }
  }

  return bestMatrix;
}

export interface QrSvgOptions {
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  sizePx?: number;
}

export function renderQrSvgString(text: string, options: QrSvgOptions = {}): string {
  const matrix = generateQrMatrix(text);
  const margin = options.margin ?? 4;
  const darkColor = options.darkColor ?? '#1B2A1E';
  const lightColor = options.lightColor ?? '#FFFFFF';
  const sizePx = options.sizePx ?? 320;
  const moduleCount = matrix.length;
  const viewBoxSize = moduleCount + margin * 2;

  let pathD = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        const x = c + margin;
        const y = r + margin;
        pathD += `M${x},${y}h1v1h-1z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${lightColor}"/><path d="${pathD}" fill="${darkColor}"/></svg>`;
}

export function renderQrSvgDataUrl(text: string, options: QrSvgOptions = {}): string {
  const svg = renderQrSvgString(text, options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
