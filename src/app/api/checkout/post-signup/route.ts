import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { phoneFromAuthUser } from '@/lib/admin/client-phone';
import { getReferralCodeForCheckout } from '@/lib/referrals/checkout-referral';
import {
  parseCheckoutCustomerFields,
  parseOfferCodeFromBody,
  resolveOfferCode,
} from '@/lib/promo-codes/resolve-offer-code';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStripeCheckoutSession, parseCheckoutCourseId } from '@/lib/stripe/create-checkout-session';
import { ensureStripeCustomerForCheckout } from '@/lib/stripe/ensure-customer';

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
  const customerFields = parseCheckoutCustomerFields(body);
  const meta = userData.user.user_metadata;
  const metaFirst = meta && typeof meta === 'object' && typeof (meta as Record<string, unknown>).first_name === 'string'
    ? String((meta as Record<string, unknown>).first_name)
    : null;
  const metaLast = meta && typeof meta === 'object' && typeof (meta as Record<string, unknown>).last_name === 'string'
    ? String((meta as Record<string, unknown>).last_name)
    : null;
  const firstName = customerFields.firstName ?? metaFirst;
  const lastName = customerFields.lastName ?? metaLast;
  const phone = customerFields.phone ?? phoneFromAuthUser(userData.user);

  try {
    const cookieReferral = await getReferralCodeForCheckout();
    const resolved = await resolveOfferCode(admin, parseOfferCodeFromBody(body));
    if (resolved.kind === 'invalid') {
      return NextResponse.json({ error: resolved.message }, { status: 400 });
    }

    const promoCode = resolved.kind === 'promo' ? resolved.promo : null;
    const referralCode =
      resolved.kind === 'referral'
        ? resolved.code
        : resolved.kind === 'promo'
          ? cookieReferral && cookieReferral !== resolved.promo.code
            ? cookieReferral
            : null
          : cookieReferral;

    const stripeCustomerId = await ensureStripeCustomerForCheckout(stripe, admin, {
      userId,
      email: authEmail,
      firstName,
      lastName,
      phone,
    });

    const session = await createStripeCheckoutSession(stripe, {
      userId,
      email: authEmail,
      courseId,
      referralCode,
      promoCode,
      stripeCustomerId,
      skipPhoneCollection: Boolean(phone),
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
