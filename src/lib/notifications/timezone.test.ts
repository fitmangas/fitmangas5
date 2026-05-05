import { describe, it, expect } from 'vitest';
import { formatInTimeZone } from 'date-fns-tz';

import { shouldSendNowOrQueue } from './quiet-hours';
import {
  COACH_PUBLISH_TIMEZONE,
  formatInUserTimezone,
  fromUserTime,
  isWithinCoachMorningPublishWindow,
} from './timezone';

describe('affichage fuseau Mexico (formatInTimeZone sur instant UTC)', () => {
  it('été : minuit local', () => {
    const utc = new Date('2026-07-15T06:00:00.000Z');
    const tz = 'America/Mexico_City';
    expect(formatInTimeZone(utc, tz, 'yyyy-MM-dd HH:mm')).toBe('2026-07-15 00:00');
  });

  it('hiver : minuit local', () => {
    const utc = new Date('2026-01-15T06:00:00.000Z');
    const tz = 'America/Mexico_City';
    expect(formatInTimeZone(utc, tz, 'yyyy-MM-dd HH:mm')).toBe('2026-01-15 00:00');
  });
});

describe('fromUserTime', () => {
  it('convertit une heure locale Paris en UTC correct (hiver)', () => {
    const utc = fromUserTime('2026-01-15 12:00:00', 'Europe/Paris');
    expect(utc.toISOString()).toBe('2026-01-15T11:00:00.000Z');
  });

  it('convertit une heure locale Mexico en UTC correct', () => {
    const utc = fromUserTime('2026-07-15 08:30:00', 'America/Mexico_City');
    expect(utc.toISOString()).toBe('2026-07-15T14:30:00.000Z');
  });
});

describe('shouldSendNowOrQueue', () => {
  it('22h Paris non critique → queue_digest', () => {
    const at = fromUserTime('2026-06-10 22:00:00', 'Europe/Paris');
    expect(shouldSendNowOrQueue('user-1', 'course.live.reminder', 'Europe/Paris', at)).toBe('queue_digest');
  });

  it('03h Mexico critique → send', () => {
    const at = fromUserTime('2026-06-10 03:00:00', 'America/Mexico_City');
    expect(
      shouldSendNowOrQueue('user-1', 'subscription.payment_failed.invoice', 'America/Mexico_City', at),
    ).toBe('send');
  });

  it('14h Paris non critique → send', () => {
    const at = fromUserTime('2026-06-10 14:00:00', 'Europe/Paris');
    expect(shouldSendNowOrQueue('user-1', 'course.live.reminder', 'Europe/Paris', at)).toBe('send');
  });
});

describe('formatInUserTimezone', () => {
  it('FR : lundi 4 mai à 18h00 (Europe/Paris)', () => {
    const instant = new Date('2026-05-04T16:00:00.000Z');
    const s = formatInUserTimezone(
      instant,
      'Europe/Paris',
      'fr',
      "EEEE d MMMM 'à' HH'h'mm",
    );
    expect(s).toBe('lundi 4 mai à 18h00');
  });

  it('ES : lunes 4 de mayo a las 18:00 (Europe/Paris)', () => {
    const instant = new Date('2026-05-04T16:00:00.000Z');
    const s = formatInUserTimezone(
      instant,
      'Europe/Paris',
      'es',
      "EEEE d 'de' MMMM 'a las' HH:mm",
    );
    expect(s).toBe('lunes 4 de mayo a las 18:00');
  });
});

describe('isWithinCoachMorningPublishWindow', () => {
  it('true à 8h00 Paris', () => {
    const at = fromUserTime('2026-03-02 08:00:00', COACH_PUBLISH_TIMEZONE);
    expect(isWithinCoachMorningPublishWindow(at)).toBe(true);
  });

  it('false à 10h00 Paris', () => {
    const at = fromUserTime('2026-03-02 10:00:00', COACH_PUBLISH_TIMEZONE);
    expect(isWithinCoachMorningPublishWindow(at)).toBe(false);
  });
});
