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
    <div className="quiz-doc relative min-h-screen overflow-x-hidden bg-[#FFFAF5] text-[#2C241E]">
      {/* Grille + glow façon monteur-ia, adaptés crème / terracotta */}
      <div
        aria-hidden
        className="quiz-no-print pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(44,36,30,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(44,36,30,0.045) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="quiz-no-print pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#C45D3E]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="quiz-no-print pointer-events-none absolute -right-16 top-[40%] h-80 w-80 rounded-full bg-[#C9A227]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="quiz-no-print pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#6B8F71]/10 blur-3xl"
      />

      <header className="quiz-no-print relative z-20 border-b border-[#2C241E]/10 bg-[#FFFAF5]/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href={home} className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FitMangas" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-[13px] font-semibold tracking-wide">FitMangas</span>
          </Link>
          <Link href={hub} className="text-[12px] text-[#2C241E]/55 transition hover:text-[#C45D3E]">
            {locale === 'es' ? 'Las 5 evaluaciones' : 'Les 5 évaluations'}
          </Link>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <style>{`
        @media print {
          @page { margin: 14mm; }
          html, body { background: #fff !important; }
          .quiz-no-print { display: none !important; }
          .quiz-doc { background: #fff !important; }
          .quiz-report { max-width: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
