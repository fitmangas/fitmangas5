'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { QuizLocale } from '@/lib/quiz/types';

type Props = {
  locale: QuizLocale;
  children: ReactNode;
};

export function QuizShell({ locale, children }: Props) {
  const home = locale === 'es' ? '/es' : '/';
  const hub = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <div className="quiz-doc min-h-screen bg-[#FFFAF5] text-[#2C241E]">
      <header className="quiz-no-print border-b border-[#2C241E]/10 bg-[#FFFAF5]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href={home} className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FitMangas" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-[13px] font-semibold tracking-wide">FitMangas</span>
          </Link>
          <Link href={hub} className="text-[12px] text-[#2C241E]/55 transition hover:text-[#C45D3E]">
            {locale === 'es' ? 'Las 5 evaluaciones' : 'Les 5 évaluations'}
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <style>{`
        @media print {
          @page { margin: 16mm; }
          html, body { background: #fff !important; }
          .quiz-no-print { display: none !important; }
          .quiz-doc { background: #fff !important; }
          .quiz-report { max-width: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
