import type { Metadata } from 'next';
import Script from 'next/script';

import { LandingPage } from '@/components/LandingPage';
import { loadLandingHomeData } from '@/lib/landing/home-data';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

const HOME_TITLE = 'FitMangas — Pilates y Barre online: cita fija con Alejandra';
const HOME_DESCRIPTION =
  'Pilates y Barre online: una cita fija, corrección en directo y sentirte vista. Prueba gratis 7 días con Alejandra.';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/es',
    languages: {
      fr: '/',
      es: '/es',
      'x-default': '/',
    },
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${APP_URL}/es`,
    siteName: 'FitMangas',
    type: 'website',
    locale: 'es_ES',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ['/og-default.jpg'],
  },
};

type HomeSearchParams = Promise<{ compte?: string; offer?: string }>;

export const revalidate = 300;

export default async function EsHomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const sp = await searchParams;
  const openLoginRequired = sp.compte === 'connexion-requise';
  const initialOfferId = sp.offer?.trim() || undefined;
  const { vimeoShowcase, blogPreviews } = await loadLandingHomeData();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'FitMangas',
    legalName: 'Alejandra Mangas',
    url: `${APP_URL}/es`,
    inLanguage: 'es',
    sameAs: ['https://www.instagram.com/fit.mangas/'],
    areaServed: ['France', 'Spain', 'Mexico'],
    description:
      'Pilates y Barre online: cita fija, corrección en directo y acompañamiento con Alejandra.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '39',
      highPrice: '269',
      priceCurrency: 'EUR',
    },
  };

  return (
    <>
      <Script id="fitmangas-jsonld-es" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage
        vimeoShowcase={vimeoShowcase}
        blogPreviews={blogPreviews}
        initialLang="ES"
        openLoginRequired={openLoginRequired}
        initialOfferId={initialOfferId}
      />
    </>
  );
}
