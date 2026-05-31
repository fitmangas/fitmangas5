import {
  courseDayKeyInTimeZone,
  DEFAULT_CALENDAR_TIMEZONE,
  getTwoWeekCalendarDayStarts,
} from '@/lib/calendar-window';
import { calendarDayKeyInTimeZone } from '@/lib/notifications/timezone';

export const COACH_IMAGES = ['/coaches/coach-1.png', '/coaches/coach-2.png'];

export function getCoachImage(index: number) {
  return COACH_IMAGES[Math.abs(index) % COACH_IMAGES.length];
}

/** Index stable pour alterner les photos selon le créneau du cours dans la quinzaine calendrier. */
export function getCoachImageIndexFromCourseStart(
  startsAtIso: string,
  timeZone?: string | null,
  reference = new Date(),
): number {
  const tz = timeZone?.trim() || DEFAULT_CALENDAR_TIMEZONE;
  const days = getTwoWeekCalendarDayStarts(tz, reference);
  const courseDay = courseDayKeyInTimeZone(startsAtIso, tz);
  const dayIndex = days.findIndex((day) => calendarDayKeyInTimeZone(tz, day) === courseDay);
  return dayIndex >= 0 ? dayIndex : 0;
}
