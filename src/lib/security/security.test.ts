import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const countResult = { count: 0, error: null as null | { message: string } };
const insertResult = { error: null as null | { message: string } };
const inserts: unknown[] = [];

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        gte: () => Promise.resolve(countResult),
        insert: (row: unknown) => {
          inserts.push(row);
          return Promise.resolve(insertResult);
        },
      };
      return chain;
    },
  }),
}));

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

import { guardPublicForm } from './public-form-guard';
import { checkRateLimit, hashIp, isRateLimitEnabled, PUBLIC_FORM_LIMITS } from './rate-limit';
import { isTurnstileEnabled, verifyTurnstileToken } from './turnstile';

const ENV_KEYS = ['RATE_LIMIT_ENABLED', 'TURNSTILE_ENABLED', 'TURNSTILE_SECRET_KEY', 'RATE_LIMIT_SALT'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];
  countResult.count = 0;
  countResult.error = null;
  insertResult.error = null;
  inserts.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe('limite par IP', () => {
  it('est désactivée par défaut et ne touche pas la base', async () => {
    expect(isRateLimitEnabled({})).toBe(false);
    await expect(checkRateLimit('newsletter', '1.2.3.4')).resolves.toEqual({ ok: true, skipped: 'disabled' });
    expect(inserts).toHaveLength(0);
  });

  it('hache l’IP (jamais stockée en clair) de façon stable', () => {
    const a = hashIp('1.2.3.4', { RATE_LIMIT_SALT: 'sel' });
    expect(a).toBe(hashIp(' 1.2.3.4 ', { RATE_LIMIT_SALT: 'sel' }));
    expect(a).not.toContain('1.2.3.4');
    expect(a).not.toBe(hashIp('1.2.3.4', { RATE_LIMIT_SALT: 'autre' }));
  });

  it('enregistre la tentative sous la limite', async () => {
    process.env.RATE_LIMIT_ENABLED = '1';
    countResult.count = PUBLIC_FORM_LIMITS.newsletter.max - 1;
    await expect(checkRateLimit('newsletter', '1.2.3.4')).resolves.toEqual({ ok: true });
    expect(inserts).toHaveLength(1);
    expect(JSON.stringify(inserts[0])).not.toContain('1.2.3.4');
  });

  it('bloque au-delà de la limite sans enregistrer', async () => {
    process.env.RATE_LIMIT_ENABLED = '1';
    countResult.count = PUBLIC_FORM_LIMITS.newsletter.max;
    const r = await checkRateLimit('newsletter', '1.2.3.4');
    expect(r.ok).toBe(false);
    expect(inserts).toHaveLength(0);
  });

  it('refuse et journalise si la table est indisponible (drapeau allumé)', async () => {
    process.env.RATE_LIMIT_ENABLED = '1';
    countResult.error = { message: 'relation "rate_limits" does not exist' };
    await expect(checkRateLimit('support', '1.2.3.4')).resolves.toEqual({
      ok: false,
      retryAfterSec: PUBLIC_FORM_LIMITS.support.windowSec,
    });
    expect(console.error).toHaveBeenCalled();
  });
});

describe('Turnstile', () => {
  it('est désactivé par défaut (aucun appel réseau)', async () => {
    const fetchImpl = vi.fn();
    expect(isTurnstileEnabled({})).toBe(false);
    await expect(verifyTurnstileToken(null, null, fetchImpl as unknown as typeof fetch)).resolves.toEqual({
      ok: true,
      skipped: true,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuse si activé sans clé secrète', async () => {
    process.env.TURNSTILE_ENABLED = '1';
    await expect(verifyTurnstileToken('jeton', null)).resolves.toEqual({ ok: false, reason: 'turnstile_misconfigured' });
  });

  it('refuse un jeton absent', async () => {
    process.env.TURNSTILE_ENABLED = '1';
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    await expect(verifyTurnstileToken(null, null)).resolves.toEqual({ ok: false, reason: 'turnstile_missing' });
  });

  it('accepte un jeton validé par Cloudflare', async () => {
    process.env.TURNSTILE_ENABLED = '1';
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    await expect(verifyTurnstileToken('jeton', '1.2.3.4', fetchImpl as unknown as typeof fetch)).resolves.toEqual({
      ok: true,
    });
    const body = (fetchImpl.mock.calls[0] as unknown as [string, { body: URLSearchParams }])[1].body;
    expect(body.get('remoteip')).toBe('1.2.3.4');
  });

  it('remonte le code d’erreur Cloudflare', async () => {
    process.env.TURNSTILE_ENABLED = '1';
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] })),
    );
    await expect(verifyTurnstileToken('x', null, fetchImpl as unknown as typeof fetch)).resolves.toEqual({
      ok: false,
      reason: 'invalid-input-response',
    });
  });
});

describe('garde des formulaires publics', () => {
  it('laisse tout passer avec les drapeaux éteints', async () => {
    await expect(guardPublicForm({ scope: 'quiz_lead', ip: '1.2.3.4' })).resolves.toEqual({ ok: true });
  });

  it('renvoie 403 traduit si Turnstile échoue', async () => {
    process.env.TURNSTILE_ENABLED = '1';
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    const r = await guardPublicForm({ scope: 'quiz_lead', ip: '1.2.3.4', locale: 'es' });
    expect(r).toMatchObject({ ok: false, status: 403 });
    if (!r.ok) expect(r.error).toMatch(/verificación/);
  });

  it('renvoie 429 si la limite est atteinte', async () => {
    process.env.RATE_LIMIT_ENABLED = '1';
    countResult.count = 999;
    await expect(guardPublicForm({ scope: 'quiz_lead', ip: '1.2.3.4' })).resolves.toMatchObject({
      ok: false,
      status: 429,
    });
  });
});

describe('en-têtes de sécurité — lives', () => {
  it('ne restreint ni la caméra ni le micro (salles Jitsi sur un autre hôte possibles)', async () => {
    const { buildSecurityHeaders } = await import('./headers');
    const policy = buildSecurityHeaders().find((h) => h.key === 'Permissions-Policy')?.value ?? '';
    expect(policy).not.toMatch(/camera=/);
    expect(policy).not.toMatch(/microphone=/);
    expect(policy).toContain('geolocation=()');
  });
});
