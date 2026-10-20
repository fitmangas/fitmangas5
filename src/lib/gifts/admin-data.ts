import type { SupabaseClient } from '@supabase/supabase-js';

import type { GiftRow } from './cards';
import { quoteGiftRefund, type RefundQuote } from './refund';

/** Données de l'écran admin C05 (ventes, envois, activations, conversion). */

export type AdminGiftDisplay = 'scheduled' | 'paid' | 'sent' | 'active' | 'converted' | 'refunded' | 'expired';

export type AdminGiftRow = {
  id: string;
  code: string;
  months: number;
  amountCents: number;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string | null;
  print: boolean;
  display: AdminGiftDisplay;
  dateLabel: string;
  refund: RefundQuote | null;
  refundable: boolean;
  canResend: boolean;
  manual: boolean;
};

export type AdminGiftStats = {
  soldThisMonth: number;
  soldPrevMonth: number;
  revenueCents: number;
  monthLabel: string;
  prevMonthLabel: string;
  activated: number;
  delivered: number;
  converted: number;
};

const TZ = 'Europe/Paris';
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...opts }).format(new Date(iso));
const dayMonth = (iso: string) => fmt(iso, { day: 'numeric', month: 'short' });

function display(row: GiftRow, now: Date): AdminGiftDisplay {
  if (row.status === 'refunded') return 'refunded';
  if (row.converted_at) return 'converted';
  if (row.status === 'activated') return 'active';
  if (row.status === 'expired' || new Date(row.expires_at).getTime() < now.getTime()) return 'expired';
  if (row.status === 'scheduled') return 'scheduled';
  if (row.status === 'sent') return 'sent';
  return 'paid';
}

function dateLabel(row: GiftRow, d: AdminGiftDisplay): string {
  switch (d) {
    case 'scheduled':
      return row.send_at ? `envoi ${fmt(row.send_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'envoi programmé';
    case 'sent':
      return row.delivery === 'print'
        ? `PDF envoyé le ${dayMonth(row.buyer_email_sent_at ?? row.created_at)}`
        : `email envoyé le ${dayMonth(row.recipient_email_sent_at ?? row.created_at)}`;
    case 'active':
      return `activée le ${dayMonth(row.activated_at ?? row.created_at)}${row.access_ends_at ? ` · fin ${dayMonth(row.access_ends_at)}` : row.activation_mode === 'balance_credit' ? ' · crédit' : ''}`;
    case 'converted':
      return `abonnée depuis le ${dayMonth(row.converted_at ?? row.created_at)}`;
    case 'refunded':
      return `remboursée le ${dayMonth(row.refunded_at ?? row.created_at)}`;
    case 'expired':
      return `expirée le ${dayMonth(row.expires_at)}`;
    default:
      return `payée le ${dayMonth(row.created_at)}`;
  }
}

export function toAdminGiftRows(rows: GiftRow[], now = new Date()): AdminGiftRow[] {
  return rows.map((r) => {
    const d = display(r, now);
    return {
      id: r.id,
      code: r.code,
      months: r.months,
      amountCents: r.amount_cents,
      buyerName: r.buyer_name,
      buyerEmail: r.buyer_email,
      recipientName: r.recipient_name,
      recipientEmail: r.recipient_email,
      print: r.delivery === 'print',
      display: d,
      dateLabel: dateLabel(r, d),
      refund: quoteGiftRefund(r, now),
      refundable: Boolean(r.stripe_payment_intent_id) && r.status !== 'refunded' && r.amount_cents > 0,
      canResend: Boolean(r.recipient_email) && (d === 'sent' || d === 'scheduled' || d === 'paid'),
      manual: r.amount_cents === 0,
    };
  });
}

export function giftStats(rows: GiftRow[], now = new Date()): AdminGiftStats {
  const monthKey = (iso: string) => fmt(iso, { year: 'numeric', month: '2-digit' });
  const cur = monthKey(now.toISOString());
  const prevDate = new Date(now);
  prevDate.setUTCDate(1);
  prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
  const prev = monthKey(prevDate.toISOString());
  const sold = rows.filter((r) => r.amount_cents > 0);
  const thisMonth = sold.filter((r) => monthKey(r.created_at) === cur);
  const revenueCents = thisMonth.reduce((a, r) => a + r.amount_cents - (r.refund_amount_cents ?? 0), 0);
  const delivered = rows.filter((r) => r.status !== 'refunded' && (r.status === 'sent' || r.status === 'activated' || r.status === 'expired')).length;
  return {
    soldThisMonth: thisMonth.length,
    soldPrevMonth: sold.filter((r) => monthKey(r.created_at) === prev).length,
    revenueCents,
    monthLabel: fmt(now.toISOString(), { month: 'long' }),
    prevMonthLabel: fmt(prevDate.toISOString(), { month: 'long' }),
    activated: rows.filter((r) => r.status === 'activated').length,
    delivered,
    converted: rows.filter((r) => r.converted_at).length,
  };
}

export async function loadAdminGifts(admin: SupabaseClient): Promise<{ rows: GiftRow[]; tablesMissing: boolean }> {
  const { data, error } = await admin.from('gift_cards').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) return { rows: [], tablesMissing: true };
  return { rows: (data ?? []) as GiftRow[], tablesMissing: false };
}

/** Aperçu de développement : 6 cartes d'exemple (maquette C05). */
export function demoAdminGiftRows(now = new Date('2026-10-20T10:00:00Z')): GiftRow[] {
  const base = {
    currency: 'eur',
    locale: 'fr',
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: 'pi_demo',
    buyer_timezone: 'Europe/Paris',
    message: null,
    buyer_email_sent_at: null,
    recipient_email_sent_at: null,
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
    expires_at: '2027-10-01T10:00:00Z',
  } as const;
  const d = (s: string) => new Date(s).toISOString();
  void now;
  return [
    { ...base, id: 'g1', code: 'FM-7K2Q-9XW4', months: 3, amount_cents: 10900, buyer_name: 'Sandrine M.', buyer_email: 'sandrine@exemple.fr', recipient_name: 'Julie M.', recipient_email: 'julie@exemple.fr', delivery: 'email', send_at: d('2026-10-24T06:00:00Z'), status: 'scheduled', created_at: d('2026-10-14T09:00:00Z') },
    { ...base, id: 'g2', code: 'FM-P4LD-2RT8', months: 6, amount_cents: 19500, buyer_name: 'Thomas B.', buyer_email: 'thomas@exemple.fr', recipient_name: 'Camille B.', recipient_email: 'camille@exemple.fr', delivery: 'email', send_at: d('2026-10-10T08:00:00Z'), status: 'activated', activated_at: d('2026-10-12T09:00:00Z'), access_ends_at: d('2027-04-12T09:00:00Z'), activation_mode: 'new_trial', created_at: d('2026-10-10T07:00:00Z') },
    { ...base, id: 'g3', code: 'FM-9QXA-77KM', months: 1, amount_cents: 3900, buyer_name: 'Anaïs R.', buyer_email: 'anais@exemple.fr', recipient_name: 'Anaïs R.', recipient_email: null, delivery: 'print', send_at: d('2026-10-09T10:00:00Z'), status: 'sent', buyer_email_sent_at: d('2026-10-09T10:00:00Z'), created_at: d('2026-10-09T10:00:00Z') },
    { ...base, id: 'g4', code: 'FM-ZT3W-5HB1', months: 3, amount_cents: 10900, buyer_name: 'Marc D.', buyer_email: 'marc@exemple.fr', recipient_name: 'Élodie D.', recipient_email: 'elodie@exemple.fr', delivery: 'email', send_at: d('2026-10-01T08:00:00Z'), status: 'activated', activated_at: d('2026-10-02T09:00:00Z'), access_ends_at: d('2027-01-02T09:00:00Z'), activation_mode: 'new_trial', created_at: d('2026-10-01T07:00:00Z') },
    { ...base, id: 'g5', code: 'FM-C8NV-1PQ6', months: 1, amount_cents: 3900, buyer_name: 'Laura S.', buyer_email: 'laura@exemple.fr', recipient_name: 'Inès S.', recipient_email: 'ines@exemple.fr', delivery: 'email', send_at: d('2026-09-01T08:00:00Z'), status: 'activated', activated_at: d('2026-09-03T09:00:00Z'), activation_mode: 'new_trial', converted_at: d('2026-10-03T09:00:00Z'), created_at: d('2026-09-01T07:00:00Z') },
    { ...base, id: 'g6', code: 'FM-H2RJ-4ZE9', months: 1, amount_cents: 3900, buyer_name: 'Nadia K.', buyer_email: 'nadia@exemple.fr', recipient_name: 'Sarah K.', recipient_email: 'sarah@exemple.fr', delivery: 'email', send_at: d('2026-09-12T08:00:00Z'), status: 'refunded', refunded_at: d('2026-09-18T09:00:00Z'), refund_amount_cents: 3900, created_at: d('2026-09-12T07:00:00Z') },
  ] as GiftRow[];
}
