import { describe, expect, it } from 'vitest';

import { ATTACHMENT_TEST } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_TEST } from '@/lib/self-knowledge/ipip50';
import { scoreSelfTest } from '@/lib/self-knowledge/scoring';
import type { LikertValue, SelfTestAnswers } from '@/lib/self-knowledge/types';

/**
 * Simulation parcours public : réponses → scores exacts → teaser fields.
 * (API HTTP couverte via scoring + analyze unitaires ; E2E navigateur = suite séparée.)
 */
describe('parcours public — scoring E2E logique', () => {
  it('Big Five : jeu réaliste avec reverse → scores calculables', () => {
    const answers: SelfTestAnswers = {};
    BIG_FIVE_TEST.items.forEach((item, idx) => {
      answers[item.id] = ((idx % 5) + 1) as LikertValue;
    });
    const scores = scoreSelfTest(BIG_FIVE_TEST, answers);
    expect(Object.keys(scores).sort()).toEqual(['A', 'C', 'E', 'N', 'O']);
    for (const v of Object.values(scores)) {
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(50);
    }
  });

  it('Attachement : jeu réaliste → moyennes 1–5', () => {
    const answers: SelfTestAnswers = {};
    ATTACHMENT_TEST.items.forEach((item, idx) => {
      answers[item.id] = ((idx % 5) + 1) as LikertValue;
    });
    const scores = scoreSelfTest(ATTACHMENT_TEST, answers);
    expect(scores.anxiety).toBeGreaterThanOrEqual(1);
    expect(scores.anxiety).toBeLessThanOrEqual(5);
    expect(scores.avoidance).toBeGreaterThanOrEqual(1);
    expect(scores.avoidance).toBeLessThanOrEqual(5);
  });
});
