import type { Metadata } from 'next';

import { QuizHub } from '@/components/Quiz/QuizHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: 'Profils FitMangas — 5 tests pour comprendre comment tu tiens',
  description:
    'Profil de discipline, énergie du jour, seule face au tapis, carte du stress, archétype « je rate puis… ». Des miroirs — pas un guide Pilates.',
  alternates: {
    canonical: '/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Profils FitMangas — 5 tests',
    description: 'Comprendre comment tu tiens — ou pourquoi tu lâches.',
    url: `${APP_URL}/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubPage() {
  return <QuizHub locale="fr" />;
}
