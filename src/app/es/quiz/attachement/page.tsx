import type { Metadata } from 'next';

import { AttachmentQuizClient } from '@/components/Quiz/AttachmentQuizClient';
import { QUIZ_META } from '@/lib/quiz/attachment-discipline';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com').replace(
  /\/$/,
  '',
);

export const metadata: Metadata = {
  title: QUIZ_META.es.title,
  description: QUIZ_META.es.description,
  alternates: {
    canonical: '/es/quiz/attachement',
    languages: { fr: '/quiz/attachement', es: '/es/quiz/attachement' },
  },
  openGraph: {
    title: QUIZ_META.es.title,
    description: QUIZ_META.es.description,
    url: `${APP_URL}/es/quiz/attachement`,
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export default function AttachmentQuizEsPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F2]">
      <AttachmentQuizClient locale="es" />
    </main>
  );
}
