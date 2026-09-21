import { describe, expect, it } from 'vitest';

import { youtubeShortsDescription } from '@/lib/admin/youtube-social';
import type { SocialPost } from '@/lib/admin/social-comms';

function stubReel(partial: Partial<SocialPost> = {}): SocialPost {
  return {
    id: 'yt-1',
    network: 'instagram',
    format: 'reel',
    locale: 'fr',
    title: 'À 15h ton dos te lâche',
    caption: 'Tu n’es pas seule. Essai 7 jours.',
    hashtags: ['#pilates'],
    cta: 'Essaie 7 jours',
    imageHint: '',
    imageSource: 'none',
    aiImagePrompt: '',
    imageFeedback: '',
    overlayText: null,
    useOverlay: false,
    hookTitle: 'À 15h ton dos te lâche ?',
    reelScript: 'brief',
    shotList: '',
    rawVideoPath: null,
    editedVideoPath: '/videos/x.mp4',
    videoStatus: 'ready',
    plannedAt: null,
    status: 'ready',
    sourceType: 'ai',
    sourceRef: null,
    whyItWorks: '',
    metaExternalId: null,
    alsoPublishYouTube: true,
    createdAt: '',
    updatedAt: '',
    ...partial,
  } as SocialPost;
}

describe('youtubeShortsDescription', () => {
  it('met le CTA essai + lien en haut (conversion sans DM)', () => {
    const desc = youtubeShortsDescription(stubReel());
    expect(desc).toMatch(/Essai gratuit 7 jours/);
    expect(desc).toMatch(/utm_source=youtube/);
    expect(desc).toMatch(/#Shorts/);
    expect(desc.indexOf('Essai gratuit')).toBeLessThan(desc.indexOf('#Shorts'));
  });
});
