import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { dispatchReferralRewardUnlocked } from '@/lib/notifications/phase2';
import {
  isReferralRewardProgram,
  referredProfileQualifies,
  resolveReferrerReferralProgram,
  stripeTierForReferrerProgram,
  type ReferrerProfileSlice,
} from '@/lib/referrals/referral-program';

export const REFERRAL_REWARD_THRESHOLD = 5;

/** @deprecated Utiliser `countActiveQualifiedReferrals`. */
export const VISIO_COLLECTIF_COURSE_ID = 'v-coll';

async function loadReferrerProgram(
  admin: SupabaseClient,
  referrerUserId: string,
): Promise<ReturnType<typeof resolveReferrerReferralProgram>> {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('subscription_type, last_checkout_course_id, subscription_status')
    .eq('id', referrerUserId)
    .maybeSingle();

  if (error || !profile) {
    console.error('[referral-reward] load referrer profile', error?.message);
    return 'none';
  }

  return resolveReferrerReferralProgram(profile as ReferrerProfileSlice);
}

/**
 * Compte les filleules actives éligibles selon l’abonnement de la parraine :
 * - v-coll → filleules Visio Collectif ou Individuel actives
 * - v-ind → filleules Visio Individuel actives uniquement
 * - présentiel → 0
 */
export async function countActiveQualifiedReferrals(
  admin: SupabaseClient,
  referrerUserId: string,
): Promise<number> {
  const program = await loadReferrerProgram(admin, referrerUserId);
  if (!isReferralRewardProgram(program)) return 0;

  const { data: rows, error } = await admin
    .from('referrals')
    .select('referred_user_id')
    .eq('referrer_user_id', referrerUserId)
    .eq('status', 'subscribed');

  if (error) {
    console.error('[referral-reward] count referrals', error.message);
    return 0;
  }

  const referredIds = [...new Set((rows ?? []).map((r) => r.referred_user_id).filter(Boolean))] as string[];
  if (referredIds.length === 0) return 0;

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, subscription_type, last_checkout_course_id, subscription_status')
    .in('id', referredIds);

  if (profileError) {
    console.error('[referral-reward] count referred profiles', profileError.message);
    return 0;
  }

  return (profiles ?? []).filter((p) => referredProfileQualifies(program, p)).length;
}

/** Alias historique — délègue à `countActiveQualifiedReferrals`. */
export async function countActiveVisioCollectifReferrals(
  admin: SupabaseClient,
  referrerUserId: string,
): Promise<number> {
  return countActiveQualifiedReferrals(admin, referrerUserId);
}

export async function syncReferralRewardForReferrer(
  admin: SupabaseClient,
  stripe: Stripe | null,
  referrerUserId: string,
): Promise<void> {
  const program = await loadReferrerProgram(admin, referrerUserId);
  if (!isReferralRewardProgram(program)) {
    const { data: profile } = await admin
      .from('profiles')
      .select('referral_reward_active')
      .eq('id', referrerUserId)
      .maybeSingle();
    if (profile?.referral_reward_active) {
      await admin
        .from('profiles')
        .update({ referral_reward_active: false, updated_at: new Date().toISOString() })
        .eq('id', referrerUserId);
      if (stripe) await clearStripeReferralDiscounts(admin, stripe, referrerUserId);
    }
    return;
  }

  const activeCount = await countActiveQualifiedReferrals(admin, referrerUserId);
  const shouldReward = activeCount >= REFERRAL_REWARD_THRESHOLD;

  const { data: profile, error: readError } = await admin
    .from('profiles')
    .select('referral_reward_active')
    .eq('id', referrerUserId)
    .maybeSingle();

  if (readError || !profile) {
    console.error('[referral-reward] read profile', readError?.message);
    return;
  }

  const wasRewardActive = profile.referral_reward_active === true;

  if (profile.referral_reward_active !== shouldReward) {
    const { error: updateError } = await admin
      .from('profiles')
      .update({ referral_reward_active: shouldReward, updated_at: new Date().toISOString() })
      .eq('id', referrerUserId);

    if (updateError) {
      console.error('[referral-reward] update flag', updateError.message);
      return;
    }
  }

  if (!stripe) return;

  if (shouldReward && !wasRewardActive) {
    const applied = await applyStripeReferralReward(admin, stripe, referrerUserId, true, program);
    if (!applied) {
      console.warn(
        '[referral-reward] coupon Stripe non appliqué — notification referral.reward_unlocked non envoyée.',
        { referrerUserId },
      );
      return;
    }
    await dispatchReferralRewardUnlocked(admin, referrerUserId);
    return;
  }

  await applyStripeReferralReward(admin, stripe, referrerUserId, shouldReward, program);
}

/** Recalcule la récompense de la parraine après changement chez une filleule. */
export async function syncReferrerRewardAfterReferredUserChange(
  admin: SupabaseClient,
  stripe: Stripe | null,
  referredUserId: string,
): Promise<void> {
  const { data: row } = await admin
    .from('referrals')
    .select('referrer_user_id')
    .eq('referred_user_id', referredUserId)
    .maybeSingle();

  if (!row?.referrer_user_id) return;
  await syncReferralRewardForReferrer(admin, stripe, row.referrer_user_id);
}

async function clearStripeReferralDiscounts(
  admin: SupabaseClient,
  stripe: Stripe,
  referrerUserId: string,
): Promise<void> {
  const tiers = ['online_group_monthly', 'online_individual_monthly'];
  for (const tier of tiers) {
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', referrerUserId)
      .eq('tier', tier)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const subscriptionId = sub?.stripe_subscription_id?.trim();
    if (!subscriptionId) continue;
    try {
      await stripe.subscriptions.update(subscriptionId, { discounts: [] });
    } catch (err) {
      console.error('[referral-reward] clear discount', { tier, err });
    }
  }
}

async function applyStripeReferralReward(
  admin: SupabaseClient,
  stripe: Stripe,
  referrerUserId: string,
  enable: boolean,
  program: ReturnType<typeof resolveReferrerReferralProgram>,
): Promise<boolean> {
  const couponId = process.env.STRIPE_REFERRAL_REWARD_COUPON_ID?.trim();
  if (!couponId) {
    console.warn('[referral-reward] STRIPE_REFERRAL_REWARD_COUPON_ID manquant — pas de remise Stripe appliquée.');
    return false;
  }

  const tier = stripeTierForReferrerProgram(program);
  if (!tier) return false;

  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', referrerUserId)
    .eq('tier', tier)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionId = sub?.stripe_subscription_id?.trim();
  if (!subscriptionId) return false;

  try {
    await stripe.subscriptions.update(subscriptionId, {
      discounts: enable ? [{ coupon: couponId }] : [],
    });
    return true;
  } catch (err) {
    console.error('[referral-reward] stripe subscription update', err);
    return false;
  }
}
