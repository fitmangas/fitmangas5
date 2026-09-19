'use client';

import Image from 'next/image';
import Link from 'next/link';

import { DiscColorStrip } from '@/components/Quiz/QuizVisuals';
import { QuizShell } from '@/components/Quiz/QuizShell';
import { QUIZ_CATALOG } from '@/lib/quiz/catalog';
import { QUIZ_CARD_BY_SLUG, QUIZ_PROOF_MIX } from '@/lib/quiz/media';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = { locale: QuizLocale };

const COPY = {
  fr: {
    eyebrow: '5 évaluations · un rapport clair, pas un sticker',
    title: 'Comprendre comment tu tiens — ou pourquoi tu lâches.',
    lead: 'Situations concrètes, puis un rapport avec graphiques + texte + témoignages. Quatre profils simples (D · E · A · M). Pas un test officiel.',
    start: 'Commencer',
    questions: 'situations',
    stripTitle: 'Les 4 profils',
    stripLead: 'Une lettre = un mot clair. Ton mix apparaît à la fin.',
    proof: 'Elles ne s’entraînent plus seules',
  },
  es: {
    eyebrow: '5 evaluaciones · un informe claro, no una etiqueta',
    title: 'Entender cómo te sostienes — o por qué sueltas.',
    lead: 'Situaciones concretas, luego un informe con gráficos + texto + testimonios. Cuatro perfiles simples (D · E · A · M). No es un test oficial.',
    start: 'Empezar',
    questions: 'situaciones',
    stripTitle: 'Los 4 perfiles',
    stripLead: 'Una letra = una palabra clara. Tu mix aparece al final.',
    proof: 'Ya no entrenan solas',
  },
} as const;

const terracottaCta =
  'inline-flex items-center justify-center rounded-full border-2 border-[#c45d3e] bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e] shadow-[0_8px_20px_rgba(196,93,62,0.14)] transition group-hover:bg-[#c45d3e] group-hover:text-white group-hover:shadow-[0_12px_26px_rgba(196,93,62,0.28)]';

export function QuizHub({ locale }: Props) {
  const t = COPY[locale];
  const quizBase = locale === 'es' ? '/es/quiz' : '/quiz';
  const marquee = [...QUIZ_PROOF_MIX, ...QUIZ_PROOF_MIX];

  return (
    <QuizShell locale={locale}>
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-12 sm:pt-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-[2.1rem] italic leading-[1.12] tracking-tight text-brand-ink sm:text-[2.65rem]">
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-brand-ink/60">{t.lead}</p>
      </section>

      {/* Preuve humaine : clientes + coach, pas 100 % Alejandra */}
      <div className="quiz-no-print relative mb-10 overflow-hidden border-y border-brand-ink/[0.04] bg-white py-5">
        <p className="mb-4 px-5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">
          {t.proof}
        </p>
        <div className="flex w-max animate-[quizMarquee_48s_linear_infinite] gap-3 px-3">
          {marquee.map((item, i) => (
            <div
              key={`${item.src}-${i}`}
              className="relative h-36 w-[7.5rem] shrink-0 overflow-hidden rounded-[22px] border border-brand-ink/[0.06] shadow-[0_10px_28px_rgba(0,0,0,0.08)] sm:h-40 sm:w-32"
            >
              <Image src={item.src} alt={item.name} fill className="object-cover" sizes="128px" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-2.5 pt-8">
                <p className="truncate text-[11px] font-semibold text-white">{item.name}</p>
                <p className="text-[9px] uppercase tracking-wider text-white/70">
                  {item.kind === 'client'
                    ? locale === 'es'
                      ? 'Mangita'
                      : 'Mangita'
                    : 'Coach'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes quizMarquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      <section className="mx-auto max-w-5xl px-5 pb-8">
        <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.stripTitle}</p>
          <p className="mt-2 text-[14px] text-brand-ink/55">{t.stripLead}</p>
          <div className="mt-5">
            <DiscColorStrip locale={locale} />
          </div>
        </div>
      </section>

      <ol className="mx-auto max-w-5xl space-y-4 px-5 pb-20">
        {QUIZ_CATALOG.map((quiz, i) => {
          const card = QUIZ_CARD_BY_SLUG[quiz.slug];
          return (
            <li key={quiz.slug}>
              <Link
                href={`${quizBase}/${quiz.slug}`}
                className="group grid overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(196,93,62,0.14)] sm:grid-cols-[150px_1fr]"
              >
                <div className="relative hidden min-h-[160px] sm:block">
                  {card ? (
                    <>
                      <Image src={card.poster} alt={card.name} fill className="object-cover" sizes="150px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[12px] font-semibold text-white">{card.name}</p>
                        <p className="truncate text-[10px] text-white/75">
                          {locale === 'es' ? card.professionEs : card.professionFr}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex items-start gap-4 p-5 sm:p-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] text-[11px] font-bold text-white shadow-lg">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-serif text-[1.35rem] italic tracking-tight text-brand-ink">
                        {quiz.title[locale]}
                      </span>
                      <span className="text-[12px] text-brand-ink/40">
                        {quiz.questions.length} {t.questions} · {quiz.durationHint[locale]}
                      </span>
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
