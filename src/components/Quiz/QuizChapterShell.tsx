'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

import {
  canGoNext,
  canGoPrev,
  chapterCounter,
  clampChapterIndex,
} from '@/lib/quiz/chapter-steps';
import type { QuizLocale } from '@/lib/quiz/types';

import './quiz-chapter.css';

export type QuizChapterStep = {
  id: string;
  shortLabel: string;
  label: string;
  content: ReactNode;
  /** Ouverture plein écran — pas de chrome. */
  hideChrome?: boolean;
  /** Autorise « Suivant » (ex. réponse choisie). */
  allowsNext?: boolean;
  /** Libellé du bouton droit. */
  nextLabel?: string;
  /** Action custom au lieu d’avancer d’un cran (ex. soumettre). */
  onNext?: () => void;
};

type Props = {
  locale: QuizLocale;
  steps: QuizChapterStep[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  homeHref: string;
  hubHref: string;
  headerAction?: ReactNode;
  openingPromise: string;
  openingCta: string;
  brandTitle?: string;
  brandSub?: string;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  if (el.closest('[role="dialog"], [role="listbox"], [role="menu"], [role="radiogroup"]')) {
    return true;
  }
  return false;
}

export function QuizChapterShell({
  locale,
  steps,
  activeIndex,
  onActiveIndexChange,
  homeHref,
  hubHref,
  headerAction,
  openingPromise,
  openingCta,
  brandTitle = 'FitMangas',
  brandSub,
}: Props) {
  const liveId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLElement | null>>({});
  const [enteringLocked, setEnteringLocked] = useState(false);
  const [logoExiting, setLogoExiting] = useState(false);
  const [breathe, setBreathe] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const total = steps.length;
  const safeIndex = clampChapterIndex(activeIndex, total);
  const active = steps[safeIndex];
  const hideChrome = Boolean(active?.hideChrome);
  const counter = chapterCounter(safeIndex, total);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    if (hideChrome && !reducedMotion) {
      const t = window.setTimeout(() => setBreathe(true), 1200);
      return () => window.clearTimeout(t);
    }
    setBreathe(false);
  }, [hideChrome, safeIndex, reducedMotion]);

  const resetScroll = useCallback(() => {
    const run = () => {
      window.scrollTo(0, 0);
      viewportRef.current?.scrollTo(0, 0);
      const id = steps[safeIndex]?.id;
      if (id) stepRefs.current[id]?.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [safeIndex, steps]);

  useEffect(() => {
    setAnimKey((k) => k + 1);
    resetScroll();
    const label = steps[safeIndex]?.label;
    if (label) {
      // Annonce discrète ; focus sur le titre de l’étape si présent.
      const heading = document.querySelector<HTMLElement>(
        `[data-chapter-id="${steps[safeIndex]?.id}"] [data-chapter-heading]`,
      );
      heading?.focus({ preventScroll: true });
    }
  }, [safeIndex, steps, resetScroll]);

  const goTo = useCallback(
    (index: number) => {
      onActiveIndexChange(clampChapterIndex(index, total));
    },
    [onActiveIndexChange, total],
  );

  const handleEnter = useCallback(() => {
    if (enteringLocked) return;
    if (reducedMotion) {
      goTo(safeIndex + 1);
      return;
    }
    setEnteringLocked(true);
    setLogoExiting(true);
    window.setTimeout(() => {
      goTo(safeIndex + 1);
      setLogoExiting(false);
      setEnteringLocked(false);
      setBreathe(false);
    }, 620);
  }, [enteringLocked, goTo, reducedMotion, safeIndex]);

  const handlePrev = useCallback(() => {
    if (!canGoPrev(safeIndex)) return;
    goTo(safeIndex - 1);
  }, [goTo, safeIndex]);

  const handleNext = useCallback(() => {
    const step = steps[safeIndex];
    if (!step) return;
    if (step.allowsNext === false) return;
    if (step.onNext) {
      step.onNext();
      return;
    }
    if (!canGoNext(safeIndex, total)) return;
    goTo(safeIndex + 1);
  }, [goTo, safeIndex, steps, total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (hideChrome) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        // Espace : ne pas voler l’activation native d’un bouton focusé.
        if (e.key === ' ' && e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNext, handlePrev, hideChrome]);

  if (!active || total === 0) return null;

  const nextDisabled = active.allowsNext === false || (!active.onNext && !canGoNext(safeIndex, total));
  const prevDisabled = !canGoPrev(safeIndex);
  const nextLabel =
    active.nextLabel ??
    (locale === 'es' ? 'Siguiente →' : 'Suivant →');
  const prevLabel = locale === 'es' ? '← Anterior' : '← Précédent';
  const sub =
    brandSub ??
    (locale === 'es' ? 'Evaluación' : 'Évaluation');

  return (
    <div className="quiz-chapter-root quiz-doc" data-locale={locale}>
      <div className="quiz-chapter-sr" aria-live="polite" id={liveId}>
        {locale === 'es'
          ? `Paso ${counter.current} de ${counter.total}: ${active.label}`
          : `Étape ${counter.current} sur ${counter.total} : ${active.label}`}
      </div>

      {!hideChrome ? (
        <header className="quiz-chapter-header quiz-no-print">
          <Link href={homeHref} className="flex shrink-0 items-center gap-2.5">
            <Image src="/logo.png" alt="FitMangas" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--qc-navy)' }}>
              FitMangas
            </span>
          </Link>

          <nav className="quiz-chapter-tabs" aria-label={locale === 'es' ? 'Sumario' : 'Sommaire'}>
            {steps.map((step, i) => (
              <button
                key={step.id}
                type="button"
                className="quiz-chapter-tab"
                aria-current={i === safeIndex ? 'page' : undefined}
                onClick={() => goTo(i)}
              >
                {step.shortLabel}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            {headerAction ?? (
              <Link
                href={hubHref}
                className="inline-flex rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:bg-black/[0.04]"
                style={{ color: 'var(--qc-muted)' }}
              >
                {locale === 'es' ? 'Las 5' : 'Les 5'}
              </Link>
            )}
          </div>
        </header>
      ) : null}

      <div
        ref={viewportRef}
        className={`quiz-chapter-viewport${hideChrome ? ' quiz-chapter-viewport--opening' : ''}`}
      >
        {steps.map((step, i) => (
          <section
            key={step.id}
            ref={(el) => {
              stepRefs.current[step.id] = el;
            }}
            className="quiz-chapter-step"
            data-active={i === safeIndex ? 'true' : 'false'}
            data-anim={reducedMotion ? 'off' : 'on'}
            data-chapter-id={step.id}
            aria-hidden={i !== safeIndex}
            // Remount animation on each visit
            data-visit={i === safeIndex ? animKey : undefined}
          >
            <div className="quiz-chapter-step-inner" key={i === safeIndex ? `${step.id}-${animKey}` : step.id}>
              {step.hideChrome ? (
                <div className="quiz-chapter-opening">
                  <div className="quiz-chapter-opening-stage">
                    <div className="quiz-chapter-pulse-ring" aria-hidden />
                    <div
                      className="quiz-chapter-logo-block"
                      data-breathe={breathe && !logoExiting ? 'true' : 'false'}
                      data-exiting={logoExiting ? 'true' : 'false'}
                    >
                      <Image
                        src="/logo.png"
                        alt=""
                        width={120}
                        height={120}
                        className="quiz-chapter-logo-mark"
                        priority
                      />
                      <p className="quiz-chapter-logo-title">{brandTitle}</p>
                      <p className="quiz-chapter-logo-sub">{sub}</p>
                    </div>
                  </div>
                  <div
                    className="quiz-chapter-opening-footer"
                    data-exiting={logoExiting ? 'true' : 'false'}
                  >
                    <p className="quiz-chapter-promise">{openingPromise}</p>
                    <button
                      type="button"
                      className="quiz-chapter-enter-btn"
                      disabled={enteringLocked}
                      onClick={handleEnter}
                      onKeyDown={(e: ReactKeyboardEvent) => {
                        if (e.key === 'Enter') e.stopPropagation();
                      }}
                    >
                      {openingCta}
                      <span className="quiz-chapter-enter-arrow" aria-hidden>
                        →
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                step.content
              )}
            </div>
          </section>
        ))}
      </div>

      {!hideChrome ? (
        <div className="quiz-chapter-dock quiz-no-print" role="navigation" aria-label={locale === 'es' ? 'Navegación' : 'Navigation'}>
          <button
            type="button"
            className="quiz-chapter-dock-btn"
            disabled={prevDisabled}
            onClick={handlePrev}
          >
            {prevLabel}
          </button>
          <div className="quiz-chapter-dock-center">
            <span className="quiz-chapter-dock-count">
              {counter.current} / {counter.total}
            </span>
            <span className="quiz-chapter-dock-title">{active.label}</span>
          </div>
          <button
            type="button"
            className="quiz-chapter-dock-btn"
            disabled={nextDisabled}
            onClick={handleNext}
          >
            {nextLabel}
          </button>
        </div>
      ) : null}

      <style>{`
        @media print {
          @page { margin: 14mm; }
          html, body { background: #fff !important; }
          .quiz-no-print { display: none !important; }
          .quiz-doc { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
