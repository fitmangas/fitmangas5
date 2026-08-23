import { describe, expect, it, vi } from 'vitest';

import { PromoCodeValidationError, validatePromoCodeForCheckout } from './validate';

function mockAdmin(row: Record<string, unknown> | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
  };
}

describe('validatePromoCodeForCheckout', () => {
  const now = new Date('2026-08-14T12:00:00.000Z');

  it('accepte un code percent actif avec Stripe', async () => {
    const admin = mockAdmin({
      id: 'promo-1',
      code: 'FIT10',
      active: true,
      valid_from: '2026-08-01T00:00:00.000Z',
      valid_until: null,
      max_redemptions: 100,
      redeemed_count: 2,
      discount_percent: 10,
      metadata: {
        benefit_type: 'percent',
        stripe_promotion_code_id: 'promo_stripe_1',
      },
    });

    const result = await validatePromoCodeForCheckout(admin as never, 'fit10', now);
    expect(result.code).toBe('FIT10');
    expect(result.benefitType).toBe('percent');
    expect(result.stripePromotionCodeId).toBe('promo_stripe_1');
  });

  it('accepte un code 1 mois gratuit', async () => {
    const admin = mockAdmin({
      id: 'promo-2',
      code: 'FAMILLE1MOIS',
      active: true,
      valid_from: '2026-08-01T00:00:00.000Z',
      valid_until: null,
      max_redemptions: null,
      redeemed_count: 0,
      discount_percent: 0,
      metadata: {
        benefit_type: 'free_months',
        free_months: 1,
        stripe_promotion_code_id: 'promo_stripe_2',
      },
    });

    const result = await validatePromoCodeForCheckout(admin as never, 'famille1mois', now);
    expect(result.benefitType).toBe('free_months');
    expect(result.freeMonths).toBe(1);
  });

  it('refuse un code expiré', async () => {
    const admin = mockAdmin({
      id: 'promo-3',
      code: 'OLD',
      active: true,
      valid_from: '2026-01-01T00:00:00.000Z',
      valid_until: '2026-06-01T00:00:00.000Z',
      max_redemptions: null,
      redeemed_count: 0,
      discount_percent: 10,
      metadata: { stripe_promotion_code_id: 'promo_stripe_3' },
    });

    await expect(validatePromoCodeForCheckout(admin as never, 'OLD', now)).rejects.toBeInstanceOf(
      PromoCodeValidationError,
    );
  });

  it('refuse un code sans lien Stripe', async () => {
    const admin = mockAdmin({
      id: 'promo-4',
      code: 'NOSTRIPE',
      active: true,
      valid_from: '2026-08-01T00:00:00.000Z',
      valid_until: null,
      max_redemptions: null,
      redeemed_count: 0,
      discount_percent: 10,
      metadata: {},
    });

    await expect(validatePromoCodeForCheckout(admin as never, 'NOSTRIPE', now)).rejects.toThrow(
      'non synchronisé avec Stripe',
    );
  });
});
