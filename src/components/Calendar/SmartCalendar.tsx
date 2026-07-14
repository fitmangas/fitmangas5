'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AccessType, SmartCourse } from '@/lib/domain/calendar-types';
import {
  courseDayKeyInTimeZone,
  DEFAULT_CALENDAR_TIMEZONE,
  FORTNIGHT_DAYS,
  getTwoWeekCalendarDayStarts,
} from '@/lib/calendar-window';
import { calendarDayKeyInTimeZone } from '@/lib/notifications/timezone';

import { CalendarCourseModal } from './CalendarCourseModal';
import { CourseLanguageFlag } from './CourseLanguageFlag';
import { SubscribeCalendarButton } from './SubscribeCalendarButton';
import { badgeForAccess, effectiveAccessForUi } from '@/lib/calendar-course-ui';

type ApiResponse = {
  tier: string | null;
  events: SmartCourse[];
  meta?: {
    total: number;
    windowStart?: string;
    windowEndExclusive?: string;
    fortNightDays?: number;
  };
};

/** Clé jour calendaire (fuseau cours) pour regrouper les événements. */
function courseDayKey(iso: string, timeZone: string) {
  return courseDayKeyInTimeZone(iso, timeZone);
}

function classForAccess(access: AccessType) {
  if (access === 'full') {
    return 'border-emerald-400/45 bg-emerald-500/20 text-white shadow-[0_4px_14px_rgba(16,185,129,0.2)] backdrop-blur-sm';
  }
  if (access === 'preview') {
    return 'border-orange-300/40 bg-orange-500/15 text-white/85 backdrop-blur-sm';
  }
  return 'border-white/20 bg-white/[0.08] text-white/70 blur-[0.5px]';
}

function formatFortnightSubtitle(locale: string, lang: 'fr' | 'en' | 'es') {
  const days = getTwoWeekCalendarDayStarts(DEFAULT_CALENDAR_TIMEZONE);
  const first = days[0];
  const last = days[days.length - 1];
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DEFAULT_CALENDAR_TIMEZONE,
  };
  const from = first.toLocaleDateString(locale, opts);
  const to = last.toLocaleDateString(locale, opts);
  if (lang === 'en') return `Week of ${from} to ${to}`;
  if (lang === 'es') return `Semana del ${from} al ${to}`;
  return `Semaine du ${from} au ${to}`;
}

export function SmartCalendar({ lang = 'fr' }: { lang?: 'fr' | 'en' | 'es' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<SmartCourse[]>([]);
  const [tier, setTier] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SmartCourse | null>(null);
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
  const t =
    lang === 'en'
      ? {
          title: 'Smart calendar',
          upcoming: 'Next',
          days: 'days',
          needAccess: 'Calendar subscription is available with active access to at least one course.',
          loadError: 'Unable to load events.',
          networkError: 'Network error. Try again in a moment.',
          weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        }
      : lang === 'es'
        ? {
            title: 'Calendario inteligente',
            upcoming: 'Próximos',
            days: 'días',
            needAccess: 'La suscripción al calendario está disponible con acceso activo al menos a un curso.',
            loadError: 'No se pudieron cargar los eventos.',
            networkError: 'Error de red. Inténtalo en un momento.',
            weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          }
        : {
            title: 'Calendrier intelligent',
            upcoming: 'Prochains',
            days: 'jours',
            needAccess: 'L’abonnement calendrier est disponible avec un accès actif à au moins un cours.',
            loadError: 'Impossible de charger les événements.',
            networkError: 'Erreur réseau. Réessaie dans un instant.',
            weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          };

  const calendarDays = getTwoWeekCalendarDayStarts(DEFAULT_CALENDAR_TIMEZONE);
  const todayKey = calendarDayKeyInTimeZone(DEFAULT_CALENDAR_TIMEZONE);

  const hasUpcomingEvents = events.length > 0;
  const canSubscribe = Boolean(tier) || hasUpcomingEvents;

  async function fetchEvents() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/calendar/events');
      const json = (await res.json()) as ApiResponse | { error: string };
      if (!res.ok || !('events' in json)) {
        setError('error' in json ? json.error : t.loadError);
        return;
      }
      setTier(json.tier);
      setEvents(json.events);
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchEvents();
  }, []);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, SmartCourse[]>();
    events.forEach((event) => {
      const tz = event.timezone?.trim() || DEFAULT_CALENDAR_TIMEZONE;
      const key = courseDayKey(event.starts_at, tz);
      const dayEvents = map.get(key) ?? [];
      dayEvents.push(event);
      map.set(key, dayEvents);
    });
    return map;
  }, [events]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [events],
  );

  const formatEventDate = (iso: string, timeZone: string) =>
    new Date(iso).toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone,
    });

  const formatEventTime = (startIso: string, endIso: string, timeZone: string) => {
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone };
    return `${new Date(startIso).toLocaleTimeString(locale, opts)} - ${new Date(endIso).toLocaleTimeString(locale, opts)}`;
  };

  return (
    <section className="rounded-[1.5rem] border border-white/15 bg-[#2f3338] p-4 text-white shadow-[0_18px_42px_rgba(17,24,39,0.32)] sm:p-7 md:rounded-[1.75rem]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/60">{t.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/80 md:mt-2 md:text-sm">
            {t.upcoming} {FORTNIGHT_DAYS} {t.days} · {formatFortnightSubtitle(locale, lang)}
          </p>
        </div>
        <div className="relative flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:justify-end sm:pt-0.5">
          {canSubscribe ? (
            <SubscribeCalendarButton lang={lang} tone="primary" />
          ) : (
            <p className="max-w-[220px] text-right text-[11px] leading-snug text-white/60 sm:text-right">
              {t.needAccess}
            </p>
          )}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-300/35 bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="space-y-2.5 md:hidden">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/10" />
            ))
          : sortedEvents.map((event) => {
              const access = effectiveAccessForUi(event);
              const tz = event.timezone?.trim() || DEFAULT_CALENDAR_TIMEZONE;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedCourse(event)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-left transition hover:opacity-95 ${classForAccess(access)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
                        {formatEventDate(event.starts_at, tz)}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-tight">{event.title}</p>
                      <p className="mt-1 text-xs opacity-80">{formatEventTime(event.starts_at, event.ends_at, tz)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <CourseLanguageFlag language={event.course_language} uiLang={lang} />
                      <span className="rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                        {badgeForAccess(access)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
      </div>

      {/* 2 semaines : grille 7 + 7 jours */}
      <div className="mb-2 hidden grid-cols-7 text-center text-[10px] uppercase tracking-widest text-white/55 md:grid">
        {t.weekdays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="hidden grid-cols-7 gap-2 md:grid">
        {loading
          ? Array.from({ length: 14 }, (_, index) => (
              <div key={index} className="min-h-24 animate-pulse rounded-xl bg-white/10" />
            ))
          : calendarDays.map((date) => {
              const key = calendarDayKeyInTimeZone(DEFAULT_CALENDAR_TIMEZONE, date);
              const dayEvents = groupedByDay.get(key) ?? [];
              const isPastDay = key < todayKey;

              return (
                <div
                  key={key}
                  className={`min-h-24 rounded-xl border border-white/15 bg-white/[0.06] p-1.5 backdrop-blur-md transition ${
                    isPastDay ? 'opacity-45' : ''
                  }`}
                >
                  <div className="mb-1 text-[11px] font-semibold text-white/75">
                    {date.toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                      timeZone: DEFAULT_CALENDAR_TIMEZONE,
                    })}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedCourse(event)}
                        className={`relative w-full rounded-lg border px-2 py-1 pr-6 text-left text-[10px] transition hover:opacity-95 ${classForAccess(effectiveAccessForUi(event))}`}
                      >
                        <CourseLanguageFlag
                          language={event.course_language}
                          uiLang={lang}
                          className="absolute right-1 top-1 text-sm"
                        />
                        <div className="truncate font-medium">{event.title}</div>
                        <div className="mt-0.5 text-[9px] opacity-80">{badgeForAccess(effectiveAccessForUi(event))}</div>
                      </button>
                    ))}
                    {dayEvents.length > 3 ? (
                      <p className="px-1 text-[9px] text-white/60">+{dayEvents.length - 3}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>

      <CalendarCourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} lang={lang} />
    </section>
  );
}
