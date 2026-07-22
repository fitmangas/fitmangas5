import { describe, expect, it } from 'vitest';
import { isCoursePastForReplay, LIVE_TO_REPLAY_GRACE_MS } from '@/lib/live/replay-switch';

describe('isCoursePastForReplay', () => {
  it('reste en live pendant la marge de grâce', () => {
    const endsAt = new Date('2026-07-20T18:00:00.000Z');
    const now = endsAt.getTime() + LIVE_TO_REPLAY_GRACE_MS - 1;
    expect(isCoursePastForReplay(endsAt, now)).toBe(false);
  });

  it('passe en mode replay après la grâce', () => {
    const endsAt = new Date('2026-07-20T18:00:00.000Z');
    const now = endsAt.getTime() + LIVE_TO_REPLAY_GRACE_MS + 1;
    expect(isCoursePastForReplay(endsAt, now)).toBe(true);
  });
});
