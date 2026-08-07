import type { SocialLocale } from '@/lib/admin/social-comms';

/** Détecte un whyItWorks clairement en anglais sur un post FR/ES. */
export function whyItWorksLooksEnglish(text: string): boolean {
  const t = (text || '').trim();
  if (!t || t.length < 12) return false;
  const enHits =
    /\b(this|that|because|works|women|body|pilates|helps|makes|your|you're|doesn't|isn't|strength|posture|core)\b/i.test(
      t,
    );
  const frHits = /\b(parce|que|ton|ta|tes|corps|femme|femmes|dos|hanches|respiration|parce que|c'est|n'est)\b/i.test(
    t,
  );
  const esHits = /\b(porque|tu|tus|cuerpo|mujer|mujeres|espalda|caderas|respiración|esto|no es)\b/i.test(t);
  if (!enHits) return false;
  // Anglais dominant si peu d’ancres FR/ES
  return !frHits && !esHits;
}

export function whyItWorksNeedsReviewForLocale(text: string, locale: SocialLocale): boolean {
  const t = (text || '').trim();
  if (!t) return false;
  if (whyItWorksLooksEnglish(t) && (locale === 'fr' || locale === 'es')) return true;
  if (locale === 'es' && /\b(parce que|c'est|ton dos|tes hanches|femmes)\b/i.test(t) && !/\b(porque|tu|cuerpo)\b/i.test(t)) {
    return true;
  }
  if (locale === 'fr' && /\b(porque|tu pelvis|tus caderas)\b/i.test(t) && !/\b(parce|ton|tes)\b/i.test(t)) {
    return true;
  }
  return false;
}

/** Marque les variantes ES liées à un post FR comme périmées. */
export function markSpanishVariantsStale<T extends { id: string; locale: SocialLocale; adaptedFromId: string | null; esStale?: boolean; updatedAt: string }>(
  posts: T[],
  frenchPostId: string,
  now = new Date().toISOString(),
): T[] {
  return posts.map((p) =>
    p.locale === 'es' && p.adaptedFromId === frenchPostId
      ? { ...p, esStale: true, updatedAt: now }
      : p,
  );
}
