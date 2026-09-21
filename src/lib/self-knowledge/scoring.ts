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

/**
 * Inverse Likert : max+1 − value.
 * IPIP 1–5 → 6−v ; ECR-S 1–7 → 8−v.
 */
export function invertLikert(value: LikertValue, likertMax: 5 | 7 = 5): number {
  return likertMax + 1 - value;
}

export function scoredItemValue(
  raw: LikertValue,
  reverse: boolean | undefined,
  likertMax: 5 | 7 = 5
): number {
  if (raw < 1 || raw > likertMax) {
    throw new Error(`Réponse Likert hors bornes: ${raw} (max ${likertMax})`);
  }
  return reverse ? invertLikert(raw, likertMax) : raw;
}

/**
 * Agrège les scores.
 * Big Five → sommes 10–50.
 * Attachment ECR-S → moyennes 1–7 (2 décimales).
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
    const v = scoredItemValue(raw, item.reverse, def.likertMax);
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
  const max = def.likertMax;
  for (const item of def.items) {
    const v = answers[item.id];
    if (v == null) return { ok: false, error: `Réponse manquante: ${item.id}` };
    if (!Number.isInteger(v) || v < 1 || v > max) {
      return { ok: false, error: `Valeur invalide pour ${item.id}` };
    }
  }
  return { ok: true };
}

/** Acq tag for lead capture */
export function selfTestAcqTag(slug: SelfTestSlug): string {
  return slug === 'big-five' ? 'test:big-five' : 'test:attachement';
}
