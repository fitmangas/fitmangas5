import type { User } from '@supabase/supabase-js';
import Stripe from 'stripe';

/** Téléphone saisi à l’inscription (user_metadata) ou Auth phone OTP. */
export function phoneFromAuthUser(user: User | null | undefined): string | null {
  if (!user) return null;
  const authPhone = typeof user.phone === 'string' ? user.phone.trim() : '';
  if (authPhone) return authPhone;

  const meta = user.user_metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const raw = (meta as Record<string, unknown>).phone;
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return null;
}

/** Fallback Stripe Customer.phone (si collecté au Checkout). */
export async function phoneFromStripeCustomer(stripeCustomerId: string | null | undefined): Promise<string | null> {
  const id = stripeCustomerId?.trim();
  if (!id) return null;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;

  try {
    const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    const customer = await stripe.customers.retrieve(id);
    if (customer.deleted) return null;
    const phone = typeof customer.phone === 'string' ? customer.phone.trim() : '';
    return phone || null;
  } catch (e) {
    console.warn('[phone] stripe customer lookup failed', id, e);
    return null;
  }
}

export async function resolveClientPhone(opts: {
  authUser: User | null | undefined;
  stripeCustomerId?: string | null;
}): Promise<string | null> {
  const fromAuth = phoneFromAuthUser(opts.authUser);
  if (fromAuth) return fromAuth;
  return phoneFromStripeCustomer(opts.stripeCustomerId);
}
