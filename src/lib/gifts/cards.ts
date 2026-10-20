import { renderToBuffer } from '@react-pdf/renderer';
import Stripe from 'stripe';
import { createElement } from 'react';

import { getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { COURSE_PRICE_CENTS, getStripePriceId } from '@/lib/checkout-courses';
import { GiftPdf } from './gift-pdf';
import { qrPngDataUrl } from './qr';

/** Ligne `gift_cards` (colonnes utilisées par le lot 4). */
export type GiftRow = {
  id: string;
  code: string;
  months: number;
  amount_cents: number;
  currency: string;
  locale: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_timezone: string | null;
  recipient_name: string;
  recipient_email: string | null;
  message: string | null;
  delivery: 'email' | 'print';
  send_at: string | null;
  buyer_email_sent_at: string | null;
  recipient_email_sent_at: string | null;
  status: 'paid' | 'scheduled' | 'sent' | 'activated' | 'expired' | 'refunded';
  expires_at: string;
  activation_mode: 'new_trial' | 'existing_no_access' | 'balance_credit' | 'trial_extension' | null;
  activated_by: string | null;
  activated_at: string | null;
  access_ends_at: string | null;
  stripe_subscription_id: string | null;
  reminder_14_sent_at: string | null;
  reminder_3_sent_at: string | null;
  converted_at: string | null;
  refunded_at: string | null;
  refund_amount_cents: number | null;
  created_at: string;
};

export type GiftLang = 'fr' | 'es';

export const giftLang = (row: Pick<GiftRow, 'locale'>): GiftLang => (row.locale === 'es' ? 'es' : 'fr');

export function activationUrl(code?: string | null): string {
  const base = getEmailPublicBaseUrl();
  return code ? `${base}/offrir/activer?code=${encodeURIComponent(code)}` : `${base}/offrir/activer`;
}

/** « 14 octobre 2027 » / « 14 de octubre de 2027 » */
export function longDateLabel(iso: string, lang: GiftLang, timeZone = 'Europe/Paris'): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(new Date(iso));
}

/** « 39,00 € » (montants en euros : écriture « 39,00 € » aussi en espagnol, plus lisible que « EUR 39.00 »). */
export function formatMoney(cents: number, currency = 'eur', lang: GiftLang = 'fr'): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

/** « 39 € » : sans centimes quand le montant est rond (prix mensuel affiché aux clientes). */
export function formatPriceShort(cents: number, currency = 'eur', lang: GiftLang = 'fr'): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Prix mensuel de la formule Visio collectif (lu dans Stripe, repli sur le tarif connu). */
export async function visioMonthlyCents(stripe?: Stripe | null): Promise<{ cents: number; currency: string }> {
  const priceId = getStripePriceId('v-coll');
  if (stripe && priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (price.unit_amount != null) return { cents: price.unit_amount, currency: price.currency ?? 'eur' };
    } catch (e) {
      console.error('[gifts] prix visio', e instanceof Error ? e.message : e);
    }
  }
  return { cents: COURSE_PRICE_CENTS['v-coll'] ?? 3900, currency: 'eur' };
}

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? new Stripe(key, { apiVersion: '2025-02-24.acacia' }) : null;
}

/** C02 — PDF A5 de la carte (avec QR vers la page d'activation). */
export async function renderGiftPdf(row: Pick<GiftRow, 'code' | 'months' | 'buyer_name' | 'recipient_name' | 'message' | 'expires_at' | 'locale' | 'buyer_timezone'>): Promise<Buffer> {
  const lang = giftLang(row);
  const qr = await qrPngDataUrl(activationUrl(row.code));
  const element = createElement(GiftPdf, {
    lang,
    months: row.months,
    from: row.buyer_name,
    to: row.recipient_name,
    message: row.message ?? '',
    code: row.code,
    expiresLabel: longDateLabel(row.expires_at, lang, row.buyer_timezone || 'Europe/Paris'),
    qrDataUrl: qr,
  });
  // renderToBuffer attend un élément <Document> : GiftPdf en renvoie un.
  return renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);
}

/** Carte fictive des aperçus de développement. */
export function demoGiftRow(lang: GiftLang = 'fr'): GiftRow {
  return {
    id: 'apercu',
    code: 'FM-7K2Q-9XW4',
    months: 3,
    amount_cents: 10900,
    currency: 'eur',
    locale: lang,
    stripe_checkout_session_id: 'cs_test_apercu',
    stripe_payment_intent_id: null,
    buyer_name: 'Sandrine',
    buyer_email: 'sandrine@exemple.fr',
    buyer_timezone: 'Europe/Paris',
    recipient_name: 'Julie',
    recipient_email: 'julie.m@exemple.fr',
    message:
      lang === 'es'
        ? '¡Feliz cumpleaños! 3 meses para cuidarte, a tu ritmo. Un abrazo.'
        : 'Joyeux anniversaire ! 3 mois pour prendre soin de toi, à ton rythme. Je t’embrasse.',
    delivery: 'email',
    send_at: '2026-10-24T12:00:00Z',
    buyer_email_sent_at: null,
    recipient_email_sent_at: null,
    status: 'scheduled',
    expires_at: '2027-10-14T10:00:00Z',
    activation_mode: null,
    activated_by: null,
    activated_at: null,
    access_ends_at: null,
    stripe_subscription_id: null,
    reminder_14_sent_at: null,
    reminder_3_sent_at: null,
    converted_at: null,
    refunded_at: null,
    refund_amount_cents: null,
    created_at: '2026-10-14T10:00:00Z',
  };
}
