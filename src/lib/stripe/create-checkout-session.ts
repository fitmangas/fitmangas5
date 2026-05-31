import Stripe from 'stripe';

import { COURSE_CHECKOUT_MODE, getStripePriceId, isValidCheckoutCourseId } from '@/lib/checkout-courses';

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
    params.subscription_data = { metadata: { ...metadata } };
  } else {
    params.payment_intent_data = { metadata: { ...metadata } };
  }

  return stripe.checkout.sessions.create(params);
}

export function parseCheckoutCourseId(raw: string): string | null {
  return isValidCheckoutCourseId(raw) ? raw : null;
}
