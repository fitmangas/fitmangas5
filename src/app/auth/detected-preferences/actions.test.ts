import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
let profile = {
  display_timezone_manual_locked: false,
  display_timezone: 'Europe/Paris',
};
let updatePayload: Record<string, unknown> | null = null;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { updateDetectedTimezoneOnLogin } from './actions';

describe('updateDetectedTimezoneOnLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePayload = null;
    profile = { display_timezone_manual_locked: false, display_timezone: 'Europe/Paris' };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table !== 'profiles') throw new Error(table);
      return {
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: profile, error: null }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          updatePayload = payload;
          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        },
      };
    });
  });

  it('timezone_manual_override = true → pas d’écrasement auto au login', async () => {
    profile = { display_timezone_manual_locked: true, display_timezone: 'Europe/Paris' };

    const result = await updateDetectedTimezoneOnLogin('America/Mexico_City');

    expect(result).toEqual({ updated: false, reason: 'manual_locked' });
    expect(updatePayload).toBeNull();
  });

  it('timezone_manual_override = false → mise à jour auto au login', async () => {
    const result = await updateDetectedTimezoneOnLogin('America/Mexico_City');

    expect(result).toEqual({ updated: true });
    expect(updatePayload).toEqual({ display_timezone: 'America/Mexico_City' });
  });
});
