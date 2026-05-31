'use client';

import { useState, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';

import { logVisioLockCheckoutInitiated } from '@/app/checkout/actions';

type Props = {
  children: ReactNode;
  featureDescription_fr: string;
  featureDescription_es: string;
  hasAccess?: boolean;
  locale?: 'fr' | 'es';
};

export function getVisioLockState(hasAccess: boolean) {
  return { showOverlay: !hasAccess, ctaOffer: 'v-coll' as const };
}

export function VisioLock({ children, featureDescription_fr, featureDescription_es, hasAccess = false, locale = 'fr' }: Props) {
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const state = getVisioLockState(hasAccess);
  if (!state.showOverlay) return <>{children}</>;

  const errorFallback =
    locale === 'es'
      ? 'No se pudo iniciar el pago. Inténtalo de nuevo en unos instantes.'
      : 'Impossible de lancer le paiement. Réessaie dans un instant.';

  async function handleCheckout() {
    setLoading(true);
    setCheckoutError('');
    try {
      await logVisioLockCheckoutInitiated('visio_lock_overlay');
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: state.ctaOffer }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setCheckoutError(json.error?.trim() || errorFallback);
    } catch {
      setCheckoutError(errorFallback);
    } finally {
      setLoading(false);
    }
  }

  const description = locale === 'es' ? featureDescription_es : featureDescription_fr;
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] bg-white/30 shadow-[0_24px_80px_rgba(48,35,28,0.10)]">
      <div className="pointer-events-none opacity-45 blur-[7px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-luxury-cream/55 px-6 backdrop-blur-md">
        <div className="max-w-sm text-center">
          <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-luxury-violet/25 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-violet">
            <LockKeyhole size={12} />
            {locale === 'es' ? 'Reservado a miembros Visio' : 'Réservé aux membres Visio'}
          </span>
          <button
            type="button"
            onClick={() => void handleCheckout()}
            disabled={loading}
            className="rounded-full bg-luxury-violet px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-xl transition hover:opacity-95 disabled:opacity-60"
          >
            {locale === 'es' ? 'Hazte miembro completo — 39€/mes' : 'Devenez membre complet — 39€/mois'}
          </button>
          <p className="mt-4 text-sm leading-relaxed text-luxury-ink/70">{description}</p>
          {checkoutError ? (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{checkoutError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
