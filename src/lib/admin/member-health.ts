/** Badges santé client (liste admin + agrégats KPI). */
export type MemberHealthBadge = 'new' | 'watch' | 'green' | 'orange' | 'red' | 'incomplete';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Abonnement Stripe « réel » (hors seeds / manuels / stubs locaux).
 * Les ids seed_*, manual_* et absents ne doivent pas compter comme MRR ni cohorte payante.
 */
export function isRealStripeSubscriptionId(stripeSubscriptionId: string | null | undefined): boolean {
  const id = (stripeSubscriptionId ?? '').trim();
  return id.startsWith('sub_');
}

/**
 * Profil récent / engagement :
 * - incomplete : compte créé sans abonnement Stripe réel (checkout non finalisé, seed, etc.)
 * - sinon score d’activité cours/replay, à partir de la date d’abonnement si connue
 */
export function computeMemberHealth(args: {
  lastActivityTs: number;
  accountCreatedTs: number;
  now: number;
  /** true si abonnement active/trialing avec un stripe_subscription_id réel (`sub_…`) */
  isPayingMember: boolean;
  /** Début d’abonnement (sinon compte créé) */
  subscriptionStartedTs?: number | null;
}): MemberHealthBadge {
  if (!args.isPayingMember) return 'incomplete';

  const startTs =
    args.subscriptionStartedTs && args.subscriptionStartedTs > 0
      ? args.subscriptionStartedTs
      : args.accountCreatedTs;
  const ageMs = args.now - startTs;
  const last = args.lastActivityTs > 0 ? args.lastActivityTs : 0;

  // Payante récente sans activité → Nouveau (pas « en attente de paiement »)
  if (!last) {
    if (ageMs < 14 * DAY_MS) return 'new';
    if (ageMs < 30 * DAY_MS) return 'watch';
    return 'red';
  }

  if (ageMs < 7 * DAY_MS) return 'new';

  const fourteenDaysAgo = args.now - 14 * DAY_MS;
  const fourDaysAgo = args.now - 4 * DAY_MS;

  if (ageMs < 14 * DAY_MS) {
    if (last < fourteenDaysAgo) return 'orange';
    if (last < fourDaysAgo) return 'orange';
    return 'green';
  }

  if (last < fourteenDaysAgo) return 'red';
  if (last < fourDaysAgo) return 'orange';
  return 'green';
}
