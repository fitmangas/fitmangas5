'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Lock, Video } from 'lucide-react';

import type { SmartCourse } from '@/lib/domain/calendar-types';
import { effectiveAccessForUi } from '@/lib/calendar-course-ui';
import { pickMobilePlanningDays } from '@/lib/calendar/planning-mobile-days';
import { tzHoursLabel } from '@/lib/time/tz-label';
import { CalendarCourseModal } from '@/components/Calendar/CalendarCourseModal';
import { SubscribeCalendarButton } from '@/components/Calendar/SubscribeCalendarButton';

/**
 * Planning v3 (maquettes D04 et B06) — composant unique pour /compte (variante « dashboard »)
 * et /compte/planning (variante « page »).
 * Deux types seulement, tons orange : live (liseré terracotta, fond crème) et séance du programme
 * (liseré abricot, fond pêche, « Ta séance N »). Heures dans le fuseau de la cliente.
 */

export type ProgramSession = {
  id: string;
  /** Jour (AAAA-MM-JJ) dans le fuseau de la cliente. */
  dayKey: string;
  title: string;
  /** « Ta séance 5 » */
  stepLabel: string;
  durationMin: number;
  href: string;
  done?: boolean;
};

type Lang = 'fr' | 'en' | 'es';

type Props = {
  lang?: Lang;
  variant?: 'page' | 'dashboard';
  /** Fuseau d'affichage (profiles.display_timezone, défaut selon la langue). */
  timeZone?: string;
  /** Langues des lives à montrer ; null = toutes (préférence absente). */
  languages?: Array<'fr' | 'es'> | null;
  /** Présentiel visible seulement si ONSITE_ENABLED (lu côté serveur). */
  onsiteEnabled?: boolean;
  programSessions?: ProgramSession[];
  /** Aperçus : événements fournis (aucun appel réseau) et « maintenant » figé. */
  initialEvents?: SmartCourse[];
  nowIso?: string;
};

const COPY = {
  fr: {
    kicker: 'Planning',
    pageTitle: 'Cette semaine',
    dashTitle: 'Tes prochaines séances',
    subtitle: 'Chaque live compte pour toi : pas d’inscription, tu viens quand tu veux.',
    today: 'aujourd’hui',
    nothing: 'Rien de prévu',
    session: 'Ta séance',
    done: 'Faite',
    start: 'Commencer',
    ended: 'Terminé',
    replay: 'Voir le replay',
    join: 'Rejoindre',
    visio: 'Visio',
    video: 'Vidéo',
    locked: 'Réservé aux abonnées',
    legendLive: 'Live avec Alejandra',
    legendSession: 'Ta séance du programme',
    full: 'Planning complet',
    prev: 'Semaine précédente',
    next: 'Semaine suivante',
    error: 'Impossible de charger le planning. Réessaie dans un instant.',
  },
  es: {
    kicker: 'Planning',
    pageTitle: 'Esta semana',
    dashTitle: 'Tus próximas sesiones',
    subtitle: 'Cada live cuenta para ti: sin inscripción, vienes cuando quieras.',
    today: 'hoy',
    nothing: 'Nada previsto',
    session: 'Tu sesión',
    done: 'Hecha',
    start: 'Empezar',
    ended: 'Terminado',
    replay: 'Ver el replay',
    join: 'Unirme',
    visio: 'Online',
    video: 'Video',
    locked: 'Reservado a suscriptoras',
    legendLive: 'Live con Alejandra',
    legendSession: 'Tu sesión del programa',
    full: 'Planning completo',
    prev: 'Semana anterior',
    next: 'Semana siguiente',
    error: 'No se pudo cargar el planning. Inténtalo en un momento.',
  },
  en: {
    kicker: 'Schedule',
    pageTitle: 'This week',
    dashTitle: 'Your next sessions',
    subtitle: 'Every live is yours: no booking, join whenever you like.',
    today: 'today',
    nothing: 'Nothing planned',
    session: 'Your session',
    done: 'Done',
    start: 'Start',
    ended: 'Ended',
    replay: 'Watch the replay',
    join: 'Join',
    visio: 'Online',
    video: 'Video',
    locked: 'Members only',
    legendLive: 'Live with Alejandra',
    legendSession: 'Your programme session',
    full: 'Full schedule',
    prev: 'Previous week',
    next: 'Next week',
    error: 'Unable to load the schedule. Try again in a moment.',
  },
} as const;

/* ——— Dates : clés AAAA-MM-JJ dans le fuseau d'affichage, calendrier en UTC pour les additions ——— */

function dayKeyIn(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function keyToUtc(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
}

function addDaysToKey(key: string, n: number): string {
  const d = keyToUtc(key);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lundi (clé) de la semaine contenant `key`. */
function mondayKey(key: string): string {
  const dow = (keyToUtc(key).getUTCDay() + 6) % 7; // 0 = lundi
  return addDaysToKey(key, -dow);
}

/** Instant UTC correspondant à 00:00 du jour `key` dans `timeZone` (à la minute près). */
function startOfDayInstant(key: string, timeZone: string): Date {
  const guess = new Date(`${key}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(guess);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  const offset = asIfUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

function uiLocale(lang: Lang): string {
  return lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-GB' : 'fr-FR';
}

function dayLabel(key: string, lang: Lang): string {
  const d = keyToUtc(key);
  const wd = new Intl.DateTimeFormat(uiLocale(lang), { weekday: 'short', timeZone: 'UTC' }).format(d).replace('.', '');
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}. ${d.getUTCDate()}`;
}

function weekRangeLabel(monday: string, lang: Lang): string {
  const a = keyToUtc(monday);
  const b = keyToUtc(addDaysToKey(monday, 6));
  const month = (d: Date) => new Intl.DateTimeFormat(uiLocale(lang), { month: 'short', timeZone: 'UTC' }).format(d);
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()} – ${b.getUTCDate()} ${month(b)}`;
  return `${a.getUTCDate()} ${month(a)} – ${b.getUTCDate()} ${month(b)}`;
}

function flagFor(language: string | null | undefined): string | null {
  if (language === 'es') return '🇪🇸';
  if (language === 'fr') return '🇫🇷';
  return null;
}

/* ——— Cartes ——— */

function LiveItem({
  course,
  lang,
  timeZone,
  nowMs,
  isTodayCard,
  onOpen,
}: {
  course: SmartCourse;
  lang: Lang;
  timeZone: string;
  nowMs: number;
  isTodayCard: boolean;
  onOpen: (c: SmartCourse) => void;
}) {
  const t = COPY[lang];
  const start = new Date(course.starts_at);
  const end = new Date(course.ends_at);
  const past = end.getTime() < nowMs;
  const full = effectiveAccessForUi(course) === 'full';
  const time = new Intl.DateTimeFormat(uiLocale(lang), { hour: '2-digit', minute: '2-digit', timeZone }).format(start);
  const flag = flagFor(course.course_language ?? null);
  const directLink = full && Boolean(course.jitsi_link) && (past || isTodayCard);

  // Live passé : il reste affiché, grisé (« Terminé »), pour que la semaine ne paraisse pas vide.
  const body = (
    <>
      <p className={`flex items-center justify-between text-[14px] font-semibold ${past ? 'text-luxury-muted' : 'text-luxury-ink'}`}>
        <span className="tabular-nums">{time}</span>
        {flag ? (
          <span
            className={`text-[12px] ${past ? 'opacity-60 grayscale' : ''}`}
            aria-label={course.course_language === 'es' ? 'en español' : 'en français'}
          >
            {flag}
          </span>
        ) : null}
      </p>
      <p className={`text-[13px] font-medium leading-snug ${past ? 'text-luxury-muted' : 'text-luxury-ink'}`}>{course.title}</p>
      {past ? (
        <p className="mt-0.5 text-[12px] text-luxury-soft">
          {t.ended}
          {full ? (
            <>
              {' · '}
              <span className="font-semibold text-luxury-orange">{t.replay}</span>
            </>
          ) : null}
        </p>
      ) : !full ? (
        <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-luxury-muted">
          <Lock size={11} aria-hidden />
          {t.locked}
        </p>
      ) : isTodayCard ? (
        <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-luxury-orange">
          {t.join}
          <ArrowRight size={12} strokeWidth={2.4} aria-hidden />
        </p>
      ) : (
        <p className="inline-flex items-center gap-1 text-[12px] text-luxury-muted">
          <Video size={11} aria-hidden />
          {t.visio}
        </p>
      )}
    </>
  );

  const cls = past
    ? 'block w-full rounded-xl border-l-[3px] border-l-[#d8d1c9] bg-[#f2f0ed] px-2.5 py-2.5 text-left transition hover:bg-[#ebe8e4]'
    : 'block w-full rounded-xl border-l-[3px] border-l-luxury-orange bg-[#faf7f3] px-2.5 py-2.5 text-left transition hover:bg-[#f6efe7]';

  if (directLink) {
    return (
      <Link href={`/live/${course.id}`} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(course)} className={cls}>
      {body}
    </button>
  );
}

function SessionItem({ session, lang, isTodayCard }: { session: ProgramSession; lang: Lang; isTodayCard: boolean }) {
  const t = COPY[lang];
  return (
    <Link
      href={session.href}
      className={`block rounded-xl border-l-[3px] border-l-[#e6a285] bg-[#fdf2ec] px-2.5 py-2.5 transition hover:bg-[#fbe9df] ${
        session.done ? 'opacity-60' : ''
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b0583a]">{session.stepLabel}</p>
      <p className="mt-1 text-[13px] font-medium leading-snug text-luxury-ink">{session.title}</p>
      {session.done ? (
        <p className="mt-1 flex items-center gap-1 text-[12px] text-luxury-muted">
          <Check size={12} strokeWidth={2.6} className="text-[#b0583a]" aria-hidden />
          {t.done}
        </p>
      ) : isTodayCard ? (
        <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-luxury-orange">
          {t.start}
          <ArrowRight size={12} strokeWidth={2.4} aria-hidden />
        </p>
      ) : (
        <p className="mt-1 text-[12px] text-luxury-muted">
          {t.video} · {session.durationMin} min
        </p>
      )}
    </Link>
  );
}

/* ——— Composant ——— */

export function PlanningV3({
  lang = 'fr',
  variant = 'page',
  timeZone = 'Europe/Paris',
  languages = null,
  onsiteEnabled = false,
  programSessions = [],
  initialEvents,
  nowIso,
}: Props) {
  const t = COPY[lang];
  const nowMs = useMemo(() => (nowIso ? new Date(nowIso).getTime() : Date.now()), [nowIso]);
  const todayKey = dayKeyIn(new Date(nowMs), timeZone);
  const currentMonday = mondayKey(todayKey);

  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<SmartCourse[]>(initialEvents ?? []);
  const [tier, setTier] = useState<string | null>(null);
  const [windowEnd, setWindowEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialEvents);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<SmartCourse | null>(null);

  useEffect(() => {
    if (initialEvents) return;
    let cancelled = false;
    const since = startOfDayInstant(currentMonday, timeZone).toISOString();
    fetch(`/api/calendar/events?depuis=${encodeURIComponent(since)}`)
      .then(async (r) => {
        const json = (await r.json().catch(() => ({}))) as {
          events?: SmartCourse[];
          tier?: string | null;
          meta?: { windowEndExclusive?: string };
        };
        if (cancelled) return;
        if (!r.ok || !Array.isArray(json.events)) {
          setError(true);
          return;
        }
        setEvents(json.events);
        setTier(json.tier ?? null);
        setWindowEnd(json.meta?.windowEndExclusive ? new Date(json.meta.windowEndExclusive).getTime() : null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialEvents, currentMonday, timeZone]);

  const visibleEvents = useMemo(
    () =>
      events.filter((e) => {
        if (!onsiteEnabled && e.course_format === 'onsite') return false;
        if (languages && e.course_language && !languages.includes(e.course_language as 'fr' | 'es')) return false;
        return true;
      }),
    [events, onsiteEnabled, languages],
  );

  const monday = addDaysToKey(currentMonday, weekOffset * 7);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysToKey(monday, i)), [monday]);

  const byDay = useMemo(() => {
    const map = new Map<string, { lives: SmartCourse[]; sessions: ProgramSession[] }>();
    for (const key of days) map.set(key, { lives: [], sessions: [] });
    for (const e of visibleEvents) {
      const key = dayKeyIn(new Date(e.starts_at), timeZone);
      map.get(key)?.lives.push(e);
    }
    for (const s of programSessions) map.get(s.dayKey)?.sessions.push(s);
    for (const v of map.values()) v.lives.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return map;
  }, [days, visibleEvents, programSessions, timeZone]);

  const nextMondayStart = startOfDayInstant(addDaysToKey(monday, 7), timeZone).getTime();
  const canGoNext = initialEvents ? weekOffset < 1 : windowEnd == null ? weekOffset < 1 : nextMondayStart < windowEnd;
  const canGoPrev = weekOffset > 0;
  const canSubscribe = !initialEvents && (Boolean(tier) || visibleEvents.length > 0);
  const hasSessions = programSessions.length > 0;
  const isDashboard = variant === 'dashboard';
  const mobileLimit = isDashboard ? 3 : 99;
  const minH = isDashboard ? 'min-h-[190px]' : 'min-h-[260px]';

  const dayCard = (key: string, withMinH: boolean) => {
    const entry = byDay.get(key) ?? { lives: [], sessions: [] };
    const isToday = key === todayKey;
    const empty = entry.lives.length === 0 && entry.sessions.length === 0;
    return (
      <div
        key={key}
        className={`${withMinH ? minH : ''} rounded-[1.4rem] bg-white p-3 shadow-[0_10px_26px_-16px_rgba(29,26,23,0.2)] ${
          isToday ? 'ring-1 ring-luxury-orange/40' : ''
        }`}
      >
        <p
          className={`flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] ${
            isToday ? 'text-luxury-orange' : 'text-luxury-soft'
          }`}
        >
          <span>{dayLabel(key, lang)}</span>
          {isToday ? <span className="normal-case tracking-normal">{t.today}</span> : null}
        </p>
        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="h-14 animate-pulse rounded-xl bg-[#faf7f3]" aria-hidden />
          ) : (
            <>
              {entry.sessions.map((s) => (
                <SessionItem key={s.id} session={s} lang={lang} isTodayCard={isToday} />
              ))}
              {entry.lives.map((c) => (
                <LiveItem
                  key={c.id}
                  course={c}
                  lang={lang}
                  timeZone={timeZone}
                  nowMs={nowMs}
                  isTodayCard={isToday}
                  onOpen={setSelected}
                />
              ))}
              {empty ? <p className="pt-1 text-[12px] text-luxury-soft">{t.nothing}</p> : null}
            </>
          )}
        </div>
      </div>
    );
  };

  // Mobile : une carte par jour avec du contenu. Semaine en cours : les jours à venir d'abord, complétés par
  // les derniers jours passés (grisés) pour que la semaine ne paraisse pas vide en fin de semaine.
  const daysWithContent = days.filter((key) => {
    const entry = byDay.get(key);
    return Boolean(entry && (entry.lives.length || entry.sessions.length));
  });
  const mobileDays = loading
    ? days.filter((key) => key === todayKey)
    : pickMobilePlanningDays(daysWithContent, weekOffset === 0 ? todayKey : null, mobileLimit);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">{t.kicker}</p>
          {isDashboard ? (
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-luxury-ink md:mt-2 md:text-[1.7rem]">{t.dashTitle}</h2>
          ) : (
            <h1 className="hero-signature-title mt-2 text-[2.6rem] text-luxury-ink md:text-[4rem]">{t.pageTitle}</h1>
          )}
          <p className={isDashboard ? 'mt-1 text-[13px] text-luxury-muted' : 'hero-signature-subtitle mt-2 text-[14px]'}>
            {t.subtitle} {tzHoursLabel(timeZone, lang)}.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/80 p-1 shadow-[0_6px_16px_-10px_rgba(29,26,23,0.25)]">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={!canGoPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full text-luxury-ink transition hover:bg-[#faf7f3] disabled:opacity-30"
            aria-label={t.prev}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-1.5 text-[13px] font-semibold tabular-nums text-luxury-ink">{weekRangeLabel(monday, lang)}</span>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={!canGoNext}
            className="flex h-8 w-8 items-center justify-center rounded-full text-luxury-ink transition hover:bg-[#faf7f3] disabled:opacity-30"
            aria-label={t.next}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
          {t.error}
        </p>
      ) : null}

      {/* Ordinateur : 7 cartes jour */}
      <div className="hidden gap-2.5 lg:grid lg:grid-cols-7">{days.map((key) => dayCard(key, true))}</div>

      {/* Mobile / tablette : une carte par jour avec du contenu */}
      <div className="space-y-3 lg:hidden">
        {mobileDays.length ? (
          mobileDays.slice(0, mobileLimit).map((key) => dayCard(key, false))
        ) : (
          <p className="rounded-[1.4rem] bg-white px-4 py-5 text-[13px] text-luxury-soft shadow-[0_10px_26px_-16px_rgba(29,26,23,0.2)]">
            {t.nothing}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-luxury-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-[3px] rounded bg-luxury-orange" aria-hidden />
            {t.legendLive}
          </span>
          {hasSessions ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-[3px] rounded bg-[#e6a285]" aria-hidden />
              {t.legendSession}
            </span>
          ) : null}
        </div>
        {isDashboard ? (
          <Link href="/compte/planning" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-luxury-orange">
            {t.full}
            <ArrowRight size={14} aria-hidden />
          </Link>
        ) : canSubscribe ? (
          <SubscribeCalendarButton lang={lang} tone="link" />
        ) : null}
      </div>

      {selected ? <CalendarCourseModal course={selected} lang={lang} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
