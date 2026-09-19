'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QuizReport } from '@/components/Quiz/QuizReport';
import { QuizShell } from '@/components/Quiz/QuizShell';
import { DiscColorStrip } from '@/components/Quiz/QuizVisuals';
import { QUIZ_CARD_BY_SLUG } from '@/lib/quiz/media';
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

const terracottaCta =
  'inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(196,93,62,0.28)] transition hover:brightness-110';

export function QuizRunner({ quiz, locale }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const total = quiz.questions.length;
  const question = quiz.questions[step];
  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const score = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers]);
  const card = QUIZ_CARD_BY_SLUG[quiz.slug];

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
          <div className="grid overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] lg:grid-cols-[1.25fr_0.75fr]">
            <div className="min-w-0 p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">
                {quiz.eyebrow[locale]} · {quiz.durationHint[locale]}
              </p>
              <h1 className="mt-4 overflow-x-auto font-serif text-[clamp(1.25rem,3.4vw,2.1rem)] italic leading-tight tracking-tight text-brand-ink [text-wrap:nowrap]">
                {quiz.title[locale]}
              </h1>
              <p className="mt-3 overflow-x-auto text-[clamp(12px,1.7vw,15px)] text-brand-ink/60 [text-wrap:nowrap]">
                {quiz.description[locale]}
              </p>

              {quiz.briefing ? (
                <ol className="mt-8 space-y-2.5">
                  {quiz.briefing[locale].map((line, i) => (
                    <li
                      key={i}
                      className="flex min-w-0 items-start gap-3 rounded-2xl border border-brand-ink/[0.06] bg-brand-beige/40 px-3.5 py-2.5 text-[13px] leading-snug text-brand-ink/80"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] text-[10px] font-bold text-white">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ol>
              ) : null}

              <button type="button" onClick={() => setPhase('questions')} className={`${terracottaCta} mt-8`}>
                {locale === 'es' ? 'Empezar →' : 'Commencer →'}
              </button>
              <div className="mt-4">
                <Link href={hubHref} className="text-[13px] text-brand-ink/40 hover:text-[#c45d3e]">
                  ← {locale === 'es' ? 'Las 5 evaluaciones' : 'Les 5 évaluations'}
                </Link>
              </div>
            </div>
            {card ? (
              <div className="relative hidden min-h-[320px] lg:block">
                <Image src={card.image} alt={card.captionFr} fill className="object-cover" sizes="420px" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/92 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[13px] font-semibold text-brand-ink">
                    {locale === 'es' ? card.captionEs : card.captionFr}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {quiz.discLike ? (
            <div className="mt-6 rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">
                {locale === 'es' ? 'Los 4 perfiles' : 'Les 4 profils'}
              </p>
              <p className="mt-2 text-[13px] text-brand-ink/55">
                {locale === 'es'
                  ? 'Directa · Entusiasta · Constante · Metódica — una letra clara, una frase simple.'
                  : 'Directe · Enthousiaste · Assidue · Méthodique — une lettre claire, une phrase simple.'}
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
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{quiz.eyebrow[locale]}</p>
            <p className="rounded-full bg-brand-ink/[0.04] px-3 py-1 text-[12px] tabular-nums text-brand-ink/45">
              {step + 1} / {total}
            </p>
          </div>
          <div className="mb-8 h-2 overflow-hidden rounded-full bg-brand-ink/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#c45d3e,#b35338)] transition-all duration-300"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>

          <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-7">
            <h2 className="font-serif text-[1.45rem] italic leading-[1.2] tracking-tight text-brand-ink sm:text-[1.7rem]">
              {question.prompt[locale]}
            </h2>
            <p className="mt-2 text-[13px] text-brand-ink/40">
              {locale === 'es'
                ? 'La que más se te parece. Sin puntuación hasta el informe.'
                : 'Celle qui te ressemble le plus. Aucun score avant le rapport.'}
            </p>

            <div className="mt-7 grid gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pick(opt.id)}
                  className="group flex w-full items-start gap-4 rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/30 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[#c45d3e]/40 hover:bg-white hover:shadow-[0_12px_26px_rgba(196,93,62,0.12)] sm:px-5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-[#c45d3e] ring-1 ring-brand-ink/10 transition group-hover:bg-[#c45d3e] group-hover:text-white group-hover:ring-[#c45d3e]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[15px] leading-snug text-brand-ink/90">{opt.label[locale]}</span>
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
