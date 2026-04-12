import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook Stripe non configuré.' }, { status: 503 });
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] signature', err);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const courseId = session.metadata?.course_id ?? null;
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

    if (userId) {
      try {
        const admin = createAdminClient();
        const { error } = await admin
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            last_checkout_course_id: courseId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('[stripe webhook] profiles update', error.message);
        }
      } catch (e) {
        console.error('[stripe webhook] admin client', e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
