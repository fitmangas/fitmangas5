import type { MetadataRoute } from 'next';

import { createAdminClient } from '@/lib/supabase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = ['/', '/blog', '/privacy', '/terms', '/boutique', '/connexion'].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '/blog' || path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blog_articles')
      .select('slug_fr,slug_es,updated_at,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const articles = (data ?? []).flatMap((article) => {
      const lastModified = article.updated_at || article.published_at || now;
      return [article.slug_fr, article.slug_es]
        .filter((slug): slug is string => Boolean(slug))
        .map((slug) => ({
          url: `${APP_URL}/blog/${slug}`,
          lastModified,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
    });

    return [...staticPages, ...articles];
  } catch {
    return staticPages;
  }
}
