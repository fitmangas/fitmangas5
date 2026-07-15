import type { Metadata } from 'next';
import { SeoPillarPageShell } from '@/components/Blog/SeoPillarPageShell';
import { getSeoPillarPage, SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
const page = getSeoPillarPage('cours-pilates-visio')!;

export const metadata: Metadata = {
  title: `${page.shortTitle} — cours live avec coach | FitMangas`,
  description: page.description,
  keywords: page.keywords,
  alternates: { canonical: '/cours-pilates-visio' },
  openGraph: {
    title: page.title,
    description: page.description,
    url: `${APP_URL}/cours-pilates-visio`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: page.title,
    description: page.description,
    images: ['/og-default.jpg'],
  },
};

export default function CoursPilatesVisioPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SeoPillarPageShell page={page} relatedPages={SEO_PILLAR_PAGES.filter((item) => item.slug !== page.slug)} />
    </>
  );
}

function jsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: `${APP_URL}/cours-pilates-visio`,
        about: page.keywords,
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };
}
