'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QuizChapterShell, type QuizChapterStep } from '@/components/Quiz/QuizChapterShell';
import { QuizReport } from '@/components/Quiz/QuizReport';
import { DiscColorStrip } from '@/components/Quiz/QuizVisuals';
import { clampChapterIndex, resolveChapterSteps } from '@/lib/quiz/chapter-steps';
import { QUIZ_CARD_BY_SLUG } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale } from '@/lib/quiz/types';
import { scoreQuiz } from '@/lib/quiz/types';

type Props = {
  quiz: QuizDefinition;
  locale: QuizLocale;
};

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const wasSubmitted = useRef(false);

  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const homeHref = locale === 'es' ? '/es' : '/';
  const card = QUIZ_CARD_BY_SLUG[quiz.slug];
  const score = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers]);
  const result = useMemo(() => {
    if (!submitted) return null;
    return quiz.results.find((r) => r.id === score.resultId) ?? quiz.results[0]!;
  }, [submitted, quiz, score.resultId]);

  const allAnswered = quiz.questions.every((q) => Boolean(answers[q.id]));

  const pick = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSubmitted(false);
  }, []);

  const submitReport = useCallback(() => {
    if (!allAnswered) return;
    setSubmitted(true);
  }, [allAnswered]);

  const steps: QuizChapterStep[] = useMemo(() => {
    const opening: QuizChapterStep = {
      id: 'opening',
      shortLabel: locale === 'es' ? 'Inicio' : 'Début',
      label: locale === 'es' ? 'Apertura' : 'Ouverture',
      hideChrome: true,
      content: null,
    };

    const brief: QuizChapterStep = {
      id: 'brief',
      shortLabel: locale === 'es' ? 'Marco' : 'Cadre',
      label: quiz.title[locale],
      allowsNext: true,
      content: (
        <div className="quiz-chapter-panel">
          <span className="quiz-chapter-giant" aria-hidden>
            01
          </span>
          <p className="quiz-chapter-eyebrow">{quiz.eyebrow[locale]}</p>
          <h1 className="quiz-chapter-title" data-chapter-heading tabIndex={-1}>
            {quiz.title[locale]}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--qc-muted)' }}>
            {quiz.description[locale]} · {quiz.durationHint[locale]}
          </p>

          {card ? (
            <div className="quiz-chapter-cover relative mt-8">
              <Image
                src={card.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:820px) 100vw, 900px"
                priority
              />
              <div className="quiz-chapter-cover-veil" />
              <div className="absolute bottom-5 left-5 right-5 z-[1]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--qc-gold)]">
                  {locale === 'es' ? card.captionEs : card.captionFr}
                </p>
                <p className="mt-1 text-[1.15rem] font-semibold text-white">
                  {locale === 'es' ? 'El punto de partida de tu lectura' : 'Le point de départ de ta lecture'}
                </p>
              </div>
            </div>
          ) : null}

          {quiz.briefing ? (
            <div className="quiz-chapter-card">
              <p className="quiz-chapter-eyebrow" style={{ marginBottom: 8 }}>
                {locale === 'es' ? 'Antes de empezar' : 'Avant de commencer'}
              </p>
              <ol className="space-y-3">
                {quiz.briefing[locale].map((line, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-snug" style={{ color: 'var(--qc-ink)' }}>
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'var(--qc-navy)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {quiz.discLike ? (
            <div className="quiz-chapter-card">
              <p className="quiz-chapter-eyebrow">
                {locale === 'es' ? 'Los 4 perfiles' : 'Les 4 profils'}
              </p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--qc-muted)' }}>
                {locale === 'es'
                  ? 'Directa · Entusiasta · Constante · Metódica — una lectura, no una etiqueta.'
                  : 'Directe · Enthousiaste · Assidue · Méthodique — une lecture, pas une étiquette.'}
              </p>
              <div className="mt-5">
                <DiscColorStrip locale={locale} />
              </div>
            </div>
          ) : null}
        </div>
      ),
    };

    const questionSteps: QuizChapterStep[] = quiz.questions.map((q, qi) => {
      const selected = answers[q.id];
      const isLast = qi === quiz.questions.length - 1;
      const num = String(qi + 2).padStart(2, '0');
      return {
        id: q.id,
        shortLabel: String(qi + 1),
        label: locale === 'es' ? `Situación ${qi + 1}` : `Situation ${qi + 1}`,
        allowsNext: Boolean(selected) && (!isLast || allAnswered),
        nextLabel: isLast
          ? locale === 'es'
            ? 'Ver mi informe →'
            : 'Voir mon rapport →'
          : undefined,
        onNext: isLast ? () => submitReport() : undefined,
        content: (
          <div className="quiz-chapter-panel">
            <span className="quiz-chapter-giant" aria-hidden>
              {num}
            </span>
            <p className="quiz-chapter-eyebrow">
              {locale === 'es' ? `Pregunta ${qi + 1}` : `Question ${qi + 1}`} · {quiz.eyebrow[locale]}
            </p>
            <h2 className="quiz-chapter-title max-w-[22ch]" data-chapter-heading tabIndex={-1}>
              {q.prompt[locale]}
            </h2>
            <p className="mt-3 text-[14px]" style={{ color: 'var(--qc-muted)' }}>
              {locale === 'es'
                ? 'Elige la que más se te parece. Avanzas con « Siguiente » — no se envía todavía.'
                : 'Choisis celle qui te ressemble le plus. Tu avances avec « Suivant » — rien n’est envoyé encore.'}
            </p>
            <div className="quiz-chapter-card" role="radiogroup" aria-label={q.prompt[locale]}>
              {q.options.map((opt, oi) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected === opt.id}
                  data-selected={selected === opt.id ? 'true' : 'false'}
                  className="quiz-chapter-option"
                  onClick={() => pick(q.id, opt.id)}
                >
                  <span className="quiz-chapter-option-letter">{String.fromCharCode(65 + oi)}</span>
                  <span className="text-[15px] leading-snug" style={{ color: 'var(--qc-ink)' }}>
                    {opt.label[locale]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ),
      };
    });

    const resultStep: QuizChapterStep | null =
      submitted && result
        ? {
            id: 'result',
            shortLabel: locale === 'es' ? 'Informe' : 'Rapport',
            label: locale === 'es' ? 'Tu informe' : 'Ton rapport',
            allowsNext: false,
            content: (
              <QuizReport
                quiz={quiz}
                result={result}
                score={score}
                locale={locale}
                trialHref={trialUrl(locale, quiz.slug)}
                hubHref={hubHref}
                embeddedInChapter
              />
            ),
          }
        : null;

    const all = [opening, brief, ...questionSteps, ...(resultStep ? [resultStep] : [])];
    const resolved = resolveChapterSteps(
      all.map((s) => ({
        id: s.id,
        shortLabel: s.shortLabel,
        label: s.label,
        include: true,
      })),
    );
    const byId = new Map(all.map((s) => [s.id, s]));
    return resolved.map((r) => byId.get(r.id)!).filter(Boolean);
  }, [answers, allAnswered, card, hubHref, locale, pick, quiz, result, score, submitReport, submitted]);

  // Première soumission → chapitre Rapport. Retour arrière ensuite autorisé.
  useEffect(() => {
    if (submitted && !wasSubmitted.current) {
      const resultIdx = steps.findIndex((s) => s.id === 'result');
      if (resultIdx >= 0) setActiveIndex(resultIdx);
    }
    wasSubmitted.current = submitted;
  }, [submitted, steps]);

  // Si le total baisse (rapport retiré), rester dans les bornes.
  useEffect(() => {
    setActiveIndex((i) => clampChapterIndex(i, steps.length));
  }, [steps.length]);

  return (
    <QuizChapterShell
      locale={locale}
      steps={steps}
      activeIndex={activeIndex}
      onActiveIndexChange={setActiveIndex}
      homeHref={homeHref}
      hubHref={hubHref}
      openingPromise={
        locale === 'es'
          ? 'Entender cómo te sostienes — para dejar de soltar sola.'
          : 'Comprendre comment tu tiens — pour ne plus lâcher seule.'
      }
      openingCta={locale === 'es' ? 'Descubrir mi perfil' : 'Découvrir mon profil'}
      brandSub={quiz.eyebrow[locale]}
      headerAction={
        <Link
          href={hubHref}
          className="inline-flex items-center rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:bg-black/[0.04]"
          style={{ color: 'var(--qc-navy)' }}
        >
          {locale === 'es' ? 'Las 5 evaluaciones' : 'Les 5 évaluations'}
        </Link>
      }
    />
  );
}
