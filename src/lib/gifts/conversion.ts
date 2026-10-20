import type { SupabaseClient } from '@supabase/supabase-js';

import { stripeClient, type GiftRow } from './cards';
import { removeGiftBenefit } from './refund';

/**
 * Première facture payée d'un abonnement lié à une carte cadeau (essai offert ou prolongé) :
 * la carte est marquée « convertie » (écran admin C05). Renvoie true si au moins une carte vient d'être marquée.
 */
export async function markGiftConverted(admin: SupabaseClient, subscriptionId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('gift_cards')
    .update({ converted_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'activated')
    .is('converted_at', null)
    .in('activation_mode', ['new_trial', 'existing_no_access', 'trial_extension'])
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/**
 * Remboursement intégral fait directement dans Stripe : la carte passe en « remboursée ».
 * Carte déjà activée : l'avantage non utilisé est retiré comme pour un remboursement depuis l'admin.
 */
export async function markGiftRefundedFromStripe(
  admin: SupabaseClient,
  paymentIntentId: string,
  amountRefundedCents: number,
): Promise<'none' | 'refunded' | 'already' | 'activated_refunded' | 'activated_warning'> {
  const { data } = await admin.from('gift_cards').select('*').eq('stripe_payment_intent_id', paymentIntentId).maybeSingle();
  const card = data as GiftRow | null;
  if (!card) return 'none';
  if (card.status === 'refunded') return 'already';
  const { data: reserved, error } = await admin
    .from('gift_cards')
    .update({ status: 'refunded', refunded_at: new Date().toISOString(), refund_amount_cents: amountRefundedCents })
    .eq('id', card.id)
    .eq('status', card.status)
    .select('id');
  if (error) throw new Error(error.message);
  if (!reserved?.length) return 'already';
  if (card.status !== 'activated') return 'refunded';
  const stripe = stripeClient();
  if (!stripe) return 'activated_warning';
  const res = await removeGiftBenefit(admin, stripe, card);
  return res.warning ? 'activated_warning' : 'activated_refunded';
}
