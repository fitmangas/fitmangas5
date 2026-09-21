import type { Metadata } from 'next';

import { SelfTestHub } from '@/components/SelfKnowledge/SelfTestHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: 'Tests de personalidad FitMangas — Big Five y apego',
  description:
    'Cuestionarios validados (IPIP-50 Big Five, ECR apego). Vista previa de tus fortalezas y enlace a la prueba gratuita de cursos colectivos en visio.',
  alternates: {
    canonical: '/es/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Tests de personalidad FitMangas',
    description: 'Conocerte mejor para sostener tu práctica — Big Five y apego.',
    url: `${APP_URL}/es/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubEsPage() {
  return <SelfTestHub locale="es" />;
}
