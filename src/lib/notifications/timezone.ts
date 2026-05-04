import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

/** Calendar day YYYY-MM-DD in IANA time zone. */
export function calendarDayKeyInTimeZone(timeZone: string, date: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) {
    return date.toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}

/** Début de journée calendaire du fuseau `timeZone` pour `date`, en ISO UTC. */
export function startOfDayUtcIsoInTimeZone(timeZone: string, date: Date = new Date()): string {
  const dayKey = calendarDayKeyInTimeZone(timeZone, date);
  const wall = parse(`${dayKey} 00:00:00`, 'yyyy-MM-dd HH:mm:ss', date);
  return fromZonedTime(wall, timeZone).toISOString();
}
