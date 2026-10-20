import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { authorizePrintfulWebhook, printfulTokenMatches, verifyPrintfulSignature } from './printful-webhook-auth';

const SECRET = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const BODY = JSON.stringify({ type: 'package_shipped', data: { order: { id: 1 } } });
const URL_BASE = 'https://fitmangas.com/api/webhooks/printful';

function check(input: { url?: string; headers?: Record<string, string>; secret?: string; production?: boolean }) {
  return authorizePrintfulWebhook({
    url: input.url ?? URL_BASE,
    headers: new Headers(input.headers ?? {}),
    body: BODY,
    secret: input.secret,
    production: input.production ?? true,
  });
}

describe('webhook Printful : authentification', () => {
  it('jeton dans l’URL (API v1, non signée) : accepté seulement s’il est exact', () => {
    expect(check({ url: `${URL_BASE}?token=${SECRET}`, secret: SECRET })).toEqual({ ok: true });
    expect(check({ url: `${URL_BASE}?token=faux`, secret: SECRET })).toMatchObject({ ok: false, status: 401 });
    expect(printfulTokenMatches(`${URL_BASE}?token=`, SECRET)).toBe(false);
  });

  it('signature HMAC du corps (clé brute ou hexadécimale, hex ou base64)', () => {
    const raw = createHmac('sha256', SECRET).update(BODY, 'utf8').digest('hex');
    const fromHex = createHmac('sha256', Buffer.from(SECRET, 'hex')).update(BODY, 'utf8').digest('hex');
    const b64 = createHmac('sha256', SECRET).update(BODY, 'utf8').digest('base64');
    expect(check({ headers: { 'x-pf-webhook-signature': raw }, secret: SECRET })).toEqual({ ok: true });
    expect(check({ headers: { 'x-pf-webhook-signature': fromHex.toUpperCase() }, secret: SECRET })).toEqual({ ok: true });
    expect(check({ headers: { 'x-pf-signature': `sha256=${b64}` }, secret: SECRET })).toEqual({ ok: true });
    expect(verifyPrintfulSignature(BODY, 'sha256=', SECRET)).toBe(false);
  });

  it('signature fausse ou absente : refus 401', () => {
    expect(check({ headers: { 'x-pf-webhook-signature': 'deadbeef' }, secret: SECRET })).toEqual({
      ok: false,
      status: 401,
      error: 'Signature Printful invalide.',
    });
    expect(check({ secret: SECRET })).toEqual({ ok: false, status: 401, error: 'Signature Printful manquante.' });
  });

  it('sans secret : refus 503 en production, accepté en local', () => {
    expect(check({ production: true })).toMatchObject({ ok: false, status: 503 });
    expect(check({ production: false })).toEqual({ ok: true });
    expect(check({ secret: '   ', production: true })).toMatchObject({ ok: false, status: 503 });
  });
});
