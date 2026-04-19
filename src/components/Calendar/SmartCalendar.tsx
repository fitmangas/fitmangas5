'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus2, Lock, Unlock, X, RefreshCw } from 'lucide-react';
import type { AccessType, SmartCourse } from '@/lib/domain/calendar-types';
import { FORTNIGHT_DAYS, getUtcFortnightWindow, isCoursePast } from '@/lib/calendar-window';

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

/** Clé jour UTC pour regrouper avec les événements (starts_at ISO). */
function utcDayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Les 14 jours de la fenêtre (UTC), du jour courant inclus. */
function getFortnightUtcDays() {
  const { start } = getUtcFortnightWindow();
  const days: Date[] = [];
  for (let i = 0; i < FORTNIGHT_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    days.push(d);
  }
  return days;
}

function classForAccess(access: AccessType) {
  if (access === 'full') {
    return 'border-brand-accent/35 bg-white text-brand-ink shadow-[0_4px_14px_rgba(0,0,0,0.04)]';
  }
  if (access === 'preview') {
    return 'border-brand-ink/10 bg-brand-sand/25 text-brand-ink/65';
  }
  return 'border-brand-ink/10 bg-brand-ink/[0.03] text-brand-ink/45 blur-[1px]';
}

function badgeForAccess(access: AccessType) {
  if (access === 'full') return 'Accès complet';
  if (access === 'preview') return 'Accès limité';
  return 'Accès refusé';
}

/** Admin ou accès complet déclaré. */
function effectiveAccessForUi(course: SmartCourse): AccessType {
  if (course.viewer_is_admin === true || course.access_type === 'full') {
    return 'full';
  }
  return course.access_type;
}

function formatFortnightSubtitle() {
  const days = getFortnightUtcDays();
  const first = days[0];
  const last = days[days.length - 1];
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  };
  const from = first.toLocaleDateString('fr-FR', opts);
  const to = last.toLocaleDateString('fr-FR', opts);
  return `${from} → ${to}`;
}

export function SmartCalendar() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<SmartCourse[]>([]);
  const [tier, setTier] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SmartCourse | null>(null);

  const fortnightDays = getFortnightUtcDays();

  const monthlyTier = useMemo(
    () => tier === 'online_individual_monthly' || tier === 'online_group_monthly',
    [tier],
  );

  const selectedIsPast = selectedCourse
    ? isCoursePast(selectedCourse.ends_at)
    : false;

  async function fetchEvents(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/calendar/events');
      const json = (await res.json()) as ApiResponse | { error: string };
      if (!res.ok || !('events' in json)) {
        setError('error' in json ? json.error : 'Impossible de charger les événements.');
        return;
      }
      setTier(json.tier);
      setEvents(json.events);
    } catch {
      setError('Erreur réseau. Réessaie dans un instant.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchEvents();
  }, []);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, SmartCourse[]>();
    events.forEach((event) => {
      const key = utcDayKey(event.starts_at);
      const dayEvents = map.get(key) ?? [];
      dayEvents.push(event);
      map.set(key, dayEvents);
    });
    return map;
  }, [events]);

  return (
    <section className="rounded-[28px] border border-brand-ink/[0.05] bg-white p-5 shadow-[0_12px_48px_rgba(0,0,0,0.04)] sm:p-7">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-accent/90">Calendrier intelligent</p>
          <h2 className="mt-1.5 font-serif text-2xl italic tracking-tight text-brand-ink md:text-[1.65rem]">Tes cours</h2>
          <p className="mt-2 text-xs leading-relaxed text-brand-ink/48">
            Prochains {FORTNIGHT_DAYS} jours · {formatFortnightSubtitle()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchEvents(true)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-ink/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-ink/60 hover:bg-brand-sand/30"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-brand-ink/55">Seules les séances à venir dans cette fenêtre sont affichées.</p>
        {monthlyTier ? (
          <a
            href="/api/calendar/export-ical"
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:opacity-90"
          >
            <CalendarPlus2 size={14} />
            Ajouter à Google Calendar
          </a>
        ) : (
          <p className="text-xs text-brand-ink/45">Export Google Calendar réservé aux abonnements mensuels.</p>
        )}
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {/* 2 semaines : grille 7 + 7 jours */}
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] uppercase tracking-widest text-brand-ink/35">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {loading
          ? Array.from({ length: 14 }, (_, index) => (
              <div key={index} className="min-h-24 animate-pulse rounded-xl bg-brand-sand/20" />
            ))
          : fortnightDays.map((date) => {
              const key = date.toISOString().slice(0, 10);
              const dayEvents = groupedByDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  className="min-h-24 rounded-xl border border-brand-ink/[0.05] bg-brand-beige/25 p-1.5"
                >
                  <div className="mb-1 text-[11px] font-semibold text-brand-ink/65">
                    {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
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
                      <p className="px-1 text-[9px] text-brand-ink/45">+{dayEvents.length - 3}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>

      {selectedCourse ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-ink/45 p-0 sm:items-center sm:p-6">
          <div className="relative z-10 w-full max-w-md rounded-t-[30px] border border-brand-ink/[0.08] bg-white p-6 shadow-2xl sm:rounded-[30px]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-accent">
                  {selectedCourse.course_format === 'online' ? 'En ligne' : 'Présentiel'} ·{' '}
                  {selectedCourse.course_category === 'group' ? 'Collectif' : 'Individuel'}
                </p>
                <h3 className="mt-1 font-serif text-2xl italic">{selectedCourse.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="rounded-full border border-brand-ink/10 p-2 text-brand-ink/45 hover:bg-brand-sand/30"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mb-3 text-sm text-brand-ink/70">
              {new Date(selectedCourse.starts_at).toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="mb-4 text-sm text-brand-ink/70">{selectedCourse.description || 'Description à venir.'}</p>

            {selectedIsPast ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-ink/15 bg-brand-ink/[0.04] px-3 py-1 text-xs text-brand-ink/70">
                  Séance terminée · plus de réservation
                </div>
                {effectiveAccessForUi(selectedCourse) === 'full' && selectedCourse.replay_url ? (
                  <a
                    href={selectedCourse.replay_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-brand-ink/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-ink/75"
                  >
                    Voir le replay
                  </a>
                ) : null}
              </div>
            ) : effectiveAccessForUi(selectedCourse) === 'full' ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                  <Unlock size={12} />
                  Accès complet
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.jitsi_link ? (
                    <Link
                      href={`/live/${selectedCourse.id}`}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-emerald-700/20 hover:bg-emerald-700"
                    >
                      REJOINDRE LE LIVE
                    </Link>
                  ) : selectedCourse.live_url ? (
                    <a
                      href={selectedCourse.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-brand-accent px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                    >
                      Rejoindre le live
                    </a>
                  ) : null}
                  {selectedCourse.replay_url ? (
                    <a
                      href={selectedCourse.replay_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-brand-ink/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-ink/75"
                    >
                      Voir le replay
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
                  <Lock size={12} />
                  {selectedCourse.access_type === 'preview' ? 'Accès limité' : 'Accès refusé'}
                </div>
                <p className="text-sm text-brand-ink/65">
                  Cet événement est visible pour te guider, mais il n’est pas inclus dans ton plan actuel.
                </p>
                <a
                  href={selectedCourse.cta_url ?? '/#offers'}
                  className="inline-flex rounded-full bg-brand-accent px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                >
                  {selectedCourse.cta_label ?? 'Débloquer'}
                </a>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedCourse(null)}
            className="absolute inset-0"
            aria-label="Fermer la modale"
          />
        </div>
      ) : null}
    </section>
  );
}
