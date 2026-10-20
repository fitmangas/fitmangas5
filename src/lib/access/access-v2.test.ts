import { describe, expect, it } from 'vitest';

import { computeVisioAccessV2, currentVisioFromTier } from './access-v2';

const now = Date.parse('2026-10-19T12:00:00Z');

describe('computeVisioAccessV2', () => {
  it('accorde l’accès pour un abonnement live actif', () => {
    expect(
      computeVisioAccessV2(
        [{ status: 'active', ends_at: null, stripe_subscription_id: 'sub_live123', livemode: true }],
        now,
      ).visio,
    ).toBe(true);
  });

  it('accorde l’accès pour un essai non expiré', () => {
    expect(
      computeVisioAccessV2(
        [{ status: 'trialing', ends_at: '2026-10-26T00:00:00Z', stripe_subscription_id: 'sub_trial', livemode: true }],
        now,
      ).visio,
    ).toBe(true);
  });

  it('refuse un id seed / manuel', () => {
    expect(
      computeVisioAccessV2([{ status: 'active', ends_at: null, stripe_subscription_id: 'seed_abc' }], now).visio,
    ).toBe(false);
  });

  it('refuse livemode false', () => {
    expect(
      computeVisioAccessV2(
        [{ status: 'active', ends_at: null, stripe_subscription_id: 'sub_test', livemode: false }],
        now,
      ).visio,
    ).toBe(false);
  });

  it('refuse un abonnement annulé ou expiré', () => {
    expect(
      computeVisioAccessV2(
        [{ status: 'canceled', ends_at: null, stripe_subscription_id: 'sub_x', livemode: true }],
        now,
      ).visio,
    ).toBe(false);
    expect(
      computeVisioAccessV2(
        [{ status: 'active', ends_at: '2026-10-01T00:00:00Z', stripe_subscription_id: 'sub_old', livemode: true }],
        now,
      ).visio,
    ).toBe(false);
  });
});

describe('currentVisioFromTier', () => {
  it('suit le tier actuel', () => {
    expect(currentVisioFromTier('online_group_monthly')).toBe(true);
    expect(currentVisioFromTier(null)).toBe(false);
  });
});

describe('computeVisioAccessV2 — formule', () => {
  it('ignore un abonnement présentiel', () => {
    const r = computeVisioAccessV2([{ status: 'active', ends_at: null, stripe_subscription_id: 'sub_123', tier: 'onsite_monthly' }]);
    expect(r.visio).toBe(false);
  });
  it('accepte un abonnement visio collectif', () => {
    const r = computeVisioAccessV2([{ status: 'active', ends_at: null, stripe_subscription_id: 'sub_123', tier: 'online_group_monthly' }]);
    expect(r.visio).toBe(true);
  });
});
