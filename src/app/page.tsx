import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';

import { LandingPage } from '@/components/LandingPage';
import { uniqueBlogImageUrl } from '@/lib/blog/images';
import { createAdminClient } from '@/lib/supabase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

function landingLangFromAcceptLanguage(value: string | null): 'FR' | 'ES' {
  const firstSupported = (value ?? '')
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .find((lang) => lang?.startsWith('fr') || lang?.startsWith('es'));
  return firstSupported?.startsWith('es') ? 'ES' : 'FR';
}

export const metadata: Metadata = {
  title: 'FitMangas — Cours de Pilates & Barre en visio avec Alejandra',
  description: 'Cours de Pilates et Barre en visio avec Alejandra : live, replay, progression et coaching premium.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FitMangas — Cours de Pilates & Barre en visio avec Alejandra',
    description: 'Cours de Pilates et Barre en visio avec Alejandra : live, replay, progression et coaching premium.',
    url: APP_URL,
    siteName: 'FitMangas',
    type: 'website',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitMangas — Cours de Pilates & Barre en visio avec Alejandra',
    description: 'Cours de Pilates et Barre en visio avec Alejandra : live, replay, progression et coaching premium.',
    images: ['/og-default.jpg'],
  },
};

type HomeSearchParams = Promise<{ compte?: string; offer?: string }>;

export const revalidate = 300;

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const sp = await searchParams;
  const openLoginRequired = sp.compte === 'connexion-requise';
  const initialOfferId = sp.offer?.trim() || undefined;
  let vimeoShowcase: { title: string; thumbnailUrl: string | null }[] = [];
  let blogPreviews: {
    titleFr: string;
    titleEs: string | null;
    excerptFr: string | null;
    excerptEs: string | null;
    coverImageUrl: string | null;
    categoryLabelFr: string | null;
    categoryLabelEs: string | null;
  }[] = [];
  const initialLang = landingLangFromAcceptLanguage((await headers()).get('accept-language'));

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
      .select('title_fr, title_es, description_fr, description_es, featured_image_url, published_at, blog_categories ( label_fr, label_es, slug )')
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
        titleFr: String(row.title_fr ?? ''),
        titleEs: row.title_es ? String(row.title_es) : null,
        excerptFr: row.description_fr ? String(row.description_fr) : null,
        excerptEs: row.description_es ? String(row.description_es) : null,
        coverImageUrl: uniqueBlogImageUrl({
          coverImageUrl: row.featured_image_url ? String(row.featured_image_url) : null,
          categoryLabel,
          index,
          used: usedImages,
        }),
        categoryLabelFr: categoryLabel,
        categoryLabelEs: typeof category?.label_es === 'string' ? category.label_es : categoryLabel,
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
      <LandingPage
        vimeoShowcase={vimeoShowcase}
        blogPreviews={blogPreviews}
        initialLang={initialLang}
        openLoginRequired={openLoginRequired}
        initialOfferId={initialOfferId}
      />
    </>
  );
}
