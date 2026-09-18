'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QuizReport } from '@/components/Quiz/QuizReport';
import { QuizShell } from '@/components/Quiz/QuizShell';
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
        <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
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
            <ol className="mt-8 space-y-4 border-l-2 border-[#C45D3E] pl-5">
              {quiz.briefing[locale].map((line, i) => (
                <li key={i} className="text-[15px] leading-relaxed text-[#2C241E]/80">
                  {line}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-8 text-[15px] leading-relaxed text-[#2C241E]/70">
              {locale === 'es'
                ? 'No hay respuesta correcta. Elige la que más se te parece. Al final, un informe — no cuatro líneas.'
                : 'Il n’y a pas de bonne réponse. Choisis celle qui te ressemble le plus. À la fin, un rapport — pas quatre lignes.'}
            </p>
          )}

          <button
            type="button"
            onClick={() => setPhase('questions')}
            className="mt-10 inline-flex items-center justify-center rounded-md bg-[#C45D3E] px-6 py-3.5 text-[13px] font-semibold text-white transition hover:brightness-110"
          >
            {locale === 'es' ? 'Empezar la evaluación →' : 'Commencer l’évaluation →'}
          </button>
          <div className="mt-4">
            <Link href={hubHref} className="text-[13px] text-[#2C241E]/40 hover:text-[#C45D3E]">
              ← {locale === 'es' ? 'Las 5 evaluaciones' : 'Les 5 évaluations'}
            </Link>
          </div>
        </section>
      ) : null}

      {phase === 'questions' && question ? (
        <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">
              {quiz.eyebrow[locale]}
            </p>
            <p className="text-[12px] tabular-nums text-[#2C241E]/40">
              {step + 1} / {total}
            </p>
          </div>
          <div className="mb-8 h-[2px] overflow-hidden rounded-full bg-[#2C241E]/10">
            <div
              className="h-full rounded-full bg-[#C45D3E] transition-all duration-300"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>

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

          <div className="mt-8 grid gap-3">
            {question.options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => pick(opt.id)}
                className="flex w-full items-start gap-4 rounded-xl border border-[#2C241E]/12 bg-white px-4 py-4 text-left transition hover:border-[#C45D3E]/50 hover:bg-[#C45D3E]/[0.04] sm:px-5"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FFFAF5] text-[12px] font-semibold text-[#C45D3E] ring-1 ring-[#2C241E]/10">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[15px] leading-snug text-[#2C241E]/90">{opt.label[locale]}</span>
              </button>
            ))}
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
