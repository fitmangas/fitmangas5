'use client';

import Link from 'next/link';

import { QuizShell } from '@/components/Quiz/QuizShell';
import { QUIZ_CATALOG } from '@/lib/quiz/catalog';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = { locale: QuizLocale };

const COPY = {
  fr: {
    eyebrow: '5 évaluations · un rapport, pas un sticker',
    title: 'Comprendre comment tu tiens — ou pourquoi tu lâches.',
    lead: 'Pas une landing. Pas un test à quatre phrases. Des situations concrètes, puis un compte-rendu que tu peux lire et enregistrer en PDF : forces, stress, peurs, comment te parler. Le premier est une lecture type DISC, appliquée à ton agenda et à ton corps.',
    start: 'Commencer',
    questions: 'situations',
  },
  es: {
    eyebrow: '5 evaluaciones · un informe, no una etiqueta',
    title: 'Entender cómo te sostienes — o por qué sueltas.',
    lead: 'No es una landing. No es un test de cuatro frases. Situaciones concretas, luego un informe que puedes leer y guardar en PDF: fuerzas, estrés, miedos, cómo hablarte. El primero es una lectura tipo DISC, aplicada a tu agenda y a tu cuerpo.',
    start: 'Empezar',
    questions: 'situaciones',
  },
} as const;

export function QuizHub({ locale }: Props) {
  const t = COPY[locale];
  const quizBase = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <QuizShell locale={locale}>
      <section className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:pt-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">{t.eyebrow}</p>
        <h1
          className="mt-4 text-[2.1rem] leading-[1.12] tracking-tight text-[#2C241E] sm:text-[2.65rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
        >
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#2C241E]/65">{t.lead}</p>

        <ol className="mt-12 divide-y divide-[#2C241E]/10 border-y border-[#2C241E]/10">
          {QUIZ_CATALOG.map((quiz, i) => (
            <li key={quiz.slug}>
              <Link
                href={`${quizBase}/${quiz.slug}`}
                className="group flex items-start gap-5 py-6 transition hover:bg-[#C45D3E]/[0.04]"
              >
                <span className="mt-1 w-8 shrink-0 text-[12px] tabular-nums text-[#2C241E]/35">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className="text-[1.35rem] tracking-tight text-[#2C241E]"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
                    >
                      {quiz.title[locale]}
                    </span>
                    <span className="text-[12px] text-[#2C241E]/40">
                      {quiz.questions.length} {t.questions} · {quiz.durationHint[locale]}
                    </span>
                  </span>
                  <span className="mt-2 block text-[14px] leading-relaxed text-[#2C241E]/60">
                    {quiz.description[locale]}
                  </span>
                  <span className="mt-3 inline-block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#C45D3E] transition group-hover:tracking-[0.18em]">
                    {t.start} →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </QuizShell>
  );
}
