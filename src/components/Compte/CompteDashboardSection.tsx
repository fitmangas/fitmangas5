import Link from 'next/link';
import { Activity, Calendar, Sparkles } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { getMonthlyProgress, getNextAppointment, type MonthlyProgress, type NextAppointment } from '@/lib/compte/dashboard';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';

import { MonthlyProgressRing } from './MonthlyProgressRing';

function NextAppointmentCard({ appointment }: { appointment: NextAppointment }) {
  if (!appointment) {
    return (
      <GlassCard className="p-8 md:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-luxury-soft">Prochain rendez-vous</p>
            <p className="mt-4 text-lg font-semibold tracking-tight text-luxury-ink">Aucune réservation à venir</p>
            <p className="mt-2 text-sm text-luxury-muted">Réserve une séance depuis le calendrier ci-dessous.</p>
          </div>
          <span className="kpi-icon-wrap kpi-icon-wrap--violet shrink-0">
            <Calendar size={20} aria-hidden strokeWidth={2} />
          </span>
        </div>
      </GlassCard>
    );
  }

  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const now = Date.now();
  const liveWindow = now >= start.getTime() && now <= end.getTime();

  return (
    <GlassCard className="p-8 md:p-9">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-luxury-soft">Prochain rendez-vous</p>
          <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-luxury-ink">{appointment.title}</h2>
          <p className="mt-3 text-sm text-luxury-muted">
            {start.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
          {liveWindow ? (
            <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
              En direct maintenant
            </p>
          ) : null}
          <div className="mt-8">
            <Link href={`/live/${appointment.courseId}`} className="btn-luxury-primary min-h-[48px] min-w-[160px]">
              Rejoindre
            </Link>
          </div>
        </div>
        <span className="kpi-icon-wrap kpi-icon-wrap--orange shrink-0">
          <Sparkles size={20} aria-hidden strokeWidth={2} />
        </span>
      </div>
    </GlassCard>
  );
}

function MonthlyProgressCard({ progress }: { progress: MonthlyProgress }) {
  return (
    <GlassCard className="flex flex-col p-8 md:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-luxury-soft">Progression mensuelle</p>
          <p className="mt-2 text-sm text-luxury-muted">Cours suivis ce mois-ci (séances terminées)</p>
        </div>
        <span className="kpi-icon-wrap kpi-icon-wrap--green shrink-0">
          <Activity size={20} aria-hidden strokeWidth={2} />
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <MonthlyProgressRing followedCount={progress.followedCount} goal={progress.goal} />
      </div>
      <p className="mt-4 text-center text-[11px] text-luxury-muted">
        Objectif modifiable via <span className="font-mono text-[10px] text-luxury-soft">NEXT_PUBLIC_MONTHLY_SESSION_GOAL</span>
      </p>
    </GlassCard>
  );
}

export async function CompteDashboardSection({ userId }: { userId: string }) {
  const goal = getMonthlySessionGoal();
  const [appointment, monthly] = await Promise.all([
    getNextAppointment(userId),
    getMonthlyProgress(userId, goal),
  ]);

  return (
    <section className="grid gap-8 md:grid-cols-2">
      <NextAppointmentCard appointment={appointment} />
      <MonthlyProgressCard progress={monthly} />
    </section>
  );
}
