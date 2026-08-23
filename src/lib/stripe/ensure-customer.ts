import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export type EnsureStripeCustomerInput = {
  userId: string;
  email: string | null | undefined;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

function fullName(firstName?: string | null, lastName?: string | null): string | undefined {
  const name = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ').trim();
  return name || undefined;
}

/**
 * Crée ou met à jour le customer Stripe avec nom / e-mail / téléphone
 * pour préremplir Checkout et éviter de retaper les infos.
 */
export async function ensureStripeCustomerForCheckout(
  stripe: Stripe,
  admin: SupabaseClient,
  input: EnsureStripeCustomerInput,
): Promise<string> {
  const email = input.email?.trim().toLowerCase() || undefined;
  const name = fullName(input.firstName, input.lastName);
  const phone = input.phone?.trim() || undefined;

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', input.userId)
    .maybeSingle();

  const existingId =
    typeof profile?.stripe_customer_id === 'string' ? profile.stripe_customer_id.trim() : '';

  if (existingId) {
    await stripe.customers.update(existingId, {
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      metadata: { supabase_user_id: input.userId },
    });
    return existingId;
  }

  const customer = await stripe.customers.create({
    ...(email ? { email } : {}),
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    metadata: { supabase_user_id: input.userId },
  });

  const { error } = await admin
    .from('profiles')
    .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
    .eq('id', input.userId);
  if (error) {
    console.warn('[stripe] profile stripe_customer_id sync failed', error.message);
  }

  return customer.id;
}
