import { describe, expect, it } from 'vitest';

import { normalizePhone } from '@/lib/quiz/lead';

describe('normalizePhone', () => {
  it('accepte un mobile FR national', () => {
    expect(normalizePhone('06 12 34 56 78')).toBe('0612345678');
  });

  it('accepte un format international', () => {
    expect(normalizePhone('+33 6 12 34 56 78')).toBe('+33612345678');
  });

  it('rejette trop court', () => {
    expect(normalizePhone('123')).toBeNull();
  });
});
