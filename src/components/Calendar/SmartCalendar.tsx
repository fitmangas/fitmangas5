'use client';

import { useEffect, useMemo, useState } from 'react';
import { Smartphone } from 'lucide-react';
import type { AccessType, SmartCourse } from '@/lib/domain/calendar-types';
import {
  courseDayKeyInTimeZone,
  DEFAULT_CALENDAR_TIMEZONE,
  FORTNIGHT_DAYS,
  getTwoWeekCalendarDayStarts,
} from '@/lib/calendar-window';
import { calendarDayKeyInTimeZone } from '@/lib/notifications/timezone';

import { CalendarCourseModal } from './CalendarCourseModal';
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
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncUrl, setSyncUrl] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
  const t =
    lang === 'en'
      ? {
          title: 'Smart calendar',
          upcoming: 'Next',
          days: 'days',
          disableConfirm: 'Disable sync? New courses will no longer be sent automatically to phone.',
          connected: 'Calendar connected',
          connect: 'Connect to my calendar?',
          needAccess: 'Phone sync is available with active access to at least one course.',
          active: 'Sync active',
          activeHint: 'Courses are automatically sent to your phone. If needed, open this link once on iPhone/Android:',
          loadError: 'Unable to load events.',
          networkError: 'Network error. Try again in a moment.',
          weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        }
      : lang === 'es'
        ? {
            title: 'Calendario inteligente',
            upcoming: 'Próximos',
            days: 'días',
            disableConfirm: '¿Desactivar sincronización? Los nuevos cursos ya no se enviarán automáticamente al teléfono.',
            connected: 'Calendario conectado',
            connect: '¿Conectar a mi calendario?',
            needAccess: 'La conexión móvil está disponible con acceso activo al menos a un curso.',
            active: 'Sincronización activa',
            activeHint: 'Los cursos se envían automáticamente a tu teléfono. Si hace falta, abre este enlace una vez en iPhone/Android:',
            loadError: 'No se pudieron cargar los eventos.',
            networkError: 'Error de red. Inténtalo en un momento.',
            weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          }
        : {
            title: 'Calendrier intelligent',
            upcoming: 'Prochains',
            days: 'jours',
            disableConfirm: 'Désactiver la synchronisation ? Les nouveaux cours ne seront plus envoyés automatiquement au téléphone.',
            connected: 'Calendrier connecté',
            connect: 'Connecter à mon calendrier ?',
            needAccess: 'Connexion téléphone disponible avec un accès actif à au moins un cours.',
            active: 'Synchronisation active',
            activeHint: 'Les cours sont envoyés automatiquement sur ton téléphone. Si besoin, ouvre ce lien une fois sur iPhone/Android:',
            loadError: 'Impossible de charger les événements.',
            networkError: 'Erreur réseau. Réessaie dans un instant.',
            weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          };

  const calendarDays = getTwoWeekCalendarDayStarts(DEFAULT_CALENDAR_TIMEZONE);
  const todayKey = calendarDayKeyInTimeZone(DEFAULT_CALENDAR_TIMEZONE);

  const hasUpcomingEvents = events.length > 0;
  const canUseMobileSync = Boolean(tier) || hasUpcomingEvents;

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
    void (async () => {
      try {
        const res = await fetch('/api/calendar/mobile-sync');
        if (!res.ok) return;
        const json = (await res.json()) as { enabled?: boolean; webcalUrl?: string | null };
        setSyncEnabled(json.enabled === true);
        setSyncUrl(typeof json.webcalUrl === 'string' ? json.webcalUrl : null);
      } catch {
        // ignore
      }
    })();
  }, []);

  async function setMobileSync(enabled: boolean) {
    setSyncBusy(true);
    try {
      const res = await fetch('/api/calendar/mobile-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = (await res.json().catch(() => ({}))) as { enabled?: boolean; webcalUrl?: string | null };
      if (!res.ok) return;
      setSyncEnabled(json.enabled === true);
      setSyncUrl(typeof json.webcalUrl === 'string' ? json.webcalUrl : null);
      if (enabled) {
        setShowSyncInfo(true);
        if (json.webcalUrl) {
          window.location.href = json.webcalUrl;
        }
      }
    } finally {
      setSyncBusy(false);
    }
  }

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
    <section className="rounded-[1.75rem] border border-white/15 bg-[#2f3338] p-5 text-white shadow-[0_18px_42px_rgba(17,24,39,0.32)] sm:p-7">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/60">{t.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {t.upcoming} {FORTNIGHT_DAYS} {t.days} · {formatFortnightSubtitle(locale, lang)}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end sm:w-auto sm:justify-end sm:pt-0.5">
          {canUseMobileSync ? (
            syncEnabled ? (
              <button
                type="button"
                disabled={syncBusy}
                onClick={() => {
                  const ok = window.confirm(
                    t.disableConfirm,
                  );
                  if (ok) void setMobileSync(false);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition hover:bg-white/20 disabled:opacity-60"
              >
                <Smartphone size={14} />
                {t.connected}
              </button>
            ) : (
              <button
                type="button"
                disabled={syncBusy}
                onClick={() => void setMobileSync(true)}
                className="btn-luxury-primary inline-flex items-center gap-2 px-5 py-2.5 text-[10px] tracking-[0.14em] disabled:opacity-60"
              >
                <Smartphone size={14} />
                {t.connect}
              </button>
            )
          ) : (
            <p className="max-w-[220px] text-right text-[11px] leading-snug text-white/60 sm:text-right">
              {t.needAccess}
            </p>
          )}
        </div>
      </div>

      {canUseMobileSync && syncEnabled && showSyncInfo && syncUrl ? (
        <div className="mb-4 rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
          <p className="font-semibold">{t.active}</p>
          <p className="mt-1">
            {t.activeHint}
          </p>
          <a href={syncUrl} className="mt-1 block break-all text-emerald-800 underline underline-offset-2">
            {syncUrl}
          </a>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-300/35 bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="space-y-3 md:hidden">
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
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:opacity-95 ${classForAccess(access)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
                        {formatEventDate(event.starts_at, tz)}
                      </p>
                      <p className="mt-1 text-base font-semibold leading-tight">{event.title}</p>
                      <p className="mt-1 text-xs opacity-80">{formatEventTime(event.starts_at, event.ends_at, tz)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {badgeForAccess(access)}
                    </span>
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
                        className={`w-full rounded-lg border px-2 py-1 text-left text-[10px] transition hover:opacity-95 ${classForAccess(effectiveAccessForUi(event))}`}
                      >
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
