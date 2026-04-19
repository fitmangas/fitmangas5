'use client';

export function BillingPortalButton({ disabled }: { disabled: boolean }) {
  return (
    <form action="/api/billing/portal" method="post">
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-brand-ink/[0.12] bg-white px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-ink/85 shadow-sm transition hover:bg-brand-beige/50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Gérer l’abonnement et les paiements (Stripe)
      </button>
      {disabled ? (
        <p className="mt-3 text-xs text-brand-ink/45">
          Après un premier paiement Stripe, ton espace client de facturation sera disponible ici.
        </p>
      ) : null}
    </form>
  );
}
