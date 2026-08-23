import Stripe from 'stripe';

import { COURSE_CHECKOUT_MODE, getStripePriceId, isValidCheckoutCourseId } from '@/lib/checkout-courses';
import type { ValidatedPromoCode } from '@/lib/promo-codes/types';

export const VISIO_FREE_TRIAL_DAYS = 7;

export type CreateCheckoutSessionInput = {
  userId: string;
  email: string | null | undefined;
  courseId: string;
  referralCode?: string | null;
  promoCode?: ValidatedPromoCode | null;
  /** Customer Stripe déjà créé/à jour (nom, e-mail, téléphone préremplis). */
  stripeCustomerId?: string | null;
  /** Si true, ne redemande pas le téléphone sur Checkout (déjà collecté). */
  skipPhoneCollection?: boolean;
};

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://fitmangas.com' : 'http://localhost:3000')
  ).replace(/\/$/, '');
}

function isVisioSubscriptionCourse(courseId: string): boolean {
  return courseId === 'v-coll' || courseId === 'v-ind';
}

export async function createStripeCheckoutSession(
  stripe: Stripe,
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const { userId, email, courseId, referralCode, promoCode, stripeCustomerId, skipPhoneCollection } = input;
  const priceId = getStripePriceId(courseId);
  if (!priceId) {
    throw new Error('STRIPE_PRICE_MISSING');
  }

  const mode = COURSE_CHECKOUT_MODE[courseId];
  const appUrl = getAppBaseUrl();
  const successPath = `/compte?checkout=success&session_id={CHECKOUT_SESSION_ID}`;

  const metadata: Record<string, string> = {
    supabase_user_id: userId,
    course_id: courseId,
  };
  const ref = referralCode?.trim();
  if (ref) metadata.referral_code = ref;
  if (promoCode) {
    metadata.promo_code = promoCode.code;
    metadata.promo_code_id = promoCode.id;
  }

  const customerId = stripeCustomerId?.trim() || null;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}${successPath}`,
    cancel_url: `${appUrl}/?checkout=cancelled`,
    metadata,
    ...(customerId
      ? {
          customer: customerId,
          customer_update: { name: 'auto', address: 'auto' },
        }
      : {
          customer_email: email ?? undefined,
        }),
    ...(skipPhoneCollection ? {} : { phone_number_collection: { enabled: true } }),
    ...(promoCode
      ? {
          discounts: [{ promotion_code: promoCode.stripePromotionCodeId }],
        }
      : {}),
  };

  if (mode === 'subscription') {
    params.payment_method_collection = 'always';
    params.subscription_data = {
      metadata: { ...metadata },
      ...(isVisioSubscriptionCourse(courseId) && promoCode?.benefitType !== 'free_months'
        ? { trial_period_days: VISIO_FREE_TRIAL_DAYS }
        : {}),
    };
  } else {
    params.payment_intent_data = { metadata: { ...metadata } };
  }

  return stripe.checkout.sessions.create(params);
}

export function parseCheckoutCourseId(raw: string): string | null {
  return isValidCheckoutCourseId(raw) ? raw : null;
}
