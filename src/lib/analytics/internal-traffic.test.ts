import { describe, expect, it } from 'vitest';

import { ga4ConfigParams, internalTrafficCookieValue, isInternalTrafficCookie } from './internal-traffic';

describe('trafic interne GA4', () => {
  it('reconnaît le cookie posé par l’admin', () => {
    expect(isInternalTrafficCookie('fm_internal=1')).toBe(true);
    expect(isInternalTrafficCookie('a=b; fm_internal=1; c=d')).toBe(true);
    expect(isInternalTrafficCookie('fm_internal=0')).toBe(false);
    expect(isInternalTrafficCookie('xfm_internal=1')).toBe(false);
    expect(isInternalTrafficCookie('')).toBe(false);
    expect(isInternalTrafficCookie(null)).toBe(false);
  });

  it('ajoute traffic_type seulement pour le trafic interne', () => {
    expect(ga4ConfigParams(false, { anonymize_ip: true })).toBe('{"anonymize_ip":true}');
    expect(ga4ConfigParams(true, { anonymize_ip: true })).toBe('{"anonymize_ip":true,"traffic_type":"internal"}');
    expect(ga4ConfigParams(true)).toBe('{"traffic_type":"internal"}');
  });

  it('cookie d’un an, sécurisé en https', () => {
    expect(internalTrafficCookieValue(true)).toBe('fm_internal=1; Max-Age=31536000; Path=/; SameSite=Lax; Secure');
    expect(internalTrafficCookieValue(false)).not.toContain('Secure');
  });
});
