import type { Metadata } from 'next';
import Script from 'next/script';

import { LandingPage } from '@/components/LandingPage';
import { uniqueBlogImageUrl } from '@/lib/blog/images';
import { createAdminClient } from '@/lib/supabase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Fit Mangas — Pilates en visio et en studio',
  description: 'Cours de Pilates et Barre avec Alejandra : visio collectif, individuel, replay et accompagnement premium.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Fit Mangas — Pilates en visio et en studio',
    description: 'Rejoins Fit Mangas : cours live, replay, progression et coaching premium.',
    url: APP_URL,
    siteName: 'Fit Mangas',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fit Mangas — Pilates en visio et en studio',
    description: 'Cours live, replay et progression personnalisée.',
  },
};

export default async function HomePage() {
  let vimeoShowcase: { title: string; thumbnailUrl: string | null }[] = [];
  let blogPreviews: { title: string; excerpt: string | null; coverImageUrl: string | null; categoryLabel: string | null }[] = [];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('standalone_vimeo_videos')
      .select('title, thumbnail_url')
      .eq('validation_status', 'published')
      .not('title', 'is', null)
      .not('thumbnail_url', 'is', null)
      .not('thumbnail_url', 'ilike', '%default-live%')
      .order('published_at', { ascending: false })
      .limit(12);

    vimeoShowcase = (data ?? [])
      .map((row) => ({
        title: typeof row.title === 'string' ? row.title : '',
        thumbnailUrl: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
      }))
      .filter((item) => item.title.trim().length > 0);

    const { data: articles } = await admin
      .from('blog_articles')
      .select('title_fr, description_fr, featured_image_url, published_at, blog_categories ( label_fr, slug )')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);
    const usedImages = new Set<string>();
    blogPreviews = (articles ?? []).map((row, index) => {
      const category = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories;
      const categoryLabel =
        typeof category?.label_fr === 'string'
          ? category.label_fr
          : typeof category?.slug === 'string'
            ? category.slug
            : null;
      return {
        title: String(row.title_fr ?? ''),
        excerpt: row.description_fr ? String(row.description_fr) : null,
        coverImageUrl: uniqueBlogImageUrl({
          coverImageUrl: row.featured_image_url ? String(row.featured_image_url) : null,
          categoryLabel,
          index,
          used: usedImages,
        }),
        categoryLabel,
      };
    });
  } catch {
    vimeoShowcase = [];
    blogPreviews = [];
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Fit Mangas',
    url: APP_URL,
    sameAs: ['https://www.instagram.com/fit.mangas/'],
    areaServed: ['France', 'Spain', 'Mexico'],
    description: 'Studio Pilates et Barre en visio et en studio.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '39',
      highPrice: '269',
      priceCurrency: 'EUR',
    },
  };

  return (
    <>
      <Script id="fitmangas-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage vimeoShowcase={vimeoShowcase} blogPreviews={blogPreviews} />
    </>
  );
}
