import { describe, expect, it } from 'vitest';

import { computeMemberHealth, isRealStripeSubscriptionId } from '@/lib/admin/member-health';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-07-14T12:00:00.000Z');

describe('isRealStripeSubscriptionId', () => {
  it('accepte les ids Stripe réels', () => {
    expect(isRealStripeSubscriptionId('sub_1TqRmXGe7RgAEfvc7DjDe2L7')).toBe(true);
  });

  it('refuse seeds / manuels / vides', () => {
    expect(isRealStripeSubscriptionId('seed_sub_04d0099c')).toBe(false);
    expect(isRealStripeSubscriptionId('manual_test_demo')).toBe(false);
    expect(isRealStripeSubscriptionId(null)).toBe(false);
    expect(isRealStripeSubscriptionId('')).toBe(false);
  });
});

describe('computeMemberHealth', () => {
  it('marque Pas finalisé sans abonnement payant', () => {
    expect(
      computeMemberHealth({
        lastActivityTs: 0,
        accountCreatedTs: now - 9 * DAY,
        now,
        isPayingMember: false,
      }),
    ).toBe('incomplete');
  });

  it('place une payante récente sans activité en Nouveau (pas En attente paiement)', () => {
    expect(
      computeMemberHealth({
        lastActivityTs: 0,
        accountCreatedTs: now - 20 * DAY,
        now,
        isPayingMember: true,
        subscriptionStartedTs: now - 7 * DAY,
      }),
    ).toBe('new');
  });

  it('place une payante 14–30 j sans activité en Sans activité', () => {
    expect(
      computeMemberHealth({
        lastActivityTs: 0,
        accountCreatedTs: now - 40 * DAY,
        now,
        isPayingMember: true,
        subscriptionStartedTs: now - 20 * DAY,
      }),
    ).toBe('watch');
  });

  it('marque Actif si activité récente', () => {
    expect(
      computeMemberHealth({
        lastActivityTs: now - 1 * DAY,
        accountCreatedTs: now - 60 * DAY,
        now,
        isPayingMember: true,
        subscriptionStartedTs: now - 60 * DAY,
      }),
    ).toBe('green');
  });

  it('marque À risque si inactivité > 14 j', () => {
    expect(
      computeMemberHealth({
        lastActivityTs: now - 20 * DAY,
        accountCreatedTs: now - 90 * DAY,
        now,
        isPayingMember: true,
        subscriptionStartedTs: now - 90 * DAY,
      }),
    ).toBe('red');
  });
});
