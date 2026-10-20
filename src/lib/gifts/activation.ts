import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { getStripePriceId } from '@/lib/checkout-courses';
import { dispatchSubscriptionActivated } from '@/lib/notifications/phase2';
import { ensureStripeCustomerForCheckout } from '@/lib/stripe/ensure-customer';
import { normalizeGiftCode, isGiftCodeFormat } from './code';
import { stripeGiftWritesAllowed } from './flag';
import { stripeClient, visioMonthlyCents, type GiftLang, type GiftRow } from './cards';

/**
 * Activation d'une carte cadeau (C04), SPEC §5 :
 * - nouvelle cliente, ou compte sans accès Visio : abonnement Visio en essai de N mois, sans carte
 *   (`missing_payment_method = cancel` : l'accès s'arrête seul à la fin) ;
 * - déjà abonnée : crédit de N × le prix mensuel sur son solde Stripe (déduit des prochains prélèvements) ;
 * - déjà en essai : essai prolongé de N mois.
 * La carte est d'abord réservée en base (une seule activation possible), puis Stripe est appelé ;
 * en cas d'échec Stripe, la réservation est annulée.
 */

export type GiftLookup =
  | { ok: true; code: string; months: number; recipientName: string; buyerName: string; message: string | null; expiresAt: string; lang: GiftLang }
  | { ok: false; reason: 'format' | 'unknown' | 'used' | 'expired' | 'refunded' };

const ACTIVATABLE: GiftRow['status'][] = ['paid', 'scheduled', 'sent'];

export async function lookupGiftByCode(admin: SupabaseClient, raw: string): Promise<GiftLookup> {
  const code = normalizeGiftCode(raw);
  if (!isGiftCodeFormat(code)) return { ok: false, reason: 'format' };
  const { data } = await admin.from('gift_cards').select('*').eq('code', code).maybeSingle();
  const row = data as GiftRow | null;
  if (!row) return { ok: false, reason: 'unknown' };
  if (row.status === 'refunded') return { ok: false, reason: 'refunded' };
  if (row.status === 'activated') return { ok: false, reason: 'used' };
  if (row.status === 'expired' || new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };
  return {
    ok: true,
    code: row.code,
    months: row.months,
    recipientName: row.recipient_name,
    buyerName: row.buyer_name,
    message: row.message,
    expiresAt: row.expires_at,
    lang: row.locale === 'es' ? 'es' : 'fr',
  };
}

export const LOOKUP_MESSAGES: Record<Exclude<GiftLookup, { ok: true }>['reason'], { fr: string; es: string }> = {
  format: { fr: 'Le code ressemble à FM-XXXX-XXXX.', es: 'El código se parece a FM-XXXX-XXXX.' },
  unknown: { fr: 'Ce code n’existe pas. Vérifie les lettres et les chiffres.', es: 'Este código no existe. Revisa las letras y los números.' },
  used: { fr: 'Cette carte a déjà été activée.', es: 'Esta tarjeta ya fue activada.' },
  expired: { fr: 'Cette carte a expiré.', es: 'Esta tarjeta caducó.' },
  refunded: { fr: 'Cette carte a été remboursée.', es: 'Esta tarjeta fue reembolsada.' },
};

export type ActivationResult =
  | {
      ok: true;
      mode: NonNullable<GiftRow['activation_mode']>;
      months: number;
      accessEndsAt: string | null;
      creditCents: number | null;
      /** Abonnement qui s'arrête à la fin de la période : à réactiver pour profiter du crédit. */
      needsReactivation: boolean;
      /** Un prélèvement de l'abonnement est en échec : moyen de paiement à mettre à jour. */
      paymentIssue?: boolean;
    }
  | { ok: false; status: number; message: { fr: string; es: string } };

function addMonthsUnix(fromUnix: number, months: number): number {
  const d = new Date(fromUnix * 1000);
  d.setUTCMonth(d.getUTCMonth() + months);
  return Math.floor(d.getTime() / 1000);
}

const FAIL = (status: number, fr: string, es: string): ActivationResult => ({ ok: false, status, message: { fr, es } });

/** Statuts Stripe où l'abonnement donne encore l'accès : on ajoute le cadeau dessus. Sinon, nouvel essai offert. */
const LIVE_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due']);

async function customerHasPaymentMethod(stripe: Stripe, customerId: string): Promise<boolean> {
  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) return false;
  const c = customer as Stripe.Customer;
  return Boolean(c.invoice_settings?.default_payment_method || c.default_source);
}

export async function activateGiftForUser(
  admin: SupabaseClient,
  input: { code: string; userId: string; email: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null },
  deps: { stripe?: Stripe | null } = {},
): Promise<ActivationResult> {
  if (!stripeGiftWritesAllowed()) return FAIL(503, 'L’activation des cartes ouvre bientôt.', 'La activación de las tarjetas abre pronto.');
  const stripe = deps.stripe ?? stripeClient();
  if (!stripe) return FAIL(503, 'Activation momentanément indisponible.', 'Activación no disponible por ahora.');
  const code = normalizeGiftCode(input.code);
  const now = new Date();

  const { data: claimed, error: claimErr } = await admin
    .from('gift_cards')
    .update({ status: 'activated', activated_by: input.userId, activated_at: now.toISOString() })
    .eq('code', code)
    .in('status', ACTIVATABLE)
    .gt('expires_at', now.toISOString())
    .select('*');
  if (claimErr) return FAIL(503, 'Activation momentanément indisponible.', 'Activación no disponible por ahora.');
  const card = (claimed?.[0] as GiftRow | undefined) ?? null;
  if (!card) {
    const look = await lookupGiftByCode(admin, code);
    const reason = look.ok ? 'used' : look.reason;
    return { ok: false, status: 409, message: LOOKUP_MESSAGES[reason] };
  }

  const revert = async () => {
    // Seulement si la carte est toujours à nous (un remboursement simultané ne doit pas être écrasé).
    await admin
      .from('gift_cards')
      .update({
        // Email pas encore parti : la carte redevient « programmée » (la tâche des 10 minutes l'enverra).
        status: card.recipient_email_sent_at || card.delivery === 'print' || !card.recipient_email ? 'sent' : 'scheduled',
        activated_by: null,
        activated_at: null,
      })
      .eq('id', card.id)
      .eq('status', 'activated')
      .eq('activated_by', input.userId);
  };

  let mode: NonNullable<GiftRow['activation_mode']> | null = null;
  let accessEndsAt: string | null = null;
  let creditCents: number | null = null;
  let needsReactivation = false;
  let paymentIssue = false;
  let subscriptionId: string | null = null;
  /** Une écriture Stripe a réussi : la carte reste consommée quoi qu'il arrive ensuite. */
  let stripeDone = false;
  // Une clé d'idempotence par réservation. La reprise sûre après une erreur repose sur les marques posées chez Stripe
  // (gift_card_id sur l'abonnement ou le crédit, gift_extension_card_id sur l'essai prolongé), vérifiées avant toute écriture.
  const claimedUnix = Math.floor(new Date(card.activated_at ?? now.toISOString()).getTime() / 1000);
  const attemptKey = `${card.id}-${input.userId}-${claimedUnix}`;
  const trialModeFromProfile = async (): Promise<'new_trial' | 'existing_no_access'> => {
    const { data: profile } = await admin.from('profiles').select('created_at').eq('id', input.userId).maybeSingle();
    const createdAt = profile?.created_at ? new Date(String(profile.created_at)).getTime() : now.getTime();
    return now.getTime() - createdAt < 60 * 60_000 ? 'new_trial' : 'existing_no_access';
  };

  try {
    const { data: subs } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, status, tier, stripe_customer_id')
      .eq('user_id', input.userId)
      .in('status', ['trialing', 'active', 'past_due'])
      .not('stripe_subscription_id', 'is', null);
    const visioSubs = (subs ?? []).filter((s) => s.tier === 'online_group_monthly' || s.tier === 'online_individual_monthly');
    const visio = visioSubs.find((s) => s.tier === 'online_group_monthly') ?? visioSubs[0];

    // Le statut qui compte est celui de Stripe (la ligne locale peut être en retard).
    let sub: Stripe.Subscription | null = null;
    if (visio?.stripe_subscription_id) {
      const found = await stripe.subscriptions.retrieve(String(visio.stripe_subscription_id));
      if (LIVE_STATUSES.has(found.status)) sub = found;
    }

    if (sub && sub.metadata?.gift_card_id === card.id) {
      // L'essai offert par CETTE carte existe déjà (tentative précédente dont la réponse s'est perdue) : on le reprend.
      mode = await trialModeFromProfile();
      accessEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
      subscriptionId = sub.id;
      stripeDone = true;
    } else if (sub) {
      if (sub.status === 'trialing' && sub.trial_end && visio?.tier === 'online_group_monthly') {
        // Déjà en essai Visio collectif : l'essai est prolongé de N mois (une seule fois par carte).
        mode = 'trial_extension';
        if (sub.metadata?.gift_extension_card_id === card.id) {
          accessEndsAt = new Date(sub.trial_end * 1000).toISOString();
        } else {
          const trialEnd = addMonthsUnix(Math.max(sub.trial_end, claimedUnix), card.months);
          await stripe.subscriptions.update(
            sub.id,
            { trial_end: trialEnd, proration_behavior: 'none', metadata: { ...sub.metadata, gift_extension_card_id: card.id } },
            { idempotencyKey: `gift-extension-${attemptKey}` },
          );
          accessEndsAt = new Date(trialEnd * 1000).toISOString();
        }
        stripeDone = true;
        subscriptionId = sub.id;
      } else {
        // Déjà abonnée : N mois au prix du Visio collectif crédités sur son solde (déduits des prochains prélèvements).
        mode = 'balance_credit';
        const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const existing = await stripe.customers.listBalanceTransactions(customer, { limit: 100 });
        const already = existing.data.find((tx) => tx.metadata?.gift_card_id === card.id && tx.amount < 0);
        if (already) {
          creditCents = Math.abs(already.amount);
        } else {
          const price = await visioMonthlyCents(stripe);
          if (sub.currency && sub.currency.toLowerCase() !== price.currency.toLowerCase()) throw new Error(`devise ${sub.currency} différente du prix Visio`);
          creditCents = price.cents * card.months;
          await stripe.customers.createBalanceTransaction(
            customer,
            {
              amount: -creditCents,
              currency: price.currency,
              description: `Carte cadeau FitMangas ${card.code} (${card.months} mois)`,
              metadata: { gift_card_id: card.id },
            },
            { idempotencyKey: `gift-credit-${attemptKey}` },
          );
        }
        stripeDone = true;
        needsReactivation = sub.cancel_at_period_end === true;
        paymentIssue = sub.status === 'past_due';
        subscriptionId = sub.id;
      }
    } else {
      mode = await trialModeFromProfile();
      const priceId = getStripePriceId('v-coll');
      if (!priceId) throw new Error('STRIPE_PRICE_ID_VISIO_COLLECTIF manquant');
      const customerId = await ensureStripeCustomerForCheckout(stripe, admin, {
        userId: input.userId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      });
      // Tentative précédente déjà passée chez Stripe (réponse perdue) : on reprend l'abonnement créé.
      const previous = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
      let created = previous.data.find((s) => s.metadata?.gift_card_id === card.id && s.status !== 'canceled') ?? null;
      if (!created) {
        const trialEnd = addMonthsUnix(claimedUnix, card.months);
        // « Rien n'est prélevé ensuite » : sans moyen de paiement, l'essai s'arrête seul ; avec une carte déjà enregistrée
        // (ancienne abonnée), l'abonnement est programmé pour s'arrêter à la fin de l'essai, sauf si elle choisit de continuer.
        const hasPm = await customerHasPaymentMethod(stripe, customerId);
        created = await stripe.subscriptions.create(
          {
            customer: customerId,
            items: [{ price: priceId }],
            trial_end: trialEnd,
            trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
            payment_settings: { save_default_payment_method: 'on_subscription' },
            ...(hasPm ? { cancel_at_period_end: true } : {}),
            metadata: { supabase_user_id: input.userId, course_id: 'v-coll', gift_card_id: card.id },
          },
          { idempotencyKey: `gift-activation-${attemptKey}` },
        );
      }
      stripeDone = true;
      subscriptionId = created.id;
      accessEndsAt = created.trial_end ? new Date(created.trial_end * 1000).toISOString() : null;
      try {
        // Accès ouvert tout de suite (le webhook refait la même écriture, sans doublon).
        await dispatchSubscriptionActivated(admin, input.userId, 'v-coll', customerId, created.id, { subscriptionStatus: 'trialing' });
      } catch (e) {
        console.error('[gifts] activation : accès local non écrit (le webhook le fera)', e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    console.error('[gifts] activation', e instanceof Error ? e.message : e);
    if (!stripeDone) {
      // Une nouvelle tentative retrouvera ce qui serait passé chez Stripe malgré l'erreur (abonnement ou crédit marqués par la carte).
      await revert();
      return FAIL(502, 'L’activation n’a pas abouti. Réessaie dans un instant.', 'La activación no se completó. Inténtalo de nuevo en un momento.');
    }
  }

  const { error: saveErr } = await admin
    .from('gift_cards')
    .update({ activation_mode: mode, access_ends_at: accessEndsAt, stripe_subscription_id: subscriptionId })
    .eq('id', card.id);
  if (saveErr) console.error('[gifts] activation : détails non enregistrés', card.id, saveErr.message);
  return { ok: true, mode: mode ?? 'new_trial', months: card.months, accessEndsAt, creditCents, needsReactivation, paymentIssue };
}
