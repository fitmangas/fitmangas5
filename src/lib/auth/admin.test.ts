import { beforeEach, describe, expect, it, vi } from 'vitest';

import { canUseAdminViewSwitch, checkIsAdmin } from './admin';

function supabaseWithRole(role: string | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: { role }, error: null })),
        })),
      })),
    })),
  };
}

describe('admin gates', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@fitmangas.com';
  });

  it('checkIsAdmin accepte ADMIN_EMAILS ou profiles.role', async () => {
    await expect(
      checkIsAdmin(supabaseWithRole('member') as never, {
        id: 'u1',
        email: 'admin@fitmangas.com',
      }),
    ).resolves.toEqual({ isAdmin: true, source: 'email' });

    await expect(
      checkIsAdmin(supabaseWithRole('admin') as never, {
        id: 'u2',
        email: 'other@example.com',
      }),
    ).resolves.toEqual({ isAdmin: true, source: 'role' });
  });

  it('canUseAdminViewSwitch exige role admin en base + email autorisé', async () => {
    await expect(
      canUseAdminViewSwitch(supabaseWithRole('admin') as never, {
        id: 'u1',
        email: 'admin@fitmangas.com',
      }),
    ).resolves.toEqual({ canSwitch: true, role: 'admin', emailAllowed: true });

    await expect(
      canUseAdminViewSwitch(supabaseWithRole('member') as never, {
        id: 'u1',
        email: 'admin@fitmangas.com',
      }),
    ).resolves.toMatchObject({ canSwitch: false, role: 'member', emailAllowed: true });

    await expect(
      canUseAdminViewSwitch(supabaseWithRole('admin') as never, {
        id: 'u2',
        email: 'other@example.com',
      }),
    ).resolves.toMatchObject({ canSwitch: false, role: 'admin', emailAllowed: false });
  });
});
