'use client';

import Link from 'next/link';

import { QUIZ_CATALOG } from '@/lib/quiz/catalog';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = {
  locale: QuizLocale;
};

const COPY = {
  fr: {
    brand: 'FitMangas',
    eyebrow: 'Profils · 5 tests',
    title: 'Comprendre comment tu tiens — ou pourquoi tu lâches',
    lead: 'Pas un guide « comment démarrer le Pilates ». Des miroirs pour te catégoriser, te reconnaître, puis choisir un cadre qui te tient.',
    start: 'Commencer',
    home: 'Accueil',
  },
  es: {
    brand: 'FitMangas',
    eyebrow: 'Perfiles · 5 tests',
    title: 'Entender cómo te mantienes — o por qué sueltas',
    lead: 'No es una guía « cómo empezar Pilates ». Espejos para categorizarte, reconocerte y elegir un marco que te sostenga.',
    start: 'Empezar',
    home: 'Inicio',
  },
} as const;

export function QuizHub({ locale }: Props) {
  const t = COPY[locale];
  const homeHref = locale === 'es' ? '/es' : '/';
  const quizBase = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0908] text-[#F6F0E8]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 45% at 15% -5%, #C45D3E44, transparent 55%),
            radial-gradient(ellipse 50% 35% at 95% 5%, #7A9EAE28, transparent 50%),
            linear-gradient(180deg, #14110f 0%, #0B0908 45%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-8">
        <header className="mb-10 flex items-center justify-between">
          <p className="text-[13px] font-semibold tracking-wide">{t.brand}</p>
          <Link
            href={homeHref}
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#F6F0E8]/55 transition hover:text-[#F6F0E8]"
          >
            {t.home}
          </Link>
        </header>

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C45D3E]">{t.eyebrow}</p>
        <h1
          className="mt-4 max-w-2xl text-[2.15rem] leading-[1.08] tracking-tight text-[#FFFAF5] sm:text-[2.75rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
        >
          {t.title}
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#F6F0E8]/65 sm:text-[16px]">{t.lead}</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {QUIZ_CATALOG.map((quiz, index) => {
            const wide = index === 0;
            return (
              <Link
                key={quiz.slug}
                href={`${quizBase}/${quiz.slug}`}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:border-white/25 hover:bg-white/[0.06] sm:p-6 ${
                  wide ? 'sm:col-span-2 sm:flex sm:items-end sm:justify-between sm:gap-8' : ''
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
                  style={{ background: quiz.accent }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: quiz.accent }}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F6F0E8]/45">
                      {quiz.eyebrow[locale]} · {quiz.durationHint[locale]}
                    </span>
                  </div>
                  <h2
                    className={`mt-3 tracking-tight text-[#FFFAF5] ${
                      wide ? 'text-[1.55rem] sm:text-[1.75rem]' : 'text-[1.25rem]'
                    }`}
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontStyle: 'italic',
                      fontWeight: 600,
                    }}
                  >
                    {quiz.title[locale]}
                  </h2>
                  <p
                    className={`mt-2 text-[13px] leading-relaxed text-[#F6F0E8]/55 ${
                      wide ? 'max-w-lg sm:text-[14px]' : ''
                    }`}
                  >
                    {quiz.description[locale]}
                  </p>
                </div>
                <span
                  className={`relative mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] transition group-hover:gap-3 ${
                    wide ? 'sm:mt-0 sm:shrink-0' : ''
                  }`}
                  style={{ color: quiz.accent }}
                >
                  {t.start} →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
