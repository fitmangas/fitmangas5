import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStripeCheckoutSession, VISIO_FREE_TRIAL_DAYS } from './create-checkout-session';

function stripeMock() {
  const create = vi.fn().mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.test/session' });
  return {
    stripe: { checkout: { sessions: { create } } },
    create,
  };
}

describe('createStripeCheckoutSession', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: 'https://fitmangas.test',
      STRIPE_PRICE_ID_VISIO_COLLECTIF: 'price_v_coll',
      STRIPE_PRICE_ID_VISIO_INDIVIDUEL: 'price_v_ind',
      STRIPE_PRICE_ID_NANTES_COLLECTIF: 'price_n_coll',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('active 7 jours gratuits et collecte le moyen de paiement pour Visio collectif', async () => {
    const { stripe, create } = stripeMock();

    await createStripeCheckoutSession(stripe as never, {
      userId: 'user_1',
      email: 'client@example.com',
      courseId: 'v-coll',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        payment_method_collection: 'always',
        line_items: [{ price: 'price_v_coll', quantity: 1 }],
        subscription_data: expect.objectContaining({
          trial_period_days: VISIO_FREE_TRIAL_DAYS,
          metadata: expect.objectContaining({ course_id: 'v-coll' }),
        }),
      }),
    );
  });

  it('active aussi les 7 jours gratuits pour Visio individuel', async () => {
    const { stripe, create } = stripeMock();

    await createStripeCheckoutSession(stripe as never, {
      userId: 'user_1',
      email: 'client@example.com',
      courseId: 'v-ind',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        payment_method_collection: 'always',
        line_items: [{ price: 'price_v_ind', quantity: 1 }],
        subscription_data: expect.objectContaining({
          trial_period_days: VISIO_FREE_TRIAL_DAYS,
          metadata: expect.objectContaining({ course_id: 'v-ind' }),
        }),
      }),
    );
  });

  it('ne met pas d’essai gratuit sur les paiements ponctuels Nantes', async () => {
    const { stripe, create } = stripeMock();

    await createStripeCheckoutSession(stripe as never, {
      userId: 'user_1',
      email: 'client@example.com',
      courseId: 'n-coll',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_intent_data: expect.objectContaining({
          metadata: expect.objectContaining({ course_id: 'n-coll' }),
        }),
      }),
    );
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty('subscription_data');
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty('payment_method_collection');
  });
});
