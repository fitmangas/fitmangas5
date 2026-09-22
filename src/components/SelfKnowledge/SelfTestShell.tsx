'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = {
  locale: SelfTestLang;
  children: ReactNode;
};

export function SelfTestShell({ locale, children }: Props) {
  const home = locale === 'es' ? '/es' : '/';
  const hub = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <div
      className="quiz-doc relative min-h-screen text-brand-ink font-sans selection:bg-[#c45d3e]/20"
      style={{
        backgroundColor: '#FFFAF5',
        backgroundImage:
          'radial-gradient(900px 520px at -6% -18%, rgba(196,93,62,0.10) 0%, transparent 58%), radial-gradient(780px 440px at 108% -10%, rgba(229,208,186,0.35) 0%, transparent 62%), linear-gradient(180deg, #FFFAF5 0%, #F7F0E8 100%)',
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
            {locale === 'es' ? 'Los tests' : 'Les tests'}
          </Link>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <style>{`
        @media print {
          @page { margin: 10mm 12mm 14mm; size: A4; }
          html, body {
            background: #FFFAF5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .quiz-no-print, .self-test-no-print { display: none !important; }
          .quiz-doc {
            background: #FFFAF5 !important;
            background-image: none !important;
          }
          .self-test-report {
            max-width: none !important;
            padding: 0 !important;
          }
          .self-test-report a { text-decoration: none; color: inherit; }
          .sticky { position: static !important; }
          nav[data-testid="report-sticky-nav"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
