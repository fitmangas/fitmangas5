'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = {
  locale: SelfTestLang;
  children: ReactNode;
  /** Fond image plein écran (page questions) + voile cream */
  pageBackgroundUrl?: string;
  /** Opacité du voile cream 0–1 (défaut 0.38) */
  veilOpacity?: number;
  /** Mode PDF print : fond crème full-bleed, marges intérieures */
  printBleed?: boolean;
};

export function SelfTestShell({
  locale,
  children,
  pageBackgroundUrl,
  veilOpacity = 0.38,
  printBleed = false,
}: Props) {
  const home = locale === 'es' ? '/es' : '/';
  const hub = locale === 'es' ? '/es/quiz' : '/quiz';

  const defaultBg =
    'radial-gradient(900px 520px at -6% -18%, rgba(196,93,62,0.10) 0%, transparent 58%), radial-gradient(780px 440px at 108% -10%, rgba(229,208,186,0.35) 0%, transparent 62%), linear-gradient(180deg, #FFFAF5 0%, #F7F0E8 100%)';

  const style: CSSProperties = pageBackgroundUrl
    ? {
        backgroundColor: '#FFFAF5',
        backgroundImage: `linear-gradient(rgba(255,250,245,${veilOpacity}), rgba(255,250,245,${veilOpacity})), url('${pageBackgroundUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }
    : {
        backgroundColor: '#FFFAF5',
        backgroundImage: defaultBg,
      };

  return (
    <div
      className={`quiz-doc relative min-h-screen text-brand-ink font-sans selection:bg-[#c45d3e]/20 ${
        printBleed ? 'self-test-print-bleed' : ''
      }`}
      style={style}
      data-print-bleed={printBleed ? 'true' : undefined}
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
          @page { margin: 0; size: A4; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFAF5 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .quiz-no-print, .self-test-no-print { display: none !important; }
          .quiz-doc, .self-test-print-bleed {
            min-height: auto !important;
            background: #FFFAF5 !important;
            background-image: none !important;
          }
          .self-test-report {
            max-width: none !important;
            padding: 14mm 14mm 18mm !important;
            box-sizing: border-box !important;
          }
          .self-test-report a { text-decoration: none; color: inherit; }
          .sticky { position: static !important; }
          nav[data-testid="report-sticky-nav"] { display: none !important; }
        }
        /* Chromium page.pdf (emulateMedia print) — même règles */
        .self-test-print-bleed .self-test-report {
          padding: 14mm 14mm 18mm;
          max-width: none;
        }
      `}</style>
    </div>
  );
}
