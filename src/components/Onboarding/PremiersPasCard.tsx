'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

import {
  CALENDAR_SUBSCRIBED_EVENT,
  CALENDAR_SUBSCRIBED_KEY,
  PREMIERS_PAS_COPY,
  PREMIERS_PAS_HIDDEN_COOKIE,
  premiersPasProgress,
  type OnboardingLang,
  type PremiersPasItem,
} from '@/lib/onboarding/premiers-pas';

/**
 * Liste « Tes premiers pas » du tableau de bord : 5 étapes (4 si programmes éteints), « Compte créé » déjà cochée.
 * L'abonnement calendrier n'est connu que dans le navigateur (aucune trace en base) : coché ici après le clic réussi.
 */
export function PremiersPasCard({ lang, items: serverItems }: { lang: OnboardingLang; items: PremiersPasItem[] }) {
  const t = PREMIERS_PAS_COPY[lang];
  const titleId = useId();
  const [calendar, setCalendar] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CALENDAR_SUBSCRIBED_KEY) === '1') setCalendar(true);
    } catch {
      /* stockage indisponible : l'étape reste à faire */
    }
    const onSubscribed = () => setCalendar(true);
    window.addEventListener(CALENDAR_SUBSCRIBED_EVENT, onSubscribed);
    return () => window.removeEventListener(CALENDAR_SUBSCRIBED_EVENT, onSubscribed);
  }, []);

  const items = useMemo(
    () => serverItems.map((i) => (i.id === 'calendar' ? { ...i, done: i.done || calendar } : i)),
    [serverItems, calendar],
  );
  const progress = premiersPasProgress(items);

  if (hidden || progress.complete) return null;

  function hide() {
    try {
      document.cookie = `${PREMIERS_PAS_HIDDEN_COOKIE}=1;path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    } catch {
      /* rien */
    }
    setHidden(true);
  }

  return (
    <section aria-labelledby={titleId} className="glass-card p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <h2 id={titleId} className="text-[16px] font-semibold text-luxury-ink md:text-[17px]">
          {t.title}, <span className="fm-display font-normal text-luxury-orange">{t.accent}</span>
        </h2>
        <div className="flex min-w-[150px] flex-1 items-center gap-3">
          <div
            className="fm-progress flex-1"
            role="progressbar"
            aria-label={t.title}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
          >
            <span style={{ width: `${progress.percent}%` }} />
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-luxury-ink">
            {t.progress(progress.done, progress.total)}
          </span>
        </div>
        <button
          type="button"
          onClick={hide}
          className="text-[12px] font-semibold text-luxury-muted underline-offset-4 transition hover:text-luxury-ink hover:underline"
        >
          {t.hide}
        </button>
      </div>
      <ol className="mt-3.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, i) => (
          // Téléphone : les étapes faites sont résumées par la barre (« 2 / 5 ») pour garder la carte compacte.
          <li key={item.id} className={item.done ? 'max-sm:hidden' : undefined}>
            {item.done || !item.href ? (
              <div className="flex h-full items-center gap-2.5 rounded-2xl bg-white/45 px-3 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C45D3E] text-white shadow-[0_4px_10px_-4px_rgba(196,93,62,0.6)]">
                  <Check size={13} strokeWidth={3} aria-hidden />
                </span>
                <span className="text-[13px] leading-snug text-luxury-muted">
                  {item.label}
                  <span className="sr-only"> · {t.doneLabel}</span>
                </span>
              </div>
            ) : (
              <Link
                href={item.href}
                className="group flex h-full items-center gap-2.5 rounded-2xl bg-white/85 px-3 py-2.5 shadow-[0_8px_18px_-12px_rgba(29,26,23,0.28)] outline-none transition hover:-translate-y-px hover:bg-white focus-visible:ring-2 focus-visible:ring-[#C45D3E]/45"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C45D3E]/45 text-[11px] font-semibold text-[#b0583a]">
                  {i + 1}
                </span>
                <span className="flex-1 text-[13px] font-medium leading-snug text-luxury-ink">{item.label}</span>
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="shrink-0 text-[#C45D3E] transition group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
