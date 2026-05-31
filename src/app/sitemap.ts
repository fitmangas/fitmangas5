import type { MetadataRoute } from 'next';

import { createAdminClient } from '@/lib/supabase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

/** Dates stables pour les pages légales (évite lastModified = build time). */
const LEGAL_LAST_MODIFIED = new Date('2026-05-01T00:00:00.000Z');
const HOME_LAST_MODIFIED = new Date('2026-05-16T00:00:00.000Z');

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
    {
      url: `${APP_URL}/connexion`,
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

    blogPages = (articles ?? []).map((row) => {
      const slug = String(row.slug_fr).trim();
      const lastModified = row.published_at ?? row.updated_at ?? HOME_LAST_MODIFIED;
      return {
        url: `${APP_URL}/blog/${encodeURIComponent(slug)}`,
        lastModified: new Date(lastModified),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      };
    });
  } catch (e) {
    console.error('[sitemap] blog articles', e);
  }

  return [...staticPages, ...blogPages];
}
