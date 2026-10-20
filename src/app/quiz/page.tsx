import type { Metadata } from 'next';

import { SelfTestHub } from '@/components/SelfKnowledge/SelfTestHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: { absolute: 'Tests de personnalité FitMangas — Big Five et attachement' },
  description: 'Des tests gratuits pour mieux te connaître et choisir ta pratique.',
  alternates: {
    canonical: '/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Tests de personnalité FitMangas',
    description: 'Des tests gratuits pour mieux te connaître et choisir ta pratique.',
    url: `${APP_URL}/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubPage() {
  return <SelfTestHub locale="fr" />;
}
