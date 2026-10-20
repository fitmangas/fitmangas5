import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendEmailMock = vi.fn(async (_input: unknown) => ({ ok: true as const }));
vi.mock('@/lib/email/send', () => ({ sendEmail: (input: unknown) => sendEmailMock(input) }));

import { processDigestQueue } from './phase3';

function chain(data: unknown[], extras: { count?: number } = {}) {
  const single = Promise.resolve({ data: data.length ? data[0] : null, error: null });
  const list = Promise.resolve({ data, count: extras.count ?? data.length, error: null });
  const self: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in', 'is', 'gte', 'lte', 'order', 'limit', 'update']) self[m] = vi.fn(() => self);
  self.maybeSingle = vi.fn(() => single);
  self.insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  self.then = list.then.bind(list);
  self.catch = list.catch.bind(list);
  return self;
}

function mockClient(tables: Record<string, unknown[]>) {
  const getUserById = vi.fn(async () => ({ data: { user: { email: 'cliente@example.com' } }, error: null }));
  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn((_cols?: string, opts?: { head?: boolean }) => chain(tables[table] ?? [], opts?.head ? { count: 0 } : {})),
      update: vi.fn(() => chain([])),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: { admin: { getUserById } },
  } as unknown as SupabaseClient;
  return { client, getUserById };
}

// Lundi 26 octobre 2026, 07:00 UTC = 08:00 à Paris (heure d'hiver).
const MONDAY_8H_PARIS = new Date('2026-10-26T07:00:00Z');

const baseTables = () => ({
  profiles: [{ id: 'u1', display_timezone: 'Europe/Paris', preferred_locale: 'fr' }],
  notification_preferences: [{ user_id: 'u1', digest_frequency: 'weekly', content_email_enabled: true }],
  notification_log: [] as unknown[],
  notification_digest_queue: [{ id: 'q1', digest_bucket: 'content', payload: {}, created_at: '2026-10-22T10:00:00Z' }],
  blog_articles: [{ title_fr: 'Le dos au bureau', published_at: '2026-10-23T10:00:00Z' }],
  standalone_vimeo_videos: [],
  enrollments: [],
  referrals: [],
});

describe('récapitulatif « Ta semaine » (NOTIF_V2)', () => {
  const saved = { ...process.env };
  beforeEach(() => {
    sendEmailMock.mockClear();
    process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 = '1';
    process.env.NOTIF_V2_CUTOFF = '2026-10-20T12:00:00Z';
    process.env.RESEND_API_KEY = 're_test';
    process.env.NEWSLETTER_FROM_EMAIL = 'FitMangas <hello@fitmangas.com>';
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it('envoyé à une cliente qui a l’accès Visio', async () => {
    const { client } = mockClient(baseTables());
    const result = await processDigestQueue(client, { now: MONDAY_8H_PARIS, hasVisioAccess: async () => true });
    expect(result.sent).toBe(1);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it('jamais envoyé à un compte sans accès Visio (prospect, ancienne cliente)', async () => {
    const { client, getUserById } = mockClient(baseTables());
    const result = await processDigestQueue(client, { now: MONDAY_8H_PARIS, hasVisioAccess: async () => false });
    expect(result.sent).toBe(0);
    expect(getUserById).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('accès illisible : pas d’envoi', async () => {
    const { client } = mockClient(baseTables());
    const result = await processDigestQueue(client, {
      now: MONDAY_8H_PARIS,
      hasVisioAccess: async () => {
        throw new Error('base indisponible');
      },
    });
    expect(result.sent).toBe(0);
  });

  it('déjà envoyé aujourd’hui (deuxième passage dans l’heure) : pas de doublon', async () => {
    const tables = { ...baseTables(), notification_log: [{ id: 'deja' }] };
    const { client } = mockClient(tables);
    const result = await processDigestQueue(client, { now: MONDAY_8H_PARIS, hasVisioAccess: async () => true });
    expect(result.sent).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('interrupteur « Ta semaine » coupé : rien', async () => {
    const tables = {
      ...baseTables(),
      notification_preferences: [{ user_id: 'u1', digest_frequency: 'weekly', content_email_enabled: true, weekly_digest_email: false }],
    };
    const { client } = mockClient(tables);
    const result = await processDigestQueue(client, { now: MONDAY_8H_PARIS, hasVisioAccess: async () => true });
    expect(result.sent).toBe(0);
  });

  it('sans NOTIF_V2_CUTOFF : rien ne part', async () => {
    delete process.env.NOTIF_V2_CUTOFF;
    const { client } = mockClient(baseTables());
    const result = await processDigestQueue(client, { now: MONDAY_8H_PARIS, hasVisioAccess: async () => true });
    expect(result).toEqual({ sent: 0, skipped: 'missing_cutoff' });
  });
});
