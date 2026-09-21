import type { Metadata } from 'next';

import { QuizHub } from '@/components/Quiz/QuizHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: 'Évaluations FitMangas — rapport de profil, pas un sticker',
  description:
    'Lecture type DISC (discipline), énergie, seule face au tapis, carte du stress, archétype après un raté. Un compte-rendu à lire et enregistrer en PDF.',
  alternates: {
    canonical: '/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Évaluations FitMangas — un rapport, pas un sticker',
    description: 'Comprendre comment tu tiens — rapport lisible, pas quatre lignes.',
    url: `${APP_URL}/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubPage() {
  return <QuizHub locale="fr" />;
}
