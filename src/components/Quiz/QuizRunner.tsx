'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { QuizDefinition, QuizLocale } from '@/lib/quiz/types';
import { scoreQuiz } from '@/lib/quiz/types';

type Props = {
  quiz: QuizDefinition;
  locale: QuizLocale;
};

function trialSignupUrl(locale: QuizLocale, quizSlug: string): string {
  const path = locale === 'es' ? '/es' : '';
  const params = new URLSearchParams({
    offer: 'v-coll',
    utm_source: 'quiz',
    utm_medium: 'web',
    utm_campaign: quizSlug,
  });
  return `${path}/?${params.toString()}`;
}

export function QuizRunner({ quiz, locale }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const total = quiz.questions.length;
  const question = quiz.questions[step];
  const progress = done ? 100 : Math.round((step / total) * 100);

  const result = useMemo(() => {
    if (!done) return null;
    const { resultId } = scoreQuiz(quiz, answers);
    return quiz.results.find((r) => r.id === resultId) ?? quiz.results[0]!;
  }, [done, answers, quiz]);

  const trialUrl = trialSignupUrl(locale, quiz.slug);

  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const homeHref = locale === 'es' ? '/es' : '/';

  function pick(optionId: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    if (step + 1 >= total) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setDone(false);
  }

  async function shareResult() {
    if (!result) return;
    const text = result.shareLine[locale];
    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://fitmangas.com${locale === 'es' ? '/es' : ''}/quiz/${quiz.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: quiz.title[locale], text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
    } catch {
      /* ignore cancel */
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0908] text-[#F6F0E8]">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 10% -10%, ${quiz.accent}33, transparent 55%),
            radial-gradient(ellipse 60% 40% at 90% 10%, #7A9EAE22, transparent 50%),
            linear-gradient(180deg, #120f0d 0%, #0B0908 40%, #0B0908 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-16 pt-6 sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link
            href={hubHref}
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#F6F0E8]/70 transition hover:text-[#F6F0E8]"
          >
            ← {locale === 'es' ? 'Perfiles' : 'Profils'}
          </Link>
          <Link href={homeHref} className="text-[13px] font-semibold tracking-wide text-[#F6F0E8]/90">
            FitMangas
          </Link>
        </header>

        <div className="mb-6">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: quiz.accent }}
          >
            {quiz.eyebrow[locale]}
          </p>
          <div className="mt-4 h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: quiz.accent }}
            />
          </div>
          {!done && (
            <p className="mt-2 text-right text-[11px] tabular-nums text-[#F6F0E8]/45">
              {step + 1} / {total}
            </p>
          )}
        </div>

        {!done && question ? (
          <section className="flex flex-1 flex-col">
            <h1
              className="text-[1.65rem] leading-[1.15] tracking-tight text-[#FFFAF5] sm:text-[1.85rem]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
            >
              {question.prompt[locale]}
            </h1>

            <div className="mt-8 flex flex-col gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pick(opt.id)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition duration-200 hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.99]"
                >
                  <span className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wider text-[#0B0908]"
                      style={{ background: `${quiz.accent}cc` }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-[15px] leading-snug text-[#F6F0E8]/92 sm:text-[16px]">
                      {opt.label[locale]}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : result ? (
          <section className="flex flex-1 flex-col" style={{ animation: 'quizFadeIn 0.45s ease-out' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F6F0E8]/50">
              {locale === 'es' ? 'Tu resultado' : 'Ton résultat'}
            </p>
            <h1
              className="mt-3 text-[2rem] leading-[1.1] tracking-tight text-[#FFFAF5] sm:text-[2.35rem]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
            >
              {result.title[locale]}
            </h1>
            <p className="mt-3 text-[17px] leading-snug text-[#F6F0E8]/75">{result.tagline[locale]}</p>

            <div className="mt-8 space-y-4 border-l-2 pl-4" style={{ borderColor: quiz.accent }}>
              {result.body[locale].map((p) => (
                <p key={p} className="text-[15px] leading-relaxed text-[#F6F0E8]/80">
                  {p}
                </p>
              ))}
            </div>

            <div
              className="mt-8 rounded-2xl border border-white/10 px-5 py-5"
              style={{ background: `linear-gradient(135deg, ${quiz.accent}22, transparent 70%)` }}
            >
              <p className="text-[15px] leading-relaxed text-[#FFFAF5]">{result.bridge[locale]}</p>
            </div>

            <a
              href={trialUrl}
              className="mt-8 flex w-full items-center justify-center rounded-full px-6 py-4 text-[15px] font-semibold text-[#FFFAF5] shadow-lg transition hover:brightness-110 active:scale-[0.99]"
              style={{ background: quiz.accent }}
            >
              {quiz.cta[locale]}
            </a>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={shareResult}
                className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[13px] font-medium text-[#F6F0E8]/85 transition hover:bg-white/[0.08]"
              >
                {locale === 'es' ? 'Compartir' : 'Partager'}
              </button>
              <button
                type="button"
                onClick={restart}
                className="rounded-full border border-transparent px-5 py-2.5 text-[13px] font-medium text-[#F6F0E8]/55 transition hover:text-[#F6F0E8]/85"
              >
                {locale === 'es' ? 'Rehacer' : 'Recommencer'}
              </button>
              <Link
                href={hubHref}
                className="rounded-full border border-transparent px-5 py-2.5 text-[13px] font-medium text-[#F6F0E8]/55 transition hover:text-[#F6F0E8]/85"
              >
                {locale === 'es' ? 'Otro perfil' : 'Autre profil'}
              </Link>
            </div>
          </section>
        ) : null}
      </div>

      <style>{`
        @keyframes quizFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
