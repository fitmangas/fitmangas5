export const BLOG_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1200&q=80',
] as const;

const CATEGORY_OFFSETS: Record<string, number> = {
  bien: 0,
  bienestar: 0,
  wellness: 0,
  renforcement: 2,
  fuerza: 2,
  strength: 2,
  pilates: 4,
  nutrition: 5,
  barre: 6,
};

function categoryOffset(categoryLabel: string | null | undefined) {
  const normalized = categoryLabel?.trim().toLowerCase() ?? '';
  const key = Object.keys(CATEGORY_OFFSETS).find((entry) => normalized.includes(entry));
  return key ? CATEGORY_OFFSETS[key] : 0;
}

export function uniqueBlogImageUrl(params: {
  coverImageUrl?: string | null;
  categoryLabel?: string | null;
  index: number;
  used: Set<string>;
}) {
  const cover = params.coverImageUrl?.trim();
  if (cover && !params.used.has(cover)) {
    params.used.add(cover);
    return cover;
  }

  const start = (categoryOffset(params.categoryLabel) + params.index) % BLOG_FALLBACK_IMAGES.length;
  for (let i = 0; i < BLOG_FALLBACK_IMAGES.length; i += 1) {
    const fallback = BLOG_FALLBACK_IMAGES[(start + i) % BLOG_FALLBACK_IMAGES.length];
    if (!params.used.has(fallback)) {
      params.used.add(fallback);
      return fallback;
    }
  }

  return BLOG_FALLBACK_IMAGES[start];
}
