import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import type { GiftRow } from './cards';

/**
 * Remboursement d'une carte (C05), SPEC §5 « Rétractation » :
 * - carte non activée : remboursement intégral ;
 * - carte activée : au prorata des jours non utilisés (depuis l'activation, sur N mois).
 * Le délai légal est de 14 jours après l'achat ; au-delà, l'admin peut encore rembourser (geste commercial),
 * l'écran le signale.
 */

export type RefundQuote = {
  amountCents: number;
  full: boolean;
  usedDays: number;
  totalDays: number;
  /** Achat il y a plus de 14 jours : hors délai de rétractation. */
  late: boolean;
};

const DAY = 86_400_000;

export function giftTotalDays(row: Pick<GiftRow, 'months' | 'activated_at'>): number {
  const start = row.activated_at ? new Date(row.activated_at) : new Date();
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + row.months);
  return Math.round((end.getTime() - start.getTime()) / DAY);
}

export function quoteGiftRefund(
  row: Pick<GiftRow, 'amount_cents' | 'months' | 'status' | 'activated_at' | 'created_at'>,
  now = new Date(),
): RefundQuote | null {
  if (row.status === 'refunded' || row.amount_cents <= 0) return null;
  const late = now.getTime() - new Date(row.created_at).getTime() > 14 * DAY;
  if (row.status !== 'activated' || !row.activated_at) {
    return { amountCents: row.amount_cents, full: true, usedDays: 0, totalDays: giftTotalDays(row), late };
  }
  const totalDays = giftTotalDays(row);
  const usedDays = Math.min(totalDays, Math.max(0, Math.ceil((now.getTime() - new Date(row.activated_at).getTime()) / DAY)));
  const amountCents = Math.max(0, Math.floor((row.amount_cents * (totalDays - usedDays)) / totalDays));
  return { amountCents, full: usedDays === 0, usedDays, totalDays, late };
}

/** Crédit encore disponible sur le solde Stripe (le solde est négatif quand la cliente a du crédit). */
export function remainingCreditCents(customerBalance: number | null | undefined): number {
  return Math.max(0, -(customerBalance ?? 0));
}

/** Part du crédit cadeau à reprendre : au prorata des jours restants, jamais plus que le crédit encore disponible. */
export function creditToRemoveCents(grantedCents: number, unusedRatio: number, customerBalance: number | null | undefined): number {
  const prorata = Math.round(Math.abs(grantedCents) * Math.min(1, Math.max(0, unusedRatio)));
  return Math.min(prorata, remainingCreditCents(customerBalance));
}

/**
 * Rembourse via Stripe puis retire l'avantage non utilisé :
 * essai offert → abonnement annulé (ou essai raccourci si d'autres cartes y sont ajoutées) ;
 * essai prolongé → raccourci des jours remboursés ; crédit de solde → part non utilisée retirée du solde.
 *
 * La carte est d'abord réservée en base (statut « remboursée » si elle n'a pas changé depuis la lecture) :
 * une activation simultanée ne peut plus passer, et deux remboursements ne peuvent pas se suivre.
 */
export async function refundGift(
  admin: SupabaseClient,
  stripe: Stripe,
  row: GiftRow,
  amountCents: number,
): Promise<{ ok: true; warning?: string } | { ok: false; message: string }> {
  if (!row.stripe_payment_intent_id) return { ok: false, message: 'Paiement Stripe introuvable pour cette carte (carte manuelle ?).' };
  if (amountCents <= 0 || amountCents > row.amount_cents) return { ok: false, message: 'Montant de remboursement invalide.' };

  // 1. Réservation : seulement si la carte est toujours dans l'état lu (sinon l'admin recharge la page).
  const { data: reserved, error: reserveErr } = await admin
    .from('gift_cards')
    .update({ status: 'refunded', refunded_at: new Date().toISOString(), refund_amount_cents: amountCents })
    .eq('id', row.id)
    .eq('status', row.status)
    .select('id');
  if (reserveErr) return { ok: false, message: 'Base de données indisponible : rien n’a été remboursé.' };
  if (!reserved?.length) return { ok: false, message: 'La carte vient de changer (activée ou déjà remboursée) : recharge la page.' };

  // 2. Remboursement Stripe ; en cas d'échec, la carte reprend son état.
  try {
    await stripe.refunds.create(
      { payment_intent: row.stripe_payment_intent_id, amount: amountCents, metadata: { gift_card_id: row.id } },
      { idempotencyKey: `gift-refund-${row.id}-${amountCents}` },
    );
  } catch (e) {
    await admin
      .from('gift_cards')
      .update({ status: row.status, refunded_at: row.refunded_at, refund_amount_cents: row.refund_amount_cents })
      .eq('id', row.id)
      .eq('status', 'refunded');
    throw e;
  }

  // 3. Retrait de l'avantage non utilisé (l'argent est déjà rendu : une erreur ici est signalée, pas annulée).
  return removeGiftBenefit(admin, stripe, row);
}

/**
 * Retire l'avantage non utilisé d'une carte activée qui vient d'être remboursée (depuis l'admin ou depuis Stripe).
 * Essai offert → abonnement annulé, ou essai raccourci si d'autres cartes y sont ajoutées (leurs dates sont recalées) ;
 * essai prolongé → raccourci ; crédit → part restante reprise, jamais plus que le crédit encore disponible.
 */
export async function removeGiftBenefit(
  admin: SupabaseClient,
  stripe: Stripe,
  row: GiftRow,
): Promise<{ ok: true; warning?: string }> {
  if (row.status !== 'activated' || !row.stripe_subscription_id) return { ok: true };
  const quote = quoteGiftRefund(row);
  const unusedRatio = quote && quote.totalDays ? (quote.totalDays - quote.usedDays) / quote.totalDays : 1;
  try {
    const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const removeDays = Math.round((quote?.totalDays ?? 0) * unusedRatio);
    const shortenTrial = async () => {
      if (sub.status !== 'trialing' || !sub.trial_end) return;
      const next = Math.max(Math.floor(Date.now() / 1000) + 3600, sub.trial_end - removeDays * 86_400);
      await stripe.subscriptions.update(sub.id, { trial_end: next, proration_behavior: 'none' });
      // Les autres cartes du même essai gardent une date de fin juste (rappels J-14 / J-3).
      await admin
        .from('gift_cards')
        .update({ access_ends_at: new Date(next * 1000).toISOString() })
        .eq('stripe_subscription_id', sub.id)
        .eq('status', 'activated')
        .neq('id', row.id);
    };

    if (row.activation_mode === 'new_trial' || row.activation_mode === 'existing_no_access') {
      // D'autres cartes encore actives sur le même abonnement : on ne retire que les jours de celle-ci.
      const { data: others } = await admin
        .from('gift_cards')
        .select('id')
        .eq('stripe_subscription_id', sub.id)
        .eq('status', 'activated')
        .neq('id', row.id);
      if (others?.length) await shortenTrial();
      else if (sub.status === 'trialing') await stripe.subscriptions.cancel(sub.id);
    } else if (row.activation_mode === 'trial_extension') {
      await shortenTrial();
    } else if (row.activation_mode === 'balance_credit') {
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      // Crédit réellement accordé à l'activation (retrouvé par la carte).
      const list = await stripe.customers.listBalanceTransactions(customerId, { limit: 100 });
      const granted = list.data.find((tx) => tx.metadata?.gift_card_id === row.id && tx.amount < 0);
      const alreadyRemoved = list.data.some((tx) => tx.metadata?.gift_card_refund_id === row.id);
      if (granted && !alreadyRemoved) {
        const customer = await stripe.customers.retrieve(customerId);
        const balance = 'deleted' in customer && customer.deleted ? 0 : (customer as Stripe.Customer).balance;
        const removeCents = creditToRemoveCents(granted.amount, unusedRatio, balance);
        if (removeCents > 0) {
          await stripe.customers.createBalanceTransaction(
            customerId,
            {
              amount: removeCents,
              currency: granted.currency,
              description: `Remboursement de la carte cadeau ${row.code}`,
              metadata: { gift_card_refund_id: row.id },
            },
            { idempotencyKey: `gift-refund-credit-${row.id}` },
          );
        }
      }
    }
    return { ok: true };
  } catch (e) {
    console.error('[gifts] remboursement : avantage non retiré', e instanceof Error ? e.message : e);
    return { ok: true, warning: 'Remboursement fait, mais l’avantage n’a pas pu être retiré dans Stripe : vérifie l’abonnement de la cliente.' };
  }
}
