import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { creamTopCropRows, isCreamRgb } from '@/lib/admin/social-image-letterbox';
import { composeSocialPublishImageBuffer, wrapOverlayLines } from '@/lib/admin/social-publish-image';
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
    carouselSlideTitles: ['5 RAISONS', "1. PERSONNE NE T'ATTEND", '2. TU NE VOIS PAS TES ERREURS', '', '', ''],
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

    const buffer = await composeSocialPublishImageBuffer(fixturePost(), '/logo.png', 2);
    expect(buffer.length).toBeGreaterThan(10_000);

    const { data, info } = await (await import('sharp')).default(buffer).raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    let lightPixels = 0;
    let edgeTransitions = 0;
    const y = Math.floor(h * 0.88);
    let prev = data[(y * w + 100) * info.channels]!;
    for (let x = 100; x < w - 100; x += 1) {
      const i = (y * w + x) * info.channels;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      if (r > 230 && g > 225 && b > 220) lightPixels += 1;
      if (Math.abs(r - prev) > 35) edgeTransitions += 1;
      prev = r;
    }
    expect(lightPixels).toBeGreaterThan(20);
    expect(edgeTransitions).toBeGreaterThan(40);
  });

  it('n’affiche pas le marqueur admin OVERLAY À REVOIR sur l’image', async () => {
    const buffer = await composeSocialPublishImageBuffer(
      fixturePost({
        carouselSlideTitles: [
          '5 RAISONS',
          '1. OVERLAY À REVOIR',
          '2. TU NE VOIS PAS TES ERREURS',
          '3. POINT',
          '4. POINT',
          'OVERLAY À REVOIR — CTA',
        ],
      }),
      '/logo.png',
      1,
    );
    const { data, info } = await (await import('sharp')).default(buffer).raw().toBuffer({ resolveWithObject: true });
    let edgeTransitions = 0;
    const y = Math.floor(info.height * 0.88);
    let prev = data[(y * info.width + 100) * info.channels]!;
    for (let x = 100; x < info.width - 100; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i]!;
      if (Math.abs(r - prev) > 35) edgeTransitions += 1;
      prev = r;
    }
    expect(edgeTransitions).toBeLessThan(15);
  });

  it('garde le titre numéroté du slide 3 sur une ou deux lignes sans orphelin', async () => {
    const lines = wrapOverlayLines('2. TU NE VOIS PAS TES ERREURS');
    expect(lines.join(' ')).toContain('ERREURS');
    expect(lines[0]).toMatch(/^2\./);
    expect(lines.every((l) => l.length > 2)).toBe(true);
  });

  it('brûle le titre de la dernière slide CTA (dashboard) avec police embarquée', async () => {
    const dash = path.join(process.cwd(), 'public/espace cliente dashboard.jpg');
    expect(fs.existsSync(dash)).toBe(true);

    const buffer = await composeSocialPublishImageBuffer(
      fixturePost({
        carouselPaths: [
          '/logo.png',
          '/logo.png',
          '/logo.png',
          '/logo.png',
          '/logo.png',
          '/espace cliente dashboard.jpg',
        ],
        carouselSlideTitles: [
          '5 RAISONS',
          '1. POINT',
          '2. POINT',
          '3. POINT',
          '4. POINT',
          'ESSAI 7 JOURS — ON T’ATTEND EN VISIO',
        ],
      }),
      '/espace cliente dashboard.jpg',
      5,
    );
    expect(buffer.length).toBeGreaterThan(10_000);

    const { data, info } = await (await import('sharp')).default(buffer).raw().toBuffer({ resolveWithObject: true });
    let lightPixels = 0;
    for (let y = Math.floor(info.height * 0.7); y < Math.floor(info.height * 0.88); y += 1) {
      for (let x = Math.floor(info.width * 0.2); x < Math.floor(info.width * 0.8); x += 3) {
        const i = (y * info.width + x) * info.channels;
        if (data[i]! > 230 && data[i + 1]! > 225 && data[i + 2]! > 220) lightPixels += 1;
      }
    }
    expect(lightPixels).toBeGreaterThan(30);
  });

  it('recadre une bande crème haute puis remplit le 4:5', async () => {
    const sharp = (await import('sharp')).default;
    const w = 400;
    const h = 500;
    const creamTop = 180;
    const pixels = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 3;
        if (y < creamTop) {
          pixels[i] = 255;
          pixels[i + 1] = 250;
          pixels[i + 2] = 245;
        } else {
          pixels[i] = 80;
          pixels[i + 1] = 60;
          pixels[i + 2] = 40;
        }
      }
    }
    const tmpRel = '/tmp-cream-letterbox-test.jpg';
    const tmp = path.join(process.cwd(), 'public', 'tmp-cream-letterbox-test.jpg');
    await sharp(pixels, { raw: { width: w, height: h, channels: 3 } }).jpeg().toFile(tmp);
    try {
      const buffer = await composeSocialPublishImageBuffer(
        fixturePost({
          format: 'feed',
          useOverlay: false,
          carouselSlideTitles: [],
          overlayText: '',
        }),
        tmpRel,
        0,
      );
      const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      let creamInTopBand = 0;
      let samples = 0;
      for (let y = 0; y < Math.floor(info.height * 0.12); y += 2) {
        for (let x = 0; x < info.width; x += 8) {
          const i = (y * info.width + x) * info.channels;
          samples += 1;
          if (data[i]! > 210 && data[i + 1]! > 195 && data[i + 2]! > 175) creamInTopBand += 1;
        }
      }
      expect(creamInTopBand / samples).toBeLessThan(0.35);
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});

describe('creamTopCropRows', () => {
  it('détecte une bande crème haute', () => {
    expect(isCreamRgb(255, 250, 245)).toBe(true);
    expect(isCreamRgb(40, 30, 20)).toBe(false);

    const w = 20;
    const h = 40;
    const creamRows = 16;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        if (y < creamRows) {
          data[i] = 255;
          data[i + 1] = 250;
          data[i + 2] = 245;
          data[i + 3] = 255;
        } else {
          data[i] = 90;
          data[i + 1] = 70;
          data[i + 2] = 50;
          data[i + 3] = 255;
        }
      }
    }
    expect(creamTopCropRows(data, w, h, 4)).toBe(creamRows);
  });
});
