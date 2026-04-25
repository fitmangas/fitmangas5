'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarCheck2 } from 'lucide-react';

import { CalendarCourseModal } from '@/components/Calendar/CalendarCourseModal';
import { GlassCard } from '@/components/ui/GlassCard';
import type { NextAppointment } from '@/lib/compte/dashboard';
import type { SmartCourse } from '@/lib/domain/calendar-types';

function buildModalCourse(appointment: NonNullable<NextAppointment>): SmartCourse {
  const base = appointment.smartCourse;
  if (appointment.enrollmentStatus === 'booked') {
    if (base) {
      return {
        ...base,
        access_type: 'full',
        status_label: 'Accès complet',
        viewer_is_admin: base.viewer_is_admin === true,
      };
    }
    return {
      id: appointment.courseId,
      slug: '',
      title: appointment.title,
      description: null,
      course_format: 'online',
      course_category: 'group',
      starts_at: appointment.startsAt,
      ends_at: appointment.endsAt,
      timezone: 'UTC',
      location: null,
      live_url: null,
      jitsi_link: null,
      replay_url: null,
      capacity_max: null,
      viewer_is_admin: false,
      access_type: 'full',
      can_purchase_single: false,
      cta_label: 'Découvrir les abonnements',
      cta_url: '/#offers',
      upsell_tier: null,
      status_label: 'Accès complet',
    };
  }

  if (appointment.enrollmentStatus === 'waitlist') {
    if (base) {
      return {
        ...base,
        access_type: base.access_type === 'locked' ? 'preview' : base.access_type,
        status_label: base.access_type === 'full' ? 'Accès complet' : 'Accès limité',
        viewer_is_admin: false,
      };
    }
    return {
      id: appointment.courseId,
      slug: '',
      title: appointment.title,
      description: null,
      course_format: 'online',
      course_category: 'group',
      starts_at: appointment.startsAt,
      ends_at: appointment.endsAt,
      timezone: 'UTC',
      location: null,
      live_url: null,
      jitsi_link: null,
      replay_url: null,
      capacity_max: null,
      viewer_is_admin: false,
      access_type: 'preview',
      can_purchase_single: false,
      cta_label: 'Découvrir les abonnements',
      cta_url: '/#offers',
      upsell_tier: null,
      status_label: 'Accès limité',
    };
  }

  if (base) return base;

  return {
    id: appointment.courseId,
    slug: '',
    title: appointment.title,
    description: null,
    course_format: 'online',
    course_category: 'group',
    starts_at: appointment.startsAt,
    ends_at: appointment.endsAt,
    timezone: 'UTC',
    location: null,
    live_url: null,
    jitsi_link: null,
    replay_url: null,
    capacity_max: null,
    viewer_is_admin: false,
    access_type: appointment.enrollmentStatus === 'calendar_full' ? 'full' : 'preview',
    can_purchase_single: false,
    cta_label: 'Découvrir les abonnements',
    cta_url: '/#offers',
    upsell_tier: null,
    status_label: appointment.enrollmentStatus === 'calendar_full' ? 'Accès complet' : 'Accès limité',
  };
}

type Props = {
  nextAppointment: NextAppointment;
  liveUnread: number | null;
};

export function NextLiveCompteCard({ nextAppointment, liveUnread }: Props) {
  const [open, setOpen] = useState(false);
  const hasUpcomingLive = nextAppointment != null;

  const modalCourse = useMemo(
    () => (nextAppointment ? buildModalCourse(nextAppointment) : null),
    [nextAppointment],
  );

  return (
    <>
      <GlassCard className="relative p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Prochain live</p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-luxury-ink">
              {hasUpcomingLive ? nextAppointment.title : 'Aucun live planifié'}
            </p>
            <p className="mt-2 text-xs text-luxury-muted">
              {hasUpcomingLive
                ? new Date(nextAppointment.startsAt).toLocaleString('fr-FR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Réserve une séance depuis le calendrier ci-dessous.'}
            </p>
          </div>
          <span className="kpi-icon-wrap kpi-icon-wrap--violet shrink-0">
            <CalendarCheck2 size={20} aria-hidden strokeWidth={2} />
          </span>
        </div>
        {liveUnread && liveUnread > 0 ? (
          <span className="absolute right-3 top-3 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(255,59,48,0.45)] ring-2 ring-white">
            {liveUnread > 99 ? '99+' : liveUnread}
          </span>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {hasUpcomingLive ? (
            <>
              <button type="button" className="btn-luxury-ghost relative z-20 min-h-[46px] min-w-[160px]" onClick={() => setOpen(true)}>
                Détails
              </button>
              <Link
                href={`/live/${nextAppointment.courseId}`}
                className="btn-luxury-primary relative z-20 min-h-[46px] min-w-[160px]"
              >
                Rejoindre
              </Link>
            </>
          ) : (
            <Link href="/compte/planning" className="btn-luxury-ghost relative z-20 min-h-[46px] min-w-[160px]">
              Voir planning
            </Link>
          )}
        </div>
      </GlassCard>

      <CalendarCourseModal course={open ? modalCourse : null} onClose={() => setOpen(false)} />
    </>
  );
}
