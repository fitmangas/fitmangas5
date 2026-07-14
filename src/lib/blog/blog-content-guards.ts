/**
 * Garde-fous anti-contenu template / doublons pour le blog.
 */

export const FALLBACK_CONTENT_MARKERS = [
  'Pourquoi ce sujet change ta pratique',
  'Un guide concret pour progresser en pilates',
  '3 actions simples à appliquer cette semaine',
  'Ce guide t\'aide à avancer concrètement',
] as const;

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nettoie les glitches HTML typiques des réponses IA (ex. </em>"> ).
 */
export function sanitizeBlogContentHtml(html: string): string {
  let out = html.trim();
  out = out.replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, '');
  // </em>">  ou </strong>'> etc.
  out = out.replace(/<\/(em|strong|i|b|span|u)>\s*["'«»]+>/gi, '</$1>');
  out = out.replace(/<\/(em|strong|i|b)>(["'])>/gi, '</$1>');
  // Guillemets orphelins collés après une balise fermante dans une citation
  out = out.replace(/(<\/(?:em|strong|i|b)>)\s*["'](?=\s*<)/gi, '$1');
  // Balises auto-fermantes mal formées
  out = out.replace(/<((?:br|hr|img)[^>]*?)\s*>+/gi, '<$1>');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

/** Détecte le HTML/description issus de l’ancien fallbackContent template. */
export function looksLikeFallbackTemplate(contentHtml: string, description?: string | null): boolean {
  const haystack = `${contentHtml ?? ''}\n${description ?? ''}`;
  return FALLBACK_CONTENT_MARKERS.some((marker) => haystack.includes(marker));
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

  const plain = stripHtmlToText(params.contentHtml);
  if (plain.length < 400) {
    return {
      allowed: false,
      reason: 'Contenu trop court pour publication.',
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
