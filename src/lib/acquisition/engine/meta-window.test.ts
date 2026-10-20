import { describe, expect, it } from 'vitest';

import { isMetaMessagingChannel, isMetaWindowOpen, lastInboundAt, planFollowupInMetaWindow } from './meta-window';

const H = 3_600_000;
const parisHour = (iso: string) =>
  Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' }).format(
      new Date(iso),
    ),
  );

describe('fenêtre Meta 24 h — relances V2', () => {
  it('relance demandée à J+2 : ramenée avant la fin des 24 h, en journée (9 h–18 h)', () => {
    const now = Date.parse('2026-10-20T19:38:00Z'); // 21 h 38 à Paris
    const runAt = planFollowupInMetaWindow(new Date(now + 48 * H).toISOString(), now, 'Europe/Paris');
    const delayH = (Date.parse(runAt) - now) / H;
    expect(delayH).toBeLessThanOrEqual(21);
    expect(delayH).toBeGreaterThan(12);
    expect(parisHour(runAt)).toBeGreaterThanOrEqual(9);
    expect(parisHour(runAt)).toBeLessThan(18);
  });

  it('message reçu à midi : relance le lendemain matin, toujours dans les 24 h', () => {
    const now = Date.parse('2026-10-21T10:00:00Z'); // 12 h à Paris
    const runAt = planFollowupInMetaWindow(new Date(now + 120 * H).toISOString(), now, 'Europe/Paris');
    expect((Date.parse(runAt) - now) / H).toBeLessThanOrEqual(21);
    expect(parisHour(runAt)).toBe(9);
  });

  it('message reçu à 8 h : relance le jour même en fin d’après-midi (pas en pleine nuit)', () => {
    const now = Date.parse('2026-10-21T06:00:00Z'); // 8 h à Paris
    const runAt = planFollowupInMetaWindow(new Date(now + 48 * H).toISOString(), now, 'Europe/Paris');
    expect(parisHour(runAt)).toBe(17);
    expect(Date.parse(runAt)).toBeGreaterThan(now);
  });

  it('relance courte déjà en journée : heure demandée conservée', () => {
    const now = Date.parse('2026-10-21T08:00:00Z'); // 10 h à Paris
    const requested = new Date(now + 2 * H).toISOString();
    expect(planFollowupInMetaWindow(requested, now, 'Europe/Paris')).toBe(requested);
  });

  it('Mexique : créneau calculé dans le fuseau de Mexico', () => {
    const now = Date.parse('2026-10-21T02:00:00Z'); // 20 h à Mexico la veille
    const runAt = planFollowupInMetaWindow(new Date(now + 48 * H).toISOString(), now, 'America/Mexico_City');
    const h = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: 'numeric', hourCycle: 'h23' }).format(
        new Date(runAt),
      ),
    );
    expect(h).toBeGreaterThanOrEqual(9);
    expect(h).toBeLessThan(18);
    expect((Date.parse(runAt) - now) / H).toBeLessThanOrEqual(21);
  });

  it('à l’envoi : fenêtre ouverte moins de 24 h après le dernier message reçu', () => {
    const now = Date.parse('2026-10-22T19:38:00Z');
    expect(isMetaWindowOpen('2026-10-22T08:00:00Z', now)).toBe(true);
    expect(isMetaWindowOpen('2026-10-17T19:38:00Z', now)).toBe(false);
    expect(isMetaWindowOpen(null, now)).toBe(false);
  });

  it('dernier message reçu = le plus récent des messages entrants', () => {
    expect(
      lastInboundAt([
        { direction: 'inbound', createdAt: '2026-10-17T19:30:00Z' },
        { direction: 'outbound', createdAt: '2026-10-17T19:31:00Z' },
        { direction: 'inbound', createdAt: '2026-10-17T19:42:00Z' },
      ]),
    ).toBe('2026-10-17T19:42:00.000Z');
    expect(lastInboundAt([{ direction: 'outbound', createdAt: '2026-10-17T19:31:00Z' }])).toBeNull();
  });

  it('canaux Meta : Instagram, Messenger (facebook), WhatsApp', () => {
    expect(isMetaMessagingChannel('instagram')).toBe(true);
    expect(isMetaMessagingChannel('facebook')).toBe(true);
    expect(isMetaMessagingChannel('whatsapp')).toBe(true);
    expect(isMetaMessagingChannel('email')).toBe(false);
  });
});
