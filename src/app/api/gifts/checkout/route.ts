import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { isGiftsEnabled, stripeGiftWritesAllowed } from '@/lib/gifts/flag';
import { loadGiftPrices, type GiftMonths } from '@/lib/gifts/prices';
import { computeSendAtUtc, maxSendDateYmd, normalizeGiftTimezone } from '@/lib/gifts/send-at';
import { getAppBaseUrl } from '@/lib/stripe/create-checkout-session';
import { GENERIC_ERROR_FR } from '@/lib/http/public-error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ERR = {
  consent: { fr: 'Coche la case d’accès immédiat pour continuer.', es: 'Marca la casilla de acceso inmediato para continuar.' },
  names: { fr: 'Indique ton prénom et celui de la personne à qui tu l’offres.', es: 'Indica tu nombre y el de la persona a la que se la regalas.' },
  recipient: { fr: 'L’email de la destinataire n’est pas valide.', es: 'El email de la destinataria no es válido.' },
  buyer: { fr: 'Ton email n’est pas valide.', es: 'Tu email no es válido.' },
  date: { fr: 'Choisis une date d’envoi entre aujourd’hui et dans 6 mois.', es: 'Elige una fecha de envío entre hoy y dentro de 6 meses.' },
  price: { fr: 'Paiement indisponible pour le moment (prix non configuré).', es: 'Pago no disponible por ahora (precio no configurado).' },
  generic: { fr: GENERIC_ERROR_FR, es: 'Algo salió mal. Inténtalo de nuevo en un momento.' },
  closed: {
    fr: 'Les cartes cadeaux ouvrent bientôt.',
    es: 'Las tarjetas regalo abren pronto.',
  },
} as const;

/** C01 — crée la session Stripe Checkout (paiement unique) d'une carte cadeau. La carte est créée par le webhook. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 400 });
  }
  const lang = body.locale === 'es' ? 'es' : 'fr';
  if (!isGiftsEnabled()) return NextResponse.json({ error: ERR.generic[lang] }, { status: 404 });
  if (!stripeGiftWritesAllowed()) return NextResponse.json({ error: ERR.closed[lang] }, { status: 503 });
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return NextResponse.json({ error: ERR.generic[lang] }, { status: 503 });

  if (body.immediate !== true) return NextResponse.json({ error: ERR.consent[lang] }, { status: 400 });
  const months = Number(body.months) as GiftMonths;
  const from = String(body.from ?? '').trim().slice(0, 60);
  const to = String(body.to ?? '').trim().slice(0, 60);
  if (!from || !to) return NextResponse.json({ error: ERR.names[lang] }, { status: 400 });
  const buyerEmail = String(body.buyerEmail ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(buyerEmail)) return NextResponse.json({ error: ERR.buyer[lang] }, { status: 400 });
  const message = String(body.message ?? '').trim().slice(0, 250);
  const delivery = body.delivery === 'print' ? 'print' : 'email';
  const recipientEmail = delivery === 'email' ? String(body.recipientEmail ?? '').trim().toLowerCase() : '';
  if (delivery === 'email' && !EMAIL_RE.test(recipientEmail)) return NextResponse.json({ error: ERR.recipient[lang] }, { status: 400 });

  const tz = normalizeGiftTimezone(String(body.timezone ?? 'Europe/Paris'));
  let sendAt = '';
  if (delivery === 'email') {
    const date = String(body.date ?? '');
    const time = /^\d{2}:\d{2}$/.test(String(body.time ?? '')) ? String(body.time) : '08:00';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > maxSendDateYmd(new Date())) return NextResponse.json({ error: ERR.date[lang] }, { status: 400 });
    try {
      // Heure déjà passée : la carte part dès le paiement (webhook).
      sendAt = computeSendAtUtc(date, time, tz).toISOString();
    } catch {
      return NextResponse.json({ error: ERR.date[lang] }, { status: 400 });
    }
  }

  const prices = await loadGiftPrices();
  const price = prices.find((p) => p.months === months);
  if (!price?.priceId) return NextResponse.json({ error: ERR.price[lang] }, { status: 503 });

  try {
    const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    const origin = getAppBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: lang,
      invoice_creation: { enabled: true },
      customer_email: buyerEmail,
      line_items: [{ price: price.priceId, quantity: 1 }],
      success_url: `${origin}/offrir?ok=1${lang === 'es' ? '&lang=es' : ''}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/offrir${lang === 'es' ? '?lang=es' : ''}`,
      metadata: {
        kind: 'gift',
        months: String(months),
        from,
        to,
        message,
        delivery,
        recipient_email: recipientEmail,
        buyer_timezone: tz,
        send_at: sendAt,
        locale: lang,
        // Case cochée : demande d'accès immédiat (renonciation partielle au délai de rétractation, texte C01).
        immediate: '1',
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[gifts] checkout', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: ERR.generic[lang] }, { status: 502 });
  }
}
