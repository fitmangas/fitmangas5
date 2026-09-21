import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { QuizRunner } from '@/components/Quiz/QuizRunner';
import { getQuizBySlug, QUIZ_SLUGS } from '@/lib/quiz/catalog';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return QUIZ_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz) return { title: 'Quiz' };
  return {
    title: quiz.title.es,
    description: quiz.description.es,
    alternates: {
      canonical: `/es/quiz/${slug}`,
      languages: { fr: `/quiz/${slug}`, es: `/es/quiz/${slug}` },
    },
    openGraph: {
      title: quiz.title.es,
      description: quiz.description.es,
      url: `${APP_URL}/es/quiz/${slug}`,
      type: 'website',
      images: ['/og-default.jpg'],
    },
  };
}

export default async function QuizEsPage({ params }: Props) {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz) notFound();
  return <QuizRunner quiz={quiz} locale="es" />;
}
