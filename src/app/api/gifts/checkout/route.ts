import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { isGiftsEnabled, stripeGiftWritesAllowed } from '@/lib/gifts/flag';
import { loadGiftPrices, type GiftMonths } from '@/lib/gifts/prices';
import { computeSendAtUtc, maxSendDateYmd, normalizeGiftTimezone } from '@/lib/gifts/send-at';
import { getAppBaseUrl } from '@/lib/stripe/create-checkout-session';
import { GENERIC_ERROR_FR } from '@/lib/http/public-error';

export async function POST(request: Request) {
  if (!isGiftsEnabled()) return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 404 });
  if (!stripeGiftWritesAllowed()) {
    return NextResponse.json({ error: 'Paiement carte cadeau disponible uniquement avec une clé Stripe test, ou en production après GO.' }, { status: 503 });
  }
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 400 });
  }
  if (body.immediate !== true) {
    return NextResponse.json({ error: 'Coche la case d’accès immédiat pour continuer.' }, { status: 400 });
  }
  const months = Number(body.months) as GiftMonths;
  const prices = await loadGiftPrices();
  const price = prices.find((p) => p.months === months);
  if (!price?.priceId) {
    return NextResponse.json({ error: 'Prix Stripe non configuré (STRIPE_PRICE_GIFT_*).' }, { status: 503 });
  }
  const from = String(body.from ?? '').trim();
  const to = String(body.to ?? '').trim();
  const buyerEmail = String(body.buyerEmail ?? '').trim();
  const message = String(body.message ?? '').slice(0, 250);
  const delivery = body.delivery === 'print' ? 'print' : 'email';
  const tz = normalizeGiftTimezone(String(body.timezone ?? 'Europe/Paris'));
  const date = String(body.date ?? '');
  const time = String(body.time ?? '08:00');
  let sendAt: string | null = null;
  if (delivery === 'email' && date && time) {
    const utc = computeSendAtUtc(date, time, tz);
    const max = maxSendDateYmd(new Date());
    if (date > max) return NextResponse.json({ error: 'Date d’envoi au plus tard 6 mois après l’achat.' }, { status: 400 });
    sendAt = utc.toISOString();
  }

  const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  const origin = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    invoice_creation: { enabled: true },
    customer_email: buyerEmail || undefined,
    line_items: [{ price: price.priceId, quantity: 1 }],
    success_url: `${origin}/offrir?ok=1`,
    cancel_url: `${origin}/offrir`,
    metadata: {
      kind: 'gift',
      months: String(months),
      from,
      to,
      message,
      delivery,
      recipient_email: String(body.recipientEmail ?? ''),
      buyer_timezone: tz,
      send_at: sendAt ?? '',
      immediate: '1',
    },
  });
  return NextResponse.json({ url: session.url });
}
