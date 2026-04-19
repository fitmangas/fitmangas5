'use client';

export function BillingPortalButton({ disabled }: { disabled: boolean }) {
  return (
    <form action="/api/billing/portal" method="post">
      <button
        type="submit"
        disabled={disabled}
        className="btn-luxury-ghost min-h-[48px] border-2 px-8 py-3 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Gérer l’abonnement et les paiements (Stripe)
      </button>
      {disabled ? (
        <p className="mt-3 text-xs text-luxury-soft">
          Après un premier paiement Stripe, ton espace client de facturation sera disponible ici.
        </p>
      ) : null}
    </form>
  );
}
