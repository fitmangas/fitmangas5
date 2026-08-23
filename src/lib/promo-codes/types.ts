export type PromoBenefitType = 'percent' | 'free_months';

export type PromoMetadata = {
  benefit_type: PromoBenefitType;
  free_months?: number | null;
  stripe_coupon_id?: string | null;
  stripe_promotion_code_id?: string | null;
};

export type ValidatedPromoCode = {
  id: string;
  code: string;
  benefitType: PromoBenefitType;
  discountPercent: number;
  freeMonths: number | null;
  stripePromotionCodeId: string;
};

export function parsePromoMetadata(raw: unknown): PromoMetadata {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { benefit_type: 'percent' };
  }
  const row = raw as Record<string, unknown>;
  const benefitType = row.benefit_type === 'free_months' ? 'free_months' : 'percent';
  const freeMonthsRaw = row.free_months;
  const freeMonths =
    typeof freeMonthsRaw === 'number' && Number.isFinite(freeMonthsRaw) && freeMonthsRaw > 0
      ? Math.round(freeMonthsRaw)
      : null;
  return {
    benefit_type: benefitType,
    free_months: freeMonths,
    stripe_coupon_id: typeof row.stripe_coupon_id === 'string' ? row.stripe_coupon_id : null,
    stripe_promotion_code_id:
      typeof row.stripe_promotion_code_id === 'string' ? row.stripe_promotion_code_id : null,
  };
}

export function formatPromoBenefitLabel(meta: PromoMetadata, discountPercent: number): string {
  if (meta.benefit_type === 'free_months') {
    const months = meta.free_months ?? 1;
    return months === 1 ? '1 mois gratuit' : `${months} mois gratuits`;
  }
  return `${Number(discountPercent)} %`;
}
