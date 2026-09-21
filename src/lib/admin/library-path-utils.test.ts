import { describe, expect, it } from 'vitest';

import {
  addLibraryPathAliases,
  hashVariationSeed,
  isBoardLibraryPath,
  libraryPathAliases,
  libraryPathIsBlocked,
} from '@/lib/admin/library-path-utils';
import {
  collectUsedCarouselCoverPaths,
  collectUsedFeedLibraryPaths,
  collectUsedLibraryPaths,
  type SocialPost,
} from '@/lib/admin/social-comms';

function stubPost(partial: Partial<SocialPost> & Pick<SocialPost, 'id' | 'imagePath' | 'carouselPaths'>): SocialPost {
  return {
    network: 'instagram',
    format: 'feed',
    locale: 'fr',
    title: 't',
    caption: 'c',
    hashtags: [],
    cta: '',
    imageHint: '',
    imageSource: 'library',
    aiImagePrompt: '',
    imageFeedback: '',
    overlayText: null,
    useOverlay: true,
    hookTitle: '',
    reelScript: '',
    shotList: '',
    rawVideoPath: null,
    editedVideoPath: null,
    videoStatus: null,
    plannedAt: null,
    status: 'ready',
    sourceType: 'ai',
    sourceRef: null,
    whyItWorks: '',
    metaExternalId: null,
    createdAt: '',
    updatedAt: '',
    ...partial,
  } as SocialPost;
}

describe('library-path-utils', () => {
  it('hashVariationSeed disperse les UUID (≠ id.length)', () => {
    const a = hashVariationSeed('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'feed');
    const b = hashVariationSeed('ffffffff-1111-2222-3333-444444444444', 'feed');
    expect(a).not.toBe(b);
    expect('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'.length).toBe(
      'ffffffff-1111-2222-3333-444444444444'.length,
    );
  });

  it('aliases lient base et crop 4x5', () => {
    const aliases = libraryPathAliases('/library/portraits/portrait-03-4x5.webp');
    expect(aliases).toContain('/library/portraits/portrait-03.webp');
    expect(aliases).toContain('/library/portraits/portrait-03-4x5.webp');
  });

  it('isBoardLibraryPath ignore /library/social/', () => {
    expect(isBoardLibraryPath('/library/portraits/portrait-01.webp')).toBe(true);
    expect(isBoardLibraryPath('/library/social/gen.jpg')).toBe(false);
  });

  it('libraryPathIsBlocked via alias', () => {
    const blocked = new Set<string>();
    addLibraryPathAliases(blocked, '/library/portraits/portrait-05.webp');
    expect(libraryPathIsBlocked('/library/portraits/portrait-05-4x5.webp', blocked)).toBe(true);
  });
});

describe('collectUsedCarouselCoverPaths / feed', () => {
  it('ban uniquement la cover carousel (pas les autres usages)', () => {
    const covers = collectUsedCarouselCoverPaths([
      stubPost({
        id: '1',
        format: 'feed',
        status: 'published',
        imagePath: '/library/portraits/portrait-07-4x5.webp',
        carouselPaths: [],
      }),
      stubPost({
        id: '2',
        format: 'carousel',
        status: 'ready',
        imagePath: '/library/portraits/portrait-02-4x5.webp',
        carouselPaths: [
          '/library/portraits/portrait-02-4x5.webp',
          '/library/social/ai-slide.webp',
          '',
          '',
          '',
          '',
        ],
      }),
    ]);
    expect(covers.has('/library/portraits/portrait-02.webp')).toBe(true);
    expect(covers.has('/library/portraits/portrait-07.webp')).toBe(false);
  });

  it('feed : ban seulement si publié', () => {
    const feeds = collectUsedFeedLibraryPaths([
      stubPost({
        id: '1',
        format: 'feed',
        status: 'ready',
        imagePath: '/library/pilates-mat/pilates-mat-01-4x5.webp',
        carouselPaths: [],
      }),
      stubPost({
        id: '2',
        format: 'feed',
        status: 'published',
        imagePath: '/library/portraits/portrait-07-4x5.webp',
        carouselPaths: [],
      }),
    ]);
    expect(feeds.has('/library/portraits/portrait-07.webp')).toBe(true);
    expect(feeds.has('/library/pilates-mat/pilates-mat-01.webp')).toBe(false);
  });

  it('legacy collectUsedLibraryPaths = covers + feeds publiés (plus de ban global)', () => {
    const used = collectUsedLibraryPaths([
      stubPost({
        id: '1',
        format: 'carousel',
        imagePath: '/library/portraits/portrait-02-4x5.webp',
        carouselPaths: ['/library/portraits/portrait-02-4x5.webp', '', '', '', '', ''],
      }),
      stubPost({
        id: '2',
        format: 'feed',
        status: 'published',
        imagePath: '/library/portraits/portrait-07-4x5.webp',
        carouselPaths: [],
      }),
    ]);
    expect(used.has('/library/portraits/portrait-02.webp')).toBe(true);
    expect(used.has('/library/portraits/portrait-07.webp')).toBe(true);
  });
});
