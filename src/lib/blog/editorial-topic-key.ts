export const TOPIC_KEY_PREFIX = 'topic:';

export function formatSeoKeywordsWithTopic(topicId: string, keywords: string | null | undefined): string {
  const cleanId = topicId.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const base = (keywords ?? '').trim().replace(/^topic:[^,]+,?\s*/i, '');
  return base ? `topic:${cleanId}, ${base}` : `topic:${cleanId}`;
}

/** Marqueur stocké dans seo_keywords quand Unsplash a échoué (image de secours locale). */
export const IMAGE_SOURCE_FALLBACK_TAG = 'imageSource:fallback';

export function withImageSourceFallbackTag(seoKeywords: string | null | undefined): string {
  const base = (seoKeywords ?? '').trim().replace(/(?:^|,\s*)imageSource:fallback\b/gi, '').replace(/^,\s*|,\s*$/g, '').trim();
  return base ? `${base}, ${IMAGE_SOURCE_FALLBACK_TAG}` : IMAGE_SOURCE_FALLBACK_TAG;
}

export function hasImageSourceFallbackTag(seoKeywords: string | null | undefined): boolean {
  return /(?:^|,\s*)imageSource:fallback\b/i.test(seoKeywords ?? '');
}

export function extractTopicId(seoKeywords: string | null | undefined): string | null {
  if (!seoKeywords?.trim()) return null;
  const match = /(?:^|,\s*)topic:([^,\s]+)/i.exec(seoKeywords);
  return match?.[1]?.trim() ?? null;
}

export function extractTopicIdsFromRows(rows: Array<{ seo_keywords: string | null }>): Set<string> {
  const used = new Set<string>();
  for (const row of rows) {
    const id = extractTopicId(row.seo_keywords);
    if (id) used.add(id);
  }
  return used;
}
