import { deflateSync } from 'node:zlib';

import type { ImageGenerateResult, ImageProvider, ImageSize } from '@/lib/admin/image-providers/types';

/** Cream marque FitMangas. */
export const BRAND_CREAM = { r: 0xff, g: 0xfa, b: 0xf5 };
/** Terracotta marque FitMangas. */
export const BRAND_TERRACOTTA = { r: 0xc4, g: 0x5d, b: 0x3e };

function crcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crcTable();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/**
 * PNG RGB 8-bit sans dépendance externe.
 * Fond cream + bande / accent terracotta (respiration visuelle / citation).
 */
export function renderBrandBackgroundPng(
  width: number,
  height: number,
  variant: 'solid' | 'accent-bar' | 'quote-frame' = 'quote-frame',
): Buffer {
  const w = Math.max(64, Math.min(2160, Math.round(width)));
  const h = Math.max(64, Math.min(2700, Math.round(height)));
  const rowSize = 1 + w * 3;
  const raw = Buffer.alloc(rowSize * h);

  for (let y = 0; y < h; y += 1) {
    const row = y * rowSize;
    raw[row] = 0; // filter none
    for (let x = 0; x < w; x += 1) {
      let r = BRAND_CREAM.r;
      let g = BRAND_CREAM.g;
      let b = BRAND_CREAM.b;

      if (variant === 'accent-bar') {
        const barTop = Math.floor(h * 0.72);
        const barBottom = Math.floor(h * 0.78);
        if (y >= barTop && y <= barBottom && x >= Math.floor(w * 0.18) && x <= Math.floor(w * 0.82)) {
          r = BRAND_TERRACOTTA.r;
          g = BRAND_TERRACOTTA.g;
          b = BRAND_TERRACOTTA.b;
        }
      } else if (variant === 'quote-frame') {
        const marginX = Math.floor(w * 0.08);
        const marginY = Math.floor(h * 0.12);
        const border = Math.max(3, Math.floor(w * 0.006));
        const inOuter = x >= marginX && x < w - marginX && y >= marginY && y < h - marginY;
        const inInner =
          x >= marginX + border &&
          x < w - marginX - border &&
          y >= marginY + border &&
          y < h - marginY - border;
        if (inOuter && !inInner) {
          r = BRAND_TERRACOTTA.r;
          g = BRAND_TERRACOTTA.g;
          b = BRAND_TERRACOTTA.b;
        }
        // Accent pill bas (fitmangas.com zone)
        const pillY0 = Math.floor(h * 0.86);
        const pillY1 = Math.floor(h * 0.91);
        const pillX0 = Math.floor(w * 0.32);
        const pillX1 = Math.floor(w * 0.68);
        if (y >= pillY0 && y <= pillY1 && x >= pillX0 && x <= pillX1) {
          r = BRAND_TERRACOTTA.r;
          g = BRAND_TERRACOTTA.g;
          b = BRAND_TERRACOTTA.b;
        }
      }

      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export class BrandBackgroundProvider implements ImageProvider {
  readonly name = 'brand';

  isAvailable(): boolean {
    return true;
  }

  async generate(prompt: string, size: ImageSize): Promise<ImageGenerateResult> {
    const lower = prompt.toLowerCase();
    const variant =
      lower.includes('accent') || lower.includes('bar')
        ? 'accent-bar'
        : lower.includes('solid')
          ? 'solid'
          : 'quote-frame';
    try {
      const buffer = renderBrandBackgroundPng(size.width, size.height, variant);
      return { buffer, mimeType: 'image/png', provider: this.name };
    } catch (e) {
      return {
        error: `Fond de marque local échoué : ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}
