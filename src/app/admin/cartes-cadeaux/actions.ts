'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isGiftsEnabled, stripeGiftWritesAllowed } from '@/lib/gifts/flag';
import { generateGiftCode } from '@/lib/gifts/code';
import { createAdminClient } from '@/lib/supabase/admin';
import { A_VALIDER_LOT1, A_VALIDER_LOT4 } from '@/content/a-valider';
import { sendRecipientGiftEmail } from '@/lib/gifts/fulfill';
import { getEmailPublicBaseUrl } from '@/lib/email/base-template';

const GENERIC = A_VALIDER_LOT1.errors.generic.fr;

export async function resendGiftEmailAction(cardId: string) {
  await requireAdmin();
  if (!isGiftsEnabled()) return { ok: false as const, message: A_VALIDER_LOT4.flagOff.fr };
  const admin = createAdminClient();
  try {
    const { data } = await admin.from('gift_cards').select('*').eq('id', cardId).maybeSingle();
    if (!data?.recipient_email) return { ok: false as const, message: GENERIC };
    const activate = `${getEmailPublicBaseUrl()}/offrir/activer?code=${encodeURIComponent(String(data.code))}`;
    await sendRecipientGiftEmail(
      String(data.recipient_email),
      String(data.recipient_name),
      String(data.buyer_name),
      String(data.code),
      activate,
      String(data.message ?? ''),
    );
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: GENERIC };
  }
}

export async function refundGiftAction(cardId: string, confirmed: boolean) {
  await requireAdmin();
  if (!isGiftsEnabled()) return { ok: false as const, message: A_VALIDER_LOT4.flagOff.fr };
  if (!confirmed) return { ok: false as const, message: 'Confirmation obligatoire.' };
  if (!stripeGiftWritesAllowed()) return { ok: false as const, message: A_VALIDER_LOT4.stripeTestOnly.fr };
  console.info('[gifts] refund demandé', cardId);
  return { ok: false as const, message: 'Remboursement Stripe à lancer après GO (test).' };
}

export async function createManualGiftAction(input: { months: 1 | 3 | 6 | 12; recipientName: string; recipientEmail?: string }) {
  await requireAdmin();
  if (!isGiftsEnabled()) return { ok: false as const, message: A_VALIDER_LOT4.flagOff.fr };
  const admin = createAdminClient();
  const code = generateGiftCode();
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  try {
    const { error } = await admin.from('gift_cards').insert({
      code,
      months: input.months,
      amount_cents: 0,
      buyer_name: 'FitMangas',
      buyer_email: 'alejandra@fitmangas.com',
      recipient_name: input.recipientName,
      recipient_email: input.recipientEmail ?? null,
      delivery: 'email',
      status: 'sent',
      expires_at: expires.toISOString(),
    });
    if (error) return { ok: false as const, message: GENERIC };
    return { ok: true as const, code };
  } catch {
    return { ok: false as const, message: GENERIC };
  }
}
