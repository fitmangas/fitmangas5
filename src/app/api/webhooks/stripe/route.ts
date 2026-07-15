import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { confirmUserEmailIfNeeded } from '@/lib/auth/confirm-user-email';
import { attachReferralForNewUser, markReferralsSubscribedForUser } from '@/lib/referrals/attach';
import { isValidReferralCode, normalizeReferralCode } from '@/lib/referrals/cookie';
import { syncReferralRewardForReferrer, syncReferrerRewardAfterReferredUserChange } from '@/lib/referrals/reward';
import { buildProfileSubscriptionUpdate } from '@/lib/stripe/profile-subscription-sync';
import { findUserIdByEmail } from '@/lib/stripe/find-user-by-email';
import { resolveStripeCustomerIdFromSession } from '@/lib/stripe/resolve-checkout-customer';
import { syncStripeSubscriptionStatus } from '@/lib/stripe/subscription-status-sync';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  dispatchCheckoutAbandoned,
  dispatchPaymentFailed,
  dispatchPresentialPurchaseWithoutScheduledCourse,
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

function eventCreatedAt(event: Stripe.Event): string {
  return new Date(event.created * 1000).toISOString();
}

function readSubscriptionReference(value: unknown): string | Stripe.Subscription | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string' && id.startsWith('sub_')) {
      return value as Stripe.Subscription;
    }
  }
  return null;
}

function invoiceSubscriptionReference(invoice: Stripe.Invoice): string | Stripe.Subscription | null {
  const direct = readSubscriptionReference((invoice as unknown as { subscription?: unknown }).subscription);
  if (direct) return direct;

  const parent = invoice as unknown as {
    parent?: { subscription_details?: { subscription?: unknown } | null } | null;
  };
  const fromParent = readSubscriptionReference(parent.parent?.subscription_details?.subscription);
  if (fromParent) return fromParent;

  const withLines = invoice as unknown as {
    lines?: {
      data?: Array<{
        subscription?: unknown;
        parent?: { subscription_item_details?: { subscription?: unknown } | null } | null;
      }>;
    };
  };
  for (const line of withLines.lines?.data ?? []) {
    const fromLine = readSubscriptionReference(line.subscription);
    if (fromLine) return fromLine;
    const fromLineParent = readSubscriptionReference(line.parent?.subscription_item_details?.subscription);
    if (fromLineParent) return fromLineParent;
  }

  return null;
}

async function retrieveInvoiceSubscription(stripe: Stripe, invoice: Stripe.Invoice): Promise<Stripe.Subscription | null> {
  const ref = invoiceSubscriptionReference(invoice);
  if (!ref) return null;
  if (typeof ref !== 'string') return ref;
  return stripe.subscriptions.retrieve(ref);
}

async function findUserIdByCustomer(admin: ReturnType<typeof createAdminClient>, customerId: string | null) {
  if (!customerId) return null;
  const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  return data?.id ?? null;
}

async function resolveCheckoutUserId(
  admin: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const fromMeta = session.metadata?.supabase_user_id ?? session.client_reference_id ?? null;
  if (fromMeta) {
    return fromMeta;
  }

  const customerId = asString(session.customer);
  const byCustomer = await findUserIdByCustomer(admin, customerId);
  if (byCustomer) {
    return byCustomer;
  }

  const email = session.customer_email ?? session.customer_details?.email ?? null;
  const byEmail = await findUserIdByEmail(admin, email);
  if (byEmail) {
    return byEmail;
  }

  console.warn('[stripe webhook] resolveCheckoutUserId: aucun profil trouvé', {
    sessionId: session.id,
    customerId,
    email,
    metadata: session.metadata,
  });
  return null;
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

function subscriptionStatusForAccess(status: Stripe.Subscription.Status | null | undefined): 'active' | 'trialing' {
  return status === 'trialing' ? 'trialing' : 'active';
}

async function resolveCheckoutSubscription(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{ id: string | null; status: 'active' | 'trialing' }> {
  const subscription = session.subscription;
  if (!subscription) return { id: null, status: 'active' };
  if (typeof subscription !== 'string') {
    return {
      id: subscription.id,
      status: subscriptionStatusForAccess(subscription.status),
    };
  }
  const retrieved = await stripe.subscriptions.retrieve(subscription);
  return {
    id: retrieved.id,
    status: subscriptionStatusForAccess(retrieved.status),
  };
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
  const { data: existingEvent } = await admin.from('stripe_events').select('id').eq('id', event.id).maybeSingle();
  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const courseId = session.metadata?.course_id ?? null;
        const customerId = await resolveStripeCustomerIdFromSession(stripe, session);
        const customerEmail = session.customer_email ?? session.customer_details?.email ?? null;

        if (!courseId) {
          console.warn('[stripe webhook] checkout.session.completed skip — course_id manquant', { sessionId: session.id });
          break;
        }

        const userId = await resolveCheckoutUserId(admin, session);
        if (!userId) {
          throw new Error(`checkout.session.completed: profil introuvable pour la session ${session.id}`);
        }

        await confirmUserEmailIfNeeded(admin, userId);

        if (session.mode === 'subscription') {
          const subscription = await resolveCheckoutSubscription(stripe, session);
          await dispatchSubscriptionActivated(admin, userId, courseId, customerId, subscription.id, {
            subscriptionStatus: subscription.status,
          });
          const refFromMeta = session.metadata?.referral_code;
          if (typeof refFromMeta === 'string' && isValidReferralCode(refFromMeta)) {
            const { data: authUser } = await admin.auth.admin.getUserById(userId);
            await attachReferralForNewUser(admin, normalizeReferralCode(refFromMeta), userId, authUser.user?.email);
          }
          await markReferralsSubscribedForUser(admin, userId, courseId, stripe);
        } else if (session.mode === 'payment') {
          const concreteCourseId = session.metadata?.concrete_course_id ?? (await findNextPresentialCourse(admin, courseId));
          const profilePatch = buildProfileSubscriptionUpdate({
            stripeCustomerId: customerId,
            courseId,
            subscriptionStatus: 'active',
            lastCheckoutCourseId: courseId,
          });
          const { error: profileErr } = await admin.from('profiles').update(profilePatch).eq('id', userId);
          if (profileErr) console.error('[stripe webhook] payment profile update failed', profileErr);
          if (concreteCourseId) {
            await dispatchPresentialPurchased(admin, userId, concreteCourseId, courseId);
          } else {
            await dispatchPresentialPurchaseWithoutScheduledCourse(admin, userId, courseId);
          }
        }
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id ?? (await findUserIdByCustomer(admin, asString(subscription.customer)));
        const courseId = subscription.metadata?.course_id;
        if (userId && courseId) {
          await dispatchSubscriptionActivated(admin, userId, courseId, asString(subscription.customer), subscription.id, {
            subscriptionStatus: subscriptionStatusForAccess(subscription.status),
          });
          await markReferralsSubscribedForUser(admin, userId, courseId, stripe);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ?? (await findUserIdByCustomer(admin, asString(subscription.customer)));
        if (userId) {
          await syncStripeSubscriptionStatus({
            client: admin,
            userId,
            subscription,
            source: event.type,
            eventCreatedAt: eventCreatedAt(event),
          });
        } else {
          console.warn('[stripe webhook] customer.subscription.updated skip — utilisateur introuvable', {
            subscriptionId: subscription.id,
            customerId: asString(subscription.customer),
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ?? (await findUserIdByCustomer(admin, asString(subscription.customer)));
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('tier')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        const tierFromMeta = subscription.metadata?.course_id;
        const tier =
          subRow?.tier ??
          (tierFromMeta === 'v-ind'
            ? 'online_individual_monthly'
            : tierFromMeta === 'v-coll'
              ? 'online_group_monthly'
              : null);
        const resolvedTier =
          tier ??
          (subscription.metadata?.course_id === 'v-ind' ? 'online_individual_monthly' : 'online_group_monthly');
        if (userId) {
          await dispatchSubscriptionCancelled(
            admin,
            userId,
            resolvedTier,
            subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
          );
          await syncReferrerRewardAfterReferredUserChange(admin, stripe, userId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = asString(invoice.customer);
        const userId = await findUserIdByCustomer(admin, customerId);
        if (userId && customerId) {
          const subscription = await retrieveInvoiceSubscription(stripe, invoice);
          if (subscription) {
            await syncStripeSubscriptionStatus({
              client: admin,
              userId,
              subscription,
              source: event.type,
              eventCreatedAt: eventCreatedAt(event),
            });
          } else {
            console.warn('[stripe webhook] invoice.payment_failed sans abonnement lié', { invoiceId: invoice.id, userId });
          }
          await dispatchPaymentFailed(admin, stripe, customerId, userId, invoice.id);
        }
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = await findUserIdByCustomer(admin, asString(invoice.customer));
        if (userId) {
          const subscription = await retrieveInvoiceSubscription(stripe, invoice);
          if (subscription) {
            await syncStripeSubscriptionStatus({
              client: admin,
              userId,
              subscription,
              source: event.type,
              eventCreatedAt: eventCreatedAt(event),
            });
          } else {
            console.warn('[stripe webhook] invoice.payment_succeeded sans abonnement lié', { invoiceId: invoice.id, userId });
          }
          if (invoice.billing_reason === 'subscription_create') break;
          await dispatchSubscriptionRenewed(admin, userId, invoice.id);
          await syncReferrerRewardAfterReferredUserChange(admin, stripe, userId);
          const { data: profile } = await admin
            .from('profiles')
            .select('referral_reward_active')
            .eq('id', userId)
            .maybeSingle();
          if (profile?.referral_reward_active) {
            await syncReferralRewardForReferrer(admin, stripe, userId);
          }
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const courseId = session.metadata?.course_id?.trim() || 'v-coll';
        let userId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? null;
        if (!userId) {
          const email = session.customer_email ?? session.customer_details?.email ?? null;
          userId = await findUserIdByEmail(admin, email);
        }
        if (userId) {
          await dispatchCheckoutAbandoned(admin, userId, courseId, session.id);
        } else {
          console.info('[stripe webhook] checkout.session.expired — utilisateur introuvable', {
            sessionId: session.id,
            email: session.customer_email,
          });
        }
        break;
      }
      default:
        break;
    }

    await markStripeEventProcessed(admin, event);
  } catch (e) {
    console.error('[stripe webhook] handler', e);
    return NextResponse.json({ error: 'Erreur traitement webhook.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
