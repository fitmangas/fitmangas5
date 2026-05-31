import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePostLoginPath } from './post-login-redirect';

const clearDemoClientModeCookie = vi.fn(async () => {});

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    delete: clearDemoClientModeCookie,
  })),
}));

vi.mock('@/lib/demo-client-mode', () => ({
  DEMO_CLIENT_COOKIE: 'fm_demo_client',
}));

vi.mock('@/lib/auth/admin', () => ({
  checkIsAdmin: vi.fn(async (_supabase, user: { email?: string | null }) => ({
    isAdmin: user.email === 'admin@fitmangas.com',
    source: 'email' as const,
  })),
}));

describe('resolvePostLoginPath', () => {
  beforeEach(() => {
    clearDemoClientModeCookie.mockClear();
  });

  it('envoie un admin vers /admin et efface le cookie démo', async () => {
    const path = await resolvePostLoginPath({} as never, {
      id: 'u1',
      email: 'admin@fitmangas.com',
    });
    expect(path).toBe('/admin');
    expect(clearDemoClientModeCookie).toHaveBeenCalled();
  });

  it('envoie un membre vers /compte sans toucher au cookie démo', async () => {
    const path = await resolvePostLoginPath({} as never, {
      id: 'u2',
      email: 'cliente@example.com',
    });
    expect(path).toBe('/compte');
    expect(clearDemoClientModeCookie).not.toHaveBeenCalled();
  });
});
