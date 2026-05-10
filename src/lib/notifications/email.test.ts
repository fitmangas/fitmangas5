import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  getUserById: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mocks.send,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mocks.maybeSingle,
        }),
      }),
    })),
    auth: {
      admin: {
        getUserById: mocks.getUserById,
      },
    },
  })),
}));

import { sendDispatcherEmail } from './email';

describe('sendDispatcherEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'resend-key';
    process.env.NEWSLETTER_FROM_EMAIL = 'alejandra@fitmangas.com';
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: { email: 'client@example.com' } }, error: null });
    mocks.send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  it('appelle Resend avec from = NEWSLETTER_FROM_EMAIL', async () => {
    await sendDispatcherEmail({
      toProfileId: 'user-1',
      event_type: 'course.live.reminder',
      payload: { title: 'Cours', body: 'Dans 10 minutes' },
      locale: 'fr',
    });

    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'alejandra@fitmangas.com',
        to: 'client@example.com',
        subject: 'Cours',
      }),
    );
  });

  it('sans RESEND_API_KEY → warning, pas de crash', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    delete process.env.RESEND_API_KEY;

    await expect(
      sendDispatcherEmail({
        toProfileId: 'user-1',
        event_type: 'course.live.reminder',
        payload: { title: 'Cours' },
        locale: 'fr',
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
