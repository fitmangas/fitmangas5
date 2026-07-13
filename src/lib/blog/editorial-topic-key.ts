export const TOPIC_KEY_PREFIX = 'topic:';

export function formatSeoKeywordsWithTopic(topicId: string, keywords: string): string {
  const cleanId = topicId.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const base = keywords.trim().replace(/^topic:[^,]+,?\s*/i, '');
  return base ? `topic:${cleanId}, ${base}` : `topic:${cleanId}`;
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
