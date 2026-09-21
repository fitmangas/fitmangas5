import { ATTACHMENT_TEST } from './ecr-short';
import { BIG_FIVE_TEST } from './ipip50';
import {
  BIG_FIVE_120_TEST,
  domain120ToTrait50,
  FACET_DOMAIN,
  IPIP120_FACET_IDS,
} from './ipip120';
import type {
  BigFiveFormat,
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

export function getSelfTest(
  slug: string,
  format?: BigFiveFormat
): SelfTestDefinition | null {
  if (slug === 'big-five') {
    if (format === 'ipip-120') return BIG_FIVE_120_TEST;
    return BIG_FIVE_TEST;
  }
  if (slug === 'attachement') return ATTACHMENT_TEST;
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

function isIpip120(def: SelfTestDefinition): boolean {
  return def.format === 'ipip-120' || def.version.includes('120');
}

function scoreBigFive120(
  def: SelfTestDefinition,
  answers: SelfTestAnswers
): SelfTestScores {
  const facetKeys = def.facetKeys ?? [...IPIP120_FACET_IDS];
  const facetBuckets: Record<string, number[]> = {};
  for (const key of facetKeys) facetBuckets[key] = [];

  for (const item of def.items) {
    const raw = answers[item.id]!;
    const v = scoredItemValue(raw, item.reverse, def.likertMax);
    if (!facetBuckets[item.key]) facetBuckets[item.key] = [];
    facetBuckets[item.key]!.push(v);
  }

  const scores: SelfTestScores = {};
  for (const fid of facetKeys) {
    const arr = facetBuckets[fid] ?? [];
    scores[fid] = arr.reduce((a, b) => a + b, 0);
  }

  const domainRaw: Record<'E' | 'A' | 'C' | 'O' | 'N', number> = {
    E: 0,
    A: 0,
    C: 0,
    O: 0,
    N: 0,
  };

  for (const fid of facetKeys) {
    const domain = FACET_DOMAIN[fid];
    if (domain) domainRaw[domain] += scores[fid] ?? 0;
  }

  scores.E = domain120ToTrait50(domainRaw.E);
  scores.A = domain120ToTrait50(domainRaw.A);
  scores.C = domain120ToTrait50(domainRaw.C);
  scores.O = domain120ToTrait50(domainRaw.O);
  scores.ES = domain120ToTrait50(144 - domainRaw.N);

  return scores;
}

/**
 * Agrège les scores.
 * Big Five IPIP-50 → sommes 10–50.
 * Big Five IPIP-120 → facettes 4–20 + domaines normalisés 10–50.
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

  if (def.slug === 'big-five' && isIpip120(def)) {
    return scoreBigFive120(def, answers);
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
