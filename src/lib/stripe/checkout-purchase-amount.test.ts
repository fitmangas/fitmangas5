import { describe, expect, it } from 'vitest';

import { purchaseAmountEurFromCheckout } from './checkout-purchase-amount';

describe('purchaseAmountEurFromCheckout', () => {
  it('utilise amount_total Stripe en priorité', () => {
    expect(purchaseAmountEurFromCheckout({ courseId: 'v-coll', amountTotalCents: 3900 })).toBe(39);
  });

  it('retombe sur la grille tarifaire', () => {
    expect(purchaseAmountEurFromCheckout({ courseId: 'v-ind', amountTotalCents: null })).toBe(269);
    expect(purchaseAmountEurFromCheckout({ courseId: 'n-coll' })).toBe(10);
  });
});
