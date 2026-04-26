'use client';

import Link from 'next/link';
import { Lock, Unlock, X } from 'lucide-react';

import type { SmartCourse } from '@/lib/domain/calendar-types';
import { isCoursePast } from '@/lib/calendar-window';

import { effectiveAccessForUi } from '@/lib/calendar-course-ui';

type Props = {
  course: SmartCourse | null;
  onClose: () => void;
};

export function CalendarCourseModal({ course, onClose }: Props) {
  if (!course) return null;

  const selectedIsPast = isCoursePast(course.ends_at);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative z-10 w-full max-w-md rounded-t-[1.75rem] border border-white/35 bg-white/[0.42] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)] backdrop-blur-[22px] sm:rounded-[1.75rem]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">
              {course.course_format === 'online' ? 'En ligne' : 'Présentiel'} ·{' '}
              {course.course_category === 'group' ? 'Collectif' : 'Individuel'}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-luxury-ink">{course.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/40 bg-white/30 p-2 text-luxury-soft transition hover:bg-white/50"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>

        <p className="mb-3 text-sm text-luxury-muted">
          {new Date(course.starts_at).toLocaleString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p className="mb-4 text-sm text-luxury-muted">{course.description || 'Description à venir.'}</p>

        {selectedIsPast ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/30 px-3 py-1 text-xs text-luxury-muted backdrop-blur-sm">
              Séance terminée · plus de réservation
            </div>
            {effectiveAccessForUi(course) === 'full' && course.replay_url ? (
              <a
                href={course.replay_url}
                target="_blank"
                rel="noreferrer"
                className="btn-luxury-ghost rounded-full px-4 py-2 text-[10px] tracking-[0.12em]"
              >
                Voir le replay
              </a>
            ) : null}
          </div>
        ) : effectiveAccessForUi(course) === 'full' ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
              <Unlock size={12} />
              Accès complet
            </div>
            <div className="flex flex-wrap gap-2">
              {course.jitsi_link ? (
                <Link
                  href={`/live/${course.id}`}
                  className="btn-luxury-primary px-5 py-2.5 text-[10px] tracking-[0.14em]"
                >
                  REJOINDRE LE LIVE
                </Link>
              ) : course.live_url ? (
                <a
                  href={course.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-luxury-primary px-5 py-2.5 text-[10px] tracking-[0.14em]"
                >
                  Rejoindre le live
                </a>
              ) : null}
              {course.replay_url ? (
                <a
                  href={course.replay_url}
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
              {course.access_type === 'preview' ? 'Accès limité' : 'Accès refusé'}
            </div>
            <p className="text-sm text-luxury-muted">
              Cet événement est visible pour te guider, mais il n’est pas inclus dans ton plan actuel.
            </p>
            <a
              href={course.cta_url ?? '/#offers'}
              className="btn-luxury-primary inline-flex px-5 py-2.5 text-[10px] tracking-[0.14em]"
            >
              {course.cta_label ?? 'Débloquer'}
            </a>
          </div>
        )}
      </div>
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Fermer la modale" />
    </div>
  );
}
