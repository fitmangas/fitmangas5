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
    console.log('[stripe webhook] resolveCheckoutUserId: metadata/client_reference', { userId: fromMeta });
    return fromMeta;
  }

  const customerId = asString(session.customer);
  const byCustomer = await findUserIdByCustomer(admin, customerId);
  if (byCustomer) {
    console.log('[stripe webhook] resolveCheckoutUserId: stripe_customer_id', { userId: byCustomer, customerId });
    return byCustomer;
  }

  const email = session.customer_email ?? session.customer_details?.email ?? null;
  const byEmail = await findUserIdByEmail(admin, email);
  if (byEmail) {
    console.log('[stripe webhook] resolveCheckoutUserId: customer_email', { userId: byEmail, email });
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

        console.log('[stripe webhook] checkout.session.completed start', {
          eventId: event.id,
          sessionId: session.id,
          mode: session.mode,
          courseId,
          customerId,
          customerEmail,
          clientReferenceId: session.client_reference_id,
          metadataUserId: session.metadata?.supabase_user_id,
          paymentStatus: session.payment_status,
          status: session.status,
          amountTotal: session.amount_total,
        });

        if (!courseId) {
          console.warn('[stripe webhook] checkout.session.completed skip — course_id manquant', { sessionId: session.id });
          break;
        }

        const userId = await resolveCheckoutUserId(admin, session);
        if (!userId) {
          throw new Error(`checkout.session.completed: profil introuvable pour la session ${session.id}`);
        }

        console.log('[stripe webhook] confirmUserEmailIfNeeded', { userId });
        await confirmUserEmailIfNeeded(admin, userId);
        console.log('[stripe webhook] confirmUserEmailIfNeeded done', { userId });

        if (session.mode === 'subscription') {
          const subscriptionId =
            typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;
          console.log('[stripe webhook] dispatchSubscriptionActivated', { userId, courseId, subscriptionId, customerId });
          await dispatchSubscriptionActivated(admin, userId, courseId, customerId, subscriptionId);
          const { data: profileAfter } = await admin
            .from('profiles')
            .select('stripe_customer_id, subscription_status, subscription_type, customer_tier, last_checkout_course_id')
            .eq('id', userId)
            .maybeSingle();
          console.log('[stripe webhook] profil après activation', { userId, profileAfter });
          const { data: subsAfter } = await admin.from('subscriptions').select('id, tier, status, stripe_subscription_id').eq('user_id', userId);
          console.log('[stripe webhook] subscriptions après activation', { userId, subsAfter });
          const refFromMeta = session.metadata?.referral_code;
          if (typeof refFromMeta === 'string' && isValidReferralCode(refFromMeta)) {
            const { data: authUser } = await admin.auth.admin.getUserById(userId);
            await attachReferralForNewUser(admin, normalizeReferralCode(refFromMeta), userId, authUser.user?.email);
          }
          await markReferralsSubscribedForUser(admin, userId, courseId, stripe);
          console.log('[stripe webhook] markReferralsSubscribedForUser done', { userId, courseId });
        } else if (session.mode === 'payment') {
          const concreteCourseId = session.metadata?.concrete_course_id ?? (await findNextPresentialCourse(admin, courseId));
          const profilePatch = buildProfileSubscriptionUpdate({
            stripeCustomerId: customerId,
            courseId,
            subscriptionStatus: 'active',
            lastCheckoutCourseId: courseId,
          });
          console.log('[stripe webhook] payment mode profile update', { userId, concreteCourseId, profilePatch });
          const { error: profileErr } = await admin.from('profiles').update(profilePatch).eq('id', userId);
          if (profileErr) console.error('[stripe webhook] payment profile update failed', profileErr);
          if (concreteCourseId) {
            console.log('[stripe webhook] dispatchPresentialPurchased', { userId, concreteCourseId, courseId });
            await dispatchPresentialPurchased(admin, userId, concreteCourseId, courseId);
          } else {
            console.log('[stripe webhook] dispatchPresentialPurchaseWithoutScheduledCourse', { userId, courseId });
            await dispatchPresentialPurchaseWithoutScheduledCourse(admin, userId, courseId);
          }
        }
        console.log('[stripe webhook] checkout.session.completed end', { sessionId: session.id, userId });
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id ?? (await findUserIdByCustomer(admin, asString(subscription.customer)));
        const courseId = subscription.metadata?.course_id;
        if (userId && courseId) {
          await dispatchSubscriptionActivated(admin, userId, courseId, asString(subscription.customer), subscription.id);
          await markReferralsSubscribedForUser(admin, userId, courseId, stripe);
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
        if (userId && customerId) await dispatchPaymentFailed(admin, stripe, customerId, userId, invoice.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_create') break;
        const userId = await findUserIdByCustomer(admin, asString(invoice.customer));
        if (userId) {
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
