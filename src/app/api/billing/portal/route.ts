import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
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

  const formData = await request.formData().catch(() => null);
  const intent = formData?.get('intent')?.toString() ?? 'default';

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

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
    let flowData: Stripe.BillingPortal.SessionCreateParams.FlowData | undefined;

    if (intent === 'subscription') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .not('stripe_subscription_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const subscriptionId = sub?.stripe_subscription_id?.trim();
      if (subscriptionId) {
        flowData = {
          type: 'subscription_update',
          subscription_update: { subscription: subscriptionId },
        };
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/compte/profil`,
      ...(flowData ? { flow_data: flowData } : {}),
    });

    if (!session.url) {
      return NextResponse.json({ error: 'URL du portail indisponible.' }, { status: 500 });
    }

    // 303 : après POST du formulaire, le navigateur doit GET l’URL Stripe (307 garde POST → erreur billing)
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error('[billing portal]', e);
    return NextResponse.json({ error: 'Impossible d’ouvrir le portail Stripe.' }, { status: 500 });
  }
}
