import type { Metadata } from 'next';
import Script from 'next/script';

import { LandingPage } from '@/components/LandingPage';
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
  } catch {
    vimeoShowcase = [];
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
      <LandingPage vimeoShowcase={vimeoShowcase} />
    </>
  );
}
