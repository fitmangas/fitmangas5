import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getReferralCodeForCheckout } from '@/lib/referrals/checkout-referral';
import {
  parseCheckoutCustomerFields,
  parseOfferCodeFromBody,
  resolveOfferCode,
} from '@/lib/promo-codes/resolve-offer-code';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createStripeCheckoutSession, parseCheckoutCourseId } from '@/lib/stripe/create-checkout-session';
import { ensureStripeCustomerForCheckout } from '@/lib/stripe/ensure-customer';
import { phoneFromAuthUser } from '@/lib/admin/client-phone';

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe n’est pas configuré (STRIPE_SECRET_KEY).' }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
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

  if (!courseId) {
    return NextResponse.json({ error: 'Offre non reconnue.' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  const customerFields = parseCheckoutCustomerFields(body);
  const metaFirst =
    typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : null;
  const metaLast =
    typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : null;
  const firstName = customerFields.firstName ?? metaFirst;
  const lastName = customerFields.lastName ?? metaLast;
  const phone = customerFields.phone ?? phoneFromAuthUser(user);

  try {
    const admin = createAdminClient();
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
      userId: user.id,
      email: user.email,
      firstName,
      lastName,
      phone,
    });

    const session = await createStripeCheckoutSession(stripe, {
      userId: user.id,
      email: user.email,
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
    console.error('[checkout]', e);
    return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 });
  }
}
