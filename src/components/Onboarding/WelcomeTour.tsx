'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';

import {
  availableTourSteps,
  OPEN_TOUR_EVENT,
  TOUR_READY_FLAG,
  TOUR_SEEN_KEY,
  tourCopy,
  welcomeTitle,
  WELCOME_VIDEO,
  WELCOME_VIDEO_POSTER,
  type OnboardingLang,
  type TourStep,
} from '@/lib/onboarding/premiers-pas';
import { placeTourCard, type Box } from '@/lib/onboarding/tour-position';

import { useDialogFocus } from './use-dialog-focus';

type Props = {
  lang: OnboardingLang;
  firstName?: string | null;
  /** Ouvrir tout seul à la première visite sur cet appareil. */
  autoStart?: boolean;
  /** Programmes allumés : sinon le texte de bienvenue ne parle pas de programme. */
  programmesOn?: boolean;
  /** Aperçus de développement : ouvert d'emblée sur cette étape (0 = bienvenue), sans mémoriser. */
  previewStep?: number;
};

/** Marge autour de l'élément mis en lumière. */
const PAD = 10;
const CARD_WIDTH = 390;
/** Anneau de focus doux (terracotta) au lieu du contour noir du navigateur. */
const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-[#C45D3E]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFAF5]';

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSeen(): void {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    /* navigation privée : le tuto pourra se rouvrir, sans gravité */
  }
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function targetEl(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
}

function presentTargets(steps: TourStep[]): string[] {
  return steps.map((s) => s.id).filter((id) => targetEl(id));
}

/**
 * Tuto guidé du tableau de bord (« façon PlayStation ») : fenêtre de bienvenue (vidéo si disponible),
 * puis projecteur sur 4 zones réelles de la page. Vu une fois par appareil ; relancé par le bouton « ? ».
 */
export function WelcomeTour({ lang, firstName, autoStart = true, programmesOn = true, previewStep }: Props) {
  const t = tourCopy(lang);
  const preview = previewStep != null;
  const [open, setOpen] = useState(false);
  /** 0 = bienvenue ; 1..n = étapes. */
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [rect, setRect] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [cardHeight, setCardHeight] = useState(220);
  const [reduced, setReduced] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const videoSrc = WELCOME_VIDEO[lang];
  const poster = WELCOME_VIDEO_POSTER[lang];

  const start = useCallback(
    (at = 0) => {
      lastFocus.current = (document.activeElement as HTMLElement | null) ?? null;
      setReduced(reducedMotion());
      const available = availableTourSteps(lang, presentTargets(t.steps));
      setSteps(available);
      setIndex(Math.min(at, available.length));
      setOpen(true);
    },
    [lang, t.steps],
  );

  const close = useCallback(() => {
    if (!preview) writeSeen();
    setOpen(false);
    setRect(null);
    const el = lastFocus.current;
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* rien */
      }
    }
  }, [preview]);

  // Le bouton « ? » relance le tuto quand il est présent sur la page.
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w[TOUR_READY_FLAG] = true;
    const onOpen = () => start(0);
    window.addEventListener(OPEN_TOUR_EVENT, onOpen);
    return () => {
      window.removeEventListener(OPEN_TOUR_EVENT, onOpen);
      delete w[TOUR_READY_FLAG];
    };
  }, [start]);

  // Ouverture automatique à la première visite (ou d'emblée dans les aperçus).
  useEffect(() => {
    if (preview) {
      const id = window.setTimeout(() => start(previewStep ?? 0), 50);
      return () => window.clearTimeout(id);
    }
    if (!autoStart || readSeen()) return;
    const id = window.setTimeout(() => start(0), 700);
    return () => window.clearTimeout(id);
  }, [autoStart, preview, previewStep, start]);

  const step = index > 0 ? (steps[index - 1] ?? null) : null;
  const total = steps.length;
  const isLast = index > 0 && index === total;

  const measure = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight || 220);
    if (!step) {
      setRect(null);
      return;
    }
    const el = targetEl(step.id);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Découpe gardée dans l'écran (une carte collée au bord ne doit pas être coupée).
    const left = Math.max(4, r.left - PAD);
    const right = Math.min(window.innerWidth - 4, r.right + PAD);
    setRect({ top: r.top - PAD, left, width: Math.max(0, right - left), height: r.height + PAD * 2 });
  }, [step]);

  // À chaque étape : faire défiler jusqu'à la cible, puis mesurer (pendant et après le défilement).
  useEffect(() => {
    if (!open) return;
    if (step) {
      const el = targetEl(step.id);
      el?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }
    measure();
    const timers = [80, 260, 520, 900].map((ms) => window.setTimeout(measure, ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [open, step, reduced, measure]);

  // Suivre la page si elle bouge (défilement, redimensionnement).
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [open, measure]);

  const next = useCallback(() => {
    if (index === 0) {
      // Les cibles peuvent arriver après le premier rendu : on recalcule au départ de la visite.
      const available = availableTourSteps(lang, presentTargets(t.steps));
      setSteps(available);
      if (!available.length) {
        close();
        return;
      }
      setIndex(1);
      return;
    }
    if (index >= total) {
      close();
      return;
    }
    setIndex((i) => i + 1);
  }, [index, total, close, lang, t.steps]);

  const prev = useCallback(() => setIndex((i) => Math.max(1, i - 1)), []);

  useDialogFocus(cardRef, open, close, index);

  // → / Entrée (hors bouton) = suivant ; ← = précédent. Jamais quand la vidéo (ou un champ) a le focus : ses flèches lui appartiennent.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      const onMedia = Boolean(active && /^(VIDEO|AUDIO|INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
      if (onMedia) return;
      const onControl = Boolean(active && /^(BUTTON|A)$/.test(active.tagName));
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && !onControl)) {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' && index > 1) {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, next, prev, index]);

  if (!open) return null;

  const transition = reduced
    ? 'none'
    : 'top 320ms cubic-bezier(.2,.8,.2,1), left 320ms cubic-bezier(.2,.8,.2,1), width 320ms cubic-bezier(.2,.8,.2,1), height 320ms cubic-bezier(.2,.8,.2,1)';

  // « Tu peux revoir ce tuto… avec le bouton ? » : le dernier mot reste collé à l'icône (pas de « ? » seul en début de ligne).
  const hintWords = t.replayHint.split(' ');
  const hintLast = hintWords.pop() ?? '';
  const hintHead = hintWords.join(' ');
  const replayHint = (
    <p className="mt-3 rounded-2xl bg-[#fdf2ec] px-3 py-2 text-[12.5px] leading-relaxed text-[#8f4a33]">
      {hintHead}{' '}
      <span className="whitespace-nowrap">
        {hintLast}{' '}
        <span
          aria-hidden
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#C45D3E]/50 bg-white align-[-4px] text-[11px] font-bold text-[#C45D3E]"
        >
          ?
        </span>
      </span>
    </p>
  );

  /* ——— Étape 0 : bienvenue ——— */
  if (index === 0) {
    // La vidéo n'existe qu'en français pour l'instant (null ailleurs) ; elle ne se charge qu'à la lecture.
    const showVideo = Boolean(videoSrc);
    // Portail vers <body> : au-dessus du menu latéral, du bouton support et de WhatsApp (contextes d'empilement séparés).
    return createPortal(
      <div className="fixed inset-0 z-[700] flex items-end justify-center bg-[rgba(29,26,23,0.58)] p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className={`relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[540px] overflow-y-auto overscroll-contain rounded-[2rem] bg-[#FFFAF5] shadow-[0_30px_90px_rgba(29,26,23,0.38)] sm:max-h-[calc(100dvh-3rem)] ${
            reduced ? '' : 'animate-[fmTourIn_380ms_cubic-bezier(.2,.8,.2,1)]'
          }`}
        >
          {showVideo ? (
            <video
              className="aspect-video w-full bg-[#1d1a17] object-cover"
              src={videoSrc ?? undefined}
              poster={poster ?? undefined}
              controls
              preload="none"
              playsInline
              aria-label={t.videoLabel}
            />
          ) : (
            <div className="relative flex items-center gap-3 bg-[linear-gradient(135deg,#fdf2ec_0%,#f6e4d8_100%)] px-6 pb-5 pt-6 sm:px-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_20px_-10px_rgba(196,93,62,0.5)]">
                <Image src="/logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b0583a]">FitMangas</span>
            </div>
          )}
          <div className="px-6 pb-6 pt-5 sm:px-8 sm:pb-7">
            <h2 id={titleId} className="fm-display text-[28px] leading-tight text-luxury-ink sm:text-[32px]">
              {welcomeTitle(lang, firstName)}
            </h2>
            <p id={bodyId} className="mt-2.5 text-[14.5px] leading-relaxed text-luxury-muted">
              {programmesOn ? t.welcomeBody : t.welcomeBodyNoProgramme}
            </p>
            {replayHint}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                data-primary
                onClick={next}
                className={`btn-luxury-primary w-full !px-6 sm:w-auto ${FOCUS}`}
              >
                {t.start}
              </button>
              <button type="button" onClick={close} className={`btn-luxury-ghost w-full !px-6 sm:w-auto ${FOCUS}`}>
                {t.skip}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t.close}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-luxury-ink shadow-sm transition hover:bg-white ${FOCUS}`}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <style>{`@keyframes fmTourIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}`}</style>
      </div>,
      document.body,
    );
  }

  /* ——— Étapes 1..n : projecteur sur la cible ——— */
  const placement = placeTourCard(rect, viewport, { width: CARD_WIDTH, height: cardHeight });

  return createPortal(
    <div className="fixed inset-0 z-[700]" role="presentation">
      {/* Bloque les clics sur la page pendant la visite. */}
      <div className="absolute inset-0" aria-hidden />
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[1.7rem] ring-2 ring-[#C45D3E]/75"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(29,26,23,0.58), 0 0 0 6px rgba(196,93,62,0.16)',
            transition,
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[rgba(29,26,23,0.58)]" />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed rounded-[1.6rem] bg-[#FFFAF5] p-5 shadow-[0_24px_70px_rgba(29,26,23,0.4)] sm:p-6"
        style={{ top: placement.top, left: placement.left, width: placement.width, transition }}
      >
        {step ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">
              {t.stepOf} {index} / {total}
            </p>
            {/* Annoncé par les lecteurs d'écran à chaque changement d'étape. */}
            <div aria-live="polite">
              <h2 id={titleId} className="mt-1.5 pr-8 text-[18px] font-semibold leading-snug text-luxury-ink">
                {step.title}
              </h2>
              <p id={bodyId} className="mt-1.5 text-[14px] leading-relaxed text-luxury-muted">
                {step.body}
              </p>
            </div>
            {isLast ? replayHint : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                {steps.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all ${i + 1 === index ? 'w-5 bg-[#C45D3E]' : 'w-1.5 bg-black/15'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {!isLast ? (
                  <button
                    type="button"
                    onClick={close}
                    className={`rounded-full px-2.5 py-2 text-[12px] font-semibold text-luxury-muted transition hover:text-luxury-ink ${FOCUS}`}
                  >
                    {t.skip}
                  </button>
                ) : null}
                {index > 1 ? (
                  <button
                    type="button"
                    onClick={prev}
                    aria-label={t.prev}
                    title={t.prev}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,169,110,0.55)] bg-white/70 text-luxury-ink transition hover:bg-white ${FOCUS}`}
                  >
                    <ChevronLeft size={17} aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  data-primary
                  onClick={next}
                  className={`btn-luxury-primary !min-h-[40px] !px-5 !py-2.5 ${FOCUS}`}
                >
                  {isLast ? t.done : t.next}
                </button>
              </div>
            </div>
          </>
        ) : null}
        <button
          type="button"
          onClick={close}
          aria-label={t.close}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-luxury-muted transition hover:bg-black/5 hover:text-luxury-ink ${FOCUS}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
