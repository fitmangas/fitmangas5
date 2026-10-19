import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { sendEmail } from '@/lib/email/send';
import { wrapResendEmailV2, outlookButton, getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { generateGiftCode } from './code';

const FROM = () => process.env.NEWSLETTER_FROM_EMAIL?.trim();

export async function fulfillGiftCheckout(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<{ ok: true; code: string } | { ok: false; reason: string }> {
  const meta = session.metadata ?? {};
  const months = Number(meta.months || 3);
  const buyerEmail = session.customer_email || session.customer_details?.email || '';
  const code = generateGiftCode();
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  const sendAt = meta.send_at ? new Date(meta.send_at) : new Date();
  const delivery = meta.delivery === 'print' ? 'print' : 'email';
  const immediateSend = delivery === 'print' || sendAt.getTime() <= Date.now();

  try {
    const { error } = await admin.from('gift_cards').insert({
      code,
      months,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      buyer_name: meta.from || 'Acheteuse',
      buyer_email: buyerEmail,
      buyer_timezone: meta.buyer_timezone || 'Europe/Paris',
      recipient_name: meta.to || 'Destinataire',
      recipient_email: meta.recipient_email || null,
      message: (meta.message || '').slice(0, 250),
      delivery,
      send_at: sendAt.toISOString(),
      status: immediateSend ? 'sent' : 'scheduled',
      expires_at: expires.toISOString(),
      recipient_email_sent_at: immediateSend && delivery === 'email' ? new Date().toISOString() : null,
      buyer_email_sent_at: new Date().toISOString(),
    });
    if (error) {
      console.error('[gifts] insert', error.message);
      return { ok: false, reason: error.message };
    }
  } catch (e) {
    console.error('[gifts] insert', e);
    return { ok: false, reason: 'tables' };
  }

  const base = getEmailPublicBaseUrl();
  const activate = `${base}/offrir/activer?code=${encodeURIComponent(code)}`;
  const from = FROM();
  if (from && buyerEmail) {
    await sendEmail({
      from,
      to: buyerEmail,
      subject: 'Ta carte cadeau FitMangas',
      html: wrapResendEmailV2({
        innerHtml: `<p style="margin:0 0 16px;">Voici le code : <strong>${code}</strong></p>${outlookButton('Voir la carte', `${base}/api/gifts/pdf/${session.id}`)}`,
        locale: 'fr',
        kicker: 'Carte cadeau',
        headline: 'Merci pour ton cadeau',
        showPreferencesLink: false,
      }),
    });
  }
  if (from && immediateSend && delivery === 'email' && meta.recipient_email) {
    await sendRecipientGiftEmail(meta.recipient_email, meta.to || '', meta.from || '', code, activate, meta.message || '');
  }
  return { ok: true, code };
}

export async function sendRecipientGiftEmail(
  to: string,
  recipientName: string,
  buyerName: string,
  code: string,
  activateUrl: string,
  message: string,
) {
  const from = FROM();
  if (!from) return;
  const inner = `<p style="margin:0 0 12px;">${recipientName}, ${buyerName} t’offre FitMangas.</p>
    ${message ? `<p style="margin:0 0 16px;font-style:italic;">« ${message} »</p>` : ''}
    <p style="margin:0 0 16px;">Code : <strong>${code}</strong></p>
    ${outlookButton('Activer mon cadeau', activateUrl)}`;
  await sendEmail({
    from,
    to,
    subject: `${buyerName} t’offre FitMangas`,
    html: wrapResendEmailV2({
      innerHtml: inner,
      locale: 'fr',
      kicker: 'Un cadeau pour toi',
      headline: `${recipientName}, ton cadeau t’attend`,
      showPreferencesLink: false,
    }),
  });
}

export async function processScheduledGiftEmails(admin: SupabaseClient) {
  try {
    const { data, error } = await admin
      .from('gift_cards')
      .select('id, code, recipient_email, recipient_name, buyer_name, message, send_at')
      .eq('status', 'scheduled')
      .eq('delivery', 'email')
      .lte('send_at', new Date().toISOString())
      .limit(20);
    if (error) {
      console.error('[gifts] scheduled select', error.message);
      return { skipped: 'tables', sent: 0 };
    }
    const base = getEmailPublicBaseUrl();
    let sent = 0;
    for (const row of data ?? []) {
      if (!row.recipient_email) continue;
      const activate = `${base}/offrir/activer?code=${encodeURIComponent(String(row.code))}`;
      await sendRecipientGiftEmail(
        String(row.recipient_email),
        String(row.recipient_name),
        String(row.buyer_name),
        String(row.code),
        activate,
        String(row.message ?? ''),
      );
      await admin
        .from('gift_cards')
        .update({ status: 'sent', recipient_email_sent_at: new Date().toISOString() })
        .eq('id', row.id);
      sent += 1;
    }
    return { sent };
  } catch (e) {
    console.error('[gifts] scheduled', e);
    return { skipped: 'tables', sent: 0 };
  }
}
