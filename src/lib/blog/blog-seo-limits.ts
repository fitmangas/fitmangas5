/**
 * Limites SEO dures FitMangas (Score SEO admin = titre < 60, description < 160).
 * À appliquer en génération ET en écriture DB — pas seulement « conseillé » dans le prompt.
 */

/** Max inclusif pour passer `title.length < 60`. */
export const BLOG_SEO_TITLE_MAX = 59;
/** Max inclusif pour passer `description.length < 160`. */
export const BLOG_SEO_META_MAX = 159;

export function truncateSeoText(value: string, maxLength: number): string {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;

  const slice = text.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  if (sentenceEnd >= Math.floor(maxLength * 0.55) && sentenceEnd < maxLength) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace >= Math.floor(maxLength * 0.55)) {
    let trimmed = cut
      .slice(0, lastSpace)
      .replace(/[,;:.–—-]+$/g, '')
      .trim();
    // Évite les fins orphelines FR / ES
    trimmed = trimmed.replace(
      /\s+(et|ou|de|du|des|le|la|les|un|une|en|au|aux|pour|sans|avec|sur|dans|par|à|y|el|los|las|una|para|sin|con|por)$/i,
      '',
    );
    if (trimmed.length > 0 && trimmed.length <= maxLength) return trimmed;
  }

  return `${cut.slice(0, Math.max(1, maxLength - 1)).replace(/[\s,;:.–—-]+$/g, '')}…`.slice(0, maxLength);
}

/** Garantit titre SEO < 60 caractères. */
export function enforceBlogSeoTitle(title: string): string {
  return truncateSeoText(title, BLOG_SEO_TITLE_MAX);
}

/** Garantit meta/description SEO < 160 caractères. */
export function enforceBlogSeoMeta(meta: string): string {
  return truncateSeoText(meta, BLOG_SEO_META_MAX);
}

export function isBlogSeoTitleOk(title: string): boolean {
  const t = (title || '').trim();
  return t.length > 0 && t.length < 60;
}

export function isBlogSeoMetaOk(meta: string): boolean {
  const t = (meta || '').trim();
  return t.length > 0 && t.length < 160;
}
