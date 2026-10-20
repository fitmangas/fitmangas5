import { describe, expect, it } from 'vitest';

import { computeVisioAccessV2, currentVisioFromTier, isDemoAccessUser } from './access-v2';

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

describe('isDemoAccessUser', () => {
  it('reconnaît seulement le compte démo listé', () => {
    expect(isDemoAccessUser('f694a7d9-a460-4574-899e-fa46bb461d3c')).toBe(true);
    expect(isDemoAccessUser('F694A7D9-A460-4574-899E-FA46BB461D3C')).toBe(true);
    expect(isDemoAccessUser('44b98152-eb62-4170-aadf-6abf42cf8219')).toBe(false);
    expect(isDemoAccessUser(null)).toBe(false);
    expect(isDemoAccessUser('')).toBe(false);
  });
});
