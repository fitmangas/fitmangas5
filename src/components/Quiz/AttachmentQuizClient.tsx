'use client';

import { useMemo, useState } from 'react';

import {
  getAttachmentQuizQuestions,
  getAttachmentQuizResult,
  getAttachmentQuizTrialUrl,
  QUIZ_META,
  scoreAttachmentAnswers,
  type QuizLocale,
} from '@/lib/quiz/attachment-discipline';

type Step = 'intro' | 'questions' | 'result';

export function AttachmentQuizClient({ locale }: { locale: QuizLocale }) {
  const meta = QUIZ_META[locale];
  const questions = useMemo(() => getAttachmentQuizQuestions(locale), [locale]);
  const [step, setStep] = useState<Step>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = questions[index];
  const style = useMemo(
    () => (step === 'result' ? scoreAttachmentAnswers(questions, answers) : null),
    [step, questions, answers],
  );
  const result = style ? getAttachmentQuizResult(style, locale) : null;
  const trialUrl = getAttachmentQuizTrialUrl(locale);

  function pickOption(optionId: string) {
    if (!current) return;
    const nextAnswers = { ...answers, [current.id]: optionId };
    setAnswers(nextAnswers);
    if (index >= questions.length - 1) {
      setStep('result');
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10 md:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-accent">{meta.brand}</p>
      <h1 className="mt-3 font-serif text-3xl italic leading-tight tracking-tight text-brand-ink md:text-4xl">
        {meta.title}
      </h1>

      {step === 'intro' ? (
        <div className="mt-8 space-y-6">
          <p className="text-[0.95rem] leading-relaxed text-brand-ink/75 md:text-base">
            {meta.description}
          </p>
          <button
            type="button"
            onClick={() => {
              setStep('questions');
              setIndex(0);
              setAnswers({});
            }}
            className="inline-flex min-h-12 items-center justify-center bg-[#C45D3E] px-6 text-sm font-medium text-white transition hover:bg-[#b35338]"
          >
            {meta.start}
          </button>
        </div>
      ) : null}

      {step === 'questions' && current ? (
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-accent">
            {meta.progress(index + 1, questions.length)}
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden bg-brand-ink/10">
            <div
              className="h-full bg-[#C45D3E] transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
          <h2 className="mt-6 font-serif text-xl italic text-brand-ink md:text-2xl">{current.prompt}</h2>
          <div className="mt-6 flex flex-col gap-3">
            {current.options.map((opt) => {
              const selected = answers[current.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pickOption(opt.id)}
                  className={`min-h-14 border px-4 py-3 text-left text-sm leading-snug transition md:text-[0.95rem] ${
                    selected
                      ? 'border-[#C45D3E] bg-[#C45D3E]/10 text-brand-ink'
                      : 'border-brand-ink/15 bg-white text-brand-ink hover:border-[#C45D3E]/60'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="mt-6 text-sm text-brand-ink/60 underline-offset-2 hover:underline"
            >
              {meta.back}
            </button>
          ) : null}
        </div>
      ) : null}

      {step === 'result' && result ? (
        <div className="mt-8 space-y-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-accent">
            {meta.resultEyebrow}
          </p>
          <h2 className="font-serif text-2xl italic leading-snug text-brand-ink md:text-3xl">
            {result.title}
          </h2>
          <p className="text-base text-brand-ink/80">{result.subtitle}</p>
          <div className="space-y-3 text-[0.95rem] leading-relaxed text-brand-ink/75">
            {result.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <p className="border-l-2 border-[#C45D3E] pl-4 text-[0.95rem] leading-relaxed text-brand-ink">
            {result.bridge}
          </p>
          <a
            href={trialUrl}
            className="inline-flex min-h-12 items-center justify-center bg-[#C45D3E] px-6 text-sm font-medium text-white transition hover:bg-[#b35338]"
          >
            {result.cta}
          </a>
          <button
            type="button"
            onClick={() => {
              setStep('intro');
              setIndex(0);
              setAnswers({});
            }}
            className="block text-sm text-brand-ink/55 underline-offset-2 hover:underline"
          >
            {locale === 'es' ? 'Rehacer el quiz' : 'Refaire le quiz'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
