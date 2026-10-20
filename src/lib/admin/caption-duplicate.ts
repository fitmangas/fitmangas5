/** Similarité de mots (Jaccard) — alerte doublon publications, sans IA. */

export function tokenizeCaption(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/https?:\/\/\S+/g, ' ')
      .split(/[^a-z0-9à-ÿ]+/i)
      .map((w) => w.trim())
      .filter((w) => w.length >= 3),
  );
}

export function captionWordSimilarity(a: string, b: string): number {
  const left = tokenizeCaption(a);
  const right = tokenizeCaption(b);
  if (!left.size || !right.size) return 0;
  let inter = 0;
  for (const w of left) if (right.has(w)) inter += 1;
  const union = left.size + right.size - inter;
  return union ? inter / union : 0;
}

export function findDuplicateCaption<T extends { id: string; caption: string; plannedAt?: string | null; createdAt?: string | null }>(
  candidate: string,
  others: T[],
  now = Date.now(),
  windowMs = 60 * 86400000,
): { post: T; score: number } | null {
  const cap = candidate.trim();
  if (!cap) return null;
  let best: { post: T; score: number } | null = null;
  for (const post of others) {
    const when = Date.parse(post.plannedAt || post.createdAt || '');
    if (Number.isFinite(when) && now - when > windowMs) continue;
    const score = captionWordSimilarity(cap, post.caption);
    if (score > 0.8 && (!best || score > best.score)) best = { post, score };
  }
  return best;
}

export function stripDuplicateTrialCta(caption: string): string {
  const lines = caption.split('\n');
  const trialRe = /essai gratuit 7 jours/i;
  let seen = false;
  const kept: string[] = [];
  for (const line of lines) {
    if (trialRe.test(line)) {
      if (seen) continue;
      seen = true;
    }
    kept.push(line);
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
