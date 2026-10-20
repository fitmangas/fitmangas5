import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePostLoginPath } from './post-login-redirect';

const cookieDelete = vi.fn();
const cookieHas = vi.fn(() => true);

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    has: cookieHas,
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
    cookieDelete.mockReset();
    cookieHas.mockReset().mockReturnValue(true);
  });

  it('envoie un admin vers /admin et efface le cookie démo legacy', async () => {
    const path = await resolvePostLoginPath({} as never, {
      id: 'u1',
      email: 'admin@fitmangas.com',
    });
    expect(path).toBe('/admin');
    expect(cookieDelete).toHaveBeenCalledWith('fm_demo_client');
  });

  it('admin déjà connectée qui ouvre /connexion : pas d’erreur 500 si Next refuse de modifier le cookie', async () => {
    cookieDelete.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
    });
    await expect(resolvePostLoginPath({} as never, { id: 'u1', email: 'admin@fitmangas.com' })).resolves.toBe('/admin');
  });

  it('ne touche à rien quand le cookie démo est absent', async () => {
    cookieHas.mockReturnValue(false);
    await expect(resolvePostLoginPath({} as never, { id: 'u1', email: 'admin@fitmangas.com' })).resolves.toBe('/admin');
    expect(cookieDelete).not.toHaveBeenCalled();
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
