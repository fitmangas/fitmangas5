import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { confirmUserEmailIfNeeded } from '@/lib/auth/confirm-user-email';
import { getAppBaseUrl } from '@/lib/stripe/create-checkout-session';
import { purchaseAmountEurFromCheckout } from '@/lib/stripe/checkout-purchase-amount';
import { buildProfileSubscriptionUpdate } from '@/lib/stripe/profile-subscription-sync';
import { resolveStripeCustomerIdFromSession } from '@/lib/stripe/resolve-checkout-customer';
import { createAdminClient } from '@/lib/supabase/admin';

function compteSuccessUrl(origin: string, session: Stripe.Checkout.Session): string {
  const courseId = session.metadata?.course_id?.trim() || '';
  const purchaseValue = purchaseAmountEurFromCheckout({
    courseId,
    amountTotalCents: session.amount_total,
  });
  const url = new URL('/compte', origin);
  url.searchParams.set('checkout', 'success');
  if (courseId) url.searchParams.set('course_id', courseId);
  if (purchaseValue != null) url.searchParams.set('purchase_value', String(purchaseValue));
  url.searchParams.set('purchase_currency', (session.currency ?? 'eur').toUpperCase());
  return url.pathname + url.search;
}

/**
 * Retour Stripe après paiement (parcours inscription sans session).
 * Confirme l’e-mail si besoin et ouvre une session via magic link.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const origin = getAppBaseUrl();

  console.log('[checkout-success] GET', { sessionId: sessionId ? 'present' : 'missing' });

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/?checkout=error`);
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.warn('[checkout-success] STRIPE_SECRET_KEY missing');
    return NextResponse.redirect(`${origin}/?checkout=error`);
  }

  const stripe = new Stripe(stripeSecret);
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('[checkout-success] session retrieved', {
      sessionId,
      payment_status: session.payment_status,
      status: session.status,
    });
  } catch (e) {
    console.error('[checkout-success] retrieve session', e);
    return NextResponse.redirect(`${origin}/?checkout=error`);
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    console.warn('[checkout-success] not paid / not complete', { sessionId, payment_status: session.payment_status, status: session.status });
    return NextResponse.redirect(`${origin}/checkout/abandoned?session_id=${encodeURIComponent(sessionId)}`);
  }

  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
  if (!userId) {
    console.warn('[checkout-success] no userId on session', { sessionId });
    return NextResponse.redirect(`${origin}/?checkout=error`);
  }

  const admin = createAdminClient();
  console.log('[checkout-success] confirmUserEmailIfNeeded', { userId });
  await confirmUserEmailIfNeeded(admin, userId);

  const stripeCustomerId = await resolveStripeCustomerIdFromSession(stripe, session);
  if (stripeCustomerId) {
    const courseId = session.metadata?.course_id ?? null;
    const { error: profileSyncErr } = await admin
      .from('profiles')
      .update(
        buildProfileSubscriptionUpdate({
          stripeCustomerId,
          courseId: courseId ?? undefined,
          subscriptionStatus: 'active',
          lastCheckoutCourseId: courseId ?? undefined,
        }),
      )
      .eq('id', userId);
    if (profileSyncErr) {
      console.error('[checkout-success] stripe_customer_id sync', profileSyncErr);
    } else {
      console.log('[checkout-success] stripe_customer_id synced', { userId, stripeCustomerId });
    }
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  const email = userData.user?.email;
  if (userError || !email) {
    console.warn('[checkout-success] no email for magic link', { userId, userError: userError?.message });
    return NextResponse.redirect(`${origin}${compteSuccessUrl(origin, session)}`);
  }

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(compteSuccessUrl(origin, session))}`;
  console.log('[checkout-success] generateLink magiclink', { userId, redirectTo });
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  const actionLink = linkData?.properties?.action_link;
  if (linkError || !actionLink) {
    console.error('[checkout-success] generateLink', linkError);
    const connexionUrl = new URL('/connexion', origin);
    connexionUrl.searchParams.set('checkout', 'success');
    connexionUrl.searchParams.set('email', email);
    connexionUrl.searchParams.set('message', 'payment_ok');
    const courseId = session.metadata?.course_id?.trim();
    const purchaseValue = purchaseAmountEurFromCheckout({
      courseId,
      amountTotalCents: session.amount_total,
    });
    if (courseId) connexionUrl.searchParams.set('course_id', courseId);
    if (purchaseValue != null) connexionUrl.searchParams.set('purchase_value', String(purchaseValue));
    return NextResponse.redirect(connexionUrl.toString());
  }

  console.log('[checkout-success] redirect to magic link', { userId });
  return NextResponse.redirect(actionLink);
}
