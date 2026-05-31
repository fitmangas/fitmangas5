import { describe, expect, it } from 'vitest';

import {
  courseDayKeyInTimeZone,
  getFortnightWindow,
  getMondayOfWeekContaining,
  getTwoWeekCalendarDayStarts,
  isoWeekdayInTimeZone,
} from '@/lib/calendar-window';
import {
  COURSE_TIME_SLOT_OPTIONS,
  formatCourseInstant,
  isoFromCourseDatetimeLocal,
  jitsiParisDateBlockFromStartsAt,
  plusOneHourCourseDatetimeLocal,
  snapCourseTimeSlot,
  toCourseDatetimeLocalValue,
} from '@/lib/course-datetime';

describe('course-datetime (Europe/Paris)', () => {
  it('19:00 Paris été → 17:00 UTC stocké', () => {
    expect(isoFromCourseDatetimeLocal('2026-06-02T19:00')).toBe('2026-06-02T17:00:00.000Z');
  });

  it('réaffiche 19:00 Paris depuis UTC', () => {
    expect(toCourseDatetimeLocalValue('2026-06-02T17:00:00.000Z')).toBe('2026-06-02T19:00');
  });

  it('affiche en français 24 h avec fuseau', () => {
    expect(formatCourseInstant('2026-06-02T17:00:00.000Z', 'Europe/Paris')).toBe(
      '02 juin 2026, 19:00 · France (Paris)',
    );
  });

  it('bloc Jitsi identique à l’ancienne saisie Paris (régression pipeline)', () => {
    const local = '2026-06-02T19:00';
    const iso = isoFromCourseDatetimeLocal(local, 'Europe/Paris');
    expect(jitsiParisDateBlockFromStartsAt(iso)).toBe(local.replace(/[^0-9]/g, '').slice(0, 12));
  });

  it('plusOneHour ne plante pas pendant une saisie partielle', () => {
    expect(plusOneHourCourseDatetimeLocal('2026-06-02T19', 'Europe/Paris')).toBe('2026-06-02T19');
    expect(plusOneHourCourseDatetimeLocal('2026-06-02T', 'Europe/Paris')).toBe('2026-06-02T');
  });

  it('00:45 Paris est une heure valide pour le stockage UTC', () => {
    expect(isoFromCourseDatetimeLocal('2026-06-01T00:45')).toBe('2026-05-31T22:45:00.000Z');
    expect(formatCourseInstant('2026-05-31T22:45:00.000Z', 'Europe/Paris')).toBe(
      '01 juin 2026, 00:45 · France (Paris)',
    );
  });

  it('créneaux horaires par pas de 5 minutes', () => {
    expect(COURSE_TIME_SLOT_OPTIONS).toHaveLength(288);
    expect(COURSE_TIME_SLOT_OPTIONS[0]).toBe('00:00');
    expect(COURSE_TIME_SLOT_OPTIONS[1]).toBe('00:05');
    expect(COURSE_TIME_SLOT_OPTIONS.at(-1)).toBe('23:55');
    expect(snapCourseTimeSlot('19:07')).toBe('19:05');
    expect(snapCourseTimeSlot('19:08')).toBe('19:10');
  });

  it('06:05 Paris est un créneau valide', () => {
    expect(isoFromCourseDatetimeLocal('2026-06-01T06:05')).toBe('2026-06-01T04:05:00.000Z');
    expect(formatCourseInstant('2026-06-01T04:05:00.000Z', 'Europe/Paris')).toBe(
      '01 juin 2026, 06:05 · France (Paris)',
    );
  });

  it('plusOneHour arrondit au pas de 5 minutes', () => {
    expect(plusOneHourCourseDatetimeLocal('2026-06-02T18:55', 'Europe/Paris')).toBe('2026-06-02T19:55');
  });
});

describe('course-datetime (America/Mexico_City)', () => {
  it('12:00 Mexico → UTC puis réaffichage cohérent', () => {
    const iso = isoFromCourseDatetimeLocal('2026-06-02T12:00', 'America/Mexico_City');
    expect(iso).toBe('2026-06-02T18:00:00.000Z');
    expect(toCourseDatetimeLocalValue(iso, 'America/Mexico_City')).toBe('2026-06-02T12:00');
  });

  it('Jitsi reste en heure Paris même si saisie Mexico', () => {
    const iso = isoFromCourseDatetimeLocal('2026-06-02T12:00', 'America/Mexico_City');
    expect(jitsiParisDateBlockFromStartsAt(iso)).toBe('202606022000');
  });
});

describe('calendar-window (Europe/Paris)', () => {
  it('clé jour calendaire Paris pour 19:00 Paris', () => {
    expect(courseDayKeyInTimeZone('2026-06-02T17:00:00.000Z', 'Europe/Paris')).toBe('2026-06-02');
  });

  it('fenêtre démarre à minuit Paris', () => {
    const ref = new Date('2026-06-02T12:00:00.000Z');
    const { start } = getFortnightWindow('Europe/Paris', ref);
    expect(start.toISOString()).toBe('2026-06-01T22:00:00.000Z');
  });

  it('2 juin 2026 = mardi à Paris', () => {
    const ref = new Date('2026-06-02T17:00:00.000Z');
    expect(isoWeekdayInTimeZone('Europe/Paris', ref)).toBe(2);
  });

  it('grille 2 semaines : mardi 2 juin sous colonne MAR (index 1)', () => {
    const ref = new Date('2026-06-02T12:00:00.000Z');
    const monday = getMondayOfWeekContaining('Europe/Paris', ref);
    const days = getTwoWeekCalendarDayStarts('Europe/Paris', ref);
    expect(days[0].getTime()).toBe(monday.getTime());
    expect(days).toHaveLength(14);

    const pilatesKey = courseDayKeyInTimeZone('2026-06-02T17:00:00.000Z', 'Europe/Paris');
    const gridIndex = days.findIndex(
      (d) => courseDayKeyInTimeZone(d.toISOString(), 'Europe/Paris') === pilatesKey,
    );
    expect(gridIndex).toBe(1);
    expect(gridIndex % 7).toBe(1);
  });

  it('alignement ven 5 / mer 10 / sam 13 juin 2026', () => {
    const ref = new Date('2026-06-01T12:00:00.000Z');
    const days = getTwoWeekCalendarDayStarts('Europe/Paris', ref);
    const column = (iso: string) => {
      const key = courseDayKeyInTimeZone(iso, 'Europe/Paris');
      const idx = days.findIndex((d) => courseDayKeyInTimeZone(d.toISOString(), 'Europe/Paris') === key);
      return idx >= 0 ? idx % 7 : -1;
    };
    expect(column('2026-06-05T14:00:00.000Z')).toBe(4);
    expect(column('2026-06-10T12:00:00.000Z')).toBe(2);
    expect(column('2026-06-13T10:00:00.000Z')).toBe(5);
  });
});
