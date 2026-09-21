import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.fn();
const mockAdmin = { from: mockFrom };

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdmin,
}));

import { saveHealthEntry, getLatestHealthConsent } from './store';

function chain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const m of ['select', 'insert', 'update', 'eq', 'ilike', 'is', 'in', 'order', 'limit']) {
    api[m] = vi.fn(self);
  }
  api.maybeSingle = vi.fn(async () => result);
  api.then = undefined;
  return api;
}

describe('saveHealthEntry — consentement obligatoire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuse si aucun consentement', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'health_consents') {
        return chain({ data: null, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await saveHealthEntry({
      profileId: 'user-1',
      consentId: 'consent-x',
      metrics: {
        sessionsPerWeek: 3,
        sleepHours: 7,
        restingHr: 60,
        hrvMs: null,
        activeMinutes: 100,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toMatch(/consentement/i);
    }
  });

  it('refuse si consentId ne correspond pas', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'health_consents') {
        return chain({
          data: { id: 'consent-real', profile_id: 'user-1', version: 'health-v1', consented_at: new Date().toISOString() },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const result = await saveHealthEntry({
      profileId: 'user-1',
      consentId: 'consent-wrong',
      metrics: {
        sessionsPerWeek: 2,
        sleepHours: 8,
        restingHr: null,
        hrvMs: null,
        activeMinutes: 80,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });
});

describe('getLatestHealthConsent', () => {
  it('retourne null si erreur / vide', async () => {
    mockFrom.mockImplementation(() => chain({ data: null, error: null }));
    expect(await getLatestHealthConsent('u1')).toBeNull();
  });
});
