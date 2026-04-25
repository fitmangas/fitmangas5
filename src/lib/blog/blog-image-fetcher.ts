type UnsplashResult = {
  urls?: { regular?: string; small?: string };
  alt_description?: string | null;
  user?: { name?: string | null; links?: { html?: string | null } };
};

const CATEGORY_QUERIES: Record<string, string> = {
  technique: 'pilates form core strength women',
  respiration: 'breathing mindfulness yoga pilates',
  posture: 'posture alignment pilates studio',
  renforcement: 'women fitness strength training pilates',
  'bien-etre': 'wellness calm movement women',
  nutrition: 'healthy lifestyle hydration fitness',
};

export function inferUnsplashQuery(title: string, categorySlug: string): string {
  const base = CATEGORY_QUERIES[categorySlug] ?? 'pilates fitness women health';
  const head = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');
  return `${head} ${base}`.trim();
}

export async function fetchUnsplashImage(params: {
  title: string;
  categorySlug: string;
}): Promise<{ imageUrl: string | null; credit: string | null; alt: string | null }> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return { imageUrl: null, credit: null, alt: null };
  }

  const query = inferUnsplashQuery(params.title, params.categorySlug);
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  });

  if (!response.ok) {
    console.error('[fetchUnsplashImage]', response.status, await response.text());
    return { imageUrl: null, credit: null, alt: null };
  }

  const data = (await response.json()) as { results?: UnsplashResult[] };
  const first = data.results?.[0];
  const imageUrl = first?.urls?.regular ?? first?.urls?.small ?? null;
  const author = first?.user?.name?.trim() || null;
  const authorLink = first?.user?.links?.html?.trim() || null;
  const credit =
    author && authorLink ? `Photo by ${author} on Unsplash (${authorLink})` : author ? `Photo by ${author} on Unsplash` : null;
  const alt = first?.alt_description?.trim() || null;

  return { imageUrl, credit, alt };
}
