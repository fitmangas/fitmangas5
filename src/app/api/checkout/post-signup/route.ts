import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getReferralCodeForCheckout } from '@/lib/referrals/checkout-referral';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStripeCheckoutSession, parseCheckoutCourseId } from '@/lib/stripe/create-checkout-session';

/**
 * Checkout après inscription : vérifie userId + e-mail (service role), sans cookie.
 */
export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe n’est pas configuré (STRIPE_SECRET_KEY).' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const courseId =
    typeof body === 'object' && body !== null && 'courseId' in body && typeof (body as { courseId: unknown }).courseId === 'string'
      ? parseCheckoutCourseId((body as { courseId: string }).courseId)
      : null;
  const userId =
    typeof body === 'object' && body !== null && 'userId' in body && typeof (body as { userId: unknown }).userId === 'string'
      ? (body as { userId: string }).userId.trim()
      : '';
  const email =
    typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email: unknown }).email === 'string'
      ? (body as { email: string }).email.trim().toLowerCase()
      : '';

  if (!courseId || !userId || !email) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }

  const authEmail = userData.user.email?.trim().toLowerCase();
  if (!authEmail || authEmail !== email) {
    return NextResponse.json({ error: 'E-mail non associé à ce compte.' }, { status: 403 });
  }

  const stripe = new Stripe(stripeSecret);

  try {
    const referralCode = await getReferralCodeForCheckout();
    const session = await createStripeCheckoutSession(stripe, {
      userId,
      email: authEmail,
      courseId,
      referralCode,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'URL de paiement indisponible.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof Error && e.message === 'STRIPE_PRICE_MISSING') {
      return NextResponse.json(
        {
          error:
            'Identifiant de prix Stripe manquant. Définissez la variable d’environnement correspondante (voir .env.example).',
        },
        { status: 503 },
      );
    }
    console.error('[checkout/post-signup]', e);
    return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 });
  }
}
