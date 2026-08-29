import fs from 'node:fs';
import path from 'node:path';

import opentype from 'opentype.js';

import {
  OVERLAY_FONT_SIZE,
  OVERLAY_LINE_HEIGHT,
  OVERLAY_MAX_WIDTH_RATIO,
  OVERLAY_MIN_FONT_SIZE,
  normalizeOverlayForRender,
} from '@/lib/admin/social-overlay-text-shared';

/** Serif éditorial FitMangas — SemiBold statique (meilleur rendu que Variable sur librsvg). */
const OVERLAY_FONT_FILES = [
  'PlayfairDisplay-Variable.ttf',
  'PlayfairDisplay-SemiBold.ttf',
  'Roboto-Bold.ttf',
];

function resolvePublicFile(publicPath: string): string {
  const rel = publicPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', rel);
}

let cachedFont: opentype.Font | null = null;

export function getOverlayFont(): opentype.Font {
  if (cachedFont) return cachedFont;
  for (const file of OVERLAY_FONT_FILES) {
    const fontPath = resolvePublicFile(`/fonts/${file}`);
    if (fs.existsSync(fontPath)) {
      cachedFont = opentype.loadSync(fontPath);
      return cachedFont;
    }
  }
  throw new Error('Police overlay introuvable (public/fonts/PlayfairDisplay-Variable.ttf).');
}

function lineWidth(font: opentype.Font, line: string, fontSize: number): number {
  return font.getAdvanceWidth(line, fontSize);
}

/** Retour à la ligne selon la largeur réelle en pixels (pas un nombre de caractères). */
export function wrapOverlayLinesToWidth(
  font: opentype.Font,
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const normalized = normalizeOverlayForRender(text);
  const numbered = normalized.match(/^(\d+[.)]\s+)(.+)$/);
  const prefix = numbered ? numbered[1]! : '';
  const words = (numbered ? numbered[2]! : normalized).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  let prefixPending = Boolean(prefix);

  const fits = (candidate: string) => lineWidth(font, candidate, fontSize) <= maxWidth;

  for (const word of words) {
    if (!line) {
      const starter = prefixPending ? `${prefix}${word}` : word;
      if (fits(starter)) {
        line = starter;
        prefixPending = false;
        continue;
      }
      if (prefixPending && prefix) {
        lines.push(prefix.trim());
        prefixPending = false;
        line = fits(word) ? word : '';
        if (!line && word) lines.push(word);
        continue;
      }
      line = word;
      continue;
    }

    const next = `${line} ${word}`;
    if (fits(next)) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export function fitOverlayTextLayout(
  font: opentype.Font,
  text: string,
  canvasWidth: number,
): { lines: string[]; fontSize: number; maxWidth: number } {
  const maxWidth = canvasWidth * OVERLAY_MAX_WIDTH_RATIO;
  let fontSize = OVERLAY_FONT_SIZE;

  while (fontSize >= OVERLAY_MIN_FONT_SIZE) {
    const lines = wrapOverlayLinesToWidth(font, text, maxWidth, fontSize);
    const widest = Math.max(0, ...lines.map((line) => lineWidth(font, line, fontSize)));
    if (widest <= maxWidth) {
      return { lines, fontSize, maxWidth };
    }
    fontSize -= 2;
  }

  const lines = wrapOverlayLinesToWidth(font, text, maxWidth, OVERLAY_MIN_FONT_SIZE);
  return { lines, fontSize: OVERLAY_MIN_FONT_SIZE, maxWidth };
}

function buildTextPathLayers(
  font: opentype.Font,
  lines: string[],
  width: number,
  startY: number,
  fontSize: number,
  lineHeight: number,
): string {
  return lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      const advance = lineWidth(font, line, fontSize);
      const x = (width - advance) / 2;
      const d = font.getPath(line, x, y, fontSize).toPathData(2);
      return `<path d="${d}" fill="#FFFAF5"/>`;
    })
    .join('\n');
}

/**
 * Texte en chemins vectoriels — librsvg/sharp ignore @font-face embarqué (<text> = carrés blancs).
 */
export function buildOverlaySvg(
  width: number,
  height: number,
  overlayText: string,
  options?: { anchorBottom?: number },
): Buffer {
  const font = getOverlayFont();
  const { lines, fontSize } = fitOverlayTextLayout(font, overlayText, width);
  const lineHeight = Math.round(fontSize * (OVERLAY_LINE_HEIGHT / OVERLAY_FONT_SIZE));
  const anchorBottom = options?.anchorBottom ?? 140;
  const startY = height - anchorBottom - (lines.length - 1) * lineHeight;
  const textSvg = buildTextPathLayers(font, lines, width, startY, fontSize, lineHeight);

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
