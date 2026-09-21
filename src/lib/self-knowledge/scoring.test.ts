import { describe, expect, it } from 'vitest';

import { ATTACHMENT_TEST, ECR_OFFICIAL_REVERSE_COUNTS, ECR_SHORT_ITEMS } from './ecr-short';
import { BIG_FIVE_TEST, IPIP50_ITEMS, IPIP50_OFFICIAL_REVERSE_COUNTS } from './ipip50';
import {
  getSelfTest,
  invertLikert,
  scoreSelfTest,
  scoredItemValue,
  selfTestAcqTag,
  validateAnswers,
} from './scoring';
import type { LikertValue, SelfTestAnswers, SelfTestDefinition } from './types';

function allAnswers(def: SelfTestDefinition, value: LikertValue): SelfTestAnswers {
  const out: SelfTestAnswers = {};
  for (const item of def.items) out[item.id] = value;
  return out;
}

describe('invertLikert / scoredItemValue', () => {
  it('IPIP 1–5 : inverse 1↔5', () => {
    expect(invertLikert(1, 5)).toBe(5);
    expect(invertLikert(5, 5)).toBe(1);
    expect(invertLikert(3, 5)).toBe(3);
  });

  it('ECR 1–7 : inverse 1↔7', () => {
    expect(invertLikert(1, 7)).toBe(7);
    expect(invertLikert(7, 7)).toBe(1);
    expect(invertLikert(4, 7)).toBe(4);
  });

  it('applique reverse seulement si reverse=true', () => {
    expect(scoredItemValue(1, false, 5)).toBe(1);
    expect(scoredItemValue(1, true, 5)).toBe(5);
    expect(scoredItemValue(7, true, 7)).toBe(1);
  });

  it('rejette hors bornes selon likertMax', () => {
    expect(() => scoredItemValue(6 as LikertValue, false, 5)).toThrow();
    expect(() => scoredItemValue(8 as LikertValue, false, 7)).toThrow();
  });
});

describe('IPIP-50 officiel — structure & keying', () => {
  it('a exactement 50 items, 10 par facteur', () => {
    expect(IPIP50_ITEMS).toHaveLength(50);
    expect(BIG_FIVE_TEST.items).toHaveLength(50);
    for (const key of ['E', 'A', 'C', 'ES', 'O']) {
      expect(BIG_FIVE_TEST.items.filter((i) => i.key === key)).toHaveLength(10);
    }
  });

  it('nombre d’items reverse = keying officiel ipip.ori.org', () => {
    for (const [key, expected] of Object.entries(IPIP50_OFFICIAL_REVERSE_COUNTS)) {
      const count = BIG_FIVE_TEST.items.filter((i) => i.key === key && i.reverse).length;
      expect(count).toBe(expected);
    }
    // Extraversion : exactement 5 −keyed
    expect(BIG_FIVE_TEST.items.filter((i) => i.key === 'E' && i.reverse)).toHaveLength(5);
  });

  it('chaque item porte le texte EN officiel', () => {
    for (const item of IPIP50_ITEMS) {
      expect(item.en?.length).toBeGreaterThan(5);
    }
  });

  it('contient les 5 items −keyed Extraversion officiels (EN)', () => {
    const reverseEn = BIG_FIVE_TEST.items
      .filter((i) => i.key === 'E' && i.reverse)
      .map((i) => i.en);
    expect(reverseEn).toEqual(
      expect.arrayContaining([
        "Don't talk a lot.",
        'Keep in the background.',
        'Have little to say.',
        "Don't like to draw attention to myself.",
        'Am quiet around strangers.',
      ]),
    );
  });

  it('Have little to say reste −keyed (pas transformé en positif)', () => {
    const item = BIG_FIVE_TEST.items.find((i) => i.en === 'Have little to say.');
    expect(item?.reverse).toBe(true);
    expect(item?.key).toBe('E');
  });

  it('toutes réponses 5 → somme = 5×(+keyed) + 1×(−keyed) par facteur', () => {
    const scores = scoreSelfTest(BIG_FIVE_TEST, allAnswers(BIG_FIVE_TEST, 5));
    for (const key of BIG_FIVE_TEST.scoreKeys) {
      const items = BIG_FIVE_TEST.items.filter((i) => i.key === key);
      const expected = items.reduce((sum, item) => sum + (item.reverse ? 1 : 5), 0);
      expect(scores[key]).toBe(expected);
      expect(scores[key]).toBeGreaterThanOrEqual(10);
      expect(scores[key]).toBeLessThanOrEqual(50);
    }
  });

  it('neutre 3 partout → 30 par facteur', () => {
    const scores = scoreSelfTest(BIG_FIVE_TEST, allAnswers(BIG_FIVE_TEST, 3));
    for (const key of BIG_FIVE_TEST.scoreKeys) {
      expect(scores[key]).toBe(30);
    }
  });

  it('Emotional Stability : 2 +keyed / 8 −keyed', () => {
    const es = BIG_FIVE_TEST.items.filter((i) => i.key === 'ES');
    expect(es.filter((i) => !i.reverse)).toHaveLength(2);
    expect(es.filter((i) => i.reverse)).toHaveLength(8);
  });
});

describe('ECR-S officiel — structure & keying', () => {
  it('a 12 items (6 anxiety + 6 avoidance), Likert max 7', () => {
    expect(ECR_SHORT_ITEMS).toHaveLength(12);
    expect(ATTACHMENT_TEST.likertMax).toBe(7);
    expect(ATTACHMENT_TEST.items.filter((i) => i.key === 'anxiety')).toHaveLength(6);
    expect(ATTACHMENT_TEST.items.filter((i) => i.key === 'avoidance')).toHaveLength(6);
  });

  it('nombre reverse = Wei et al. 2007 (anxiety 1, avoidance 3)', () => {
    for (const [key, expected] of Object.entries(ECR_OFFICIAL_REVERSE_COUNTS)) {
      const count = ATTACHMENT_TEST.items.filter((i) => i.key === key && i.reverse).length;
      expect(count).toBe(expected);
    }
  });

  it('items EN officiels présents (échantillon)', () => {
    const ens = ATTACHMENT_TEST.items.map((i) => i.en);
    expect(ens).toContain('It helps to turn to my romantic partner in times of need.');
    expect(ens).toContain('I do not often worry about being abandoned.');
    expect(ens).toContain(
      "I worry that romantic partners won't care about me as much as I care about them.",
    );
  });

  it('DOI source corrigé', () => {
    expect(ATTACHMENT_TEST.sourceUrl).toBe('https://doi.org/10.1080/00223890701268041');
    expect(ATTACHMENT_TEST.source).toMatch(/10\.1080\/00223890701268041/);
  });

  it('moyenne 4.00 si tout neutre (échelle 1–7)', () => {
    const scores = scoreSelfTest(ATTACHMENT_TEST, allAnswers(ATTACHMENT_TEST, 4));
    expect(scores.anxiety).toBe(4);
    expect(scores.avoidance).toBe(4);
  });

  it('reverse anxiety ECR8r : raw 7 → contribution 1', () => {
    const answers = allAnswers(ATTACHMENT_TEST, 4);
    answers.ECR8r = 7;
    const scores = scoreSelfTest(ATTACHMENT_TEST, answers);
    // base 4 ; ECR8r was 4→4, now 7→1 → −0.5 on mean of 6 → 3.5
    expect(scores.anxiety).toBe(3.5);
  });
});

describe('catalog & tags', () => {
  it('getSelfTest résout les 2 slugs', () => {
    expect(getSelfTest('big-five')?.version).toContain('official');
    expect(getSelfTest('attachement')?.version).toContain('official');
  });

  it('tags acq corrects', () => {
    expect(selfTestAcqTag('big-five')).toBe('test:big-five');
    expect(selfTestAcqTag('attachement')).toBe('test:attachement');
  });

  it('validateAnswers accepte 1–7 pour ECR', () => {
    expect(validateAnswers(ATTACHMENT_TEST, allAnswers(ATTACHMENT_TEST, 7)).ok).toBe(true);
  });

  it('validateAnswers refuse 6 pour IPIP', () => {
    const answers = allAnswers(BIG_FIVE_TEST, 5);
    answers.E1 = 6 as LikertValue;
    expect(validateAnswers(BIG_FIVE_TEST, answers).ok).toBe(false);
  });
});
