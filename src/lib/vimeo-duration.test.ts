import { describe, expect, it } from 'vitest';

import { mapVimeoVideoResponseToMetadata, normalizeDurationSeconds } from '@/lib/vimeo';

describe('normalizeDurationSeconds', () => {
  it('convertit 0 en null (transcodage Vimeo en cours)', () => {
    expect(normalizeDurationSeconds(0)).toBeNull();
  });

  it('conserve une durée positive', () => {
    expect(normalizeDurationSeconds(3723.7)).toBe(3724);
  });

  it('rejette les valeurs invalides', () => {
    expect(normalizeDurationSeconds(null)).toBeNull();
    expect(normalizeDurationSeconds(undefined)).toBeNull();
    expect(normalizeDurationSeconds(Number.NaN)).toBeNull();
  });
});

describe('mapVimeoVideoResponseToMetadata', () => {
  it('duration Vimeo 0 → durationSeconds null', () => {
    const meta = mapVimeoVideoResponseToMetadata({
      uri: '/videos/1197206930',
      name: 'Replay test',
      description: null,
      link: 'https://vimeo.com/1197206930',
      duration: 0,
      transcode: { status: 'in_progress' },
    });
    expect(meta.durationSeconds).toBeNull();
    expect(meta.isReady).toBe(false);
  });
});
