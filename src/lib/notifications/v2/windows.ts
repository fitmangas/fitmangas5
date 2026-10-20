import { calendarDayKeyInTimeZone } from '../timezone';

export function localHourInZone(date: Date, timeZone: string): number {
  const part = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false })
    .formatToParts(date)
    .find((p) => p.type === 'hour')?.value;
  return Number(part ?? NaN);
}

export function localWeekdayInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
}

export function minutesUntilStart(startsAtIso: string, now: Date): number {
  return (new Date(startsAtIso).getTime() - now.getTime()) / 60000;
}

/** Veille : jour calendaire local = veille du live, et heure locale ≥ 18:00. */
export function isEveReminderWindow(now: Date, startsAtIso: string, timeZone: string): boolean {
  const liveDay = calendarDayKeyInTimeZone(timeZone, new Date(startsAtIso));
  const today = calendarDayKeyInTimeZone(timeZone, now);
  const liveMidnight = Date.parse(`${liveDay}T00:00:00Z`);
  const todayMidnight = Date.parse(`${today}T00:00:00Z`);
  const dayDelta = Math.round((liveMidnight - todayMidnight) / 86400000);
  if (dayDelta !== 1) return false;
  return localHourInZone(now, timeZone) >= 18;
}

/**
 * 1 h avant : 0 < minutes avant le début ≤ 75.
 * « Dans X min » si moins de 50 min (SPEC §3.2).
 */
export function isOneHourReminderWindow(now: Date, startsAtIso: string): boolean {
  const mins = minutesUntilStart(startsAtIso, now);
  return mins > 0 && mins <= 75;
}

export function oneHourCopyMinutes(now: Date, startsAtIso: string): number {
  return Math.max(1, Math.round(minutesUntilStart(startsAtIso, now)));
}

/** Live publié < 24 h avant le début : pas de veille si début ≤ 3 h, sinon veille immédiate. */
export function shouldSendEveForLatePublish(publishedAtIso: string, startsAtIso: string, now: Date): boolean {
  const start = new Date(startsAtIso).getTime();
  const published = new Date(publishedAtIso).getTime();
  if (start - published >= 24 * 60 * 60 * 1000) return true;
  const hoursToStart = (start - now.getTime()) / 3600000;
  return hoursToStart > 3;
}

export function isSundayLocal(now: Date, timeZone: string): boolean {
  return localWeekdayInZone(now, timeZone) === 'Sun';
}

export function isHourlyDigestHour(now: Date, timeZone: string): boolean {
  return localHourInZone(now, timeZone) === 8;
}

export function isWeeklyDigestHour(now: Date, timeZone: string): boolean {
  return isSundayLocal(now, timeZone) && localHourInZone(now, timeZone) === 18;
}

const SEND_WINDOW_START = 9;
const SEND_WINDOW_END = 20;

export function isLocalSendWindow(now: Date, timeZone: string): boolean {
  const h = localHourInZone(now, timeZone);
  return h >= SEND_WINDOW_START && h < SEND_WINDOW_END;
}
