import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  dispatch: vi.fn(async () => ({ ok: true, notification_log_ids: ['1'] })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock('@/lib/notifications/dispatcher', () => ({
  dispatch: mocks.dispatch,
}));

import { logVisioLockCheckoutInitiated } from './actions';

describe('logVisioLockCheckoutInitiated', () => {
  it('clic CTA → log subscription.checkout_initiated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await logVisioLockCheckoutInitiated('visio_lock_overlay');
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event_type: 'subscription.checkout_initiated',
        user_id: 'u1',
        payload: expect.objectContaining({ source: 'visio_lock_overlay', target_offer: 'v-coll' }),
      }),
    );
  });
});
