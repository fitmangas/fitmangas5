import { describe, expect, it } from 'vitest';

import { mapStripeStatusToSupabaseStatus } from '@/lib/stripe/subscription-status-sync';

describe('mapStripeStatusToSupabaseStatus', () => {
  it('conserve les statuts supportés par l’enum Supabase', () => {
    expect(mapStripeStatusToSupabaseStatus('active')).toBe('active');
    expect(mapStripeStatusToSupabaseStatus('trialing')).toBe('trialing');
    expect(mapStripeStatusToSupabaseStatus('past_due')).toBe('past_due');
    expect(mapStripeStatusToSupabaseStatus('canceled')).toBe('canceled');
    expect(mapStripeStatusToSupabaseStatus('paused')).toBe('paused');
  });

  it('rabatte unpaid vers past_due pour garder le badge paiement échoué', () => {
    expect(mapStripeStatusToSupabaseStatus('unpaid')).toBe('past_due');
  });

  it('rabatte les statuts checkout non finalisés sans migration', () => {
    expect(mapStripeStatusToSupabaseStatus('incomplete')).toBe('paused');
    expect(mapStripeStatusToSupabaseStatus('incomplete_expired')).toBe('canceled');
  });
});
