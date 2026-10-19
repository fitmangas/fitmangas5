import { describe, expect, it } from 'vitest';

import { computeSendAtUtc, maxSendDateYmd } from './send-at';

describe('computeSendAtUtc', () => {
  it('Paris avant le changement d’heure du 25/10/2026 (CEST UTC+2)', () => {
    const d = computeSendAtUtc('2026-10-24', '14:00', 'Europe/Paris');
    expect(d.toISOString()).toBe('2026-10-24T12:00:00.000Z');
  });

  it('Paris après le changement d’heure du 25/10/2026 (CET UTC+1)', () => {
    const d = computeSendAtUtc('2026-10-26', '14:00', 'Europe/Paris');
    expect(d.toISOString()).toBe('2026-10-26T13:00:00.000Z');
  });

  it('Mexico (UTC-6, pas d’heure d’été)', () => {
    const d = computeSendAtUtc('2026-10-24', '14:00', 'America/Mexico_City');
    expect(d.toISOString()).toBe('2026-10-24T20:00:00.000Z');
  });

  it('08:00 par défaut Paris', () => {
    const d = computeSendAtUtc('2026-10-19', '08:00', 'Europe/Paris');
    expect(d.toISOString()).toBe('2026-10-19T06:00:00.000Z');
  });
});

describe('maxSendDateYmd', () => {
  it('6 mois après l’achat', () => {
    expect(maxSendDateYmd(new Date('2026-10-19T10:00:00.000Z'))).toBe('2027-04-19');
  });
});
