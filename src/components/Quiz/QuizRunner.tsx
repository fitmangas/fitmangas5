'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QuizReport } from '@/components/Quiz/QuizReport';
import { QuizShell } from '@/components/Quiz/QuizShell';
import { DiscColorStrip } from '@/components/Quiz/QuizVisuals';
import { QUIZ_HERO_BY_SLUG, QUIZ_PROOF_IMAGES } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale } from '@/lib/quiz/types';
import { scoreQuiz } from '@/lib/quiz/types';

type Props = {
  quiz: QuizDefinition;
  locale: QuizLocale;
};

type Phase = 'intro' | 'questions' | 'result';

function trialUrl(locale: QuizLocale, slug: string) {
  const path = locale === 'es' ? '/es' : '';
  const params = new URLSearchParams({
    offer: 'v-coll',
    utm_source: 'quiz',
    utm_medium: 'web',
    utm_campaign: slug,
  });
  return `${path}/?${params.toString()}`;
}

export function QuizRunner({ quiz, locale }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const total = quiz.questions.length;
  const question = quiz.questions[step];
  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const score = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers]);
  const hero = QUIZ_HERO_BY_SLUG[quiz.slug] ?? QUIZ_PROOF_IMAGES[0];

  const result = useMemo(() => {
    if (phase !== 'result') return null;
    return quiz.results.find((r) => r.id === score.resultId) ?? quiz.results[0]!;
  }, [phase, quiz, score.resultId]);

  function pick(optionId: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    if (step + 1 >= total) {
      setPhase('result');
    } else {
      setStep(step + 1);
    }
  }

  return (
    <QuizShell locale={locale}>
      {phase === 'intro' ? (
        <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
          <div className="grid overflow-hidden rounded-3xl border border-[#2C241E]/10 bg-white/80 shadow-[0_32px_70px_-40px_rgba(44,36,30,0.65)] backdrop-blur-sm lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">
                {quiz.eyebrow[locale]} · {quiz.durationHint[locale]}
              </p>
              <h1
                className="mt-4 text-[2.1rem] leading-[1.1] tracking-tight text-[#2C241E] sm:text-[2.55rem]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
              >
                {quiz.title[locale]}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#2C241E]/65">{quiz.description[locale]}</p>

              {quiz.briefing ? (
                <ol className="mt-8 space-y-3">
                  {quiz.briefing[locale].map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl border border-[#2C241E]/08 bg-[#FFFAF5]/90 px-3.5 py-3 text-[14px] leading-relaxed text-[#2C241E]/80"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#C45D3E] text-[11px] font-bold text-white">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-8 text-[15px] leading-relaxed text-[#2C241E]/70">
                  {locale === 'es'
                    ? 'No hay respuesta correcta. Elige la que más se te parece. Al final, un informe gráfico — no cuatro líneas.'
                    : 'Il n’y a pas de bonne réponse. Choisis celle qui te ressemble le plus. À la fin, un rapport graphique — pas quatre lignes.'}
                </p>
              )}

              <button
                type="button"
                onClick={() => setPhase('questions')}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#C45D3E] px-6 py-3.5 text-[13px] font-semibold text-white shadow-[0_16px_36px_-14px_#C45D3E] transition hover:brightness-110"
              >
                {locale === 'es' ? 'Empezar la evaluación →' : 'Commencer l’évaluation →'}
              </button>
              <div className="mt-4">
                <Link href={hubHref} className="text-[13px] text-[#2C241E]/40 hover:text-[#C45D3E]">
                  ← {locale === 'es' ? 'Las 5 evaluaciones' : 'Les 5 évaluations'}
                </Link>
              </div>
            </div>
            <div className="relative hidden min-h-[320px] lg:block">
              <Image src={hero} alt="" fill className="object-cover" sizes="420px" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C241E]/35 via-transparent to-transparent" />
            </div>
          </div>

          {quiz.discLike ? (
            <div className="mt-6 rounded-2xl border border-[#2C241E]/10 bg-white/70 p-5 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.45)] backdrop-blur-sm sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">
                {locale === 'es' ? 'Lo que verás al final' : 'Ce que tu verras à la fin'}
              </p>
              <p className="mt-2 text-[13px] text-[#2C241E]/55">
                {locale === 'es'
                  ? 'Rueda de 4 colores + radar de tu mix. Inspiración libre DISC — no es un test Wiley oficial.'
                  : 'Roue des 4 couleurs + radar de ton mix. Inspiration libre DISC — pas un test Wiley officiel.'}
              </p>
              <div className="mt-5">
                <DiscColorStrip locale={locale} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {phase === 'questions' && question ? (
        <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">
              {quiz.eyebrow[locale]}
            </p>
            <p className="rounded-full bg-[#2C241E]/[0.05] px-3 py-1 text-[12px] tabular-nums text-[#2C241E]/50">
              {step + 1} / {total}
            </p>
          </div>
          <div className="mb-8 h-2 overflow-hidden rounded-full bg-[#2C241E]/10 ring-1 ring-[#2C241E]/05">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C45D3E] to-[#C9A227] transition-all duration-300"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>

          <div className="rounded-2xl border border-[#2C241E]/10 bg-white/80 p-5 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.5)] backdrop-blur-sm sm:p-7">
            <h2
              className="text-[1.45rem] leading-[1.2] tracking-tight text-[#2C241E] sm:text-[1.7rem]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
            >
              {question.prompt[locale]}
            </h2>
            <p className="mt-2 text-[13px] text-[#2C241E]/40">
              {locale === 'es'
                ? 'La que más se te parece. Sin puntuación visible hasta el informe.'
                : 'Celle qui te ressemble le plus. Aucun score visible avant le rapport.'}
            </p>

            <div className="mt-7 grid gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pick(opt.id)}
                  className="group flex w-full items-start gap-4 rounded-xl border border-[#2C241E]/12 bg-[#FFFAF5]/80 px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#C45D3E]/50 hover:bg-white hover:shadow-[0_16px_36px_-20px_rgba(196,93,62,0.45)] sm:px-5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[12px] font-semibold text-[#C45D3E] ring-1 ring-[#2C241E]/10 transition group-hover:bg-[#C45D3E] group-hover:text-white group-hover:ring-[#C45D3E]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[15px] leading-snug text-[#2C241E]/90">{opt.label[locale]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {phase === 'result' && result ? (
        <QuizReport
          quiz={quiz}
          result={result}
          score={score}
          locale={locale}
          trialHref={trialUrl(locale, quiz.slug)}
          hubHref={hubHref}
        />
      ) : null}
    </QuizShell>
  );
}
