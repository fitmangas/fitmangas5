'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { SmartCourse } from '@/lib/domain/calendar-types';
import { isOnsiteEnabled } from '@/lib/onsite/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { CourseLanguageFlag } from '@/components/Calendar/CourseLanguageFlag';
import { CalendarCourseModal } from '@/components/Calendar/CalendarCourseModal';
import { isCourseLanguage } from '@/lib/course-language';

type ProgramSession = {
  id: string;
  dayKey: string;
  title: string;
  stepLabel: string;
  durationMin: number;
  href: string;
  done?: boolean;
  isToday?: boolean;
};

type Props = {
  lang?: 'fr' | 'en' | 'es';
  compact?: boolean;
  programSessions?: ProgramSession[];
  preview?: boolean;
};

function dayKey(d: Date, tz = 'Europe/Paris') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function PlanningV3({ lang = 'fr', compact = false, programSessions = [], preview = false }: Props) {
  const [events, setEvents] = useState<SmartCourse[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<SmartCourse | null>(null);
  const locale = lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-GB' : 'fr-FR';
  const showPrograms = isProgrammesEnabled() && programSessions.length > 0;
  const todayKey = dayKey(new Date());

  useEffect(() => {
    if (preview) {
      const start = new Date();
      start.setHours(18, 30, 0, 0);
      const end = new Date(start.getTime() + 55 * 60000);
      setEvents([
        {
          id: 'preview-live',
          slug: 'preview-live',
          title: 'Barre / Pilates Flow',
          description: null,
          course_format: 'online',
          course_category: 'group',
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          timezone: 'Europe/Paris',
          location: null,
          live_url: null,
          jitsi_link: null,
          replay_url: null,
          capacity_max: null,
          course_language: 'fr',
          access_type: 'full',
          can_purchase_single: false,
          cta_label: null,
          cta_url: null,
          upsell_tier: null,
          status_label: 'Accès complet',
        },
      ]);
      return;
    }
    let cancelled = false;
    fetch('/api/calendar/events')
      .then((r) => r.json())
      .then((json: { events?: SmartCourse[] }) => {
        if (cancelled) return;
        const raw = json.events ?? [];
        setEvents(isOnsiteEnabled() ? raw : raw.filter((e) => e.course_format !== 'onsite'));
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => {
    const list: Date[] = [];
    const n = compact ? 3 : 7;
    const base = compact ? new Date() : weekStart;
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < n; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, [weekStart, compact]);

  return (
    <div>
      {!compact ? (
        <div className="mb-3 flex items-center justify-between">
          <button type="button" className="text-[13px] font-semibold text-luxury-orange" onClick={() => setWeekStart((d) => new Date(d.getTime() - 7 * 86400000))}>
            ← {lang === 'es' ? 'Semana anterior' : 'Semaine précédente'}
          </button>
          <button type="button" className="text-[13px] font-semibold text-luxury-orange" onClick={() => setWeekStart((d) => new Date(d.getTime() + 7 * 86400000))}>
            {lang === 'es' ? 'Semana siguiente' : 'Semaine suivante'} →
          </button>
        </div>
      ) : null}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'md:grid-cols-7'}`}>
        {days.map((d) => {
          const key = dayKey(d);
          const isToday = key === todayKey;
          const lives = events.filter((e) => dayKey(new Date(e.starts_at), e.timezone || 'Europe/Paris') === key);
          const sessions = showPrograms ? programSessions.filter((s) => s.dayKey === key) : [];
          return (
            <article
              key={key}
              className={`rounded-[1.4rem] bg-white p-3 shadow-[0_10px_28px_-18px_rgba(29,26,23,0.18)] ${isToday ? 'ring-1 ring-[#C45D3E]' : ''}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-ink/50">
                {d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric' })}
                {isToday ? ` · ${lang === 'es' ? 'hoy' : 'aujourd’hui'}` : ''}
              </p>
              <div className="mt-2 space-y-2">
                {lives.map((live) => {
                  const start = new Date(live.starts_at);
                  const past = start.getTime() < Date.now();
                  const time = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={live.id}
                      type="button"
                      onClick={() => setSelected(live)}
                      className={`flex w-full flex-col items-start rounded-xl border-l-[3px] border-[#C45D3E] bg-[#FAF7F3] px-3 py-2 text-left ${past && live.replay_url ? 'opacity-60' : ''}`}
                    >
                      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-ink">
                        {time}
                        <CourseLanguageFlag language={isCourseLanguage(live.course_language) ? live.course_language : null} className="text-sm" />
                      </p>
                      <p className="text-[13px] text-brand-ink/80">{live.title}</p>
                      <p className="text-[11px] text-brand-ink/50">
                        {past && live.replay_url ? (lang === 'es' ? 'Ver el replay' : 'Voir le replay') : isToday ? (lang === 'es' ? 'Unirse →' : 'Rejoindre →') : 'Visio'}
                      </p>
                    </button>
                  );
                })}
                {sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={s.href}
                    className={`block rounded-xl border-l-[3px] border-[#E6A285] bg-[#FDF2EC] px-3 py-2 ${s.done ? 'opacity-60' : ''}`}
                  >
                    <p className="text-[12px] font-semibold text-[#B0583A]">{s.stepLabel}</p>
                    <p className="text-[13px] text-brand-ink">{s.title}</p>
                    <p className="text-[11px] text-brand-ink/50">
                      {s.done ? (lang === 'es' ? 'Hecha' : 'Faite') : isToday ? (lang === 'es' ? 'Empezar →' : 'Commencer →') : `Vidéo · ${s.durationMin} min`}
                    </p>
                  </Link>
                ))}
                {lives.length === 0 && sessions.length === 0 ? (
                  <p className="px-1 py-3 text-[13px] text-brand-ink/45">{lang === 'es' ? 'Nada previsto' : 'Rien de prévu'}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {compact ? (
        <p className="mt-3">
          <Link href="/compte/planning" className="text-[13px] font-semibold text-luxury-orange">
            {lang === 'es' ? 'Planning completo →' : 'Planning complet →'}
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-[12px] text-brand-ink/45">
          {lang === 'es' ? 'Live con Alejandra' : 'Live avec Alejandra'}
          {showPrograms ? ` · ${lang === 'es' ? 'Tu sesión del programa' : 'Ta séance du programme'}` : ''}
        </p>
      )}
      {selected ? <CalendarCourseModal course={selected} lang={lang} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
