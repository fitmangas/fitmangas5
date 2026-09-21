import { ATTACHMENT_TEST } from './ecr-short';
import { BIG_FIVE_TEST } from './ipip50';
import type {
  LikertValue,
  SelfTestAnswers,
  SelfTestDefinition,
  SelfTestScores,
  SelfTestSlug,
} from './types';

export const SELF_TESTS: Record<SelfTestSlug, SelfTestDefinition> = {
  'big-five': BIG_FIVE_TEST,
  attachement: ATTACHMENT_TEST,
};

export const SELF_TEST_SLUGS: SelfTestSlug[] = ['big-five', 'attachement'];

export function getSelfTest(slug: string): SelfTestDefinition | null {
  if (slug === 'big-five' || slug === 'attachement') return SELF_TESTS[slug];
  return null;
}

/** Invert Likert 1–5 → 6 − value */
export function invertLikert(value: LikertValue): LikertValue {
  return (6 - value) as LikertValue;
}

export function scoredItemValue(
  raw: LikertValue,
  reverse: boolean | undefined
): number {
  if (raw < 1 || raw > 5) {
    throw new Error(`Réponse Likert hors bornes: ${raw}`);
  }
  return reverse ? invertLikert(raw) : raw;
}

/**
 * Sum scores per key. Big Five → totals 10–50.
 * Attachment → mean 1–5 per subscale (rounded 2 decimals).
 */
export function scoreSelfTest(
  def: SelfTestDefinition,
  answers: SelfTestAnswers
): SelfTestScores {
  const missing = def.items.filter((item) => answers[item.id] == null);
  if (missing.length > 0) {
    throw new Error(
      `Réponses manquantes: ${missing.map((m) => m.id).join(', ')}`
    );
  }

  const buckets: Record<string, number[]> = {};
  for (const key of def.scoreKeys) buckets[key] = [];

  for (const item of def.items) {
    const raw = answers[item.id]!;
    const v = scoredItemValue(raw, item.reverse);
    buckets[item.key]!.push(v);
  }

  const scores: SelfTestScores = {};
  if (def.slug === 'big-five') {
    for (const key of def.scoreKeys) {
      scores[key] = buckets[key]!.reduce((a, b) => a + b, 0);
    }
  } else {
    for (const key of def.scoreKeys) {
      const arr = buckets[key]!;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      scores[key] = Math.round(mean * 100) / 100;
    }
  }
  return scores;
}

export function validateAnswers(
  def: SelfTestDefinition,
  answers: SelfTestAnswers
): { ok: true } | { ok: false; error: string } {
  for (const item of def.items) {
    const v = answers[item.id];
    if (v == null) return { ok: false, error: `Réponse manquante: ${item.id}` };
    if (![1, 2, 3, 4, 5].includes(v)) {
      return { ok: false, error: `Valeur invalide pour ${item.id}` };
    }
  }
  return { ok: true };
}

/** Acq tag for lead capture */
export function selfTestAcqTag(slug: SelfTestSlug): string {
  return slug === 'big-five' ? 'test:big-five' : 'test:attachement';
}
