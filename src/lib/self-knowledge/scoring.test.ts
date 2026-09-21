import { describe, expect, it } from 'vitest';

import { ATTACHMENT_TEST } from './ecr-short';
import { BIG_FIVE_TEST } from './ipip50';
import {
  getSelfTest,
  invertLikert,
  scoreSelfTest,
  scoredItemValue,
  selfTestAcqTag,
  validateAnswers,
} from './scoring';
import type { LikertValue, SelfTestAnswers } from './types';

function allAnswers(
  def: typeof BIG_FIVE_TEST | typeof ATTACHMENT_TEST,
  value: LikertValue
): SelfTestAnswers {
  const out: SelfTestAnswers = {};
  for (const item of def.items) out[item.id] = value;
  return out;
}

describe('invertLikert / scoredItemValue', () => {
  it('inverse 1↔5, 2↔4, 3↔3', () => {
    expect(invertLikert(1)).toBe(5);
    expect(invertLikert(2)).toBe(4);
    expect(invertLikert(3)).toBe(3);
    expect(invertLikert(4)).toBe(2);
    expect(invertLikert(5)).toBe(1);
  });

  it('applique reverse seulement si reverse=true', () => {
    expect(scoredItemValue(1, false)).toBe(1);
    expect(scoredItemValue(1, true)).toBe(5);
    expect(scoredItemValue(5, true)).toBe(1);
  });

  it('rejette hors bornes', () => {
    expect(() => scoredItemValue(0 as LikertValue, false)).toThrow();
    expect(() => scoredItemValue(6 as LikertValue, false)).toThrow();
  });
});

describe('IPIP-50 Big Five scoring', () => {
  it('a exactement 50 items, 10 par trait', () => {
    expect(BIG_FIVE_TEST.items).toHaveLength(50);
    for (const key of ['O', 'C', 'E', 'A', 'N']) {
      expect(BIG_FIVE_TEST.items.filter((i) => i.key === key)).toHaveLength(10);
    }
  });

  it('compte les items reverse correctement', () => {
    const reverseCount = BIG_FIVE_TEST.items.filter((i) => i.reverse).length;
    expect(reverseCount).toBeGreaterThanOrEqual(16);
    expect(reverseCount).toBeLessThanOrEqual(24);
  });

  it('toutes réponses 5 → traits non-reverse au max, reverse au min contribution', () => {
    const scores = scoreSelfTest(BIG_FIVE_TEST, allAnswers(BIG_FIVE_TEST, 5));
    // Pour chaque trait: reverse items contribute 1, non-reverse contribute 5
    for (const key of BIG_FIVE_TEST.scoreKeys) {
      const items = BIG_FIVE_TEST.items.filter((i) => i.key === key);
      const expected = items.reduce((sum, item) => sum + (item.reverse ? 1 : 5), 0);
      expect(scores[key]).toBe(expected);
      expect(scores[key]).toBeGreaterThanOrEqual(10);
      expect(scores[key]).toBeLessThanOrEqual(50);
    }
  });

  it('toutes réponses 1 → miroir du cas 5', () => {
    const scores = scoreSelfTest(BIG_FIVE_TEST, allAnswers(BIG_FIVE_TEST, 1));
    for (const key of BIG_FIVE_TEST.scoreKeys) {
      const items = BIG_FIVE_TEST.items.filter((i) => i.key === key);
      const expected = items.reduce((sum, item) => sum + (item.reverse ? 5 : 1), 0);
      expect(scores[key]).toBe(expected);
    }
  });

  it('neutre 3 partout → 30 par trait', () => {
    const scores = scoreSelfTest(BIG_FIVE_TEST, allAnswers(BIG_FIVE_TEST, 3));
    for (const key of BIG_FIVE_TEST.scoreKeys) {
      expect(scores[key]).toBe(30);
    }
  });

  it('item reverse isolé : E2r=5 contribue 1 à Extraversion', () => {
    const answers = allAnswers(BIG_FIVE_TEST, 3);
    answers.E2r = 5;
    const scores = scoreSelfTest(BIG_FIVE_TEST, answers);
    // base 30, E2r was 3→3, now 5→1 → -2
    expect(scores.E).toBe(28);
  });

  it('refuse réponses manquantes', () => {
    expect(() => scoreSelfTest(BIG_FIVE_TEST, { E1: 3 })).toThrow(/manquantes/i);
  });
});

describe('ECR-S attachment scoring', () => {
  it('a 12 items (6 anxiety + 6 avoidance)', () => {
    expect(ATTACHMENT_TEST.items).toHaveLength(12);
    expect(ATTACHMENT_TEST.items.filter((i) => i.key === 'anxiety')).toHaveLength(6);
    expect(ATTACHMENT_TEST.items.filter((i) => i.key === 'avoidance')).toHaveLength(6);
  });

  it('moyenne 3.00 si tout neutre', () => {
    const scores = scoreSelfTest(ATTACHMENT_TEST, allAnswers(ATTACHMENT_TEST, 3));
    expect(scores.anxiety).toBe(3);
    expect(scores.avoidance).toBe(3);
  });

  it('gère les items reverse dans la moyenne', () => {
    const answers = allAnswers(ATTACHMENT_TEST, 1);
    // reverse anxiety ANX4r: raw 1 → scored 5
    // non-reverse anxiety: raw 1 → 1
    // mean anxiety = (1*5 + 5)/6 = 10/6 ≈ 1.67
    const scores = scoreSelfTest(ATTACHMENT_TEST, answers);
    const anxietyItems = ATTACHMENT_TEST.items.filter((i) => i.key === 'anxiety');
    const expected =
      Math.round(
        (anxietyItems.reduce((s, i) => s + (i.reverse ? 5 : 1), 0) / anxietyItems.length) * 100,
      ) / 100;
    expect(scores.anxiety).toBe(expected);
  });
});

describe('catalog & tags', () => {
  it('getSelfTest résout les 2 slugs', () => {
    expect(getSelfTest('big-five')?.slug).toBe('big-five');
    expect(getSelfTest('attachement')?.slug).toBe('attachement');
    expect(getSelfTest('profil-discipline')).toBeNull();
  });

  it('tags acq corrects', () => {
    expect(selfTestAcqTag('big-five')).toBe('test:big-five');
    expect(selfTestAcqTag('attachement')).toBe('test:attachement');
  });

  it('validateAnswers accepte un jeu complet', () => {
    expect(validateAnswers(BIG_FIVE_TEST, allAnswers(BIG_FIVE_TEST, 4)).ok).toBe(true);
  });
});
