import { describe, expect, it } from 'vitest';

import { computeMemberPaymentStatus } from '@/lib/admin/member-payment-status';

const now = Date.parse('2026-07-14T12:00:00.000Z');

describe('computeMemberPaymentStatus', () => {
  it('affiche Période d’essai pour trialing', () => {
    expect(
      computeMemberPaymentStatus({
        subscriptions: [
          {
            status: 'trialing',
            ends_at: '2026-07-21T12:00:00.000Z',
            stripe_subscription_id: 'sub_1TqRmXGe7RgAEfvc7DjDe2L7',
          },
        ],
        stripeCustomerId: 'cus_test',
        profileSubscriptionStatus: 'trialing',
        now,
      }),
    ).toEqual({
      badge: 'trial',
      detail: 'Fin essai 21/07/2026',
    });
  });

  it('affiche Payé pour active', () => {
    expect(
      computeMemberPaymentStatus({
        subscriptions: [
          {
            status: 'active',
            ends_at: null,
            stripe_subscription_id: 'sub_active',
          },
        ],
        stripeCustomerId: 'cus_test',
        profileSubscriptionStatus: 'active',
        now,
      }),
    ).toEqual({ badge: 'paid', detail: null });
  });

  it('priorise Paiement échoué sur active', () => {
    expect(
      computeMemberPaymentStatus({
        subscriptions: [
          {
            status: 'active',
            ends_at: null,
            stripe_subscription_id: 'sub_old',
            created_at: '2026-01-01T00:00:00.000Z',
          },
          {
            status: 'past_due',
            ends_at: null,
            stripe_subscription_id: 'sub_due',
            created_at: '2026-06-01T00:00:00.000Z',
          },
        ],
        stripeCustomerId: 'cus_test',
        profileSubscriptionStatus: 'past_due',
        now,
      }),
    ).toEqual({ badge: 'payment_failed', detail: null });
  });

  it('affiche Annulé avec date de fin d’accès', () => {
    expect(
      computeMemberPaymentStatus({
        subscriptions: [
          {
            status: 'canceled',
            ends_at: '2026-07-20T12:00:00.000Z',
            stripe_subscription_id: 'sub_cancel',
          },
        ],
        stripeCustomerId: 'cus_test',
        profileSubscriptionStatus: 'canceled',
        now,
      }),
    ).toEqual({
      badge: 'canceled',
      detail: "Accès jusqu'au 20/07/2026",
    });
  });

  it('affiche Aucun abonnement sans Stripe ni sub réel', () => {
    expect(
      computeMemberPaymentStatus({
        subscriptions: [
          {
            status: 'active',
            ends_at: null,
            stripe_subscription_id: 'seed_sub_demo',
          },
        ],
        stripeCustomerId: null,
        profileSubscriptionStatus: null,
        now,
      }),
    ).toEqual({ badge: 'none', detail: null });
  });

  it('ignore les seeds et lit le profil incomplet', () => {
    expect(
      computeMemberPaymentStatus({
        subscriptions: [],
        stripeCustomerId: 'cus_incomplete',
        profileSubscriptionStatus: 'incomplete',
        now,
      }),
    ).toEqual({ badge: 'incomplete', detail: null });
  });
});
