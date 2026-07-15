import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export type SupabaseSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';

const DIRECT_DB_STATUSES = new Set<SupabaseSubscriptionStatus>([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'paused',
]);

/**
 * La colonne public.subscriptions.status est un enum existant.
 * Les statuts Stripe non présents dans cet enum sont rabattus sans migration.
 */
export function mapStripeStatusToSupabaseStatus(status: Stripe.Subscription.Status): SupabaseSubscriptionStatus {
  if (DIRECT_DB_STATUSES.has(status as SupabaseSubscriptionStatus)) {
    return status as SupabaseSubscriptionStatus;
  }
  if (status === 'unpaid') return 'past_due';
  if (status === 'incomplete_expired') return 'canceled';
  return 'paused';
}

export function subscriptionAccessEndsAt(subscription: Stripe.Subscription): string | null {
  if (!subscription.cancel_at_period_end && subscription.status !== 'canceled') return null;
  const currentPeriodEnd = subscription.current_period_end;
  if (!currentPeriodEnd) return null;
  return new Date(currentPeriodEnd * 1000).toISOString();
}

function eventIsClearlyOlder(args: {
  eventCreatedAt: string | null;
  currentUpdatedAt: string | null | undefined;
}): boolean {
  if (!args.eventCreatedAt || !args.currentUpdatedAt) return false;
  const eventTs = new Date(args.eventCreatedAt).getTime();
  const currentTs = new Date(args.currentUpdatedAt).getTime();
  if (!Number.isFinite(eventTs) || !Number.isFinite(currentTs)) return false;

  // Tolérance de 5 min pour les webhooks arrivés dans le même lot Stripe.
  return eventTs + 5 * 60 * 1000 < currentTs;
}

export async function syncStripeSubscriptionStatus(args: {
  client: SupabaseClient;
  userId: string;
  subscription: Stripe.Subscription;
  source: string;
  eventCreatedAt?: string | null;
}): Promise<{ synced: boolean; previousStatus: string | null; nextStatus: SupabaseSubscriptionStatus }> {
  const { client, userId, subscription, source } = args;
  const rawStatus = subscription.status;
  const nextStatus = mapStripeStatusToSupabaseStatus(rawStatus);
  const endsAt = subscriptionAccessEndsAt(subscription);
  const now = new Date().toISOString();

  const { data: current, error: readError } = await client
    .from('subscriptions')
    .select('id, status, updated_at')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();
  if (readError) throw readError;

  if (eventIsClearlyOlder({ eventCreatedAt: args.eventCreatedAt ?? null, currentUpdatedAt: current?.updated_at })) {
    console.info('[stripe webhook] statut abonnement ignoré (événement ancien)', {
      source,
      userId,
      subscriptionId: subscription.id,
      eventCreatedAt: args.eventCreatedAt,
      currentUpdatedAt: current?.updated_at,
      currentStatus: current?.status,
      incomingStatus: rawStatus,
    });
    return { synced: false, previousStatus: current?.status ?? null, nextStatus };
  }

  if (current?.id) {
    const patch: Record<string, unknown> = {
      status: nextStatus,
      updated_at: now,
    };
    if (endsAt) patch.ends_at = endsAt;
    if (nextStatus !== 'canceled' && subscription.cancel_at_period_end === false) patch.ends_at = null;

    const { error: updateError } = await client.from('subscriptions').update(patch).eq('id', current.id);
    if (updateError) throw updateError;
  } else {
    console.warn('[stripe webhook] abonnement Stripe introuvable en base, profil seulement synchronisé', {
      source,
      userId,
      subscriptionId: subscription.id,
      incomingStatus: rawStatus,
    });
  }

  const { error: profileError } = await client
    .from('profiles')
    .update({
      subscription_status: rawStatus,
      updated_at: now,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  console.info('[stripe webhook] statut abonnement synchronisé', {
    source,
    userId,
    subscriptionId: subscription.id,
    previousStatus: current?.status ?? null,
    nextStatus,
    stripeStatus: rawStatus,
    endsAt,
  });

  return { synced: true, previousStatus: current?.status ?? null, nextStatus };
}
