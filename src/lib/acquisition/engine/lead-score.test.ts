import { describe, expect, it } from 'vitest';

import { HOT_LEAD_SCORE_MIN, clampLeadScore, isHotLeadNoiseHandle } from './lead-score';

describe('lead-score', () => {
  it('clampLeadScore borne 0–100', () => {
    expect(clampLeadScore(-5)).toBe(0);
    expect(clampLeadScore(40.4)).toBe(40);
    expect(clampLeadScore(200)).toBe(100);
  });

  it('HOT_LEAD_SCORE_MIN = 40', () => {
    expect(HOT_LEAD_SCORE_MIN).toBe(40);
  });

  it('isHotLeadNoiseHandle filtre démo / meta / équipe', () => {
    expect(isHotLeadNoiseHandle('@meta_123')).toBe(true);
    expect(isHotLeadNoiseHandle('@kevpicard_')).toBe(true);
    expect(isHotLeadNoiseHandle('@alee_cast')).toBe(false);
    expect(isHotLeadNoiseHandle('@lucile.merle')).toBe(false);
  });
});
