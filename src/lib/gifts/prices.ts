import Stripe from 'stripe';


export const GIFT_DURATIONS = [1, 3, 6, 12] as const;
export type GiftMonths = (typeof GIFT_DURATIONS)[number];

const ENV_KEYS: Record<GiftMonths, string> = {
  1: 'STRIPE_PRICE_GIFT_1M',
  3: 'STRIPE_PRICE_GIFT_3M',
  6: 'STRIPE_PRICE_GIFT_6M',
  12: 'STRIPE_PRICE_GIFT_12M',
};

export type GiftPrice = {
  months: GiftMonths;
  priceId: string | null;
  amountCents: number | null;
  currency: string;
  perMonthCents: number | null;
  badge: string | null;
};

function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

export async function loadGiftPrices(): Promise<GiftPrice[]> {
  const client = stripe();
  const canRead = Boolean(client);
  const rows: GiftPrice[] = [];
  for (const months of GIFT_DURATIONS) {
    const priceId = process.env[ENV_KEYS[months]]?.trim() || null;
    let amountCents: number | null = null;
    let currency = 'eur';
    if (canRead && priceId) {
      try {
        const price = await client!.prices.retrieve(priceId);
        amountCents = price.unit_amount ?? null;
        currency = price.currency ?? 'eur';
      } catch (e) {
        console.error('[gifts] price retrieve', months, e instanceof Error ? e.message : e);
      }
    }
    rows.push({
      months,
      priceId,
      amountCents,
      currency,
      perMonthCents: amountCents != null ? Math.round(amountCents / months) : null,
      badge: months === 6 ? '1 mois offert' : months === 12 ? '3 mois offerts' : null,
    });
  }
  return rows;
}

export function formatEurFromCents(cents: number | null): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
