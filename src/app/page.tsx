import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';

import { LandingPage } from '@/components/LandingPage';
import { loadLandingHomeData } from '@/lib/landing/home-data';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

const HOME_TITLE = 'FitMangas — Pilates & Barre en visio : cours collectifs avec Alejandra';
const HOME_DESCRIPTION =
  'Pilates & Barre en visio : des cours collectifs à horaires fixes, la correction en direct et le fait d’être vue. Essai gratuit 7 jours avec Alejandra.';

function landingLangFromAcceptLanguage(value: string | null): 'FR' | 'ES' {
  const firstSupported = (value ?? '')
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .find((lang) => lang?.startsWith('fr') || lang?.startsWith('es'));
  return firstSupported?.startsWith('es') ? 'ES' : 'FR';
}

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
    languages: {
      fr: '/',
      es: '/es',
      'x-default': '/',
    },
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: APP_URL,
    siteName: 'FitMangas',
    type: 'website',
    locale: 'fr_FR',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ['/og-default.jpg'],
  },
};

type HomeSearchParams = Promise<{ compte?: string; offer?: string; course?: string }>;

export const revalidate = 300;

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const sp = await searchParams;
  const openLoginRequired = sp.compte === 'connexion-requise';
  const initialOfferId = sp.offer?.trim() || sp.course?.trim() || undefined;
  const { vimeoShowcase, blogPreviews } = await loadLandingHomeData();
  const acceptLang = landingLangFromAcceptLanguage((await headers()).get('accept-language'));
  // Sur /, on reste en FR par défaut pour le SEO FR ; le navigateur ES est renvoyé via hreflang /es.
  const initialLang = acceptLang === 'ES' ? 'ES' : 'FR';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'FitMangas',
    legalName: 'Alejandra Mangas',
    url: APP_URL,
    sameAs: ['https://www.instagram.com/fit.mangas/'],
    areaServed: ['France', 'Spain', 'Mexico'],
    description:
      'Pilates et Barre en visio : rendez-vous fixe, correction en direct et accompagnement avec Alejandra.',
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
