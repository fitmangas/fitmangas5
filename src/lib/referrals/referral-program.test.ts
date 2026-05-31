import { describe, expect, it } from 'vitest';

import {
  referredCheckoutQualifiesForProgram,
  referredProfileQualifies,
  resolveReferrerReferralProgram,
} from '@/lib/referrals/referral-program';

describe('referral-program', () => {
  it('parraine v-coll compte filleule v-ind active', () => {
    expect(
      referredProfileQualifies('visio_collectif', {
        subscription_type: 'visio_individuel',
        subscription_status: 'active',
        last_checkout_course_id: 'v-ind',
      }),
    ).toBe(true);
  });

  it('parraine v-ind ne compte pas filleule v-coll seule', () => {
    expect(
      referredProfileQualifies('visio_individuel', {
        subscription_type: 'visio_collectif',
        subscription_status: 'active',
        last_checkout_course_id: 'v-coll',
      }),
    ).toBe(false);
  });

  it('parraine v-ind compte filleule v-ind', () => {
    expect(
      referredProfileQualifies('visio_individuel', {
        subscription_type: 'online_individual_monthly',
        subscription_status: 'trialing',
        last_checkout_course_id: 'v-ind',
      }),
    ).toBe(true);
  });

  it('présentiel → programme presentiel', () => {
    expect(
      resolveReferrerReferralProgram({
        last_checkout_course_id: 'n-coll',
        subscription_type: 'presentiel_collectif',
      }),
    ).toBe('presentiel');
  });

  it('checkout présentiel ne qualifie pas', () => {
    expect(referredCheckoutQualifiesForProgram('visio_collectif', 'n-coll')).toBe(false);
    expect(referredCheckoutQualifiesForProgram('visio_collectif', 'v-coll')).toBe(true);
  });
});
