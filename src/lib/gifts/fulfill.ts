import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { generateGiftCode } from './code';
import type { GiftRow } from './cards';
import { sendBuyerGiftEmail, sendRecipientGiftEmail } from './emails';

/**
 * Webhook `checkout.session.completed` (metadata.kind = 'gift') : crée la carte, envoie l'email C03 à la destinataire
 * si l'envoi est immédiat, puis la confirmation à l'acheteuse (PDF joint).
 * Idempotent : la session Stripe est unique en base (une relance du webhook ne crée rien de plus).
 * Paiement différé (virement…) : rien tant que Stripe n'a pas confirmé (`async_payment_succeeded`).
 * Filet de sécurité : un email qui n'est pas parti (destinataire ou acheteuse) est repris par la tâche des 10 minutes.
 */
export async function fulfillGiftCheckout(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<{ ok: true; code: string } | { ok: false; reason: string }> {
  if (session.payment_status !== 'paid') return { ok: false, reason: `paiement ${session.payment_status}` };
  const { data: existing } = await admin.from('gift_cards').select('code').eq('stripe_checkout_session_id', session.id).maybeSingle();
  if (existing?.code) return { ok: true, code: String(existing.code) };

  const meta = session.metadata ?? {};
  const months = [1, 3, 6, 12].includes(Number(meta.months)) ? Number(meta.months) : 3;
  const buyerEmail = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase();
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  const recipientEmail = (meta.recipient_email || '').trim().toLowerCase() || null;
  const delivery: GiftRow['delivery'] = meta.delivery === 'print' || !recipientEmail ? 'print' : 'email';
  const parsedSendAt = delivery === 'email' && meta.send_at ? new Date(meta.send_at) : new Date();
  const sendAt = Number.isNaN(parsedSendAt.getTime()) ? new Date() : parsedSendAt;
  const immediate = delivery === 'print' || sendAt.getTime() <= Date.now();

  let row: GiftRow | null = null;
  for (let attempt = 0; attempt < 3 && !row; attempt += 1) {
    const code = generateGiftCode();
    const { data, error } = await admin
      .from('gift_cards')
      .insert({
        code,
        months,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        locale: meta.locale === 'es' ? 'es' : 'fr',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
        buyer_name: (meta.from || '').trim() || 'FitMangas',
        buyer_email: buyerEmail,
        buyer_timezone: meta.buyer_timezone || 'Europe/Paris',
        recipient_name: (meta.to || '').trim() || '—',
        recipient_email: recipientEmail,
        message: (meta.message || '').slice(0, 250) || null,
        delivery,
        send_at: sendAt.toISOString(),
        // Envoi par email : toujours « programmée » d'abord (envoyée tout de suite si l'heure est passée,
        // sinon par la tâche des 10 minutes) ; carte à imprimer : remise à l'acheteuse avec sa confirmation.
        status: delivery === 'email' ? 'scheduled' : 'sent',
        expires_at: expires.toISOString(),
      })
      .select('*')
      .single();
    if (!error && data) {
      row = data as GiftRow;
      break;
    }
    const msg = error?.message ?? '';
    if (/stripe_checkout_session_id/.test(msg)) {
      // Webhook reçu deux fois en parallèle : l'autre exécution a déjà créé la carte.
      const { data: again } = await admin.from('gift_cards').select('code').eq('stripe_checkout_session_id', session.id).maybeSingle();
      return again?.code ? { ok: true, code: String(again.code) } : { ok: false, reason: msg };
    }
    if (!/code/.test(msg)) {
      console.error('[gifts] insert', msg);
      return { ok: false, reason: msg || 'insert' };
    }
  }
  if (!row) return { ok: false, reason: 'code' };

  if (immediate && delivery === 'email') {
    const sentAt = await sendScheduledRecipientEmail(admin, row);
    if (sentAt) row = { ...row, status: 'sent', recipient_email_sent_at: sentAt };
  }
  if (await sendBuyerGiftEmail(row)) {
    await admin.from('gift_cards').update({ buyer_email_sent_at: new Date().toISOString() }).eq('id', row.id);
  }
  return { ok: true, code: row.code };
}

/**
 * Envoie l'email C03 d'une carte « programmée » : la carte est d'abord réservée (deux envois simultanés impossibles),
 * puis remise en « programmée » si l'envoi échoue — seulement si personne ne l'a activée entre-temps.
 * Renvoie l'heure d'envoi, ou null.
 */
async function sendScheduledRecipientEmail(admin: SupabaseClient, row: GiftRow): Promise<string | null> {
  if (!row.recipient_email) return null;
  const sentAt = new Date().toISOString();
  const { data: claimed } = await admin
    .from('gift_cards')
    .update({ status: 'sent', recipient_email_sent_at: sentAt })
    .eq('id', row.id)
    .eq('status', 'scheduled')
    .select('id');
  if (!claimed?.length) return null;
  const ok = await sendRecipientGiftEmail(row, admin);
  if (!ok) {
    await admin
      .from('gift_cards')
      .update({ status: 'scheduled', recipient_email_sent_at: null })
      .eq('id', row.id)
      .eq('status', 'sent')
      .eq('recipient_email_sent_at', sentAt);
    return null;
  }
  return sentAt;
}

/** Tâche des 10 minutes : emails programmés arrivés à échéance, puis confirmations d'achat restées en attente. */
export async function processScheduledGiftEmails(admin: SupabaseClient) {
  try {
    const { data, error } = await admin
      .from('gift_cards')
      .select('*')
      .eq('status', 'scheduled')
      .eq('delivery', 'email')
      .lte('send_at', new Date().toISOString())
      .order('send_at', { ascending: true })
      .limit(20);
    if (error) {
      console.error('[gifts] scheduled select', error.message);
      return { skipped: 'tables', sent: 0 };
    }
    let sent = 0;
    for (const raw of data ?? []) {
      if (await sendScheduledRecipientEmail(admin, raw as GiftRow)) sent += 1;
    }

    // Confirmations d'achat non parties (fournisseur d'email indisponible au moment du paiement).
    let buyerRetries = 0;
    const { data: pendingBuyers } = await admin
      .from('gift_cards')
      .select('*')
      .is('buyer_email_sent_at', null)
      .neq('status', 'refunded')
      .gt('amount_cents', 0)
      .lte('created_at', new Date(Date.now() - 5 * 60_000).toISOString())
      .gte('created_at', new Date(Date.now() - 3 * 86_400_000).toISOString())
      .limit(10);
    for (const raw of pendingBuyers ?? []) {
      const card = raw as GiftRow;
      const stamp = new Date().toISOString();
      const { data: claimed } = await admin
        .from('gift_cards')
        .update({ buyer_email_sent_at: stamp })
        .eq('id', card.id)
        .is('buyer_email_sent_at', null)
        .select('id');
      if (!claimed?.length) continue;
      if (await sendBuyerGiftEmail(card)) buyerRetries += 1;
      else await admin.from('gift_cards').update({ buyer_email_sent_at: null }).eq('id', card.id).eq('buyer_email_sent_at', stamp);
    }
    return { sent, buyerRetries };
  } catch (e) {
    console.error('[gifts] scheduled', e);
    return { skipped: 'tables', sent: 0 };
  }
}
