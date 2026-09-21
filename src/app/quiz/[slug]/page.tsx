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
    title: test.title.fr,
    description: test.description.fr,
    alternates: {
      canonical: `/quiz/${slug}`,
      languages: { fr: `/quiz/${slug}`, es: `/es/quiz/${slug}` },
    },
    openGraph: {
      title: test.title.fr,
      description: test.description.fr,
      url: `${APP_URL}/quiz/${slug}`,
      type: 'website',
      images: ['/og-default.jpg'],
    },
  };
}

export default async function QuizSlugPage({ params }: Props) {
  const { slug } = await params;
  const test = getSelfTest(slug);
  if (!test) notFound();
  return <SelfTestRunner test={test} locale="fr" mode="public" />;
}
