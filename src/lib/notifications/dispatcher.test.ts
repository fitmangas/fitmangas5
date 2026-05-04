import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DEFAULT_NOTIFICATION_PREFERENCES } from './defaults';
import { dispatch } from './dispatcher';
import type { NotificationPreferencesRow } from './types';

type Scenario =
  | 'default'
  | 'duplicate'
  | 'silence_non_critical'
  | 'silence_critical'
  | 'email_cap'
  | 'community_email_off'
  | 'anonymous';

let scenario: Scenario = 'default';
let prefsOverride: Partial<NotificationPreferencesRow> | null = null;
/** Compteur non lues créées depuis minuit (fuseau profil), pour le mock du cap in-app. */
let unreadTodayCount = 0;

function fullPrefs(): NotificationPreferencesRow {
  const silenceDefault =
    scenario === 'silence_non_critical' || scenario === 'silence_critical';
  return {
    user_id: 'u1',
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    silence_mode_enabled: silenceDefault,
    ...prefsOverride,
  };
}

function createHeadCountChain(count: number) {
  const result = Promise.resolve({ count, error: null });
  const self: {
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    then: typeof Promise.prototype.then;
    catch: typeof Promise.prototype.catch;
    finally: typeof Promise.prototype.finally;
  } = {
    eq: vi.fn(function eqFn() {
      return self;
    }),
    is: vi.fn(function isFn() {
      return self;
    }),
    gte: vi.fn(function gteFn() {
      return self;
    }),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally.bind(result),
  };
  return self;
}

function buildMockSupabase(sharedSlotMap?: Map<string, number>) {
  const insertedLogs: { channel?: string; payload?: Record<string, unknown>; idempotency_key?: string | null }[] =
    [];
  const insertedNotifications: unknown[] = [];
  let emailPlaceholderCalls = 0;

  const slotMap = sharedSlotMap ?? new Map<string, number>();

  const rpc = vi.fn((name: string, params: { p_user_id: string; p_scope_key: string; p_max: number }) => {
    if (name !== 'try_reserve_email_slot') {
      return Promise.reject(new Error(`unexpected rpc ${name}`));
    }
    if (scenario === 'email_cap') {
      return Promise.resolve({ data: false, error: null });
    }
    const key = `${params.p_user_id}:${params.p_scope_key}`;
    const cur = slotMap.get(key) ?? 0;
    if (cur >= params.p_max) {
      return Promise.resolve({ data: false, error: null });
    }
    slotMap.set(key, cur + 1);
    return Promise.resolve({ data: true, error: null });
  });

  const mockFrom = vi.fn((table: string) => {
    if (table === 'notification_log') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_col: string, _val: unknown) => ({
            maybeSingle: vi.fn().mockResolvedValue(
              scenario === 'duplicate'
                ? { data: { id: 'idem-existing' }, error: null }
                : { data: null, error: null },
            ),
          })),
        }),
        insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
          insertedLogs.push(row as { channel?: string; payload?: Record<string, unknown>; idempotency_key?: string | null });
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: `log-${insertedLogs.length}` }, error: null }),
            }),
          };
        }),
      };
    }

    if (table === 'notification_preferences') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: scenario === 'default' && !prefsOverride ? null : fullPrefs(),
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { preferred_locale: 'fr', display_timezone: 'Europe/Paris' },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'user_notifications') {
      return {
        select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === 'exact') {
            return createHeadCountChain(unreadTodayCount);
          }
          return {};
        }),
        insert: vi.fn().mockImplementation((row: unknown) => {
          insertedNotifications.push(row);
          return Promise.resolve({ error: null });
        }),
      };
    }

    throw new Error(`unexpected table ${table}`);
  });

  return {
    client: {
      from: mockFrom,
      rpc,
    } as unknown as import('@supabase/supabase-js').SupabaseClient,
    insertedLogs,
    insertedNotifications,
    rpc,
    get emailPlaceholderCalls() {
      return emailPlaceholderCalls;
    },
    setEmailPlaceholder(fn: () => Promise<void>) {
      emailPlaceholderCalls = 0;
      return vi.fn(async () => {
        emailPlaceholderCalls += 1;
        await fn();
      });
    },
  };
}

describe('dispatch', () => {
  beforeEach(() => {
    scenario = 'default';
    prefsOverride = null;
    unreadTodayCount = 0;
  });

  it('duplicate idempotency_key → skip tout envoi', async () => {
    scenario = 'duplicate';
    const { client } = buildMockSupabase();
    const r = await dispatch(client, {
      event_type: 'community.test',
      user_id: 'u1',
      payload: { title: 't' },
      idempotency_key: 'key-1',
    });
    expect(r).toMatchObject({ ok: true, skipped: 'duplicate' });
  });

  it('compte : subscription.payment_failed force canaux malgré silence + prefs off pour les autres catégories', async () => {
    scenario = 'silence_critical';
    prefsOverride = {
      silence_mode_enabled: true,
      courses_email_enabled: false,
      content_email_enabled: false,
      shop_email_enabled: false,
      community_email_enabled: false,
      courses_inapp_enabled: false,
      content_inapp_enabled: false,
      shop_inapp_enabled: false,
      community_inapp_enabled: false,
    };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'subscription.payment_failed.invoice',
        user_id: 'u1',
        payload: { title: 'Paiement', kind: 'pay', body: 'x' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r.ok).toBe(true);
    if (r.ok && 'skipped' in r) expect(r.skipped).toBeUndefined();
    expect(m.insertedNotifications.length).toBe(1);
    expect(sendEmail).toHaveBeenCalled();
  });

  it('événement non critique + silence → log seulement', async () => {
    scenario = 'silence_non_critical';
    prefsOverride = { silence_mode_enabled: true };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'community.reminder',
        user_id: 'u1',
        payload: { title: 'r' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r).toMatchObject({ ok: true, skipped: 'silence_mode' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(m.insertedNotifications.length).toBe(0);
    expect(m.insertedLogs.some((l) => l.payload?._silence_skip)).toBe(true);
  });

  it('cap email (RPC) atteint → pas email, in-app passe', async () => {
    scenario = 'email_cap';
    unreadTodayCount = 0;
    prefsOverride = {
      silence_mode_enabled: false,
      courses_inapp_enabled: true,
      courses_email_enabled: true,
    };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'course.live.reminder',
        user_id: 'u1',
        payload: { title: 'Cours', kind: 'k', body: 'b' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r.ok).toBe(true);
    if (r.ok && 'delivered' in r && r.delivered) {
      expect(r.delivered.in_app).toBe(true);
      expect(r.delivered.email).toBeUndefined();
    }
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('course critique annulé : critique malgré silence (course.*.cancelled)', async () => {
    scenario = 'silence_critical';
    prefsOverride = { silence_mode_enabled: true };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'course.live-jazz.cancelled',
        user_id: 'u1',
        payload: { title: 'Annulé', kind: 'c', body: '' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalled();
  });

  it('communauté email désactivé → pas email', async () => {
    prefsOverride = {
      community_email_enabled: false,
      community_inapp_enabled: true,
      silence_mode_enabled: false,
    };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'community.birthday',
        user_id: 'u1',
        payload: { title: 'Joyeux anniversaire', kind: 'community', body: '' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r.ok).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
    if (r.ok && 'delivered' in r && r.delivered) {
      expect(r.delivered.in_app).toBe(true);
    }
  });

  it('user_id null → log uniquement', async () => {
    scenario = 'anonymous';
    const m = buildMockSupabase();
    const r = await dispatch(m.client, {
      event_type: 'subscription.checkout_initiated',
      user_id: null,
      payload: { source: 'landing_blog', target_offer: 'v-coll' },
    });
    expect(r).toMatchObject({ ok: true, anonymous: true });
    expect(m.insertedLogs.length).toBe(1);
    expect(m.insertedLogs[0].channel).toBe('log');
    expect(m.insertedNotifications.length).toBe(0);
  });

  it('cap in-app sur la journée : 5 non lues créées aujourd’hui → pas de nouvelle in-app', async () => {
    unreadTodayCount = 5;
    prefsOverride = { silence_mode_enabled: false, courses_inapp_enabled: true, courses_email_enabled: false };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'course.live.reminder',
        user_id: 'u1',
        payload: { title: 'Cours', kind: 'k', body: 'b' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r.ok).toBe(true);
    expect(m.insertedNotifications.length).toBe(0);
    if (r.ok && 'delivered' in r && r.delivered) {
      expect(r.delivered.in_app).toBeUndefined();
    }
  });

  it('cap in-app sur la journée : 0 non lue aujourd’hui → in-app autorisée (anciennes ignorées)', async () => {
    unreadTodayCount = 0;
    prefsOverride = { silence_mode_enabled: false, courses_inapp_enabled: true, courses_email_enabled: false };
    const m = buildMockSupabase();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const r = await dispatch(
      m.client,
      {
        event_type: 'course.live.reminder',
        user_id: 'u1',
        payload: { title: 'Cours', kind: 'k', body: 'b' },
      },
      { sendEmailPlaceholder: sendEmail },
    );
    expect(r.ok).toBe(true);
    expect(m.insertedNotifications.length).toBe(1);
    if (r.ok && 'delivered' in r && r.delivered) {
      expect(r.delivered.in_app).toBe(true);
    }
  });

  it('race cap email : 3 dispatchs parallèles même utilisateur → au plus 2 emails', async () => {
    const shared = new Map<string, number>();
    const m = buildMockSupabase(shared);
    const sendEmail = m.setEmailPlaceholder(vi.fn().mockResolvedValue(undefined));
    const payload = { title: 'x', kind: 'k', body: '' };
    await Promise.all([
      dispatch(
        m.client,
        { event_type: 'course.a.reminder', user_id: 'u1', payload },
        { sendEmailPlaceholder: sendEmail },
      ),
      dispatch(
        m.client,
        { event_type: 'course.b.reminder', user_id: 'u1', payload },
        { sendEmailPlaceholder: sendEmail },
      ),
      dispatch(
        m.client,
        { event_type: 'course.c.reminder', user_id: 'u1', payload },
        { sendEmailPlaceholder: sendEmail },
      ),
    ]);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it('idempotency_key en doublon sur second appel → pas de double envoi', async () => {
    scenario = 'default';
    let duplicateAfterFirst = false;
    const insertedKeys: (string | null | undefined)[] = [];
    const slotMap = new Map<string, number>();

    const rpc = vi.fn((name: string, params: { p_user_id: string; p_scope_key: string; p_max: number }) => {
      if (name !== 'try_reserve_email_slot') return Promise.reject(new Error(name));
      const key = `${params.p_user_id}:${params.p_scope_key}`;
      const cur = slotMap.get(key) ?? 0;
      if (cur >= params.p_max) return Promise.resolve({ data: false, error: null });
      slotMap.set(key, cur + 1);
      return Promise.resolve({ data: true, error: null });
    });

    const from = vi.fn((table: string) => {
      if (table === 'notification_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_c: string, val: unknown) => ({
              maybeSingle: vi.fn().mockResolvedValue(
                duplicateAfterFirst && val === 'uniq-key'
                  ? { data: { id: 'already' }, error: null }
                  : { data: null, error: null },
              ),
            })),
          }),
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            insertedKeys.push(row.idempotency_key as string | null | undefined);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'L1' }, error: null }),
              }),
            };
          }),
        };
      }
      if (table === 'notification_preferences') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { preferred_locale: 'fr', display_timezone: 'Europe/Paris' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'user_notifications') {
        return {
          select: vi.fn().mockImplementation((_a: string, opts?: { count?: string }) => {
            if (opts?.count === 'exact') {
              return createHeadCountChain(0);
            }
            return {};
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      throw new Error(table);
    });

    const client = { from, rpc } as unknown as import('@supabase/supabase-js').SupabaseClient;

    const first = await dispatch(client, {
      event_type: 'course.notify',
      user_id: 'u1',
      payload: { title: 't', kind: 'k' },
      idempotency_key: 'uniq-key',
    });
    expect(first.ok).toBe(true);
    duplicateAfterFirst = true;

    const second = await dispatch(client, {
      event_type: 'course.notify',
      user_id: 'u1',
      payload: { title: 't', kind: 'k' },
      idempotency_key: 'uniq-key',
    });
    expect(second).toMatchObject({ ok: true, skipped: 'duplicate' });
  });
});
