import type { SupabaseClient } from '@supabase/supabase-js';

import { resolveOfferCode, type ResolvedOfferCode } from '@/lib/promo-codes/resolve-offer-code';
import { isGiftsEnabled } from './flag';
import { isGiftCodeFormat, normalizeGiftCode } from './code';

export type ResolvedCode =
  | ResolvedOfferCode
  | {
      kind: 'gift';
      code: string;
      months: number;
      recipientName: string;
      status: string;
      cardId: string;
    };

/** Cadeau → activation, sinon promo, sinon parrainage. */
export async function resolveCode(admin: SupabaseClient, raw: string | null | undefined): Promise<ResolvedCode> {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) return { kind: 'none' };

  if (isGiftsEnabled() && isGiftCodeFormat(trimmed)) {
    try {
      const { data } = await admin
        .from('gift_cards')
        .select('id, code, months, recipient_name, status, expires_at')
        .eq('code', normalizeGiftCode(trimmed))
        .maybeSingle();
      if (data?.id) {
        return {
          kind: 'gift',
          code: String(data.code),
          months: Number(data.months),
          recipientName: String(data.recipient_name ?? ''),
          status: String(data.status),
          cardId: String(data.id),
        };
      }
    } catch (e) {
      console.error('[gifts] resolveCode', e);
    }
  }

  return resolveOfferCode(admin, raw);
}
