import { describe, expect, it } from 'vitest';

import { recommendProgramSlug } from './level-test';

describe('test de niveau SPEC §4.7', () => {
  it('dos + débutante → anti-bureau', () => {
    expect(recommendProgramSlug('dos', 'lt6', '30').slug).toBe('dos-posture-anti-bureau');
  });
  it('20 min + débutante → routine express', () => {
    expect(recommendProgramSlug('tonifier', 'lt6', '20')).toEqual({ slug: 'routine-express-20', partialHint: false });
  });
  it('20 min + intermédiaire → tableau + conseil partie', () => {
    expect(recommendProgramSlug('tonifier', '6to24', '20')).toEqual({ slug: 'barre-sculpt', partialHint: true });
  });
});
