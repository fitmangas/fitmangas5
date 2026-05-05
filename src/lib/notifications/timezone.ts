import { parse } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { es as localeEs, fr as localeFr } from 'date-fns/locale';

const LOCAL_INPUT_FORMAT = 'yyyy-MM-dd HH:mm:ss';

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

/**
 * Interprète `localDateString` comme heure locale dans `timeZone` (sans offset dans la chaîne)
 * et retourne l’instant UTC correspondant.
 * Format attendu : `yyyy-MM-dd HH:mm:ss` (24 h).
 */
export function fromUserTime(localDateString: string, timeZone: string, referenceDate: Date = new Date()): Date {
  const wall = parse(localDateString.trim(), LOCAL_INPUT_FORMAT, referenceDate);
  if (Number.isNaN(wall.getTime())) {
    throw new Error(`fromUserTime: format invalide, attendu ${LOCAL_INPUT_FORMAT}`);
  }
  return fromZonedTime(wall, timeZone);
}

const USER_LOCALE_TO_FN = {
  fr: localeFr,
  es: localeEs,
} as const;

/**
 * Formate un instant absolu (UTC) dans le fuseau et la locale indiqués (tokens date-fns).
 * Passer l’instant réel (ex. retour `new Date()` / Supabase) — ne pas mélanger avec des « dates mur » décalées.
 */
export function formatInUserTimezone(
  date: Date,
  timeZone: string,
  locale: 'fr' | 'es',
  formatStr: string,
): string {
  return formatInTimeZone(date, timeZone, formatStr, { locale: USER_LOCALE_TO_FN[locale] });
}

/** Fuseau « coach » pour la fenêtre de publication blog planifiée (Alexandra, Paris). */
export const COACH_PUBLISH_TIMEZONE = 'Europe/Paris';

/**
 * Vérifie si `date` tombe dans la fenêtre métier 07:59–08:01 (heure locale coach, Paris).
 * Utilisé par le cron Vercel (UTC) avec une grille « toutes les 2 min » sur la plage 5h–8h UTC.
 */
export function isWithinCoachMorningPublishWindow(
  date: Date,
  coachTimeZone: string = COACH_PUBLISH_TIMEZONE,
): boolean {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: coachTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? NaN);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? NaN);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;
  if (hour === 7 && minute >= 59) return true;
  if (hour === 8 && minute <= 1) return true;
  return false;
}
