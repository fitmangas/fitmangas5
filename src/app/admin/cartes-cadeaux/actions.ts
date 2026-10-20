'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isGiftsEnabled, stripeGiftWritesAllowed } from '@/lib/gifts/flag';
import { generateGiftCode } from '@/lib/gifts/code';
import { createAdminClient } from '@/lib/supabase/admin';
import { A_VALIDER_LOT1, A_VALIDER_LOT4 } from '@/content/a-valider';
import { stripeClient, type GiftRow } from '@/lib/gifts/cards';
import { sendRecipientGiftEmail } from '@/lib/gifts/emails';
import { quoteGiftRefund, refundGift } from '@/lib/gifts/refund';

const GENERIC = A_VALIDER_LOT1.errors.generic.fr;

type Result = { ok: true; code?: string; warning?: string } | { ok: false; message: string };

async function loadCard(cardId: string): Promise<GiftRow | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('gift_cards').select('*').eq('id', cardId).maybeSingle();
  return (data as GiftRow | null) ?? null;
}

/** Renvoie l'email C03 (avec le PDF) à la destinataire. */
export async function resendGiftEmailAction(cardId: string): Promise<Result> {
  await requireAdmin();
  if (!isGiftsEnabled()) return { ok: false, message: A_VALIDER_LOT4.flagOff.fr };
  try {
    const row = await loadCard(cardId);
    if (!row?.recipient_email) return { ok: false, message: 'Pas d’email de destinataire pour cette carte.' };
    if (row.status === 'refunded') return { ok: false, message: 'Carte remboursée.' };
    const admin = createAdminClient();
    const ok = await sendRecipientGiftEmail(row, admin);
    if (!ok) return { ok: false, message: 'Envoi impossible (expéditeur non configuré ?).' };
    // Statut mis à jour seulement si la carte n'a pas changé entre-temps (activation, remboursement).
    await admin
      .from('gift_cards')
      .update({ recipient_email_sent_at: new Date().toISOString(), ...(row.status === 'scheduled' || row.status === 'paid' ? { status: 'sent' } : {}) })
      .eq('id', row.id)
      .eq('status', row.status);
    revalidatePath('/admin/cartes-cadeaux');
    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC };
  }
}

/** Rembourse (intégral ou au prorata, montant recalculé côté serveur) après confirmation explicite. */
export async function refundGiftAction(cardId: string, confirmed: boolean): Promise<Result> {
  await requireAdmin();
  if (!isGiftsEnabled()) return { ok: false, message: A_VALIDER_LOT4.flagOff.fr };
  if (!confirmed) return { ok: false, message: 'Confirmation obligatoire.' };
  if (!stripeGiftWritesAllowed()) return { ok: false, message: A_VALIDER_LOT4.stripeTestOnly.fr };
  const stripe = stripeClient();
  if (!stripe) return { ok: false, message: GENERIC };
  try {
    const row = await loadCard(cardId);
    if (!row) return { ok: false, message: 'Carte introuvable.' };
    const quote = quoteGiftRefund(row);
    if (!quote || quote.amountCents <= 0) return { ok: false, message: 'Rien à rembourser.' };
    const res = await refundGift(createAdminClient(), stripe, row, quote.amountCents);
    if (!res.ok) return res;
    revalidatePath('/admin/cartes-cadeaux');
    return { ok: true, warning: res.warning };
  } catch (e) {
    console.error('[gifts] refund', e instanceof Error ? e.message : e);
    return { ok: false, message: 'Le remboursement Stripe a échoué : rien n’a été modifié.' };
  }
}

/** Carte offerte par FitMangas (montant 0) : email C03 tout de suite, ou à remettre en PDF. */
export async function createManualGiftAction(input: {
  months: 1 | 3 | 6 | 12;
  recipientName: string;
  recipientEmail?: string;
  message?: string;
  locale?: 'fr' | 'es';
}): Promise<Result> {
  const { user } = await requireAdmin();
  if (!isGiftsEnabled()) return { ok: false, message: A_VALIDER_LOT4.flagOff.fr };
  if (![1, 3, 6, 12].includes(input.months)) return { ok: false, message: 'Durée invalide.' };
  const name = input.recipientName.trim();
  if (!name) return { ok: false, message: 'Indique le prénom de la destinataire.' };
  const email = input.recipientEmail?.trim().toLowerCase() || null;
  const admin = createAdminClient();
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  try {
    let row: GiftRow | null = null;
    for (let i = 0; i < 3 && !row; i += 1) {
      const { data, error } = await admin
        .from('gift_cards')
        .insert({
          code: generateGiftCode(),
          months: input.months,
          amount_cents: 0,
          locale: input.locale === 'es' ? 'es' : 'fr',
          buyer_name: 'Alejandra',
          buyer_email: user.email ?? 'admin',
          recipient_name: name,
          recipient_email: email,
          message: input.message?.slice(0, 250) || null,
          delivery: email ? 'email' : 'print',
          send_at: new Date().toISOString(),
          status: 'sent',
          expires_at: expires.toISOString(),
        })
        .select('*')
        .single();
      if (data) row = data as GiftRow;
      else if (error && !/code/.test(error.message)) return { ok: false, message: GENERIC };
    }
    if (!row) return { ok: false, message: GENERIC };
    if (email) {
      const sent = await sendRecipientGiftEmail(row, admin);
      if (sent) await admin.from('gift_cards').update({ recipient_email_sent_at: new Date().toISOString() }).eq('id', row.id);
    }
    revalidatePath('/admin/cartes-cadeaux');
    return { ok: true, code: row.code };
  } catch {
    return { ok: false, message: GENERIC };
  }
}
