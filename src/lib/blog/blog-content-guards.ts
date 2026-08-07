/**
 * Garde-fous anti-contenu template / doublons pour le blog.
 */

import { looksLikeGenericBlogOpener } from '@/lib/blog/blog-title-diversity';

/** Ancien fallbackContent() — sections figées à trous (commit 18fd42c). */
export const FALLBACK_CONTENT_MARKERS = [
  'Pourquoi ce sujet change ta pratique',
  'Un guide concret pour progresser en pilates',
  '3 actions simples à appliquer cette semaine',
  'Ce guide t\'aide à avancer concrètement',
  'Le contexte concret',
  'Exemple terrain',
  'Ce que tu peux retenir',
] as const;

/** CTA de fin validé (à conserver tel quel en queue d’article). */
export const BLOG_VALIDATED_CTA_HTML =
  '<p>Si cet article t\'aide, note-le et partage-le à une amie qui veut reprendre en douceur.</p>';

export const BLOG_VALIDATED_CTA_PLAIN =
  "Si cet article t'aide, note-le et partage-le à une amie qui veut reprendre en douceur.";

/** Même CTA, version espagnole (ne jamais laisser le FR en fin d’article ES). */
export const BLOG_VALIDATED_CTA_ES_HTML =
  '<p>Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera retomar con suavidad.</p>';

export const BLOG_VALIDATED_CTA_ES_PLAIN =
  'Si este artículo te ayuda, guárdalo y compártelo con una amiga que quiera retomar con suavidad.';

/** Minimum de mots réels (hors HTML) pour un corps publiable. */
export const BLOG_MIN_BODY_WORDS = 300;

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countBodyWords(html: string): number {
  const plain = stripHtmlToText(html);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/** Placeholder seed / template non résolu. */
export function containsArticlePilatesPlaceholder(text: string): boolean {
  return (
    /article\s+pilates\s*\d+/i.test(text) ||
    /mouvement\s*&\s*souffle/i.test(text) ||
    /description courte pour l['’]article\s*\d+/i.test(text)
  );
}

/**
 * Nettoie les glitches HTML typiques des réponses IA (ex. </em>"> ).
 */
export function sanitizeBlogContentHtml(html: string): string {
  let out = html.trim();
  out = out.replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, '');
  out = out.replace(/<\/(em|strong|i|b|span|u)>\s*["'«»]+>/gi, '</$1>');
  out = out.replace(/<\/(em|strong|i|b)>(["'])>/gi, '</$1>');
  out = out.replace(/(<\/(?:em|strong|i|b)>)\s*["'](?=\s*<)/gi, '$1');
  out = out.replace(/<((?:br|hr|img)[^>]*?)\s*>+/gi, '<$1>');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

/** Détecte le HTML/description issus de l’ancien fallbackContent template. */
export function looksLikeFallbackTemplate(contentHtml: string, description?: string | null): boolean {
  const haystack = `${contentHtml ?? ''}\n${description ?? ''}`;
  if (FALLBACK_CONTENT_MARKERS.some((marker) => haystack.includes(marker))) return true;
  if (containsArticlePilatesPlaceholder(haystack)) return true;
  return (
    looksLikeGenericBlogOpener(description ?? '') ||
    looksLikeGenericBlogOpener(stripHtmlToText(contentHtml ?? ''))
  );
}

/**
 * Force le CTA validé en fin d’article (retire les variantes proches, puis append).
 */
export function ensureValidatedBlogCta(contentHtml: string): string {
  let html = sanitizeBlogContentHtml(contentHtml);
  html = html.replace(/<p>\s*Si cet article t['’]aide[\s\S]*?<\/p>\s*$/i, '');
  html = html.replace(/<p>\s*Chez FitMangas[\s\S]{0,220}<\/p>\s*$/i, '');
  html = html.trim();
  html = html.replace(/<p>\s*Si cet article t['’]aide[\s\S]*?<\/p>\s*$/i, '').trim();
  return `${html}\n\n${BLOG_VALIDATED_CTA_HTML}`.trim();
}

/** Force le CTA ES validé en fin d’article ES (retire un CTA FR oublié ou une variante). */
export function ensureValidatedBlogCtaEs(contentHtml: string): string {
  let html = sanitizeBlogContentHtml(contentHtml);
  html = html.replace(/<p>\s*Si cet article t['’]aide[\s\S]*?<\/p>\s*$/i, '');
  html = html.replace(/<p>\s*Si este artículo te ayuda[\s\S]*?<\/p>\s*$/i, '');
  html = html.replace(/<p>\s*En FitMangas[\s\S]{0,220}<\/p>\s*$/i, '');
  return `${html.trim()}\n\n${BLOG_VALIDATED_CTA_ES_HTML}`.trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/article pilates \d+/gi, ' ')
      .replace(/[^a-z0-9àâäéèêëïîôùûüç\s]/gi, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
}

/** Similarité Jaccard sur tokens (0..1). */
export function contentSimilarity(aHtml: string, bHtml: string): number {
  const a = tokenize(stripHtmlToText(aHtml));
  const b = tokenize(stripHtmlToText(bHtml));
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const token of a) {
    if (b.has(token)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.82;

export type PublishGuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Empêche la publication d’un template de secours ou d’un contenu trop proche d’un autre article.
 */
export function assertContentSafeToPublish(params: {
  contentHtml: string;
  description?: string | null;
  existingContents?: Array<{ id: string; contentHtml: string }>;
  excludeArticleId?: string;
}): PublishGuardResult {
  if (looksLikeFallbackTemplate(params.contentHtml, params.description)) {
    return {
      allowed: false,
      reason: 'Contenu template de secours détecté — publication refusée.',
    };
  }

  if (containsArticlePilatesPlaceholder(params.contentHtml) || containsArticlePilatesPlaceholder(params.description ?? '')) {
    return {
      allowed: false,
      reason: 'Placeholder « Article pilates N » détecté — publication refusée.',
    };
  }

  const plain = stripHtmlToText(params.contentHtml);
  if (plain.length < 400 || countBodyWords(params.contentHtml) < BLOG_MIN_BODY_WORDS) {
    return {
      allowed: false,
      reason: `Contenu trop court pour publication (< ${BLOG_MIN_BODY_WORDS} mots).`,
    };
  }

  for (const existing of params.existingContents ?? []) {
    if (params.excludeArticleId && existing.id === params.excludeArticleId) continue;
    const score = contentSimilarity(params.contentHtml, existing.contentHtml);
    if (score >= DUPLICATE_SIMILARITY_THRESHOLD) {
      return {
        allowed: false,
        reason: `Contenu trop similaire à l’article ${existing.id} (score ${score.toFixed(2)}).`,
      };
    }
  }

  return { allowed: true };
}
