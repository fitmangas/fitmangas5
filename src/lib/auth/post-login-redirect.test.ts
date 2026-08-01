import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePostLoginPath } from './post-login-redirect';

const cookieDelete = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    delete: cookieDelete,
  })),
}));

vi.mock('@/lib/auth/admin', () => ({
  checkIsAdmin: vi.fn(async (_supabase, user: { email?: string | null }) => ({
    isAdmin: user.email === 'admin@fitmangas.com',
    source: 'email' as const,
  })),
}));

describe('resolvePostLoginPath', () => {
  beforeEach(() => {
    cookieDelete.mockClear();
  });

  it('envoie un admin vers /admin et efface le cookie démo legacy', async () => {
    const path = await resolvePostLoginPath({} as never, {
      id: 'u1',
      email: 'admin@fitmangas.com',
    });
    expect(path).toBe('/admin');
    expect(cookieDelete).toHaveBeenCalledWith('fm_demo_client');
  });

  it('envoie un membre vers /compte sans toucher au cookie démo', async () => {
    const path = await resolvePostLoginPath({} as never, {
      id: 'u2',
      email: 'cliente@example.com',
    });
    expect(path).toBe('/compte');
    expect(cookieDelete).not.toHaveBeenCalled();
  });
});
