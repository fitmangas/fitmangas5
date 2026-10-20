import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserById = vi.fn();
const upsert = vi.fn(async () => ({ error: null }));
let subscribers: Array<{ email: string }> = [];

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { getUserById } },
    from: vi.fn((table: string) => {
      if (table === 'newsletter_subscriptions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: subscribers, error: null })),
            })),
          })),
        };
      }
      return { upsert };
    }),
  })),
}));

const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn(async (_input: { to: string }) => ({ ok: true, id: 'test', safeMode: 'send' })),
}));
vi.mock('@/lib/email/send', () => ({ sendEmail }));

import { sendPublicationNewsletter } from './newsletter-double-optin';

describe('sendPublicationNewsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'key';
    process.env.NEWSLETTER_FROM_EMAIL = 'alejandra@fitmangas.com';
    subscribers = [{ email: 'member@example.com' }, { email: 'newsletter@example.com' }];
    getUserById.mockResolvedValue({ data: { user: { email: 'member@example.com' } }, error: null });
  });

  it('membre abonnée newsletter → reçoit via dispatcher uniquement', async () => {
    const result = await sendPublicationNewsletter({ articleId: 'a1', title: 'Pilates', slugFr: 'pilates', excludeUserIds: ['u1'] });
    expect(result.targeted).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'newsletter@example.com' }));
  });

  it('newsletter-only → reçoit via sendPublicationNewsletter', async () => {
    const result = await sendPublicationNewsletter({ articleId: 'a1', title: 'Pilates', slugFr: 'pilates' });
    expect(result.targeted).toBe(2);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
