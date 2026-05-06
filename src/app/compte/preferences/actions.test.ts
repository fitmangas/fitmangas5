import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockGetUser = vi.fn();
let profileExisting: {
  marketing_email_opt_in: boolean;
  display_timezone: string;
} = {
  marketing_email_opt_in: false,
  display_timezone: 'Europe/Paris',
};

let lastNotificationUpdate: Record<string, unknown> | null = null;
let lastProfileUpdate: Record<string, unknown> | null = null;

const rpcMock = vi.fn();
const mockFrom = vi.fn();

/** Ordre des effets : 'rpc' puis 'update' notification_preferences */
let notifySequence: string[] = [];

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: rpcMock,
    from: mockFrom,
  })),
}));

import { revalidatePath } from 'next/cache';

import {
  updateNotificationPreferences,
  updateProfilePreferences,
} from './actions';

describe('updateNotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastNotificationUpdate = null;
    lastProfileUpdate = null;
    notifySequence = [];
    profileExisting = { marketing_email_opt_in: false, display_timezone: 'Europe/Paris' };
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    rpcMock.mockImplementation(async (fnName: string) => {
      notifySequence.push('rpc');
      expect(fnName).toBe('ensure_notification_prefs_row');
      return { data: null, error: null };
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'notification_preferences') {
        return {
          update: (payload: Record<string, unknown>) => {
            notifySequence.push('update');
            lastNotificationUpdate = payload;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { ...profileExisting },
                error: null,
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            lastProfileUpdate = payload;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
  });

  it('refuse si pas user authentifié', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(updateNotificationPreferences({ silence_mode_enabled: true })).rejects.toThrow(
      'Unauthorized',
    );
    expect(rpcMock).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('ne appelle pas rpc ni from si partial notification vide', async () => {
    await updateNotificationPreferences({});
    expect(rpcMock).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('appelle ensure_notification_prefs_row avant update notification_preferences', async () => {
    await updateNotificationPreferences({
      courses_inapp_enabled: false,
      digest_frequency: 'weekly',
    });

    expect(notifySequence).toEqual(['rpc', 'update']);
    expect(rpcMock).toHaveBeenCalledWith('ensure_notification_prefs_row', { p_user_id: 'user-1' });
    expect(lastNotificationUpdate).toMatchObject({
      courses_inapp_enabled: false,
      digest_frequency: 'weekly',
      updated_at: expect.any(String),
    });
    expect(revalidatePath).toHaveBeenCalledWith('/compte/preferences');
  });
});

describe('updateProfilePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastNotificationUpdate = null;
    lastProfileUpdate = null;
    notifySequence = [];
    profileExisting = { marketing_email_opt_in: false, display_timezone: 'Europe/Paris' };
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    rpcMock.mockResolvedValue({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'notification_preferences') {
        return {
          update: (payload: Record<string, unknown>) => {
            lastNotificationUpdate = payload;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { ...profileExisting },
                error: null,
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            lastProfileUpdate = payload;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
  });

  it('ne touche pas profiles si partial vide (early return)', async () => {
    await updateProfilePreferences({});

    expect(mockFrom).not.toHaveBeenCalled();
    expect(lastProfileUpdate).toBeNull();
  });

  it('pose display_timezone_manual_locked quand display_timezone change', async () => {
    await updateProfilePreferences({ display_timezone: 'America/New_York' });

    expect(lastProfileUpdate).toMatchObject({
      display_timezone: 'America/New_York',
      display_timezone_manual_locked: true,
    });
  });

  it('ne pose pas display_timezone_manual_locked si fuseau inchangé', async () => {
    await updateProfilePreferences({ display_timezone: 'Europe/Paris' });

    expect(lastProfileUpdate).toEqual({ display_timezone: 'Europe/Paris' });
    expect(lastProfileUpdate).not.toHaveProperty('display_timezone_manual_locked');
  });

  it('pose marketing_email_opt_in_at quand le toggle passe à true', async () => {
    profileExisting = { marketing_email_opt_in: false, display_timezone: 'Europe/Paris' };
    await updateProfilePreferences({ marketing_email_opt_in: true });

    expect(lastProfileUpdate?.marketing_email_opt_in).toBe(true);
    expect(lastProfileUpdate?.marketing_email_opt_in_at).toEqual(expect.any(String));
  });

  it('ne pose pas marketing_email_opt_in_at quand le toggle passe à false', async () => {
    profileExisting = { marketing_email_opt_in: true, display_timezone: 'Europe/Paris' };
    await updateProfilePreferences({ marketing_email_opt_in: false });

    expect(lastProfileUpdate).toEqual({ marketing_email_opt_in: false });
    expect(lastProfileUpdate).not.toHaveProperty('marketing_email_opt_in_at');
  });
});
