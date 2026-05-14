import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { markReferralsSubscribedForUser } from '@/lib/referrals/attach';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  dispatchPaymentFailed,
  dispatchPresentialPurchased,
  dispatchSubscriptionActivated,
  dispatchSubscriptionCancelled,
  dispatchSubscriptionRenewed,
  markStripeEventProcessed,
} from '@/lib/notifications/phase2';

const stripeApiVersion = '2025-02-24.acacia';

function stripeClient() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return null;
  return new Stripe(stripeSecret, { apiVersion: stripeApiVersion });
}

function asString(value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

async function findUserIdByCustomer(admin: ReturnType<typeof createAdminClient>, customerId: string | null) {
  if (!customerId) return null;
  const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  return data?.id ?? null;
}

async function findNextPresentialCourse(admin: ReturnType<typeof createAdminClient>, offerId: string) {
  const category = offerId === 'n-ind' ? 'individual' : 'group';
  const { data } = await admin
    .from('courses')
    .select('id')
    .eq('course_format', 'onsite')
    .eq('course_category', category)
    .eq('is_published', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Webhook Stripe non configuré.' }, { status: 503 });
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');
  const stripe = stripeClient();
  if (!stripe) return NextResponse.json({ error: 'Stripe non configuré.' }, { status: 503 });
  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Signature Stripe requise.' }, { status: 401 });
      }
      console.warn('[stripe webhook] STRIPE_WEBHOOK_SECRET absent — parsing non signé en environnement contrôlé.');
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error('[stripe webhook] signature', err);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const firstProcess = await markStripeEventProcessed(admin, event);
  if (!firstProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const courseId = session.metadata?.course_id ?? null;
        const customerId = asString(session.customer);
        if (!userId || !courseId) break;
        if (session.mode === 'subscription') {
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;
          await dispatchSubscriptionActivated(admin, userId, courseId, customerId, subscriptionId);
          await markReferralsSubscribedForUser(admin, userId);
        } else if (session.mode === 'payment') {
          const concreteCourseId = session.metadata?.concrete_course_id ?? (await findNextPresentialCourse(admin, courseId));
          await admin.from('profiles').update({ stripe_customer_id: customerId, last_checkout_course_id: courseId, updated_at: new Date().toISOString() }).eq('id', userId);
          if (concreteCourseId) await dispatchPresentialPurchased(admin, userId, concreteCourseId, courseId);
        }
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id ?? (await findUserIdByCustomer(admin, asString(subscription.customer)));
        const courseId = subscription.metadata?.course_id;
        if (userId && courseId) {
          await dispatchSubscriptionActivated(admin, userId, courseId, asString(subscription.customer), subscription.id);
          await markReferralsSubscribedForUser(admin, userId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id ?? (await findUserIdByCustomer(admin, asString(subscription.customer)));
        const courseId = subscription.metadata?.course_id ?? 'v-coll';
        const tier = courseId === 'v-ind' ? 'online_individual_monthly' : 'online_group_monthly';
        if (userId) await dispatchSubscriptionCancelled(admin, userId, tier, subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = asString(invoice.customer);
        const userId = await findUserIdByCustomer(admin, customerId);
        if (userId && customerId) await dispatchPaymentFailed(admin, stripe, customerId, userId, invoice.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_create') break;
        const userId = await findUserIdByCustomer(admin, asString(invoice.customer));
        if (userId) await dispatchSubscriptionRenewed(admin, userId, invoice.id);
        break;
      }
      case 'checkout.session.expired':
        console.info('[stripe webhook] checkout.session.expired', event.id);
        break;
      default:
        break;
    }
  } catch (e) {
    await admin.from('stripe_events').delete().eq('id', event.id);
    console.error('[stripe webhook] handler', e);
    return NextResponse.json({ error: 'Erreur traitement webhook.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
