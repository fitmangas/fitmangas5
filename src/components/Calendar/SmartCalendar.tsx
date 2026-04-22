'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus2, Lock, Unlock, X } from 'lucide-react';
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
    return 'border-emerald-400/45 bg-white/55 text-luxury-ink shadow-[0_4px_14px_rgba(16,185,129,0.12)] backdrop-blur-sm';
  }
  if (access === 'preview') {
    return 'border-orange-300/40 bg-orange-50/40 text-luxury-muted backdrop-blur-sm';
  }
  return 'border-white/25 bg-slate-900/[0.06] text-luxury-soft blur-[0.5px]';
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

  async function fetchEvents() {
    setLoading(true);
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
    <section className="glass-card rounded-[1.75rem] p-5 sm:p-7">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Calendrier intelligent</p>
          <p className="mt-2 text-sm leading-relaxed text-luxury-muted">
            Prochains {FORTNIGHT_DAYS} jours · {formatFortnightSubtitle()}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {monthlyTier ? (
          <a
            href="/api/calendar/export-ical"
            className="btn-luxury-primary inline-flex items-center gap-2 px-5 py-2.5 text-[10px] tracking-[0.14em]"
          >
            <CalendarPlus2 size={14} />
            Ajouter à Google Calendar
          </a>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {/* 2 semaines : grille 7 + 7 jours */}
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] uppercase tracking-widest text-luxury-soft">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {loading
          ? Array.from({ length: 14 }, (_, index) => (
              <div key={index} className="min-h-24 animate-pulse rounded-xl bg-white/35" />
            ))
          : fortnightDays.map((date) => {
              const key = date.toISOString().slice(0, 10);
              const dayEvents = groupedByDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  className="min-h-24 rounded-xl border border-white/35 bg-white/25 p-1.5 backdrop-blur-md"
                >
                  <div className="mb-1 text-[11px] font-semibold text-luxury-muted">
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
                      <p className="px-1 text-[9px] text-luxury-soft">+{dayEvents.length - 3}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>

      {selectedCourse ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="relative z-10 w-full max-w-md rounded-t-[1.75rem] border border-white/35 bg-white/[0.42] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)] backdrop-blur-[22px] sm:rounded-[1.75rem]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">
                  {selectedCourse.course_format === 'online' ? 'En ligne' : 'Présentiel'} ·{' '}
                  {selectedCourse.course_category === 'group' ? 'Collectif' : 'Individuel'}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-luxury-ink">{selectedCourse.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="rounded-full border border-white/40 bg-white/30 p-2 text-luxury-soft transition hover:bg-white/50"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mb-3 text-sm text-luxury-muted">
              {new Date(selectedCourse.starts_at).toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="mb-4 text-sm text-luxury-muted">{selectedCourse.description || 'Description à venir.'}</p>

            {selectedIsPast ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/30 px-3 py-1 text-xs text-luxury-muted backdrop-blur-sm">
                  Séance terminée · plus de réservation
                </div>
                {effectiveAccessForUi(selectedCourse) === 'full' && selectedCourse.replay_url ? (
                  <a
                    href={selectedCourse.replay_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-luxury-ghost rounded-full px-4 py-2 text-[10px] tracking-[0.12em]"
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
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105"
                    >
                      REJOINDRE LE LIVE
                    </Link>
                  ) : selectedCourse.live_url ? (
                    <a
                      href={selectedCourse.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-luxury-primary px-5 py-2.5 text-[10px] tracking-[0.14em]"
                    >
                      Rejoindre le live
                    </a>
                  ) : null}
                  {selectedCourse.replay_url ? (
                    <a
                      href={selectedCourse.replay_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-luxury-ghost rounded-full px-4 py-2 text-[10px] tracking-[0.12em]"
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
                <p className="text-sm text-luxury-muted">
                  Cet événement est visible pour te guider, mais il n’est pas inclus dans ton plan actuel.
                </p>
                <a
                  href={selectedCourse.cta_url ?? '/#offers'}
                  className="btn-luxury-primary inline-flex px-5 py-2.5 text-[10px] tracking-[0.14em]"
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
