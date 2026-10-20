/** Alerte sujet proche (calendrier éditorial) — aucun article fusionné. */

export function nearbyKeywordAlert(candidate: string, existingTitles: string[]): string | null {
  const needle = candidate
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const words = needle.split(/[^a-z0-9]+/).filter((w) => w.length >= 5);
  if (!words.length) return null;
  for (const title of existingTitles) {
    const hay = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
    const hit = words.find((w) => hay.includes(w));
    if (hit) {
      return `Sujet proche de « ${title} » (mot-clé « ${hit} »). Propose un angle distinct, sans fusionner.`;
    }
  }
  return null;
}

export function readableArticleSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}
