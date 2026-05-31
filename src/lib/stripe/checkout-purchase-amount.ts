import { COURSE_PRICE_CENTS, isValidCheckoutCourseId } from '@/lib/checkout-courses';

/** Montant achat en EUR pour analytics (Stripe amount_total ou grille tarifaire). */
export function purchaseAmountEurFromCheckout(params: {
  courseId?: string | null;
  amountTotalCents?: number | null;
}): number | null {
  if (params.amountTotalCents != null && params.amountTotalCents > 0) {
    return Math.round((params.amountTotalCents / 100) * 100) / 100;
  }
  const courseId = params.courseId?.trim();
  if (courseId && isValidCheckoutCourseId(courseId)) {
    const cents = COURSE_PRICE_CENTS[courseId];
    if (cents != null) return cents / 100;
  }
  return null;
}
