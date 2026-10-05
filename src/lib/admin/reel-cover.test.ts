import { describe, expect, it } from 'vitest';

import {
  isLocalHyperFramesCoverPath,
  normalizeCoverInput,
  reelCoverPublicUrl,
  REEL_COVER_API_SUPPORT,
} from './reel-cover';

describe('reel-cover', () => {
  it('Instagram + Facebook acceptent une cover API ; TikTok non', () => {
    expect(REEL_COVER_API_SUPPORT.instagram.ok).toBe(true);
    expect(REEL_COVER_API_SUPPORT.facebook.ok).toBe(true);
    expect(REEL_COVER_API_SUPPORT.tiktok.ok).toBe(false);
    expect(REEL_COVER_API_SUPPORT.tiktok.how).toMatch(/timestamp/i);
  });

  it('URL publique /library et Storage → cover envoyable', () => {
    expect(reelCoverPublicUrl('https://fitmangas.com/library/covers/a.png')).toMatch(/^https:\/\//);
    expect(reelCoverPublicUrl('/library/social/covers/a.png')).toMatch(/\/library\/social\/covers/);
    expect(reelCoverPublicUrl(null)).toBeNull();
    expect(reelCoverPublicUrl('')).toBeNull();
  });

  it('chemin local HyperFrames (exports) n’est pas envoyable à Meta', () => {
    expect(reelCoverPublicUrl('exports/reel-dos-15h_cover.png')).toBeNull();
    expect(isLocalHyperFramesCoverPath('exports/reel-dos-15h_cover.png')).toBe(true);
    expect(isLocalHyperFramesCoverPath('https://x.com/a.png')).toBe(false);
  });

  it('normalize vide → null', () => {
    expect(normalizeCoverInput('  ')).toBeNull();
    expect(normalizeCoverInput('/library/a.png')).toBe('/library/a.png');
  });
});
