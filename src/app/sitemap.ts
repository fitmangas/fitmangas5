import type { MetadataRoute } from 'next';

import { createAdminClient } from '@/lib/supabase/admin';
import { SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');

/** Dates stables pour les pages légales (évite lastModified = build time). */
const LEGAL_LAST_MODIFIED = new Date('2026-05-01T00:00:00.000Z');
const HOME_LAST_MODIFIED = new Date('2026-05-16T00:00:00.000Z');
const PILLAR_LAST_MODIFIED = new Date('2026-07-15T00:00:00.000Z');

function sanitizeLastModified(value: unknown, fallback: Date): Date {
  const parsed = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(parsed.getTime())) return fallback;
  const now = Date.now();
  if (parsed.getTime() > now) return new Date(now);
  return parsed;
}

function blogArticleUrl(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${APP_URL}/blog/${clean}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...SEO_PILLAR_PAGES.map((page) => ({
      url: `${APP_URL}/${page.slug}`,
      lastModified: PILLAR_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.92,
    })),
    {
      url: `${APP_URL}/boutique`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data: articles } = await admin
      .from('blog_articles')
      .select('slug_fr, published_at, updated_at')
      .eq('status', 'published')
      .not('slug_fr', 'is', null);

    const seenSlugs = new Set<string>();
    for (const row of articles ?? []) {
      const slug = String(row.slug_fr).trim();
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      blogPages.push({
        url: blogArticleUrl(slug),
        lastModified: sanitizeLastModified(row.published_at ?? row.updated_at, HOME_LAST_MODIFIED),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  } catch (e) {
    console.error('[sitemap] blog articles', e);
  }

  const seenUrls = new Set<string>();
  return [...staticPages, ...blogPages].filter((entry) => {
    if (seenUrls.has(entry.url)) return false;
    seenUrls.add(entry.url);
    return true;
  });
}
