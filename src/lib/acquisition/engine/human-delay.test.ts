import { describe, expect, it } from 'vitest';

import { randomHumanDelayMs, shouldSkipHumanDelay } from '@/lib/acquisition/engine/human-delay';

describe('human-delay', () => {
  it('skip en test', () => {
    expect(shouldSkipHumanDelay()).toBe(true);
  });

  it('plage 30–90s', () => {
    for (let i = 0; i < 30; i += 1) {
      const ms = randomHumanDelayMs();
      expect(ms).toBeGreaterThanOrEqual(30_000);
      expect(ms).toBeLessThanOrEqual(90_000);
    }
  });
});
