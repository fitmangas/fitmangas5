'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

import { SaveToast } from '@/components/Compte/Preferences/SaveToast';
import { GlassCard } from '@/components/ui/GlassCard';

type Props = {
  customerId: string | null;
  hasActiveSubscription: boolean;
  title: string;
  openStripeSub: string;
  openUnsubscribe: string;
  openStripeInvoices: string;
  openShopArea: string;
  confirmTitle: string;
  confirmBody: string;
  confirmYes: string;
  confirmNo: string;
  cancelPending: string;
  cancelSuccess: string;
  cancelError: string;
  cancelUnavailable: string;
};

/** Classes identiques pour button et Link — pas de flex-1, hauteur fixe. */
const billingBtnClass =
  'flex h-10 w-full items-center justify-center rounded-full border border-[rgba(201,169,110,0.55)] bg-white/55 px-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-[#2d2d2d] shadow-[0_2px_12px_rgba(29,29,31,0.08)] transition-all disabled:cursor-not-allowed disabled:opacity-45';

export function ProfileBillingCard({
  customerId,
  hasActiveSubscription,
  title,
  openStripeSub,
  openUnsubscribe,
  openStripeInvoices,
  openShopArea,
  confirmTitle,
  confirmBody,
  confirmYes,
  confirmNo,
  cancelPending,
  cancelSuccess,
  cancelError,
  cancelUnavailable,
}: Props) {
  const missingStripe = !customerId;
  const canCancel = hasActiveSubscription && !missingStripe;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(hasActiveSubscription);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      toastTimeoutRef.current = null;
    }, 3500);
  }, []);

  const handleCancel = async () => {
    if (!canCancel || pending) return;
    setPending(true);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        showToast(data?.error?.trim() || cancelError);
        return;
      }
      setActiveSubscription(false);
      setConfirmOpen(false);
      showToast(cancelSuccess);
    } catch {
      showToast(cancelError);
    } finally {
      setPending(false);
    }
  };

  return (
    <GlassCard id="facturation" className="scroll-mt-28 flex h-full flex-col p-4 shadow-sm">
      <SaveToast visible={toastVisible} message={toastMessage} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{title}</p>
      {missingStripe ? (
        <p className="mt-2 text-xs leading-relaxed text-luxury-muted">
          Après ton premier paiement, tes factures et ton abonnement apparaîtront ici via Stripe.
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-3">
          <form action="/api/billing/portal" method="post" className="min-w-0">
            <input type="hidden" name="intent" value="subscription" />
            <button type="submit" disabled={missingStripe} className={billingBtnClass}>
              {openStripeSub}
            </button>
          </form>
          <button
            type="button"
            disabled={!canCancel || !activeSubscription || pending}
            title={!canCancel || !activeSubscription ? cancelUnavailable : undefined}
            className={billingBtnClass}
            onClick={() => setConfirmOpen(true)}
          >
            {openUnsubscribe}
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <form action="/api/billing/portal" method="post" className="min-w-0">
            <input type="hidden" name="intent" value="invoices" />
            <button type="submit" disabled={missingStripe} className={billingBtnClass}>
              {openStripeInvoices}
            </button>
          </form>
          <Link href="/compte/boutique/commandes" className={billingBtnClass}>
            {openShopArea}
          </Link>
        </div>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[240] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => {
            if (!pending) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-cancel-title"
            className="w-full max-w-md rounded-2xl border border-white/40 bg-[#FFFAF5] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="billing-cancel-title" className="text-lg font-semibold text-luxury-ink">
              {confirmTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-luxury-muted">{confirmBody}</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                className={billingBtnClass}
                onClick={() => setConfirmOpen(false)}
              >
                {confirmNo}
              </button>
              <button
                type="button"
                disabled={pending}
                className="flex h-10 w-full items-center justify-center rounded-full border border-[#C45D3E]/55 bg-[#C45D3E] px-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-white shadow-[0_2px_12px_rgba(29,29,31,0.12)] transition-all disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[8rem]"
                onClick={() => void handleCancel()}
              >
                {pending ? cancelPending : confirmYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
