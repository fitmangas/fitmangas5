'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, MessageCircle, X } from 'lucide-react';

import { SidebarTooltip } from '@/components/Compte/SidebarTooltip';
import {
  OPEN_TOUR_EVENT,
  PAGE_HELP_COPY,
  pageHelp,
  pageHelpIdForPath,
  TOUR_READY_FLAG,
  type OnboardingLang,
} from '@/lib/onboarding/premiers-pas';

import { useDialogFocus } from './use-dialog-focus';

/** Anneau de focus doux (terracotta) au lieu du contour noir du navigateur. */
const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-[#C45D3E]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFAF5]';

/**
 * Bouton « ? Comment ça marche ? » de l'espace cliente (menu latéral sur ordinateur, en-tête sur téléphone).
 * Sur le tableau de bord, il relance le tuto ; ailleurs, il ouvre l'aide de la page en 3 lignes.
 */
export function PageHelpButton({ lang, variant }: { lang: OnboardingLang; variant: 'rail' | 'header' }) {
  const pathname = usePathname();
  const c = PAGE_HELP_COPY[lang];
  const [open, setOpen] = useState(false);

  function onClick() {
    const tourReady = Boolean((window as unknown as Record<string, unknown>)[TOUR_READY_FLAG]);
    if (pageHelpIdForPath(pathname) === 'dashboard' && tourReady) {
      window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
      return;
    }
    setOpen(true);
  }

  const button =
    variant === 'rail' ? (
      <button
        type="button"
        onClick={onClick}
        aria-label={c.button}
        aria-haspopup="dialog"
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-luxury-muted transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/62 hover:text-luxury-ink hover:shadow-sm"
      >
        <CircleHelp size={23} strokeWidth={2} aria-hidden />
      </button>
    ) : (
      <button
        type="button"
        onClick={onClick}
        aria-label={c.button}
        aria-haspopup="dialog"
        className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-luxury-ink"
      >
        <CircleHelp size={21} aria-hidden />
      </button>
    );

  return (
    <>
      {variant === 'rail' ? <SidebarTooltip label={c.button}>{button}</SidebarTooltip> : button}
      {open ? <PageHelpDialog lang={lang} pathname={pathname} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** Carte d'aide d'une page (aussi utilisée dans les aperçus de développement). */
export function PageHelpDialog({
  lang,
  pathname,
  onClose,
}: {
  lang: OnboardingLang;
  pathname: string | null;
  onClose: () => void;
}) {
  const c = PAGE_HELP_COPY[lang];
  const help = pageHelp(lang, pathname);
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => onClose(), [onClose]);
  useDialogFocus(ref, true, close);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[650] flex items-end justify-center bg-[rgba(29,26,23,0.42)] p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[440px] rounded-[1.8rem] bg-[#FFFAF5] p-6 shadow-[0_30px_70px_rgba(29,26,23,0.32)] sm:p-7"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">{help.page}</p>
        <h2 id={titleId} className="mt-1 pr-8 text-[20px] font-semibold text-luxury-ink">
          {c.title}
        </h2>
        <ol className="mt-4 space-y-3">
          {help.lines.map((line, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-luxury-ink/85">
              <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fdf2ec] text-[11px] font-semibold text-[#b0583a]">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={() => {
              close();
              document.dispatchEvent(new Event('fm-open-support'));
            }}
            className={`inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold text-luxury-orange underline-offset-4 hover:underline ${FOCUS}`}
          >
            <MessageCircle size={14} aria-hidden />
            {c.contact}
          </button>
          <button
            type="button"
            data-primary
            onClick={close}
            className={`btn-luxury-primary !min-h-[40px] !px-5 !py-2.5 ${FOCUS}`}
          >
            {c.close}
          </button>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={c.close}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-luxury-muted transition hover:bg-black/5 hover:text-luxury-ink ${FOCUS}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
