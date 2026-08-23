import { describe, expect, it, vi } from 'vitest';

import { resolveOfferCode } from './resolve-offer-code';

describe('resolveOfferCode', () => {
  it('retourne none si vide', async () => {
    const admin = { from: vi.fn() };
    await expect(resolveOfferCode(admin as never, '  ')).resolves.toEqual({ kind: 'none' });
  });

  it('retourne promo si le code existe', async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'p1',
                code: 'MAMACITA',
                active: true,
                valid_from: '2020-01-01T00:00:00.000Z',
                valid_until: null,
                max_redemptions: null,
                redeemed_count: 0,
                discount_percent: 0,
                metadata: {
                  benefit_type: 'free_months',
                  free_months: 1,
                  stripe_promotion_code_id: 'promo_x',
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const result = await resolveOfferCode(admin as never, 'mamacita');
    expect(result.kind).toBe('promo');
    if (result.kind === 'promo') expect(result.promo.code).toBe('MAMACITA');
  });

  it('retourne referral si code promo inconnu mais parrain trouvé', async () => {
    const promoLookup = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
    const referralLookup = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'user-ref' }, error: null }),
        }),
      }),
    };
    const admin = {
      from: vi.fn((table: string) => (table === 'promo_codes' ? promoLookup : referralLookup)),
    };

    const result = await resolveOfferCode(admin as never, 'MARIE-1234');
    expect(result).toEqual({ kind: 'referral', code: 'MARIE-1234' });
  });

  it('retourne invalid si code promo expiré', async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'p1',
                code: 'OLD',
                active: true,
                valid_from: '2020-01-01T00:00:00.000Z',
                valid_until: '2021-06-01T00:00:00.000Z',
                max_redemptions: null,
                redeemed_count: 0,
                discount_percent: 10,
                metadata: { stripe_promotion_code_id: 'promo_old' },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const result = await resolveOfferCode(admin as never, 'OLD');
    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') expect(result.message).toMatch(/expiré/i);
  });
});
