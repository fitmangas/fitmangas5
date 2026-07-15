import { isRealStripeSubscriptionId } from '@/lib/admin/member-health';

/** Statut paiement affiché dans la liste admin Clients — Santé. */
export type MemberPaymentBadge =
  | 'trial'
  | 'paid'
  | 'payment_failed'
  | 'canceled'
  | 'none'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export type MemberPaymentSubscriptionRow = {
  status: string;
  ends_at: string | null;
  stripe_subscription_id: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export const MEMBER_PAYMENT_LABELS: Record<MemberPaymentBadge, string> = {
  trial: "Période d'essai",
  paid: 'Payé',
  payment_failed: 'Paiement échoué',
  canceled: 'Annulé',
  none: 'Aucun abonnement',
  incomplete: 'Checkout incomplet',
  incomplete_expired: 'Checkout expiré',
  paused: 'En pause',
};

export const MEMBER_PAYMENT_DESCRIPTIONS: Record<MemberPaymentBadge, string> = {
  trial: 'Essai Stripe en cours (trialing)',
  paid: 'Abonnement actif, prélèvement à jour',
  payment_failed: 'Prélèvement en échec (past_due / unpaid) — à relancer en urgence',
  canceled: 'Abonnement résilié',
  none: 'Compte sans checkout Stripe finalisé',
  incomplete: 'Checkout Stripe commencé mais non finalisé',
  incomplete_expired: 'Checkout Stripe expiré sans paiement',
  paused: 'Abonnement en pause',
};

const STATUS_PRIORITY: Record<string, number> = {
  past_due: 100,
  unpaid: 95,
  active: 80,
  trialing: 70,
  paused: 60,
  incomplete: 50,
  incomplete_expired: 45,
  canceled: 40,
};

export const MEMBER_PAYMENT_FILTERS: MemberPaymentBadge[] = [
  'payment_failed',
  'trial',
  'paid',
  'canceled',
  'none',
  'incomplete',
  'incomplete_expired',
  'paused',
];

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? '').trim().toLowerCase();
}

function formatFrDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function mapStripeStatusToBadge(status: string): MemberPaymentBadge | null {
  if (status === 'trialing') return 'trial';
  if (status === 'active') return 'paid';
  if (status === 'past_due' || status === 'unpaid') return 'payment_failed';
  if (status === 'canceled') return 'canceled';
  if (status === 'paused') return 'paused';
  if (status === 'incomplete') return 'incomplete';
  if (status === 'incomplete_expired') return 'incomplete_expired';
  return null;
}

function detailForBadge(badge: MemberPaymentBadge, endsAt: string | null, now: number): string | null {
  if (!endsAt) return null;
  if (badge === 'trial') return `Fin essai ${formatFrDate(endsAt)}`;
  if (badge === 'canceled') {
    const endTs = new Date(endsAt).getTime();
    if (endTs > now) return `Accès jusqu'au ${formatFrDate(endsAt)}`;
    return `Fin ${formatFrDate(endsAt)}`;
  }
  return null;
}

function pickPrimarySubscription(rows: MemberPaymentSubscriptionRow[]): MemberPaymentSubscriptionRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const priorityDiff =
      (STATUS_PRIORITY[normalizeStatus(b.status)] ?? 0) - (STATUS_PRIORITY[normalizeStatus(a.status)] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    const bTs = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
    const aTs = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
    return bTs - aTs;
  })[0];
}

/**
 * Dérive le statut paiement affiché admin à partir des abonnements synchronisés
 * (`subscriptions` + `profiles.subscription_status` / `stripe_customer_id`).
 * Aucune colonne ni migration supplémentaire.
 */
export function computeMemberPaymentStatus(args: {
  subscriptions: MemberPaymentSubscriptionRow[];
  stripeCustomerId: string | null | undefined;
  profileSubscriptionStatus: string | null | undefined;
  now?: number;
}): { badge: MemberPaymentBadge; detail: string | null } {
  const now = args.now ?? Date.now();
  const realSubs = args.subscriptions.filter((row) => isRealStripeSubscriptionId(row.stripe_subscription_id));
  const primary = pickPrimarySubscription(realSubs);
  const profileStatus = normalizeStatus(args.profileSubscriptionStatus);

  // Ces statuts Stripe ne rentrent pas tous dans l’enum subscriptions.status.
  // Le webhook les conserve dans profiles.subscription_status pour l’affichage admin.
  if (profileStatus === 'unpaid' || profileStatus === 'incomplete' || profileStatus === 'incomplete_expired') {
    const fromProfile = mapStripeStatusToBadge(profileStatus);
    if (fromProfile) return { badge: fromProfile, detail: null };
  }

  if (primary) {
    const badge = mapStripeStatusToBadge(normalizeStatus(primary.status));
    if (badge) {
      return { badge, detail: detailForBadge(badge, primary.ends_at, now) };
    }
  }

  if (profileStatus) {
    const fromProfile = mapStripeStatusToBadge(profileStatus);
    if (fromProfile) {
      const canceledSub = realSubs.find((row) => normalizeStatus(row.status) === 'canceled');
      const detail =
        fromProfile === 'canceled' && canceledSub?.ends_at
          ? detailForBadge('canceled', canceledSub.ends_at, now)
          : null;
      return { badge: fromProfile, detail };
    }
  }

  if (!args.stripeCustomerId?.trim() && realSubs.length === 0) {
    return { badge: 'none', detail: null };
  }

  const canceledSub = realSubs.find((row) => normalizeStatus(row.status) === 'canceled');
  if (canceledSub) {
    return {
      badge: 'canceled',
      detail: detailForBadge('canceled', canceledSub.ends_at, now),
    };
  }

  if (args.stripeCustomerId?.trim()) {
    if (profileStatus === 'incomplete') return { badge: 'incomplete', detail: null };
    if (profileStatus === 'incomplete_expired') return { badge: 'incomplete_expired', detail: null };
  }

  return { badge: 'none', detail: null };
}

export function paymentBadgeClass(badge: MemberPaymentBadge): string {
  if (badge === 'payment_failed') {
    return 'bg-[#f4d4c8] text-[#7a2e1a] ring-1 ring-[#c45c3e]/35';
  }
  if (badge === 'trial') return 'bg-amber-100 text-amber-950';
  if (badge === 'paid') return 'bg-stone-100 text-stone-800';
  if (badge === 'canceled') return 'bg-slate-100 text-slate-700';
  if (badge === 'paused') return 'bg-indigo-100 text-indigo-900';
  if (badge === 'incomplete' || badge === 'incomplete_expired') return 'bg-orange-100 text-orange-950';
  return 'bg-stone-100 text-stone-600';
}
