import { describe, expect, it } from 'vitest';

import { clampFollowupToSendWindow, foldAccents, timezoneForMarket } from './send-window';

describe('clampFollowupToSendWindow', () => {
  it('laisse 14:00 Paris inchangé', () => {
    const iso = '2026-10-19T12:00:00.000Z'; // 14:00 Paris (UTC+2)
    expect(clampFollowupToSendWindow(iso, 'Europe/Paris')).toBe(iso);
  });

  it('reporte 7:00 Paris au 9:00 du même jour', () => {
    const iso = '2026-10-19T05:00:00.000Z'; // 7:00 Paris
    const out = clampFollowupToSendWindow(iso, 'Europe/Paris');
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' }).format(new Date(out)),
    );
    expect(hour).toBe(9);
  });

  it('reporte 21:00 Paris au 9:00 du lendemain (changement d’heure 25/10)', () => {
    const iso = '2026-10-25T19:00:00.000Z'; // 21:00 Paris CEST
    const out = clampFollowupToSendWindow(iso, 'Europe/Paris');
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' }).format(new Date(out)),
    );
    expect(hour).toBe(9);
    expect(new Date(out).getTime()).toBeGreaterThan(new Date(iso).getTime());
  });

  it('Mexico 21:00 → 9:00 lendemain', () => {
    const iso = '2026-10-25T03:00:00.000Z'; // 21:00 Mexico UTC-6
    const out = clampFollowupToSendWindow(iso, timezoneForMarket('mx'));
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Mexico_City',
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(new Date(out)),
    );
    expect(hour).toBe(9);
  });
});

describe('foldAccents', () => {
  it('aligne después et despues', () => {
    expect(foldAccents('después del parto')).toBe(foldAccents('despues del parto'));
  });
});
