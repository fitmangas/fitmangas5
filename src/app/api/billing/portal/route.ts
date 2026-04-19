import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe n’est pas configuré.' }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();

  const customerId = profile?.stripe_customer_id?.trim();
  if (!customerId) {
    return NextResponse.json(
      { error: 'Aucun client Stripe associé. Effectue un premier achat ou contacte le support.' },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const base = appUrl.replace(/\/$/, '');

  const stripe = new Stripe(stripeSecret);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/compte/profil`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'URL du portail indisponible.' }, { status: 500 });
    }

    return NextResponse.redirect(session.url);
  } catch (e) {
    console.error('[billing portal]', e);
    return NextResponse.json({ error: 'Impossible d’ouvrir le portail Stripe.' }, { status: 500 });
  }
}
