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
    <div
      className="quiz-doc relative min-h-screen overflow-x-hidden text-brand-ink font-sans selection:bg-[#c45d3e]/20"
      style={{
        backgroundColor: '#f6f3ed',
        backgroundImage:
          'radial-gradient(900px 480px at -8% -16%, rgba(255,209,153,0.22) 0%, transparent 62%), radial-gradient(800px 420px at 108% -12%, rgba(229,208,186,0.2) 0%, transparent 64%), linear-gradient(180deg, #f8f5ef 0%, #f2eee7 100%)',
      }}
    >
      <header className="quiz-no-print sticky top-0 z-50 border-b border-brand-ink/[0.03] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href={home} className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FitMangas" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-[13px] font-semibold tracking-wide text-brand-ink">FitMangas</span>
          </Link>
          <Link
            href={hub}
            className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/55 transition hover:text-[#c45d3e]"
          >
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
