'use client';

import Image from 'next/image';
import Link from 'next/link';

import { DiscColorStrip } from '@/components/Quiz/QuizVisuals';
import { QuizShell } from '@/components/Quiz/QuizShell';
import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import { QUIZ_CATALOG } from '@/lib/quiz/catalog';
import { QUIZ_CARD_BY_SLUG } from '@/lib/quiz/media';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = { locale: QuizLocale };

const COPY = {
  fr: {
    eyebrow: '5 tests courts · un rapport sur toi',
    title: 'Comment tu réagis face à l’entraînement.',
    lead: 'Tu réponds à des situations simples. À la fin : ton mix en 4 couleurs, des graphiques, et un texte clair.',
    start: 'Commencer',
    questions: 'situations',
    stripTitle: 'Les 4 profils',
    stripLead: 'Une lettre = un mot simple. À la fin tu vois ton mix — pas une seule case.',
    proof: 'Elles ne s’entraînent plus seules',
    proofSub: 'Vidéos réelles d’adhérentes — glisse pour voir.',
  },
  es: {
    eyebrow: '5 tests cortos · un informe sobre ti',
    title: 'Cómo reaccionas frente al entrenamiento.',
    lead: 'Respondes a situaciones simples. Al final: tu mix en 4 colores, gráficos y un texto claro.',
    start: 'Empezar',
    questions: 'situaciones',
    stripTitle: 'Los 4 perfiles',
    stripLead: 'Una letra = una palabra simple. Al final ves tu mix — no una sola casilla.',
    proof: 'Ya no entrenan solas',
    proofSub: 'Vídeos reales de alumnas — desliza para ver.',
  },
} as const;

const terracottaCta =
  'inline-flex items-center justify-center rounded-full border-2 border-[#c45d3e] bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e] shadow-[0_8px_20px_rgba(196,93,62,0.14)] transition group-hover:bg-[#c45d3e] group-hover:text-white group-hover:shadow-[0_12px_26px_rgba(196,93,62,0.28)]';

export function QuizHub({ locale }: Props) {
  const t = COPY[locale];
  const quizBase = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <QuizShell locale={locale}>
      <section className="mx-auto max-w-5xl px-5 pb-6 pt-12 sm:pt-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-[2.1rem] italic leading-[1.12] tracking-tight text-brand-ink sm:text-[2.65rem]">
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-brand-ink/60">{t.lead}</p>
      </section>

      <QuizVideoProof locale={locale} title={t.proof} subtitle={t.proofSub} />

      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.stripTitle}</p>
        <p className="mt-2 text-[14px] text-brand-ink/55">{t.stripLead}</p>
        <div className="mt-5">
          <DiscColorStrip locale={locale} />
        </div>
      </section>

      <ol className="mx-auto max-w-5xl space-y-5 px-5 pb-20">
        {QUIZ_CATALOG.map((quiz, i) => {
          const card = QUIZ_CARD_BY_SLUG[quiz.slug];
          return (
            <li key={quiz.slug}>
              <Link
                href={`${quizBase}/${quiz.slug}`}
                className="group grid items-stretch gap-0 overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white/80 shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(196,93,62,0.14)] sm:grid-cols-[140px_1fr]"
              >
                <div className="relative hidden min-h-[148px] sm:block">
                  {card ? (
                    <Image
                      src={card.image}
                      alt={card.captionFr}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="140px"
                    />
                  ) : null}
                </div>
                <div className="flex items-start gap-4 p-5 sm:p-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] text-[11px] font-bold text-white shadow-lg">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-serif text-[1.25rem] italic leading-snug tracking-tight text-brand-ink sm:text-[1.4rem]">
                      {quiz.title[locale]}
                    </span>
                    <span className="mt-1 block text-[12px] text-brand-ink/40">
                      {quiz.questions.length} {t.questions} · {quiz.durationHint[locale]}
                    </span>
                    <span className="mt-2 block text-[14px] leading-relaxed text-brand-ink/60">
                      {quiz.description[locale]}
                    </span>
                    <span className={`${terracottaCta} mt-4`}>{t.start} →</span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </QuizShell>
  );
}
