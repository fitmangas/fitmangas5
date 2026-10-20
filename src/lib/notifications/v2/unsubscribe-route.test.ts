import { beforeEach, describe, expect, it, vi } from 'vitest';

const updates: Array<{ table: string; values: Record<string, unknown> }> = [];

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      update: (values: Record<string, unknown>) => ({
        eq: () => {
          updates.push({ table, values });
          return Promise.resolve({ error: null });
        },
      }),
    }),
  }),
}));

describe('désinscription des emails', () => {
  beforeEach(() => {
    updates.length = 0;
    process.env.NOTIF_UNSUB_SECRET = 'secret-de-test';
  });

  it('GET affiche une confirmation sans rien modifier (antivirus de messagerie)', async () => {
    const { signUnsubscribeToken } = await import('./unsubscribe');
    const { GET } = await import('@/app/api/notifications/unsubscribe/route');
    const token = signUnsubscribeToken('user-1');
    const res = await GET(new Request(`https://fitmangas.com/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Me désinscrire');
    expect(updates).toHaveLength(0);
  });

  it('POST « un clic » (RFC 8058) désinscrit', async () => {
    const { signUnsubscribeToken } = await import('./unsubscribe');
    const { POST } = await import('@/app/api/notifications/unsubscribe/route');
    const token = signUnsubscribeToken('user-2');
    const res = await POST(
      new Request(`https://fitmangas.com/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      }),
    );
    expect(res.status).toBe(200);
    expect(updates.map((u) => u.table).sort()).toEqual(['notification_preferences', 'profiles']);
  });

  it('jeton invalide : aucune modification', async () => {
    const { POST } = await import('@/app/api/notifications/unsubscribe/route');
    const res = await POST(
      new Request('https://fitmangas.com/api/notifications/unsubscribe?token=faux.jeton', { method: 'POST', body: 'List-Unsubscribe=One-Click' }),
    );
    expect(res.status).toBe(400);
    expect(updates).toHaveLength(0);
  });
});
