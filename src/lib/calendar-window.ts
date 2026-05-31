/**
 * Fenêtre calendrier : 14 jours glissants à partir du jour courant (minuit fuseau métier).
 * Même logique côté API et côté client pour éviter les décalages.
 */

import { addDays, parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

import {
  calendarDayKeyInTimeZone,
  COACH_PUBLISH_TIMEZONE,
  startOfDayUtcIsoInTimeZone,
} from '@/lib/notifications/timezone';

export const FORTNIGHT_DAYS = 14;

/** Fuseau par défaut des séances (colonne courses.timezone). */
export const DEFAULT_CALENDAR_TIMEZONE = COACH_PUBLISH_TIMEZONE;

export type FortnightWindow = {
  start: Date;
  endExclusive: Date;
};

/** Début du jour calendaire dans `timeZone` + 14×24h (fin exclusive). */
export function getFortnightWindow(
  timeZone: string = DEFAULT_CALENDAR_TIMEZONE,
  reference = new Date(),
): FortnightWindow {
  const start = new Date(startOfDayUtcIsoInTimeZone(timeZone, reference));
  const endExclusive = new Date(start.getTime() + FORTNIGHT_DAYS * 24 * 60 * 60 * 1000);
  return { start, endExclusive };
}

/** Alias historique — fenêtre ancrée Europe/Paris. */
export function getUtcFortnightWindow(reference = new Date()): FortnightWindow {
  return getFortnightWindow(DEFAULT_CALENDAR_TIMEZONE, reference);
}

const LOCAL_DAY_PARSE = 'yyyy-MM-dd HH:mm:ss';

/** Lundi = 1 … Dimanche = 7 (ISO), calculé dans le fuseau `timeZone`. */
export function isoWeekdayInTimeZone(timeZone: string, date: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[wd] ?? 1;
}

/** Lundi 00:00 (fuseau métier) de la semaine contenant `reference`. */
export function getMondayOfWeekContaining(
  timeZone: string = DEFAULT_CALENDAR_TIMEZONE,
  reference = new Date(),
): Date {
  const dayKey = calendarDayKeyInTimeZone(timeZone, reference);
  const weekday = isoWeekdayInTimeZone(timeZone, reference);
  const wall = parse(`${dayKey} 00:00:00`, LOCAL_DAY_PARSE, reference);
  return fromZonedTime(addDays(wall, -(weekday - 1)), timeZone);
}

/** 14 cellules Lun→Dim × 2 semaines, alignées sur le vrai weekday (fuseau métier). */
export function getTwoWeekCalendarDayStarts(
  timeZone: string = DEFAULT_CALENDAR_TIMEZONE,
  reference = new Date(),
): Date[] {
  const monday = getMondayOfWeekContaining(timeZone, reference);
  const mondayKey = calendarDayKeyInTimeZone(timeZone, monday);
  const wallMonday = parse(`${mondayKey} 00:00:00`, LOCAL_DAY_PARSE, reference);
  const days: Date[] = [];
  for (let i = 0; i < FORTNIGHT_DAYS; i++) {
    days.push(fromZonedTime(addDays(wallMonday, i), timeZone));
  }
  return days;
}

/** @deprecated Préférer getTwoWeekCalendarDayStarts pour la grille client. */
export function getFortnightDayStarts(
  timeZone: string = DEFAULT_CALENDAR_TIMEZONE,
  reference = new Date(),
): Date[] {
  return getTwoWeekCalendarDayStarts(timeZone, reference);
}

export function isCalendarDayBeforeToday(
  dayInstant: Date,
  timeZone: string = DEFAULT_CALENDAR_TIMEZONE,
  reference = new Date(),
): boolean {
  const dayKey = calendarDayKeyInTimeZone(timeZone, dayInstant);
  const todayKey = calendarDayKeyInTimeZone(timeZone, reference);
  return dayKey < todayKey;
}

export function courseDayKeyInTimeZone(startsAtIso: string, timeZone: string): string {
  return calendarDayKeyInTimeZone(timeZone, new Date(startsAtIso));
}

export function isWithinFortnight(startsAtIso: string, window: FortnightWindow): boolean {
  const t = new Date(startsAtIso).getTime();
  return t >= window.start.getTime() && t < window.endExclusive.getTime();
}

/** Cours terminé : plus de réservation / live. */
export function isCoursePast(endsAtIso: string, reference = new Date()): boolean {
  return new Date(endsAtIso).getTime() < reference.getTime();
}
