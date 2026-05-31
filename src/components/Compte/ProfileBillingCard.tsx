import Link from 'next/link';

import { GlassCard } from '@/components/ui/GlassCard';

type Props = {
  customerId: string | null;
  title: string;
  openStripeSub: string;
  openStripeInvoices: string;
  openShopArea: string;
};

/** Classes identiques pour button et Link — pas de flex-1, hauteur fixe. */
const billingBtnClass =
  'flex h-10 w-full items-center justify-center rounded-full border border-[rgba(201,169,110,0.55)] bg-white/55 px-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-[#2d2d2d] shadow-[0_2px_12px_rgba(29,29,31,0.08)] transition-all disabled:cursor-not-allowed disabled:opacity-45';

export function ProfileBillingCard({ customerId, title, openStripeSub, openStripeInvoices, openShopArea }: Props) {
  const missingStripe = !customerId;

  return (
    <GlassCard id="facturation" className="scroll-mt-28 flex h-full flex-col p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{title}</p>
      {missingStripe ? (
        <p className="mt-2 text-xs leading-relaxed text-luxury-muted">
          Après ton premier paiement, tes factures et ton abonnement apparaîtront ici via Stripe.
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <form action="/api/billing/portal" method="post" className="min-w-0">
          <input type="hidden" name="intent" value="subscription" />
          <button type="submit" disabled={missingStripe} className={billingBtnClass}>
            {openStripeSub}
          </button>
        </form>
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
    </GlassCard>
  );
}
