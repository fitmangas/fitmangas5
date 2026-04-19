import Link from 'next/link';

import { getMonthlyProgress, getNextAppointment, type MonthlyProgress, type NextAppointment } from '@/lib/compte/dashboard';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';

function NextAppointmentCard({ appointment }: { appointment: NextAppointment }) {
  if (!appointment) {
    return (
      <article className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Prochain rendez-vous</p>
        <p className="mt-4 font-serif text-xl italic text-brand-ink/55">Aucune réservation à venir</p>
        <p className="mt-2 text-sm text-brand-ink/45">Réserve une séance depuis le calendrier ci-dessous.</p>
      </article>
    );
  }

  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const now = Date.now();
  const liveWindow = now >= start.getTime() && now <= end.getTime();

  return (
    <article className="rounded-[28px] border border-brand-accent/20 bg-gradient-to-br from-white to-brand-sand/20 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Prochain rendez-vous</p>
      <h2 className="mt-4 font-serif text-2xl italic leading-snug text-brand-ink">{appointment.title}</h2>
      <p className="mt-3 text-sm text-brand-ink/60">
        {start.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
      </p>
      {liveWindow ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">En direct maintenant</p>
      ) : null}
      <div className="mt-8">
        <Link
          href={`/live/${appointment.courseId}`}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand-accent px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_32px_rgba(0,0,0,0.14)] transition hover:opacity-93"
        >
          Rejoindre
        </Link>
      </div>
    </article>
  );
}

function MonthlyProgressCard({ progress }: { progress: MonthlyProgress }) {
  const pct = Math.min(100, Math.round((progress.followedCount / Math.max(progress.goal, 1)) * 100));

  return (
    <article className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Progression mensuelle</p>
      <p className="mt-4 font-serif text-3xl italic tabular-nums text-brand-ink">
        {progress.followedCount}{' '}
        <span className="text-lg font-normal not-italic text-brand-ink/45">/ {progress.goal}</span>
      </p>
      <p className="mt-2 text-sm text-brand-ink/50">Cours suivis ce mois-ci (séances terminées).</p>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-brand-ink/[0.06]">
        <div
          className="h-full rounded-full bg-brand-accent transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-brand-ink/38">Objectif mensuel personnalisable (variable d’environnement, défaut 8).</p>
    </article>
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
