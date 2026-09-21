import type { Metadata } from 'next';

import { SelfTestHub } from '@/components/SelfKnowledge/SelfTestHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: 'Tests de personnalité FitMangas — Big Five et attachement',
  description:
    'Questionnaires validés (IPIP-50 Big Five, ECR attachement). Aperçu de tes forces et lien vers l’essai gratuit des cours collectifs en visio.',
  alternates: {
    canonical: '/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Tests de personnalité FitMangas',
    description: 'Mieux te connaître pour tenir ta pratique — Big Five et attachement.',
    url: `${APP_URL}/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubPage() {
  return <SelfTestHub locale="fr" />;
}
