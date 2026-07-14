'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Unlock, X } from 'lucide-react';

import type { SmartCourse } from '@/lib/domain/calendar-types';
import { DEFAULT_CALENDAR_TIMEZONE, isCoursePast } from '@/lib/calendar-window';
import { getCoachImage } from '@/lib/coach-images';

import { effectiveAccessForUi } from '@/lib/calendar-course-ui';

import { SubscribeCalendarButton } from './SubscribeCalendarButton';
import { CourseLanguageFlag } from './CourseLanguageFlag';

type Props = {
  course: SmartCourse | null;
  onClose: () => void;
  lang?: 'fr' | 'en' | 'es';
};

export function CalendarCourseModal({ course, onClose, lang = 'fr' }: Props) {
  const isOpen = course != null;

  // Bloque le défilement de la page tant que la modale est ouverte
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!course) return null;

  const selectedIsPast = isCoursePast(course.ends_at);
  const coachImageSrc = getCoachImage(0);
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
  const t =
    lang === 'en'
      ? {
          online: 'Online',
          inPerson: 'In person',
          group: 'Group',
          solo: 'Individual',
          close: 'Close',
          descFallback: 'Description coming soon.',
          ended: 'Session ended · no booking',
          replay: 'Watch replay',
          full: 'Full access',
          joinUpper: 'JOIN LIVE',
          join: 'Join live',
          limited: 'Limited access',
          denied: 'Access denied',
          lockedDesc: 'This event is visible for guidance, but not included in your current plan.',
          unlock: 'Unlock',
          closeModal: 'Close modal',
        }
      : lang === 'es'
        ? {
            online: 'En línea',
            inPerson: 'Presencial',
            group: 'Grupal',
            solo: 'Individual',
            close: 'Cerrar',
            descFallback: 'Descripción próximamente.',
            ended: 'Sesión terminada · sin reserva',
            replay: 'Ver replay',
            full: 'Acceso completo',
            joinUpper: 'UNIRSE AL LIVE',
            join: 'Unirse al live',
            limited: 'Acceso limitado',
            denied: 'Acceso denegado',
            lockedDesc: 'Este evento es visible como guía, pero no está incluido en tu plan actual.',
            unlock: 'Desbloquear',
            closeModal: 'Cerrar modal',
          }
        : {
            online: 'En ligne',
            inPerson: 'Présentiel',
            group: 'Collectif',
            solo: 'Individuel',
            close: 'Fermer',
            descFallback: 'Description à venir.',
            ended: 'Séance terminée · plus de réservation',
            replay: 'Voir le replay',
            full: 'Accès complet',
            joinUpper: 'REJOINDRE LE LIVE',
            join: 'Rejoindre le live',
            limited: 'Accès limité',
            denied: 'Accès refusé',
            lockedDesc: 'Cet événement est visible pour te guider, mais il n’est pas inclus dans ton plan actuel.',
            unlock: 'Débloquer',
            closeModal: 'Fermer la modale',
          };

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6">
      <button type="button" onClick={onClose} className="absolute inset-0 cursor-default" aria-label={t.closeModal} />
      <div
        className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-white/80 bg-brand-beige p-6 shadow-[0_14px_32px_rgba(31,27,22,0.2),0_32px_64px_-28px_rgba(21,18,15,0.4)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-orange">
              {course.course_format === 'online' ? t.online : t.inPerson} ·{' '}
              {course.course_category === 'group' ? t.group : t.solo}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-luxury-ink">{course.title}</h3>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <CourseLanguageFlag language={course.course_language} uiLang={lang} className="mt-1" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-ink/10 bg-white p-2 text-luxury-soft shadow-sm transition hover:bg-white/90 hover:text-luxury-ink"
              aria-label={t.close}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <p className="mb-3 text-sm text-luxury-muted">
          {new Date(course.starts_at).toLocaleString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: course.timezone?.trim() || DEFAULT_CALENDAR_TIMEZONE,
          })}
        </p>
        <p className="mb-4 text-sm text-luxury-muted">{course.description || t.descFallback}</p>

        <div style={{ position: 'relative', zIndex: 2 }}>
        {selectedIsPast ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-ink/10 bg-white px-3 py-1 text-xs text-luxury-muted shadow-sm">
              {t.ended}
            </div>
            {effectiveAccessForUi(course) === 'full' && course.replay_url ? (
              <a
                href={course.replay_url}
                target="_blank"
                rel="noreferrer"
                className="btn-luxury-ghost rounded-full px-4 py-2 text-[10px] tracking-[0.12em]"
              >
                {t.replay}
              </a>
            ) : null}
          </div>
        ) : effectiveAccessForUi(course) === 'full' ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
              <Unlock size={12} />
              {t.full}
            </div>
            <div className="flex flex-wrap gap-2">
              {course.jitsi_link ? (
                <Link
                  href={`/live/${course.id}`}
                  className="btn-luxury-primary px-5 py-2.5 text-[10px] tracking-[0.14em]"
                >
                  {t.joinUpper}
                </Link>
              ) : course.live_url ? (
                <a
                  href={course.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-luxury-primary px-5 py-2.5 text-[10px] tracking-[0.14em]"
                >
                  {t.join}
                </a>
              ) : null}
              {course.replay_url ? (
                <a
                  href={course.replay_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-luxury-ghost rounded-full px-4 py-2 text-[10px] tracking-[0.12em]"
                >
                  {t.replay}
                </a>
              ) : null}
              <SubscribeCalendarButton lang={lang} tone="ghost" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              <Lock size={12} />
              {course.access_type === 'preview' ? t.limited : t.denied}
            </div>
            <p className="text-sm text-luxury-muted">
              {t.lockedDesc}
            </p>
            <a
              href={course.cta_url ?? '/#offers'}
              className="btn-luxury-primary inline-flex px-5 py-2.5 text-[10px] tracking-[0.14em]"
            >
              {course.cta_label ?? t.unlock}
            </a>
          </div>
        )}
        </div>
        <img
          src={coachImageSrc}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '8px',
            height: '120px',
            width: 'auto',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
