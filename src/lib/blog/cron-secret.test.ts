import { describe, expect, it, vi } from 'vitest';

import { verifyCronSecret, verifySupabaseCronSecret } from './cron-secret';

function req(auth?: string) {
  return new Request('https://fitmangas.com/api/admin/cron/hourly', {
    headers: auth ? { authorization: auth } : {},
  });
}

const VAULT_SECRET = 'f'.repeat(64);

describe('verifyCronSecret (Vercel Cron, cron-job.org)', () => {
  it('accepte seulement le bon secret', () => {
    expect(verifyCronSecret(req('Bearer vercel-secret'), { CRON_SECRET: 'vercel-secret' })).toBe(true);
    expect(verifyCronSecret(req('Bearer autre'), { CRON_SECRET: 'vercel-secret' })).toBe(false);
    expect(verifyCronSecret(req(), { CRON_SECRET: 'vercel-secret' })).toBe(false);
  });

  it('sans secret configuré : tout est refusé, même « Bearer » vide', () => {
    expect(verifyCronSecret(req('Bearer '), {})).toBe(false);
    expect(verifyCronSecret(req('Bearer undefined'), { CRON_SECRET: '  ' })).toBe(false);
  });
});

describe('verifySupabaseCronSecret (Supabase Cron, secret dans Vault)', () => {
  it('la base compare la valeur reçue', async () => {
    const matches = vi.fn(async (candidate: string) => candidate === VAULT_SECRET);
    expect(await verifySupabaseCronSecret(req(`Bearer ${VAULT_SECRET}`), matches)).toBe(true);
    expect(await verifySupabaseCronSecret(req(`Bearer ${'e'.repeat(64)}`), matches)).toBe(false);
    expect(matches).toHaveBeenCalledTimes(2);
  });

  it('valeurs absentes, trop courtes ou mal formées : refus sans interroger la base', async () => {
    const matches = vi.fn(async () => true);
    expect(await verifySupabaseCronSecret(req(), matches)).toBe(false);
    expect(await verifySupabaseCronSecret(req('Bearer court'), matches)).toBe(false);
    expect(await verifySupabaseCronSecret(req(VAULT_SECRET), matches)).toBe(false);
    expect(await verifySupabaseCronSecret(req(`Bearer ${'x'.repeat(300)}`), matches)).toBe(false);
    expect(matches).not.toHaveBeenCalled();
  });

  it('base indisponible : refus', async () => {
    const matches = vi.fn(async () => {
      throw new Error('réseau');
    });
    expect(await verifySupabaseCronSecret(req(`Bearer ${VAULT_SECRET}`), matches)).toBe(false);
  });
});
