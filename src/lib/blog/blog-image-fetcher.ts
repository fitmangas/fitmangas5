import { BLOG_FALLBACK_IMAGES } from '@/lib/blog/images';

type UnsplashResult = {
  id?: string;
  urls?: { regular?: string; small?: string };
  alt_description?: string | null;
  user?: { name?: string | null; links?: { html?: string | null } };
};

/** Identifiant stable d'une photo Unsplash (ex. `1518611012118-696072aa579a`). */
export function extractUnsplashPhotoId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const match = url.match(/images\.unsplash\.com\/photo-([^\/?#]+)/i);
  return match?.[1] ?? null;
}

export function collectUsedPhotoIdsFromUrls(urls: Array<string | null | undefined>): Set<string> {
  const used = new Set<string>();
  for (const url of urls) {
    const id = extractUnsplashPhotoId(url);
    if (id) used.add(id);
  }
  return used;
}

const CATEGORY_QUERY_POOLS: Record<string, string[]> = {
  technique: [
    'pilates mat workout studio woman',
    'pilates reformer core strength',
    'pilates class instructor movement',
    'barre pilates fusion fitness',
  ],
  respiration: [
    'breathing yoga mindfulness woman calm',
    'pilates breath meditation wellness',
    'stretching relaxation wellness studio',
    'mindful movement pilates woman',
  ],
  posture: [
    'posture alignment pilates studio',
    'pilates spine alignment woman',
    'yoga alignment stretching woman',
    'barre posture balance fitness',
  ],
  renforcement: [
    'women fitness strength pilates',
    'pilates core workout woman',
    'barre strength training woman',
    'fitness pilates toning studio',
  ],
  'bien-etre': [
    'wellness calm movement woman',
    'self care wellness stretching',
    'mindful fitness woman home',
    'pilates wellness lifestyle woman',
  ],
  nutrition: [
    'healthy lifestyle hydration fitness',
    'wellness nutrition active woman',
    'healthy food fitness lifestyle',
    'smoothie wellness fitness woman',
  ],
};

const DEFAULT_QUERY_POOL = [
  'pilates barre wellness woman',
  'yoga stretching fitness woman',
  'pilates studio workout',
  'wellness movement woman',
];

function normalizeCategorySlug(categorySlug: string): string {
  const s = categorySlug.toLowerCase().trim();
  if (s.includes('respir')) return 'respiration';
  if (s.includes('posture') || s.includes('align')) return 'posture';
  if (s.includes('renforc') || s.includes('strength') || s.includes('fuerza')) return 'renforcement';
  if (s.includes('bien') || s.includes('wellness') || s.includes('bienestar')) return 'bien-etre';
  if (s.includes('nutri')) return 'nutrition';
  if (s.includes('technique') || s.includes('pilates')) return 'technique';
  return s.replace(/\s+/g, '-');
}

function rotatedQueries(categorySlug: string, variant: number): string[] {
  const key = normalizeCategorySlug(categorySlug);
  const pool = CATEGORY_QUERY_POOLS[key] ?? DEFAULT_QUERY_POOL;
  const start = ((variant % pool.length) + pool.length) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)];
}

function buildImageUrl(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

function pickFromResults(
  results: UnsplashResult[],
  excludedPhotoIds: Set<string>,
): { imageUrl: string; credit: string | null; alt: string | null; photoId: string } | null {
  for (const result of results) {
    const imageUrl = result.urls?.regular ?? result.urls?.small ?? null;
    if (!imageUrl) continue;
    const photoId = extractUnsplashPhotoId(imageUrl);
    if (!photoId || excludedPhotoIds.has(photoId)) continue;

    const author = result.user?.name?.trim() || null;
    const authorLink = result.user?.links?.html?.trim() || null;
    const credit =
      author && authorLink
        ? `Photo by ${author} on Unsplash (${authorLink})`
        : author
          ? `Photo by ${author} on Unsplash`
          : null;
    const alt = result.alt_description?.trim() || null;

    return { imageUrl, credit, alt, photoId };
  }
  return null;
}

function pickFallbackImage(excludedPhotoIds: Set<string>, variant: number): { imageUrl: string; photoId: string } | null {
  const start = variant % BLOG_FALLBACK_IMAGES.length;
  for (let i = 0; i < BLOG_FALLBACK_IMAGES.length; i += 1) {
    const url = BLOG_FALLBACK_IMAGES[(start + i) % BLOG_FALLBACK_IMAGES.length];
    const photoId = extractUnsplashPhotoId(url);
    if (photoId && !excludedPhotoIds.has(photoId)) {
      return { imageUrl: url, photoId };
    }
  }
  return null;
}

async function searchUnsplash(query: string, page: number): Promise<UnsplashResult[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  });

  if (!response.ok) {
    console.error('[fetchUnsplashImage]', response.status, query, await response.text());
    return [];
  }

  const data = (await response.json()) as { results?: UnsplashResult[] };
  return data.results ?? [];
}

/** @deprecated Utiliser les pools par catégorie ; conservé pour compatibilité tests éventuels. */
export function inferUnsplashQuery(title: string, categorySlug: string): string {
  const queries = rotatedQueries(categorySlug, 0);
  return queries[0] ?? 'pilates fitness women health';
}

export async function fetchUnsplashImage(params: {
  title: string;
  categorySlug: string;
  excludedPhotoIds?: Set<string>;
  /** Variante pour diversifier la requête (index article, hash, etc.). */
  variant?: number;
}): Promise<{
  imageUrl: string | null;
  credit: string | null;
  alt: string | null;
  photoId: string | null;
}> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  const excluded = params.excludedPhotoIds ?? new Set<string>();
  const variant = params.variant ?? 0;

  if (!key) {
    const fallback = pickFallbackImage(excluded, variant);
    if (!fallback) return { imageUrl: null, credit: null, alt: null, photoId: null };
    return { imageUrl: fallback.imageUrl, credit: null, alt: null, photoId: fallback.photoId };
  }

  const queries = rotatedQueries(params.categorySlug, variant);

  for (let qIndex = 0; qIndex < queries.length; qIndex += 1) {
    const query = queries[qIndex];
    const page = 1 + Math.floor(variant / queries.length) + qIndex;
    const results = await searchUnsplash(query, page);
    const picked = pickFromResults(results, excluded);
    if (picked) {
      return {
        imageUrl: picked.imageUrl,
        credit: picked.credit,
        alt: picked.alt,
        photoId: picked.photoId,
      };
    }
  }

  const fallback = pickFallbackImage(excluded, variant);
  if (fallback) {
    return {
      imageUrl: fallback.imageUrl,
      credit: null,
      alt: null,
      photoId: fallback.photoId,
    };
  }

  return { imageUrl: null, credit: null, alt: null, photoId: null };
}

export function normalizeStoredImageUrl(url: string): string {
  const photoId = extractUnsplashPhotoId(url);
  if (!photoId) return url;
  return buildImageUrl(photoId);
}
