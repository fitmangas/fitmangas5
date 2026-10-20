import type { Metadata } from 'next';
import { SeoPillarPageShell } from '@/components/Blog/SeoPillarPageShell';
import { getSeoPillarPage, SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOnsiteEnabled } from '@/lib/onsite/flag';
import type { WeekLive } from '@/components/Marketing/LesCoursExtras';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
const page = getSeoPillarPage('cours-pilates-visio')!;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Cours de Pilates en visio, en direct avec Alejandra',
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

export default async function CoursPilatesVisioPage() {
  const weekLives = await loadWeekLives();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <SeoPillarPageShell
        page={page}
        relatedPages={SEO_PILLAR_PAGES.filter((item) => item.slug !== page.slug)}
        weekLives={weekLives}
      />
    </>
  );
}

async function loadWeekLives(): Promise<WeekLive[]> {
  try {
    const admin = createAdminClient();
    const from = new Date();
    const to = new Date(from.getTime() + 7 * 86400000);
    let query = admin
      .from('courses')
      .select('id, title, starts_at, course_language, course_format')
      .eq('is_published', true)
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString())
      .order('starts_at', { ascending: true })
      .limit(24);
    if (!isOnsiteEnabled()) query = query.neq('course_format', 'onsite');
    const { data } = await query;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ''),
      startsAt: String(row.starts_at ?? ''),
      language: typeof row.course_language === 'string' ? row.course_language : null,
    }));
  } catch {
    return [];
  }
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
