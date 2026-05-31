import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dispatchCourseCancelledByCoach,
  dispatchPaymentFailed,
  dispatchPresentialPurchased,
  dispatchSubscriptionActivated,
  dispatchSubscriptionCancelled,
  runCourseCycles,
  runOnboardingCycle,
  runWinBackCycle,
} from './phase2';
import type { DispatchResult } from './types';

type TableData = Record<string, unknown[]>;

function filterRows(rows: unknown[], filters: { eq: Record<string, unknown>; in: Record<string, unknown[]> }) {
  return rows.filter((row) => {
    const r = row as Record<string, unknown>;
    for (const [key, value] of Object.entries(filters.eq)) {
      if (r[key] !== value) return false;
    }
    for (const [key, values] of Object.entries(filters.in)) {
      if (!values.includes(r[key] as never)) return false;
    }
    return true;
  });
}

function queryResult(data: unknown[]) {
  const filters = { eq: {} as Record<string, unknown>, in: {} as Record<string, unknown[]> };
  const resolveRows = () => filterRows(data, filters);
  const chain: {
    select: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    not: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lte: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: typeof Promise.prototype.then;
    catch: typeof Promise.prototype.catch;
    finally: typeof Promise.prototype.finally;
  } = {
    select: vi.fn(() => chain),
    in: vi.fn((col: string, vals: unknown[]) => {
      filters.in[col] = vals;
      return chain;
    }),
    eq: vi.fn((col: string, val: unknown) => {
      filters.eq[col] = val;
      return chain;
    }),
    not: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve({ data: resolveRows()[0] ?? null, error: null })),
    then: (onFulfilled, onRejected) => Promise.resolve({ data: resolveRows(), error: null }).then(onFulfilled, onRejected),
    catch: (onRejected) => Promise.resolve({ data: resolveRows(), error: null }).catch(onRejected),
    finally: (onFinally) => Promise.resolve({ data: resolveRows(), error: null }).finally(onFinally),
  };
  return chain;
}

function writeResult() {
  const result = Promise.resolve({ data: null, error: null });
  const chain: {
    eq: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: typeof Promise.prototype.then;
    catch: typeof Promise.prototype.catch;
    finally: typeof Promise.prototype.finally;
  } = {
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn(() => result),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally.bind(result),
  };
  return chain;
}

function clientWith(data: TableData): SupabaseClient {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => queryResult(data[table] ?? [])),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => writeResult()),
    })),
  } as unknown as SupabaseClient;
}

const dispatchMock = vi.fn(async (): Promise<DispatchResult> => ({ ok: true, notification_log_ids: ['log-1'] }));

describe('Phase 2 cycles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('profil créé J+0 → dispatch onboarding.day0', async () => {
    const client = clientWith({});
    await dispatchSubscriptionActivated(client, 'u1', 'v-coll', 'cus_1', 'sub_1', { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ event_type: 'onboarding.day0', user_id: 'u1' }),
    );
  });

  it('profil J+1 → dispatch onboarding.day1', async () => {
    const client = clientWith({
      subscriptions: [{
        user_id: 'u1',
        tier: 'online_group_monthly',
        status: 'active',
        starts_at: '2026-05-09T08:00:00Z',
        profiles: { id: 'u1', display_timezone: 'Europe/Paris' },
      }],
    });
    await runOnboardingCycle(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'onboarding.day1' }));
  });

  it('profil J+3 → dispatch onboarding.day3', async () => {
    const client = clientWith({
      subscriptions: [{ user_id: 'u1', tier: 'online_group_monthly', status: 'active', starts_at: '2026-05-07T08:00:00Z', profiles: { id: 'u1', display_timezone: 'Europe/Paris' } }],
    });
    await runOnboardingCycle(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'onboarding.day3' }));
  });

  it('profil J+7 → dispatch onboarding.day7', async () => {
    const client = clientWith({
      subscriptions: [{ user_id: 'u1', tier: 'online_group_monthly', status: 'active', starts_at: '2026-05-03T08:00:00Z', profiles: { id: 'u1', display_timezone: 'Europe/Paris' } }],
    });
    await runOnboardingCycle(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'onboarding.day7' }));
  });

  it('onboarding déjà envoyé → skip via idempotency dispatcher', async () => {
    dispatchMock.mockResolvedValueOnce({ ok: true, skipped: 'duplicate' });
    const client = clientWith({
      subscriptions: [{ user_id: 'u1', tier: 'online_group_monthly', status: 'active', starts_at: '2026-05-09T08:00:00Z', profiles: { id: 'u1', display_timezone: 'Europe/Paris' } }],
    });
    await runOnboardingCycle(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ idempotency_key: 'onboarding.day1:u1' }));
  });

  it('payment_failed → dispatch critique', async () => {
    const client = clientWith({});
    const stripe = { billingPortal: { sessions: { create: vi.fn(async () => ({ url: 'https://billing.test' })) } } };
    await dispatchPaymentFailed(client, stripe as never, 'cus_1', 'u1', 'in_1', { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'subscription.payment_failed' }));
  });

  it('subscription.cancelled → notif cliente + notif admin', async () => {
    const client = clientWith({ profiles: [{ id: 'admin-1', role: 'admin' }] });
    await dispatchSubscriptionCancelled(client, 'u1', 'online_group_monthly', '2026-05-10T00:00:00Z', { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledTimes(2);
  });

  it('win_back J+30 → email envoyé 1×/user uniquement', async () => {
    const client = clientWith({
      subscriptions: [{ user_id: 'u1', tier: 'online_group_monthly', status: 'canceled', ends_at: '2026-04-10T08:00:00Z', profiles: { id: 'u1', display_timezone: 'Europe/Paris' } }],
    });
    await runWinBackCycle(client, { dispatch: dispatchMock, now: new Date('2026-05-10T08:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'subscription.win_back_J+30', channel_hints: ['email'] }));
  });

  it('reminder visio J-1 → envoi à 18h fuseau cliente', async () => {
    const client = clientWith({
      enrollments: [{
        user_id: 'u1',
        course_id: 'c1',
        status: 'booked',
        profiles: { id: 'u1', display_timezone: 'Europe/Paris', preferred_locale: 'fr' },
        courses: { id: 'c1', title: 'Live', starts_at: '2026-05-11T17:00:00Z', ends_at: '2026-05-11T18:00:00Z', course_format: 'online', course_category: 'group' },
      }],
    });
    await runCourseCycles(client, { dispatch: dispatchMock, now: new Date('2026-05-10T16:00:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        event_type: 'course.visio.reminder_J-1',
        payload: expect.objectContaining({ joinUrl: 'https://fitmangas.com/live/c1' }),
      }),
    );
  });

  it('cours annulé → dispatch critique tous canaux', async () => {
    const client = clientWith({
      courses: [{ id: 'c1', title: 'Live', starts_at: '2026-05-10T16:00:00Z', course_format: 'online' }],
      enrollments: [{ user_id: 'u1', course_id: 'c1', status: 'booked' }],
    });
    await dispatchCourseCancelledByCoach(client, 'c1', { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'course.visio.cancelled' }));
  });

  it('cours manqué → dispatch uniquement si statut missed (pointage admin)', async () => {
    const client = clientWith({
      enrollments: [{
        user_id: 'u1',
        course_id: 'c1',
        status: 'missed',
        profiles: { id: 'u1', display_timezone: 'Europe/Paris', preferred_locale: 'fr' },
        courses: { id: 'c1', title: 'Live', starts_at: '2026-05-09T17:00:00Z', ends_at: '2026-05-09T18:00:00Z', course_format: 'online', course_category: 'group' },
      }],
      notification_log: [],
    });
    await runCourseCycles(client, { dispatch: dispatchMock, now: new Date('2026-05-10T18:30:00Z') });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'course.visio.missed' }));
  });

  it('inscription booked le lendemain → pas de missed auto', async () => {
    const client = clientWith({
      enrollments: [{
        user_id: 'u1',
        course_id: 'c1',
        status: 'booked',
        profiles: { id: 'u1', display_timezone: 'Europe/Paris', preferred_locale: 'fr' },
        courses: { id: 'c1', title: 'Live', starts_at: '2026-05-09T17:00:00Z', ends_at: '2026-05-09T18:00:00Z', course_format: 'online', course_category: 'group' },
      }],
    });
    await runCourseCycles(client, { dispatch: dispatchMock, now: new Date('2026-05-10T18:30:00Z') });
    expect(dispatchMock).not.toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'course.visio.missed' }));
  });

  it('purchased présentiel → email avec adresse Nantes', async () => {
    const client = clientWith({
      courses: [{ id: 'c1', title: 'Nantes', starts_at: '2026-05-10T16:00:00Z', course_format: 'onsite', course_category: 'group' }],
    });
    await dispatchPresentialPurchased(client, 'u1', 'c1', 'n-coll', { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ event_type: 'course.presential.purchased', payload: expect.objectContaining({ body: 'Adresse : 17 Passage Leroy, 44300 Nantes.' }) }),
    );
  });

  it('cancelled_by_coach présentiel → dispatch critique', async () => {
    const client = clientWith({
      courses: [{ id: 'c1', title: 'Nantes', starts_at: '2026-05-10T16:00:00Z', course_format: 'onsite' }],
      enrollments: [{ user_id: 'u1', course_id: 'c1', status: 'booked' }],
    });
    await dispatchCourseCancelledByCoach(client, 'c1', { dispatch: dispatchMock });
    expect(dispatchMock).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'course.presential.cancelled_by_coach' }));
  });
});
