import type { SupabaseClient } from '@supabase/supabase-js';

import { parsePromoMetadata, type ValidatedPromoCode } from '@/lib/promo-codes/types';

export class PromoCodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromoCodeValidationError';
  }
}

export async function validatePromoCodeForCheckout(
  admin: SupabaseClient,
  rawCode: string,
  now: Date = new Date(),
): Promise<ValidatedPromoCode> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 2) {
    throw new PromoCodeValidationError('Code promo invalide.');
  }

  const { data: row, error } = await admin.from('promo_codes').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  if (!row) {
    throw new PromoCodeValidationError('Code promo inconnu.');
  }

  if (!row.active) {
    throw new PromoCodeValidationError('Ce code promo n’est plus actif.');
  }

  const validFrom = new Date(String(row.valid_from));
  if (Number.isNaN(validFrom.getTime()) || now < validFrom) {
    throw new PromoCodeValidationError('Ce code promo n’est pas encore valide.');
  }

  if (row.valid_until) {
    const validUntil = new Date(String(row.valid_until));
    if (!Number.isNaN(validUntil.getTime()) && now > validUntil) {
      throw new PromoCodeValidationError('Ce code promo a expiré.');
    }
  }

  const max = row.max_redemptions as number | null;
  const redeemed = Number(row.redeemed_count ?? 0);
  if (max != null && redeemed >= max) {
    throw new PromoCodeValidationError('Ce code promo a atteint sa limite d’utilisations.');
  }

  const meta = parsePromoMetadata(row.metadata);
  const stripePromotionCodeId = meta.stripe_promotion_code_id?.trim();
  if (!stripePromotionCodeId) {
    throw new PromoCodeValidationError('Code promo non synchronisé avec Stripe — contacte l’admin.');
  }

  return {
    id: String(row.id),
    code: String(row.code),
    benefitType: meta.benefit_type,
    discountPercent: Number(row.discount_percent ?? 0),
    freeMonths: meta.free_months ?? null,
    stripePromotionCodeId,
  };
}
