import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { dispatchSubscriptionCancelled } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, tier')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .not('stripe_subscription_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.error('[billing cancel] lecture abonnement', subError);
    return NextResponse.json({ error: 'Impossible de lire ton abonnement.' }, { status: 500 });
  }

  const subscriptionId = sub?.stripe_subscription_id?.trim();
  if (!subscriptionId || !sub?.tier) {
    return NextResponse.json({ error: 'Aucun abonnement actif à annuler.' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);

  try {
    const canceled = await stripe.subscriptions.cancel(subscriptionId);
    const accessEndsAt = canceled.ended_at
      ? new Date(canceled.ended_at * 1000).toISOString()
      : new Date().toISOString();

    const admin = createAdminClient();
    await dispatchSubscriptionCancelled(admin, user.id, String(sub.tier), accessEndsAt);

    return NextResponse.json({
      ok: true,
      accessEndsAt,
      emailSent: true,
    });
  } catch (e) {
    console.error('[billing cancel]', e);
    return NextResponse.json({ error: 'Impossible d’annuler l’abonnement.' }, { status: 500 });
  }
}
