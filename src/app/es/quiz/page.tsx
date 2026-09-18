import type { Metadata } from 'next';

import { QuizHub } from '@/components/Quiz/QuizHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: 'Perfiles FitMangas — 5 tests para entender cómo te mantienes',
  description:
    'Perfil de disciplina, energía del día, sola frente al tapete, mapa del estrés, arquetipo « fallo y luego… ». Espejos — no una guía de Pilates.',
  alternates: {
    canonical: '/es/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Perfiles FitMangas — 5 tests',
    description: 'Entender cómo te mantienes — o por qué sueltas.',
    url: `${APP_URL}/es/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubEsPage() {
  return <QuizHub locale="es" />;
}
