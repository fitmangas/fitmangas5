import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import {
  COURSE_CHECKOUT_MODE,
  getStripePriceId,
  isValidCheckoutCourseId,
} from '@/lib/checkout-courses';

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
      ? (body as { courseId: string }).courseId
      : '';

  if (!isValidCheckoutCourseId(courseId)) {
    return NextResponse.json({ error: 'Offre non reconnue.' }, { status: 400 });
  }

  const priceId = getStripePriceId(courseId);
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          'Identifiant de prix Stripe manquant. Définissez la variable d’environnement correspondante (voir .env.example).',
      },
      { status: 503 },
    );
  }

  const mode = COURSE_CHECKOUT_MODE[courseId];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

  const stripe = new Stripe(stripeSecret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl.replace(/\/$/, '')}/compte?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl.replace(/\/$/, '')}/?checkout=cancel`,
      metadata: {
        supabase_user_id: user.id,
        course_id: courseId,
      },
      subscription_data:
        mode === 'subscription'
          ? { metadata: { supabase_user_id: user.id, course_id: courseId } }
          : undefined,
      payment_intent_data:
        mode === 'payment'
          ? { metadata: { supabase_user_id: user.id, course_id: courseId } }
          : undefined,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'URL de paiement indisponible.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[checkout]', e);
    return NextResponse.json({ error: 'Impossible de créer la session de paiement.' }, { status: 500 });
  }
}
