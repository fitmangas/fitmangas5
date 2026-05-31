/** Libellés admin / colonne profiles.subscription_type */
export const COURSE_SUBSCRIPTION_TYPE: Record<string, string> = {
  'v-coll': 'visio_collectif',
  'v-ind': 'visio_individuel',
  'n-coll': 'presentiel_collectif',
  'n-ind': 'presentiel_individuel',
};

export function subscriptionTypeFromCourseId(courseId: string | null | undefined): string | null {
  if (!courseId) return null;
  return COURSE_SUBSCRIPTION_TYPE[courseId] ?? null;
}

export type SyncProfileSubscriptionFields = {
  stripeCustomerId?: string | null;
  courseId?: string | null;
  subscriptionStatus?: string;
  lastCheckoutCourseId?: string | null;
  customerTier?: string | null;
};

/** Met à jour profiles après paiement Stripe (webhook / phase2). */
export function buildProfileSubscriptionUpdate(fields: SyncProfileSubscriptionFields): Record<string, unknown> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (fields.stripeCustomerId !== undefined && fields.stripeCustomerId !== null && fields.stripeCustomerId !== '') {
    patch.stripe_customer_id = fields.stripeCustomerId;
  }
  if (fields.lastCheckoutCourseId !== undefined) {
    patch.last_checkout_course_id = fields.lastCheckoutCourseId;
  }
  if (fields.customerTier !== undefined) {
    patch.customer_tier = fields.customerTier;
  }
  if (fields.subscriptionStatus !== undefined) {
    patch.subscription_status = fields.subscriptionStatus;
  }
  const subType = subscriptionTypeFromCourseId(fields.courseId);
  if (subType) {
    patch.subscription_type = subType;
  }

  return patch;
}
