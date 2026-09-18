'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { QuizLocale } from '@/lib/quiz/types';

type Props = {
  locale: QuizLocale;
  children: ReactNode;
  stickyCta?: { href: string; label: string };
  /** Masquer le bandeau sticky bas */
  hideSticky?: boolean;
};

export function QuizLandingChrome({ locale, children, stickyCta, hideSticky }: Props) {
  const home = locale === 'es' ? '/es' : '/';
  const hub = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <div className="quiz-lmdm relative min-h-screen bg-[#080808] text-[#F5F5F5]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(196,93,62,0.22), transparent 55%)',
        }}
      />

      <header className="relative z-30 border-b border-white/10 bg-[#080808]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={home} className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FitMangas" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-[13px] font-semibold tracking-wide text-white">FitMangas</span>
          </Link>
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
            {locale === 'es' ? 'Perfiles' : 'Profils'}
          </p>
          <Link
            href={hub}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C45D3E] transition hover:text-[#e07a5a]"
          >
            {locale === 'es' ? 'Tests' : 'Tests'}
          </Link>
        </div>
      </header>

      <div className={`relative z-10 ${hideSticky ? '' : 'pb-24'}`}>{children}</div>

      {!hideSticky && stickyCta ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#080808]/92 px-4 py-3 backdrop-blur-lg">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="hidden text-[12px] text-white/50 sm:block">
              {locale === 'es'
                ? 'Un perfil real. Luego el marco que te sostiene.'
                : 'Un vrai profil. Puis le cadre qui te tient.'}
            </p>
            <a
              href={stickyCta.href}
              className="ml-auto inline-flex w-full items-center justify-center rounded-md bg-[#C45D3E] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[0_0_24px_rgba(196,93,62,0.35)] transition hover:brightness-110 sm:w-auto"
            >
              {stickyCta.label}
            </a>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes quizMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .quiz-marquee-track { animation: quizMarquee 42s linear infinite; }
        .quiz-marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
