import fs from 'node:fs';
import path from 'node:path';

import {
  OVERLAY_FONT_CSS_STACK,
  OVERLAY_FONT_FAMILY,
  normalizeOverlayForRender,
  wrapOverlayLines,
} from '@/lib/admin/social-overlay-text-shared';

/** Sans-serif statique — fiable sur Vercel (librsvg) et proche IG/FB. */
const OVERLAY_FONT_FILES = [
  'Roboto-Bold.ttf',
  'Inter-Bold.ttf',
  'PlayfairDisplay-SemiBold.ttf',
  'PlayfairDisplay-Variable.ttf',
];

function resolvePublicFile(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', rel);
}

let cachedFontBase64: string | null = null;

export function getOverlayFontBase64(): string {
  if (cachedFontBase64) return cachedFontBase64;
  for (const file of OVERLAY_FONT_FILES) {
    const fontPath = resolvePublicFile(`/fonts/${file}`);
    if (fs.existsSync(fontPath)) {
      cachedFontBase64 = fs.readFileSync(fontPath).toString('base64');
      return cachedFontBase64;
    }
  }
  throw new Error('Police overlay introuvable (public/fonts/Roboto-Bold.ttf ou équivalent).');
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildOverlaySvg(
  width: number,
  height: number,
  lines: string[],
  options?: { anchorBottom?: number },
): Buffer {
  const fontBase64 = getOverlayFontBase64();
  const anchorBottom = options?.anchorBottom ?? 140;
  const startY = height - anchorBottom - (lines.length - 1) * 58;
  const textSvg = lines
    .map(
      (line, index) =>
        `<text x="${width / 2}" y="${startY + index * 58}" text-anchor="middle" font-family="${OVERLAY_FONT_CSS_STACK}" font-size="48" font-weight="700" fill="#FFFAF5" stroke="rgba(20,16,14,0.55)" stroke-width="3" paint-order="stroke fill">${escapeXml(line)}</text>`,
    )
    .join('\n');

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style type="text/css"><![CDATA[
          @font-face {
            font-family: '${OVERLAY_FONT_FAMILY}';
            src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
            font-weight: 700;
            font-style: normal;
          }
        ]]></style>
        <linearGradient id="g" x1="0" y1="${Math.round(height * 0.55)}" x2="0" y2="${height}" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(30,24,20,0)"/>
          <stop offset="100%" stop-color="rgba(30,24,20,0.82)"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      ${textSvg}
    </svg>
  `);
}

export { normalizeOverlayForRender, wrapOverlayLines, isLibraryImagePath } from '@/lib/admin/social-overlay-text-shared';
