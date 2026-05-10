import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
  deleteEq: vi.fn(),
  subscriptions: [] as unknown[],
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: mocks.setVapidDetails,
    sendNotification: mocks.sendNotification,
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table !== 'push_subscriptions') {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mocks.subscriptions, error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: mocks.deleteEq,
        }),
      };
    }),
  })),
}));

import { sendPushNotification } from './push';

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';
    mocks.subscriptions = [
      {
        id: 'sub-1',
        endpoint: 'https://push.example/sub-1',
        p256dh: 'p256dh',
        auth: 'auth',
      },
    ];
    mocks.deleteEq.mockReturnValue(Promise.resolve({ error: null }));
    mocks.sendNotification.mockResolvedValue(undefined);
  });

  it('envoie une notification web-push pour une subscription valide', async () => {
    const result = await sendPushNotification('user-1', 'Titre', 'Corps', '/compte');

    expect(result.sent).toBe(1);
    expect(mocks.setVapidDetails).toHaveBeenCalledWith('mailto:alejandra@fitmangas.com', 'public-key', 'private-key');
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: 'https://push.example/sub-1',
        keys: { p256dh: 'p256dh', auth: 'auth' },
      },
      JSON.stringify({ title: 'Titre', body: 'Corps', url: '/compte' }),
    );
  });

  it('supprime une subscription expirée quand web-push retourne 410 Gone', async () => {
    mocks.sendNotification.mockRejectedValueOnce({ statusCode: 410 });

    const result = await sendPushNotification('user-1', 'Titre');

    expect(result.sent).toBe(0);
    expect(mocks.deleteEq).toHaveBeenCalledWith('id', 'sub-1');
  });
});
