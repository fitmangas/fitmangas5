import Stripe from 'stripe';

function asString(value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

/**
 * Résout l’ID client Stripe après checkout (session.customer peut être null sur l’event webhook brut).
 */
export async function resolveStripeCustomerIdFromSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const direct = asString(session.customer);
  if (direct) return direct;

  try {
    const expanded = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['customer', 'subscription'],
    });

    const fromExpanded = asString(expanded.customer);
    if (fromExpanded) return fromExpanded;

    const sub = expanded.subscription;
    const subId = typeof sub === 'string' ? sub : sub?.id;
    if (subId) {
      const subscription =
        typeof sub === 'object' && sub !== null && 'customer' in sub
          ? sub
          : await stripe.subscriptions.retrieve(subId);
      const fromSub = asString(subscription.customer);
      if (fromSub) return fromSub;
    }

    const email = expanded.customer_email ?? expanded.customer_details?.email ?? null;
    if (email) {
      const list = await stripe.customers.list({ email, limit: 1 });
      if (list.data[0]?.id) return list.data[0].id;
    }
  } catch (e) {
    console.error('[resolveStripeCustomerIdFromSession]', e);
  }

  return null;
}
