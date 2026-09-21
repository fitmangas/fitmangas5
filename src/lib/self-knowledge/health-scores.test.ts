import { describe, expect, it } from 'vitest';

import { computeHealthScores } from './health-scores';

describe('computeHealthScores (indicatif non médical)', () => {
  it('retourne des scores 0–100', () => {
    const s = computeHealthScores({
      sessionsPerWeek: 3,
      sleepHours: 7.5,
      restingHr: 60,
      hrvMs: 50,
      activeMinutes: 150,
    });
    expect(s.regularite).toBeGreaterThanOrEqual(0);
    expect(s.regularite).toBeLessThanOrEqual(100);
    expect(s.recuperation).toBeGreaterThanOrEqual(0);
    expect(s.recuperation).toBeLessThanOrEqual(100);
    expect(s.energie).toBeGreaterThanOrEqual(0);
    expect(s.energie).toBeLessThanOrEqual(100);
  });

  it('régularité basse si 0 séance', () => {
    const s = computeHealthScores({
      sessionsPerWeek: 0,
      sleepHours: null,
      restingHr: null,
      hrvMs: null,
      activeMinutes: null,
    });
    expect(s.regularite).toBe(10);
  });

  it('régularité haute autour de 3–4 séances', () => {
    const s = computeHealthScores({
      sessionsPerWeek: 3,
      sleepHours: null,
      restingHr: null,
      hrvMs: null,
      activeMinutes: null,
    });
    expect(s.regularite).toBe(85);
  });

  it('énergie suit les minutes actives OMS-ish', () => {
    const low = computeHealthScores({
      sessionsPerWeek: null,
      sleepHours: null,
      restingHr: null,
      hrvMs: null,
      activeMinutes: 20,
    });
    const mid = computeHealthScores({
      sessionsPerWeek: null,
      sleepHours: null,
      restingHr: null,
      hrvMs: null,
      activeMinutes: 150,
    });
    expect(low.energie).toBeLessThan(mid.energie);
  });
});
