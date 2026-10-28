/**
 * Offline Channel Layer for VaaniSetu
 *
 * Implements:
 * 1. Zlib/Deflate compression and decompression (via pako)
 * 2. Binary wire packet framing matching channel/packet.py
 * 3. Reed-Solomon Forward Error Correction (RS-10 over GF(2^8)) matching channel/fec.py
 * 4. Simulated low-bitrate link with configurable BPS, BER, and live bit tracking matching channel/simulated_link.py
 */

import pako from 'pako';

// Fast zero-dependency UTF-8 encoder supporting all Indic scripts
export function stringToUtf8Bytes(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let cp = str.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        cp = ((cp & 0x3ff) << 10) + (next & 0x3ff) + 0x10000;
        i++;
      }
    }
    if (cp < 0x80) {
      bytes.push(cp);
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

// Fast zero-dependency UTF-8 decoder supporting all Indic scripts
export function utf8BytesToString(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      result += String.fromCharCode(b1);
    } else if (b1 >> 5 === 0x06) {
      const b2 = bytes[i++];
      result += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
    } else if (b1 >> 4 === 0x0e) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      result += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
    } else if (b1 >> 3 === 0x1e) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
      let cp = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
      cp -= 0x10000;
      result += String.fromCharCode((cp >> 10) + 0xd800, (cp & 0x3ff) + 0xdc00);
    }
  }
  return result;
}

// ==========================================
// 1. COMPRESSION (Deflate / Zlib level 9)
// ==========================================

export function compressText(text: string): Uint8Array {
  const raw = stringToUtf8Bytes(text);
  return pako.deflate(raw, {level: 9});
}

export function decompressText(data: Uint8Array): string {
  const decompressed = pako.inflate(data);
  return utf8BytesToString(decompressed);
}

// ==========================================
// 2. PACKET FRAMING
// ==========================================
// Wire format:
// [1 byte]  language_tag_length (N)
// [N bytes] language_tag, UTF-8
// [4 bytes] payload_length, big-endian unsigned int
// [payload_length bytes] compressed text payload

export interface WirePacket {
  languageTag: string;
  payload: Uint8Array;
}

export function packPacket(packet: WirePacket): Uint8Array {
  const langBytes = stringToUtf8Bytes(packet.languageTag);
  if (langBytes.length > 255) {
    throw new Error('language_tag too long');
  }

  const headerSize = 1 + langBytes.length + 4;
  const buffer = new Uint8Array(headerSize + packet.payload.length);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // 1 byte lang length
  view.setUint8(0, langBytes.length);
  buffer.set(langBytes, 1);

  // 4 bytes payload length (big-endian)
  const payloadOffset = 1 + langBytes.length;
  view.setUint32(payloadOffset, packet.payload.length, false);

  // payload
  buffer.set(packet.payload, payloadOffset + 4);
  return buffer;
}

export function unpackPacket(data: Uint8Array): WirePacket {
  if (data.length < 5) {
    throw new Error('Packet data too short');
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const langLen = view.getUint8(0);
  let offset = 1;

  if (offset + langLen + 4 > data.length) {
    throw new Error('Packet corrupted: invalid language length');
  }

  const languageTag = utf8BytesToString(data.subarray(offset, offset + langLen));
  offset += langLen;

  const payloadLen = view.getUint32(offset, false);
  offset += 4;

  if (offset + payloadLen > data.length) {
    throw new Error('Packet corrupted: invalid payload length');
  }

  const payload = data.subarray(offset, offset + payloadLen);
  return {languageTag, payload};
}

// ==========================================
// 3. REED-SOLOMON FORWARD ERROR CORRECTION
// GF(2^8) with primitive polynomial 0x11d (285)
// ==========================================

export const DEFAULT_ECC_SYMBOLS = 10;

class GaloisField {
  exp: number[] = new Array(512);
  log: number[] = new Array(256);

  constructor(primPoly: number = 0x11d) {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.exp[i] = x;
      this.log[x] = i;
      x <<= 1;
      if (x & 0x100) {
        x ^= primPoly;
      }
    }
    for (let i = 255; i < 512; i++) {
      this.exp[i] = this.exp[i - 255];
    }
  }

  mul(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return this.exp[this.log[a] + this.log[b]];
  }

  div(a: number, b: number): number {
    if (a === 0) return 0;
    if (b === 0) throw new Error('Division by zero in GF');
    return this.exp[(this.log[a] - this.log[b] + 255) % 255];
  }

  polyMul(p1: number[], p2: number[]): number[] {
    const r = new Array(p1.length + p2.length - 1).fill(0);
    for (let i = 0; i < p1.length; i++) {
      for (let j = 0; j < p2.length; j++) {
        r[i + j] ^= this.mul(p1[i], p2[j]);
      }
    }
    return r;
  }

  polyEval(poly: number[], x: number): number {
    let y = poly[0];
    for (let i = 1; i < poly.length; i++) {
      y = this.mul(y, x) ^ poly[i];
    }
    return y;
  }

  generatorPoly(nsym: number): number[] {
    let g = [1];
    for (let i = 0; i < nsym; i++) {
      g = this.polyMul(g, [1, this.exp[i]]);
    }
    return g;
  }
}

const gf = new GaloisField();

export function fecEncode(data: Uint8Array, eccSymbols: number = DEFAULT_ECC_SYMBOLS): Uint8Array {
  const g = gf.generatorPoly(eccSymbols);
  const out = new Uint8Array(data.length + eccSymbols);
  out.set(data, 0);

  // Polynomial division remainder
  const remainder = new Array(eccSymbols).fill(0);
  for (let i = 0; i < data.length; i++) {
    const feedback = data[i] ^ remainder[0];
    for (let j = 0; j < eccSymbols - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gf.mul(g[j + 1], feedback);
    }
    remainder[eccSymbols - 1] = gf.mul(g[eccSymbols], feedback);
  }

  for (let i = 0; i < eccSymbols; i++) {
    out[data.length + i] = remainder[i];
  }
  return out;
}

export function fecDecode(data: Uint8Array, eccSymbols: number = DEFAULT_ECC_SYMBOLS): Uint8Array | null {
  if (data.length <= eccSymbols) return null;

  // 1. Calculate syndromes: [0] + [eval(msg, alpha^i) for i in 0..nsym-1]
  const dataArr = Array.from(data);
  const syndromes = new Array(eccSymbols + 1).fill(0);
  let hasErrors = false;
  for (let i = 0; i < eccSymbols; i++) {
    const s = gf.polyEval(dataArr, gf.exp[i]);
    syndromes[i + 1] = s;
    if (s !== 0) hasErrors = true;
  }

  if (!hasErrors) {
    return data.subarray(0, data.length - eccSymbols);
  }

  // 2. Berlekamp-Massey algorithm
  let errLoc = [1];
  let oldLoc = [1];
  const syndShift = syndromes.length > eccSymbols ? syndromes.length - eccSymbols : 0;

  for (let i = 0; i < eccSymbols; i++) {
    const K = i + syndShift;
    let delta = syndromes[K];
    for (let j = 1; j < errLoc.length; j++) {
      delta ^= gf.mul(errLoc[errLoc.length - 1 - j], syndromes[K - j]);
    }
    oldLoc.push(0);
    if (delta !== 0) {
      if (oldLoc.length > errLoc.length) {
        const newLoc = oldLoc.map(v => gf.mul(v, delta));
        oldLoc = errLoc.map(v => gf.div(v, delta));
        errLoc = newLoc;
      }
      const scaledOld = oldLoc.map(v => gf.mul(v, delta));
      while (errLoc.length < scaledOld.length) errLoc.unshift(0);
      while (scaledOld.length < errLoc.length) scaledOld.unshift(0);
      for (let j = 0; j < errLoc.length; j++) {
        errLoc[j] ^= scaledOld[j];
      }
    }
  }

  while (errLoc.length > 1 && errLoc[0] === 0) {
    errLoc.shift();
  }

  const errs = errLoc.length - 1;
  if (errs * 2 > eccSymbols) {
    return null;
  }

  // 3. Chien search for error roots
  const errPos: number[] = [];
  const errLocRev = [...errLoc].reverse();
  for (let i = 0; i < data.length; i++) {
    if (gf.polyEval(errLocRev, gf.exp[i]) === 0) {
      errPos.push(data.length - 1 - i);
    }
  }

  if (errPos.length !== errs) {
    return null;
  }

  // 4. Forney algorithm for error magnitudes
  const coefPos = errPos.map(p => data.length - 1 - p);
  let eloc = [1];
  for (const cp of coefPos) {
    eloc = gf.polyMul(eloc, [gf.exp[cp], 1]);
  }

  const syndRev = [...syndromes].reverse();
  const prod = gf.polyMul(syndRev, eloc);
  const eevalRev = prod.slice(Math.max(0, prod.length - (eloc.length)));

  const X = coefPos.map(cp => gf.exp[((-(255 - cp)) % 255 + 255) % 255]);
  const corrected = new Uint8Array(data);

  for (let i = 0; i < X.length; i++) {
    const Xi = X[i];
    const XiInv = gf.div(1, Xi);

    let errLocPrime = 1;
    for (let j = 0; j < X.length; j++) {
      if (j !== i) {
        errLocPrime = gf.mul(errLocPrime, 1 ^ gf.mul(XiInv, X[j]));
      }
    }
    if (errLocPrime === 0) return null;

    const y = gf.mul(Xi, gf.polyEval(eevalRev, XiInv));
    const mag = gf.div(y, errLocPrime);
    corrected[errPos[i]] ^= mag;
  }

  // 5. Verification
  const correctedArr = Array.from(corrected);
  for (let i = 0; i < eccSymbols; i++) {
    if (gf.polyEval(correctedArr, gf.exp[i]) !== 0) {
      return null;
    }
  }

  return corrected.subarray(0, data.length - eccSymbols);
}

// ==========================================
// 4. SIMULATED LOW-BITRATE LINK
// ==========================================

export interface ChannelConfig {
  bitsPerSecond: number;
  bitErrorRate: number;
  baseLatencyMs: number;
}

export const DEFAULT_OFFLINE_CHANNEL_CONFIG: ChannelConfig = {
  bitsPerSecond: 1200,      // 1200 bps constrained radio link
  bitErrorRate: 0.001,      // 0.1% bit-error rate
  baseLatencyMs: 80,        // 80ms transmission delay
};

export class OfflineSimulatedLink {
  config: ChannelConfig;
  totalBitsSent: number = 0;

  constructor(config: ChannelConfig = DEFAULT_OFFLINE_CHANNEL_CONFIG) {
    this.config = config;
  }

  async send(data: Uint8Array): Promise<Uint8Array> {
    const numBits = data.length * 8;
    this.totalBitsSent += numBits;

    // Simulate propagation time based on bps
    const transmissionSeconds = numBits / this.config.bitsPerSecond;
    const totalDelayMs = this.config.baseLatencyMs + Math.round(transmissionSeconds * 1000);

    // Sleep to simulate link timing
    if (totalDelayMs > 0) {
      await new Promise<void>(resolve => setTimeout(() => resolve(), Math.min(1200, totalDelayMs)));
    }

    return this.corrupt(data);
  }

  private corrupt(data: Uint8Array): Uint8Array {
    if (this.config.bitErrorRate <= 0) return new Uint8Array(data);
    const copy = new Uint8Array(data);
    for (let i = 0; i < copy.length; i++) {
      for (let bit = 0; bit < 8; bit++) {
        if (Math.random() < this.config.bitErrorRate) {
          copy[i] ^= 1 << bit;
        }
      }
    }
    return copy;
  }

  resetBitCounter(): void {
    this.totalBitsSent = 0;
  }
}
