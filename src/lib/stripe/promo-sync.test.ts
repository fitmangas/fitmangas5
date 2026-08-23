import { describe, expect, it, vi } from 'vitest';

import { createStripePromoResources } from './promo-sync';

describe('createStripePromoResources', () => {
  it('crée un coupon 100 % sur 1 mois pour free_months', async () => {
    const couponsCreate = vi.fn().mockResolvedValue({ id: 'coupon_free_1' });
    const promotionCodesCreate = vi.fn().mockResolvedValue({ id: 'promo_code_free_1' });
    const stripe = {
      coupons: { create: couponsCreate },
      promotionCodes: { create: promotionCodesCreate },
    };

    const result = await createStripePromoResources(stripe as never, {
      code: 'famille1mois',
      benefitType: 'free_months',
      freeMonths: 1,
      maxRedemptions: null,
    });

    expect(result).toEqual({ couponId: 'coupon_free_1', promotionCodeId: 'promo_code_free_1' });
    expect(couponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        percent_off: 100,
        duration: 'repeating',
        duration_in_months: 1,
      }),
    );
    expect(promotionCodesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        coupon: 'coupon_free_1',
        code: 'FAMILLE1MOIS',
      }),
    );
    expect(promotionCodesCreate.mock.calls[0]?.[0]).not.toHaveProperty('max_redemptions');
  });

  it('crée un coupon percent avec max_redemptions', async () => {
    const couponsCreate = vi.fn().mockResolvedValue({ id: 'coupon_pct' });
    const promotionCodesCreate = vi.fn().mockResolvedValue({ id: 'promo_code_pct' });
    const stripe = {
      coupons: { create: couponsCreate },
      promotionCodes: { create: promotionCodesCreate },
    };

    await createStripePromoResources(stripe as never, {
      code: 'fit10',
      benefitType: 'percent',
      discountPercent: 10,
      maxRedemptions: 50,
    });

    expect(couponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        percent_off: 10,
        duration: 'once',
      }),
    );
    expect(promotionCodesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_redemptions: 50,
        code: 'FIT10',
      }),
    );
  });
});
