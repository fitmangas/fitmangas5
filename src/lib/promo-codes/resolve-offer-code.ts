import type { SupabaseClient } from '@supabase/supabase-js';

import { PromoCodeValidationError, validatePromoCodeForCheckout } from '@/lib/promo-codes/validate';
import type { ValidatedPromoCode } from '@/lib/promo-codes/types';
import { isValidReferralCode, normalizeReferralCode } from '@/lib/referrals/cookie';

export type ResolvedOfferCode =
  | { kind: 'none' }
  | { kind: 'promo'; promo: ValidatedPromoCode }
  | { kind: 'referral'; code: string }
  | { kind: 'invalid'; message: string };

/**
 * Un seul champ client : d’abord code promo connu, sinon parrainage.
 * Un code promo expiré / inactif reste une erreur (pas un fallback parrainage).
 */
export async function resolveOfferCode(
  admin: SupabaseClient,
  raw: string | null | undefined,
): Promise<ResolvedOfferCode> {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) return { kind: 'none' };

  try {
    const promo = await validatePromoCodeForCheckout(admin, trimmed);
    return { kind: 'promo', promo };
  } catch (e) {
    if (!(e instanceof PromoCodeValidationError)) throw e;
    if (e.message !== 'Code promo inconnu.' && e.message !== 'Code promo invalide.') {
      return { kind: 'invalid', message: e.message };
    }
  }

  const referral = normalizeReferralCode(trimmed);
  if (!isValidReferralCode(referral)) {
    return { kind: 'invalid', message: 'Code promo ou parrainage inconnu.' };
  }

  const { data: referrer, error } = await admin
    .from('profiles')
    .select('id')
    .eq('referral_code', referral)
    .maybeSingle();
  if (error) throw error;
  if (!referrer) {
    return { kind: 'invalid', message: 'Code promo ou parrainage inconnu.' };
  }

  return { kind: 'referral', code: referral };
}

export function parseOfferCodeFromBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const row = body as Record<string, unknown>;
  for (const key of ['offerCode', 'promoCode'] as const) {
    if (typeof row[key] === 'string') {
      const trimmed = row[key].trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

export function parseCheckoutCustomerFields(body: unknown): {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
} {
  if (typeof body !== 'object' || body === null) {
    return { firstName: null, lastName: null, phone: null };
  }
  const row = body as Record<string, unknown>;
  const firstName = typeof row.firstName === 'string' ? row.firstName.trim() : '';
  const lastName = typeof row.lastName === 'string' ? row.lastName.trim() : '';
  const phone = typeof row.phone === 'string' ? row.phone.trim() : '';
  return {
    firstName: firstName || null,
    lastName: lastName || null,
    phone: phone || null,
  };
}
