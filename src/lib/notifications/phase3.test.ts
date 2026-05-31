import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dispatchBoutiqueOrderPaid,
  dispatchProductPublished,
  processDigestQueue,
  runCommunityCycles,
  runWeMissYouCycles,
} from './phase3';

function chain(data: unknown[], extras: { count?: number } = {}) {
  const promise = Promise.resolve({ data, count: extras.count ?? data.length, error: null });
  const self = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    in: vi.fn(() => self),
    is: vi.fn(() => self),
    gte: vi.fn(() => self),
    order: vi.fn(() => self),
    limit: vi.fn(() => self),
    maybeSingle: vi.fn(() => promise),
    update: vi.fn(() => self),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };
  return self;
}

function mockClient(tables: Record<string, unknown[]>): SupabaseClient {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) =>
        chain(tables[table] ?? [], opts?.head ? { count: 0 } : {}),
      ),
      update: vi.fn(() => chain([])),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      admin: {
        listUsers: vi.fn(async () => ({ data: { users: tables.authUsers ?? [] }, error: null })),
        getUserById: vi.fn(async () => ({ data: { user: { email: 'client@example.com' } }, error: null })),
      },
    },
  } as unknown as SupabaseClient;
}

const dispatchMock = vi.fn(async () => ({ ok: true as const, notification_log_ids: ['1'] }));

describe('Phase 3 notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('product_published → in-app aux membres, pas email', async () => {
    const client = mockClient({ profiles: [{ id: 'u1' }] });
    await dispatchProductPublished(client, { id: 'p1', name: 'T-shirt' }, { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ channel_hints: ['in_app'] }));
  });

  it('order_paid → email + in-app', async () => {
    const client = mockClient({});
    await dispatchBoutiqueOrderPaid(client, { userId: 'u1', orderRef: 'A1' }, { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'boutique.order_paid', channel_hints: ['in_app', 'email'] }));
  });

  it('birthday → email à 9h fuseau cliente', async () => {
    const client = mockClient({ profiles: [{ id: 'u1', first_name: 'Ana', birth_date: '1990-05-10', display_timezone: 'Europe/Paris' }] });
    await runCommunityCycles(client, { dispatch: dispatchMock, now: new Date('2026-05-10T07:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'community.birthday' }));
  });

  it('we_miss_you_30d → email + in-app', async () => {
    const client = mockClient({ authUsers: [{ id: 'u1', last_sign_in_at: '2026-04-10T08:00:00Z' }] });
    await runWeMissYouCycles(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'community.we_miss_you_30d', channel_hints: ['in_app', 'email'] }));
  });

  it('we_miss_you_60d → email uniquement', async () => {
    const client = mockClient({ authUsers: [{ id: 'u1', last_sign_in_at: '2026-03-10T08:00:00Z' }] });
    await runWeMissYouCycles(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'community.we_miss_you_60d', channel_hints: ['email'] }));
  });

  it('queue vide + daily à 8h → digest enrichi tenté (0 sans Resend)', async () => {
    const client = mockClient({
      notification_preferences: [{ user_id: 'u1', digest_frequency: 'daily', profiles: { display_timezone: 'Europe/Paris' } }],
      enrollments: [],
      blog_articles: [],
      profiles: [{ referral_reward_active: false }],
    });
    const result = await processDigestQueue(client, { now: new Date('2026-05-10T06:00:00Z') });
    expect(result.sent).toBe(0);
  });

  it('weekly + pas lundi → skip', async () => {
    const client = mockClient({ notification_preferences: [{ user_id: 'u1', digest_frequency: 'weekly', profiles: { display_timezone: 'Europe/Paris' } }] });
    const result = await processDigestQueue(client, { now: new Date('2026-05-10T06:00:00Z') });
    expect(result.sent).toBe(0);
  });
});
