import type { Metadata } from 'next';

import { QuizHub } from '@/components/Quiz/QuizHub';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: 'Evaluaciones FitMangas — informe de perfil, no una etiqueta',
  description:
    'Lectura tipo DISC (disciplina), energía, sola frente al tapete, mapa del estrés, arquetipo después de un fallo. Un informe para leer y guardar en PDF.',
  alternates: {
    canonical: '/es/quiz',
    languages: { fr: '/quiz', es: '/es/quiz' },
  },
  openGraph: {
    title: 'Evaluaciones FitMangas — un informe, no una etiqueta',
    description: 'Entender cómo te sostienes — informe para leer, no cuatro líneas.',
    url: `${APP_URL}/es/quiz`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function QuizHubEsPage() {
  return <QuizHub locale="es" />;
}
