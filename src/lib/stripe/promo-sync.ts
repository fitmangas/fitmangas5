import Stripe from 'stripe';

import type { PromoBenefitType } from '@/lib/promo-codes/types';

export type CreateStripePromoInput = {
  code: string;
  benefitType: PromoBenefitType;
  discountPercent?: number;
  freeMonths?: number;
  maxRedemptions: number | null;
};

export type StripePromoResources = {
  couponId: string;
  promotionCodeId: string;
};

export async function createStripePromoResources(
  stripe: Stripe,
  input: CreateStripePromoInput,
): Promise<StripePromoResources> {
  const code = input.code.trim().toUpperCase();

  let couponParams: Stripe.CouponCreateParams;
  if (input.benefitType === 'free_months') {
    const months = Math.max(1, Math.round(input.freeMonths ?? 1));
    couponParams = {
      name: `FitMangas ${code} — ${months} mois gratuit`,
      percent_off: 100,
      duration: 'repeating',
      duration_in_months: months,
      metadata: {
        fitmangas_benefit_type: 'free_months',
        fitmangas_free_months: String(months),
      },
    };
  } else {
    const percent = Math.min(100, Math.max(0, Math.round(input.discountPercent ?? 0)));
    couponParams = {
      name: `FitMangas ${code} — ${percent} %`,
      percent_off: percent,
      duration: 'once',
      metadata: {
        fitmangas_benefit_type: 'percent',
      },
    };
  }

  const coupon = await stripe.coupons.create(couponParams);

  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    ...(input.maxRedemptions != null ? { max_redemptions: input.maxRedemptions } : {}),
    metadata: {
      fitmangas_promo: 'true',
      fitmangas_benefit_type: input.benefitType,
    },
  });

  return {
    couponId: coupon.id,
    promotionCodeId: promotionCode.id,
  };
}

export async function deactivateStripePromotionCode(stripe: Stripe, promotionCodeId: string): Promise<void> {
  if (!promotionCodeId.trim()) return;
  try {
    await stripe.promotionCodes.update(promotionCodeId, { active: false });
  } catch (e) {
    console.warn('[promo-sync] deactivate promotion code', promotionCodeId, e);
  }
}
