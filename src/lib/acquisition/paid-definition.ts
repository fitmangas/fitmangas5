/**
 * Définition unique « payante » (SPEC §12.1) — Vue d’ensemble et SEO / MRR.
 * Abonnement Stripe actif hors essai.
 */

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'active';
}

export const PAID_DEFINITION_HINT =
  'Payante = abonnement Stripe actif hors essai (status active, pas trialing).';
