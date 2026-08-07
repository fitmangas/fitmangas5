import { createHash } from 'crypto';

export type TranslationReadyInput = {
  title_en: string | null;
  title_es: string | null;
  content_en: string | null;
  content_es: string | null;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function hasCompleteTranslations(article: TranslationReadyInput): boolean {
  return hasText(article.title_en) && hasText(article.title_es) && hasText(article.content_en) && hasText(article.content_es);
}

const ES_SYNC_TAG_RE = /(?:^|,\s*)esSync:([a-f0-9]{8,16})\b/i;

export function computeFrenchSourceHash(fields: {
  title_fr?: string | null;
  description_fr?: string | null;
  content_fr?: string | null;
  meta_description_fr?: string | null;
}): string {
  const raw = [
    fields.title_fr ?? '',
    fields.description_fr ?? '',
    fields.content_fr ?? '',
    fields.meta_description_fr ?? '',
  ]
    .map((s) => s.trim())
    .join('\u0001');
  return createHash('sha256').update(raw).digest('hex').slice(0, 12);
}

export function extractEsSyncHash(seoKeywords: string | null | undefined): string | null {
  const m = ES_SYNC_TAG_RE.exec(seoKeywords ?? '');
  return m?.[1]?.toLowerCase() ?? null;
}

export function withEsSyncHash(seoKeywords: string | null | undefined, hash: string): string {
  const cleaned = (seoKeywords ?? '').replace(ES_SYNC_TAG_RE, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
  const tag = `esSync:${hash}`;
  return cleaned ? `${cleaned}, ${tag}` : tag;
}

export function clearEsSyncHash(seoKeywords: string | null | undefined): string | null {
  const cleaned = (seoKeywords ?? '').replace(ES_SYNC_TAG_RE, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
  return cleaned || null;
}

/**
 * ES « prête » = champs ES présents ET synchronisés avec le FR (hash esSync).
 * Sans hash (articles legacy) : présence title_es + content_es uniquement,
 * mais description/meta FR non vides exigent leurs pendants ES.
 */
export function hasCompleteSpanishTranslation(
  article: Pick<TranslationReadyInput, 'title_es' | 'content_es'> & {
    description_es?: string | null;
    meta_description_es?: string | null;
    title_fr?: string | null;
    description_fr?: string | null;
    content_fr?: string | null;
    meta_description_fr?: string | null;
    seo_keywords?: string | null;
  },
): boolean {
  if (!hasText(article.title_es) || !hasText(article.content_es)) return false;
  if (hasText(article.description_fr) && !hasText(article.description_es)) return false;
  if (hasText(article.meta_description_fr) && !hasText(article.meta_description_es)) return false;

  const stored = extractEsSyncHash(article.seo_keywords);
  if (stored) {
    const current = computeFrenchSourceHash(article);
    return stored === current;
  }
  // Legacy sans hash : présence seule (invalidation FR doit nullifier ES).
  return true;
}
