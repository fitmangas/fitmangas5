import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getReferralCodeForCheckout } from '@/lib/referrals/checkout-referral';
import { createClient } from '@/lib/supabase/server';
import { createStripeCheckoutSession, parseCheckoutCourseId } from '@/lib/stripe/create-checkout-session';

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

  try {
    const referralCode = await getReferralCodeForCheckout();
    const session = await createStripeCheckoutSession(stripe, {
      userId: user.id,
      email: user.email,
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
    console.error('[checkout]', e);
    return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 });
  }
}
