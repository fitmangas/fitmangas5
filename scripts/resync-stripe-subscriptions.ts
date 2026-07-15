import './load-env-local';

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

import { mapStripeStatusToSupabaseStatus, subscriptionAccessEndsAt } from '@/lib/stripe/subscription-status-sync';

const stripeApiVersion = '2025-02-24.acacia';
const apply = process.argv.includes('--apply');

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

function isLiveStripeKey(key: string): boolean {
  return key.startsWith('sk_live_');
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecret = requireEnv('STRIPE_SECRET_KEY');

  if (!isLiveStripeKey(stripeSecret) && !process.argv.includes('--allow-test-key')) {
    throw new Error(
      'STRIPE_SECRET_KEY n’est pas une clé live. Ajoute --allow-test-key uniquement pour tester sur Stripe test.',
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion });

  const { data: rows, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, status, stripe_subscription_id')
    .like('stripe_subscription_id', 'sub_%')
    .order('updated_at', { ascending: false });
  if (error) throw error;

  console.log(
    apply
      ? 'Mode APPLY : les statuts Supabase seront mis à jour.'
      : 'Mode DRY-RUN : aucune écriture. Relancer avec --apply pour corriger.',
  );

  let checked = 0;
  let changed = 0;

  for (const row of rows ?? []) {
    if (!row.stripe_subscription_id) continue;
    checked += 1;

    const subscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const nextDbStatus = mapStripeStatusToSupabaseStatus(subscription.status);
    const endsAt = subscriptionAccessEndsAt(subscription);
    const shouldChange = row.status !== nextDbStatus;

    console.log(
      [
        row.stripe_subscription_id,
        `user=${row.user_id}`,
        `base=${row.status}`,
        `stripe=${subscription.status}`,
        `db_next=${nextDbStatus}`,
        endsAt ? `ends_at=${endsAt}` : null,
        shouldChange ? 'CHANGE' : 'OK',
      ]
        .filter(Boolean)
        .join(' | '),
    );

    if (!apply) continue;

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: nextDbStatus,
      updated_at: now,
    };
    if (endsAt) patch.ends_at = endsAt;
    if (nextDbStatus !== 'canceled' && subscription.cancel_at_period_end === false) patch.ends_at = null;

    const { error: subError } = await supabase.from('subscriptions').update(patch).eq('id', row.id);
    if (subError) throw subError;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_status: subscription.status, updated_at: now })
      .eq('id', row.user_id);
    if (profileError) throw profileError;

    if (shouldChange) changed += 1;
  }

  console.log(`Terminé. Vérifiés=${checked}, changements=${changed}, apply=${apply ? 'oui' : 'non'}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
