import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SelfTestRunner } from '@/components/SelfKnowledge/SelfTestRunner';
import { getSelfTest, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SELF_TEST_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const test = getSelfTest(slug);
  if (!test) return { title: 'Test' };
  return {
    title: test.title.es,
    description: test.description.es,
    alternates: {
      canonical: `/es/quiz/${slug}`,
      languages: { fr: `/quiz/${slug}`, es: `/es/quiz/${slug}` },
    },
    openGraph: {
      title: test.title.es,
      description: test.description.es,
      url: `${APP_URL}/es/quiz/${slug}`,
      type: 'website',
      images: ['/og-default.jpg'],
    },
  };
}

export default async function QuizSlugEsPage({ params }: Props) {
  const { slug } = await params;
  const test = getSelfTest(slug);
  if (!test) notFound();
  return <SelfTestRunner test={test} locale="es" mode="public" />;
}
