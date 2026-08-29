/** Partagé client + serveur — pas de node:fs. */

export const OVERLAY_FONT_FAMILY = 'FitMangasSocialOverlay';
export const OVERLAY_FONT_PUBLIC_PATH = '/fonts/PlayfairDisplay-Bold.ttf';
export const OVERLAY_FONT_CSS_STACK = `${OVERLAY_FONT_FAMILY}, Georgia, 'Times New Roman', serif`;
export const OVERLAY_FONT_SIZE = 52;
export const OVERLAY_LINE_HEIGHT = 58;
export const OVERLAY_FONT_WEIGHT = 700;
/** ~12 % de marge de chaque côté sur 1080 px. */
export const OVERLAY_MAX_WIDTH_RATIO = 0.76;
export const OVERLAY_MIN_FONT_SIZE = 40;

/** Évite les tofu □ (apostrophes typographiques, tirets Unicode, etc.). */
export function normalizeOverlayForRender(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u2032/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2014/g, ' - ')
    .replace(/\u2013/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('fr-FR');
}

export function wrapOverlayLines(text: string, maxChars = 36): string[] {
  const normalized = normalizeOverlayForRender(text);
  const numbered = normalized.match(/^(\d+[.)]\s+)(.+)$/);
  const prefix = numbered ? numbered[1]! : '';
  const words = (numbered ? numbered[2]! : normalized).split(/\s+/).filter(Boolean);
  const firstBudget = Math.max(12, maxChars - prefix.length);
  const lines: string[] = [];
  let line = '';
  let budget = firstBudget;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > budget) {
      if (line) lines.push(lines.length === 0 && prefix ? `${prefix}${line}` : line);
      line = word;
      budget = maxChars;
    } else {
      line = test;
    }
  }
  if (line) lines.push(lines.length === 0 && prefix ? `${prefix}${line}` : line);
  return lines.slice(0, 4);
}

export function isLibraryImagePath(imagePath: string): boolean {
  return /\/library\//.test(imagePath);
}
