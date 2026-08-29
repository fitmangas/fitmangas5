import fs from 'node:fs';
import path from 'node:path';

import opentype from 'opentype.js';

import {
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

const OVERLAY_FONT_SIZE = 48;
const OVERLAY_LINE_HEIGHT = 58;

function resolvePublicFile(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', rel);
}

let cachedFont: opentype.Font | null = null;

function getOverlayFont(): opentype.Font {
  if (cachedFont) return cachedFont;
  for (const file of OVERLAY_FONT_FILES) {
    const fontPath = resolvePublicFile(`/fonts/${file}`);
    if (fs.existsSync(fontPath)) {
      cachedFont = opentype.loadSync(fontPath);
      return cachedFont;
    }
  }
  throw new Error('Police overlay introuvable (public/fonts/Roboto-Bold.ttf ou équivalent).');
}

function buildTextPathLayers(
  font: opentype.Font,
  lines: string[],
  width: number,
  startY: number,
): string {
  return lines
    .map((line, index) => {
      const y = startY + index * OVERLAY_LINE_HEIGHT;
      const advance = font.getAdvanceWidth(line, OVERLAY_FONT_SIZE);
      const x = (width - advance) / 2;
      const d = font.getPath(line, x, y, OVERLAY_FONT_SIZE).toPathData(2);
      return `
        <path d="${d}" fill="none" stroke="rgba(20,16,14,0.55)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${d}" fill="#FFFAF5"/>
      `;
    })
    .join('\n');
}

/**
 * Texte en chemins vectoriels — librsvg/sharp ignore @font-face embarqué (<text> = carrés blancs).
 */
export function buildOverlaySvg(
  width: number,
  height: number,
  lines: string[],
  options?: { anchorBottom?: number },
): Buffer {
  const font = getOverlayFont();
  const anchorBottom = options?.anchorBottom ?? 140;
  const startY = height - anchorBottom - (lines.length - 1) * OVERLAY_LINE_HEIGHT;
  const textSvg = buildTextPathLayers(font, lines, width, startY);

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
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
