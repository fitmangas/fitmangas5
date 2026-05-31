import { formatInTimeZone } from 'date-fns-tz';
import { fr as localeFr } from 'date-fns/locale';

import { COACH_PUBLISH_TIMEZONE, fromUserTime } from '@/lib/notifications/timezone';

export const DEFAULT_COURSE_TIMEZONE = COACH_PUBLISH_TIMEZONE;

export const COURSE_TIMEZONE_OPTIONS = [
  { value: 'Europe/Paris', label: 'France (Paris) — UTC+1/+2' },
  { value: 'America/Mexico_City', label: 'Mexique (Mexico City) — UTC-6' },
  { value: 'Europe/Madrid', label: 'Espagne (Madrid) — UTC+1/+2' },
  { value: 'Europe/London', label: 'Royaume-Uni (Londres) — UTC+0/+1' },
  { value: 'America/New_York', label: 'Est US (New York) — UTC-5/-4' },
] as const;

export type CourseTimezoneValue = (typeof COURSE_TIMEZONE_OPTIONS)[number]['value'];

export function getCourseTimezoneLabel(timeZone: string): string {
  return COURSE_TIMEZONE_OPTIONS.find((o) => o.value === timeZone)?.label ?? timeZone;
}

export function getCourseTimezoneShortLabel(timeZone: string): string {
  return getCourseTimezoneLabel(timeZone).split(' — ')[0] ?? timeZone;
}

/** Affiche un instant UTC dans le fuseau cours pour les champs date + heure (24 h). */
export function toCourseDatetimeLocalValue(iso: string, timeZone = DEFAULT_COURSE_TIMEZONE): string {
  return formatInTimeZone(new Date(iso), timeZone, "yyyy-MM-dd'T'HH:mm");
}

/** Interprète la saisie locale comme heure murale dans `timeZone`. */
export function isoFromCourseDatetimeLocal(value: string, timeZone = DEFAULT_COURSE_TIMEZONE): string {
  const normalized = value.trim().replace('T', ' ');
  const segments = normalized.split(' ');
  const timePart = segments[1] ?? '';
  const withSeconds =
    timePart.split(':').length >= 3 ? normalized : `${normalized}:00`;
  return fromUserTime(withSeconds, timeZone).toISOString();
}

export const COURSE_MINUTE_OPTIONS = ['00', '15', '30', '45'] as const;

export const COURSE_HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
);

export function snapCourseMinuteValue(minutes: number): (typeof COURSE_MINUTE_OPTIONS)[number] {
  const clamped = Math.min(59, Math.max(0, minutes));
  let best: (typeof COURSE_MINUTE_OPTIONS)[number] = '00';
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of COURSE_MINUTE_OPTIONS) {
    const distance = Math.abs(clamped - Number(option));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = option;
    }
  }
  return best;
}

export function splitCourseTimeParts(time: string): { hour: string; minute: string } {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return { hour: '00', minute: '00' };
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23) {
    return { hour: '00', minute: '00' };
  }
  return {
    hour: String(hours).padStart(2, '0'),
    minute: snapCourseMinuteValue(minutes),
  };
}

export function joinCourseTimeParts(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

export function snapCourseDatetimeLocalValue(value: string): string {
  const { date, time } = splitCourseDatetimeLocal(value);
  if (!date) return value;
  const { hour, minute } = splitCourseTimeParts(time || '00:00');
  return `${date}T${joinCourseTimeParts(hour, minute)}`;
}

export function splitCourseDatetimeLocal(value: string): { date: string; time: string } {
  const [date = '', timePart = ''] = value.split('T');
  return { date, time: timePart.slice(0, 5) };
}

export function normalizeCourseTimeInput(time: string): string | null {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  if (!COURSE_MINUTE_OPTIONS.includes(minutes.toString().padStart(2, '0') as (typeof COURSE_MINUTE_OPTIONS)[number])) {
    return null;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Saisie date+heure complète (YYYY-MM-DD + HH:mm valide). */
export function isCompleteCourseDatetimeLocal(value: string): boolean {
  const { date, time } = splitCourseDatetimeLocal(value);
  return Boolean(date && normalizeCourseTimeInput(time));
}

export function joinCourseDatetimeLocal(date: string, hour: string, minute: string): string {
  if (!date) return '';
  return `${date}T${joinCourseTimeParts(hour, minute)}`;
}

export function plusOneHourCourseDatetimeLocal(value: string, timeZone = DEFAULT_COURSE_TIMEZONE): string {
  if (!isCompleteCourseDatetimeLocal(value)) return value;
  const iso = isoFromCourseDatetimeLocal(value, timeZone);
  const end = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return snapCourseDatetimeLocalValue(toCourseDatetimeLocalValue(end.toISOString(), timeZone));
}

export function convertCourseDatetimeBetweenTimezones(
  value: string,
  fromTimeZone: string,
  toTimeZone: string,
): string {
  if (!isCompleteCourseDatetimeLocal(value)) return value;
  const iso = isoFromCourseDatetimeLocal(value, fromTimeZone);
  return snapCourseDatetimeLocalValue(toCourseDatetimeLocalValue(iso, toTimeZone));
}

/** Affichage admin : français, 24 h, fuseau explicite. */
export function formatCourseInstant(
  iso: string,
  timeZone = DEFAULT_COURSE_TIMEZONE,
  options?: { includeTimezone?: boolean },
): string {
  const formatted = formatInTimeZone(new Date(iso), timeZone, 'dd MMMM yyyy, HH:mm', {
    locale: localeFr,
  });
  if (options?.includeTimezone === false) return formatted;
  return `${formatted} · ${getCourseTimezoneShortLabel(timeZone)}`;
}

/** Bloc YYYYMMDDHHMM pour la salle Jitsi — toujours heure Europe/Paris (pipeline Jibri). */
export function jitsiParisDateBlockFromStartsAt(iso: string): string {
  return formatInTimeZone(new Date(iso), COACH_PUBLISH_TIMEZONE, 'yyyyMMddHHmm');
}

export function formatCourseLocalPreview(value: string, timeZone: string): string | null {
  if (!isCompleteCourseDatetimeLocal(value)) return null;
  try {
    const iso = isoFromCourseDatetimeLocal(value, timeZone);
    return formatCourseInstant(iso, timeZone);
  } catch {
    return null;
  }
}
