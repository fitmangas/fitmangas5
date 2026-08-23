import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { composeSocialPublishImageBuffer } from '@/lib/admin/social-publish-image';
import type { SocialPost } from '@/lib/admin/social-comms';

const fixturePost = (overrides: Partial<SocialPost> = {}): SocialPost =>
  ({
    id: 'test-carousel',
    network: 'instagram',
    format: 'carousel',
    locale: 'fr',
    title: 'Test carousel',
    caption: 'Caption test',
    hashtags: [],
    cta: '',
    imageHint: '',
    imagePath: null,
    imageSource: 'ai',
    aiImagePrompt: '',
    imageFeedback: '',
    overlayText: 'Titre slide 0',
    useOverlay: true,
    hookTitle: '',
    reelScript: '',
    shotList: '',
    rawVideoPath: null,
    editedVideoPath: null,
    videoStatus: null,
    carouselPaths: ['/logo.png'],
    carouselSlideTitles: ['5 RAISONS', "1. PERSONNE NE T'ATTEND", '', '', '', ''],
    plannedAt: null,
    status: 'ready',
    sourceType: 'ai',
    sourceRef: null,
    whyItWorks: '',
    metaExternalId: null,
    alsoPublishFacebook: false,
    adaptedFromId: null,
    facebookExternalId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as SocialPost;

describe('composeSocialPublishImageBuffer', () => {
  it('brûle le titre carousel avec police embarquée (pas de carrés blancs)', async () => {
    const logoPath = path.join(process.cwd(), 'public/logo.png');
    expect(fs.existsSync(logoPath)).toBe(true);

    const buffer = await composeSocialPublishImageBuffer(fixturePost(), '/logo.png', 1);
    expect(buffer.length).toBeGreaterThan(10_000);

    const { data, info } = await (await import('sharp')).default(buffer).raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    // Zone basse où le texte overlay est dessiné — doit contenir du blanc cassé (#FFFAF5)
    let lightPixels = 0;
    for (let y = Math.floor(h * 0.72); y < h; y += 1) {
      for (let x = 0; x < w; x += 4) {
        const i = (y * w + x) * info.channels;
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        if (r > 230 && g > 225 && b > 220) lightPixels += 1;
      }
    }
    expect(lightPixels).toBeGreaterThan(20);
  });
});
