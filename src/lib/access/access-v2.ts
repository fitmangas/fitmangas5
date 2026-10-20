import { isRealStripeSubscriptionId } from '@/lib/admin/member-health';

/**
 * Comptes démo : accès visio sans abonnement Stripe, pour montrer ou filmer l'espace cliente
 * (décision de Kevin, 20/10/2026). Archivés côté admin : hors liste Clients et hors compteurs.
 */
export const DEMO_ACCESS_USER_IDS: ReadonlySet<string> = new Set([
  'f694a7d9-a460-4574-899e-fa46bb461d3c', // « Margaux Demo » (cliente.demo@fitmangas.com)
]);

export function isDemoAccessUser(userId: string | null | undefined): boolean {
  return Boolean(userId) && DEMO_ACCESS_USER_IDS.has(String(userId).trim().toLowerCase());
}

export type AccessV2Subscription = {
  status: string | null;
  ends_at: string | null;
  stripe_subscription_id: string | null;
  /** Formule de l'abonnement (online_group_monthly, online_individual_monthly, …). Si fournie, seules les formules visio comptent. */
  tier?: string | null;
  /** Si connu (Stripe retrieve). Les lignes test sont exclues. */
  livemode?: boolean | null;
};

export type AccessV2Result = {
  visio: boolean;
  reason: string;
};

/**
 * Accès visio ACCESS_V2 : une ligne `subscriptions` active ou en essai,
 * identifiant Stripe réel (`sub_…`), non expirée, livemode !== false,
 * et formule visio quand la formule est connue (un abonnement présentiel ne donne pas les lives en visio).
 */
export function computeVisioAccessV2(
  subscriptions: AccessV2Subscription[],
  now = Date.now(),
): AccessV2Result {
  const eligible = subscriptions.filter((row) => {
    if (row.livemode === false) return false;
    if (!isRealStripeSubscriptionId(row.stripe_subscription_id)) return false;
    const status = (row.status ?? '').toLowerCase();
    if (status !== 'active' && status !== 'trialing') return false;
    if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
    if (row.tier != null && row.tier !== '' && !currentVisioFromTier(row.tier)) return false;
    return true;
  });
  if (eligible.length === 0) {
    return { visio: false, reason: 'aucune subscription active/essai live' };
  }
  const status = (eligible[0].status ?? '').toLowerCase();
  return { visio: true, reason: status === 'trialing' ? 'essai live' : 'abonnement live' };
}

export function currentVisioFromTier(tier: string | null | undefined): boolean {
  return tier === 'online_group_monthly' || tier === 'online_individual_monthly';
}
