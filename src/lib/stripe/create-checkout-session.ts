import Stripe from 'stripe';

import { COURSE_CHECKOUT_MODE, getStripePriceId, isValidCheckoutCourseId } from '@/lib/checkout-courses';

export const VISIO_FREE_TRIAL_DAYS = 7;

export type CreateCheckoutSessionInput = {
  userId: string;
  email: string | null | undefined;
  courseId: string;
  referralCode?: string | null;
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
  const { userId, email, courseId, referralCode } = input;
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

  const params: Stripe.Checkout.SessionCreateParams = {
    mode,
    customer_email: email ?? undefined,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}${successPath}`,
    cancel_url: `${appUrl}/?checkout=cancelled`,
    metadata,
  };

  if (mode === 'subscription') {
    params.payment_method_collection = 'always';
    params.subscription_data = {
      metadata: { ...metadata },
      ...(isVisioSubscriptionCourse(courseId) ? { trial_period_days: VISIO_FREE_TRIAL_DAYS } : {}),
    };
  } else {
    params.payment_intent_data = { metadata: { ...metadata } };
  }

  return stripe.checkout.sessions.create(params);
}

export function parseCheckoutCourseId(raw: string): string | null {
  return isValidCheckoutCourseId(raw) ? raw : null;
}
