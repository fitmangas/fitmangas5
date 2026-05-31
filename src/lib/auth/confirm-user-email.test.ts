import { describe, expect, it, vi } from 'vitest';

import { confirmUserEmailIfNeeded } from './confirm-user-email';

describe('confirmUserEmailIfNeeded', () => {
  it('confirms when email not yet confirmed', async () => {
    const updateUserById = vi.fn(async () => ({ data: { user: {} }, error: null }));
    const admin = {
      auth: {
        admin: {
          getUserById: vi.fn(async () => ({
            data: { user: { id: 'u1', email_confirmed_at: null } },
            error: null,
          })),
          updateUserById,
        },
      },
    } as never;

    await confirmUserEmailIfNeeded(admin, 'u1');
    expect(updateUserById).toHaveBeenCalledWith('u1', { email_confirm: true });
  });

  it('skips when already confirmed', async () => {
    const updateUserById = vi.fn();
    const admin = {
      auth: {
        admin: {
          getUserById: vi.fn(async () => ({
            data: { user: { id: 'u1', email_confirmed_at: '2020-01-01T00:00:00Z' } },
            error: null,
          })),
          updateUserById,
        },
      },
    } as never;

    await confirmUserEmailIfNeeded(admin, 'u1');
    expect(updateUserById).not.toHaveBeenCalled();
  });
});
