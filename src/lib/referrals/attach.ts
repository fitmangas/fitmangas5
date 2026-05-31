import type { SupabaseClient } from '@supabase/supabase-js';

import { isValidReferralCode, normalizeReferralCode } from '@/lib/referrals/cookie';
import { referredCheckoutQualifiesForProgram, resolveReferrerReferralProgram } from '@/lib/referrals/referral-program';
import { syncReferralRewardForReferrer, syncReferrerRewardAfterReferredUserChange } from '@/lib/referrals/reward';
import type Stripe from 'stripe';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function attachReferralForNewUser(
  admin: SupabaseClient,
  refCodeRaw: string | undefined,
  newUserId: string,
  newUserEmail: string | null | undefined,
): Promise<void> {
  if (!refCodeRaw || !newUserEmail) return;
  const refCode = normalizeReferralCode(refCodeRaw);
  if (!isValidReferralCode(refCode)) return;
  const email = normalizeEmail(newUserEmail);
  if (!email) return;

  const { data: referrer } = await admin.from('profiles').select('id').eq('referral_code', refCode).maybeSingle();
  if (!referrer?.id || referrer.id === newUserId) return;

  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referrer_user_id', referrer.id)
    .eq('referred_email', email)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from('referrals')
      .update({
        referred_user_id: newUserId,
        referral_code: refCode,
        status: 'signed_up',
        converted_at: now,
      })
      .eq('id', existing.id);
    if (error) console.error('[attachReferralForNewUser] update', error.message);
    return;
  }

  const { error } = await admin.from('referrals').insert({
    referrer_user_id: referrer.id,
    referral_code: refCode,
    referred_email: email,
    referred_user_id: newUserId,
    status: 'signed_up',
    converted_at: now,
  });
  if (error) console.error('[attachReferralForNewUser] insert', error.message);
}

export async function markReferralsSubscribedForUser(
  admin: SupabaseClient,
  userId: string,
  courseId: string | null | undefined,
  stripe: Stripe | null = null,
): Promise<void> {
  const isVisioCheckout = courseId === 'v-coll' || courseId === 'v-ind';
  if (!isVisioCheckout) {
    await syncReferrerRewardAfterReferredUserChange(admin, stripe, userId);
    return;
  }

  const { data: referralRow } = await admin
    .from('referrals')
    .select('referrer_user_id')
    .eq('referred_user_id', userId)
    .maybeSingle();

  if (!referralRow?.referrer_user_id) return;

  const { data: referrerProfile } = await admin
    .from('profiles')
    .select('subscription_type, last_checkout_course_id, subscription_status')
    .eq('id', referralRow.referrer_user_id)
    .maybeSingle();

  const program = resolveReferrerReferralProgram(referrerProfile ?? {});
  if (!referredCheckoutQualifiesForProgram(program, courseId)) {
    await syncReferrerRewardAfterReferredUserChange(admin, stripe, userId);
    return;
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from('referrals')
    .update({ status: 'subscribed', converted_at: now })
    .eq('referred_user_id', userId)
    .in('status', ['pending', 'signed_up'])
    .select('referrer_user_id');

  if (error) {
    console.error('[markReferralsSubscribedForUser]', error.message);
    return;
  }

  const referrerIds = [...new Set((updated ?? []).map((r) => r.referrer_user_id).filter(Boolean))] as string[];
  for (const referrerId of referrerIds) {
    await syncReferralRewardForReferrer(admin, stripe, referrerId);
  }

  if (!referrerIds.length) {
    await syncReferrerRewardAfterReferredUserChange(admin, stripe, userId);
  }
}
