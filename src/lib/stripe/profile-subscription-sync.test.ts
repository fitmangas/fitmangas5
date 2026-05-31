import { describe, expect, it } from 'vitest';

import { buildProfileSubscriptionUpdate, subscriptionTypeFromCourseId } from './profile-subscription-sync';

describe('profile-subscription-sync', () => {
  it('mappe v-coll vers visio_collectif', () => {
    expect(subscriptionTypeFromCourseId('v-coll')).toBe('visio_collectif');
  });

  it('construit le patch profil après paiement abonnement', () => {
    const patch = buildProfileSubscriptionUpdate({
      stripeCustomerId: 'cus_123',
      courseId: 'v-coll',
      subscriptionStatus: 'active',
      lastCheckoutCourseId: 'v-coll',
      customerTier: 'online_group_monthly',
    });
    expect(patch).toMatchObject({
      stripe_customer_id: 'cus_123',
      subscription_status: 'active',
      subscription_type: 'visio_collectif',
      last_checkout_course_id: 'v-coll',
      customer_tier: 'online_group_monthly',
    });
    expect(patch.updated_at).toBeTruthy();
  });

  it('n’écrase pas stripe_customer_id avec null', () => {
    const patch = buildProfileSubscriptionUpdate({
      stripeCustomerId: null,
      subscriptionStatus: 'active',
    });
    expect(patch).not.toHaveProperty('stripe_customer_id');
  });
});
