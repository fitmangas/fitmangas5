import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenText, CalendarCheck2, PlayCircle, Target } from 'lucide-react';

import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { MonthlyProgressRing } from '@/components/Compte/MonthlyProgressRing';
import { MyReplaysSection } from '@/components/Replay/MyReplaysSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { getNextAppointment, getMonthlyProgress } from '@/lib/compte/dashboard';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';
import { getReplayLibraryForUser } from '@/lib/replay-library';
import { createClient } from '@/lib/supabase/server';

function weeklyMotivation(firstName: string): string {
  const lines = [
    `Nouvelle semaine ${firstName} : avance avec constance, même à petits pas.`,
    `${firstName}, chaque séance compte. Cette semaine, on garde le rythme.`,
    `Objectif de la semaine ${firstName} : rester régulière et fière de ton énergie.`,
    `${firstName}, focus sur toi cette semaine : présence, souffle et progression.`,
    `Semaine en cours : discipline douce, résultats durables. Tu es sur la bonne voie ${firstName}.`,
  ];
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekIndex = Math.floor((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return lines[((weekIndex % lines.length) + lines.length) % lines.length];
}

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const params = await searchParams;
  const checkoutOk = params.checkout === 'success';
  const goal = getMonthlySessionGoal();

  const [{ data: profile }, monthly, nextAppointment, replayItems, { count: unreadNotifications }, { count: replayUnread }, { count: blogUnread }, { count: liveUnread }] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).maybeSingle(),
    getMonthlyProgress(user.id, goal),
    getNextAppointment(user.id),
    getReplayLibraryForUser(user.id),
    supabase.from('user_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kind', 'replay_video')
      .is('read_at', null),
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kind', 'blog_article')
      .is('read_at', null),
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('kind', ['live_course', 'planning_live'])
      .is('read_at', null),
  ]);

  const firstName = profile?.first_name?.trim() || 'Alejandra';
  const motivation = weeklyMotivation(firstName);
  const replayCount = replayItems.length;
  const remainingToGoal = Math.max(monthly.goal - monthly.followedCount, 0);
  const hasUpcomingLive = !!nextAppointment;

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 pb-16 md:space-y-10 md:px-8">
      <section className="grid items-center gap-4 pt-2 md:grid-cols-[1fr_auto]">
        <div className="text-center md:text-center">
          <h1 className="hero-signature-title text-5xl text-luxury-ink md:text-6xl">Bonjour {firstName}</h1>
          <p className="hero-signature-subtitle mt-1 text-sm md:text-base">{motivation}</p>
          {checkoutOk ? (
            <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-emerald-300/60 bg-emerald-50/90 px-5 py-3.5 text-sm font-medium leading-relaxed text-emerald-950">
              Paiement enregistre. Tu recevras la confirmation par e-mail (recu Stripe). Ton acces au calendrier est mis a jour.
            </p>
          ) : null}
        </div>
        <details className="relative z-[120]">
          <summary className="relative flex cursor-pointer list-none flex-col items-center gap-2 rounded-[2rem] border border-white/60 bg-white/65 px-4 py-3 shadow-[0_12px_32px_rgba(29,29,31,0.12)] backdrop-blur-xl [&::-webkit-details-marker]:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/client-contact-photo.png"
              alt="Coach IA"
              className="h-[88px] w-[88px] rounded-full object-cover object-top ring-1 ring-white/70"
            />
            {unreadNotifications && unreadNotifications > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_rgba(255,59,48,0.45)] ring-2 ring-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            ) : null}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/85 text-base font-semibold text-luxury-ink">
              +
            </span>
          </summary>
          <div className="absolute right-0 z-[140] mt-2 w-56 rounded-3xl border border-white/70 bg-white/90 p-2 shadow-[0_18px_42px_rgba(29,29,31,0.15)] backdrop-blur-xl">
            <Link href="/compte/profil" className="block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
              Mon profil
            </Link>
            <Link href="/compte/profil#notifications" className="mt-1 flex items-center justify-between rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
              <span>Notifications</span>
              {unreadNotifications && unreadNotifications > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_rgba(255,59,48,0.45)]">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              ) : null}
            </Link>
            <Link href="/" className="mt-1 block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
              Retour au site
            </Link>
            <form action="/auth/signout" method="post" className="mt-1">
              <button type="submit" className="w-full rounded-2xl px-4 py-2 text-left text-sm text-luxury-ink transition hover:bg-white/70">
                Deconnexion
              </button>
            </form>
          </div>
        </details>
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Tableau de bord</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">Ton suivi en direct</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <GlassCard className="relative p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Progression mensuelle</p>
                <p className="mt-2 text-xs text-luxury-muted">Cours suivis ce mois-ci</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--green shrink-0">
                <Target size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            <div className="mt-1 flex justify-center">
              <MonthlyProgressRing followedCount={monthly.followedCount} goal={monthly.goal} />
            </div>
          </GlassCard>

          <GlassCard className="relative p-5 md:p-6">
            <Link href="/compte/planning" className="absolute inset-0 z-10 rounded-[inherit]" aria-label="Ouvrir mon planning" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Prochain live</p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-luxury-ink">
                  {hasUpcomingLive ? 'Prête pour ta prochaine séance' : 'Aucun live planifié'}
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
            <div className="mt-5">
              {hasUpcomingLive ? (
                <Link href={`/live/${nextAppointment.courseId}`} className="btn-luxury-primary relative z-20 min-h-[46px] min-w-[160px]">
                  Rejoindre
                </Link>
              ) : (
                <Link href="/compte/planning" className="btn-luxury-ghost relative z-20 min-h-[46px] min-w-[160px]">
                  Voir planning
                </Link>
              )}
            </div>
          </GlassCard>

          <GlassCard className="relative p-5 md:p-6">
            <Link href="/compte/replays" className="absolute inset-0 z-10 rounded-[inherit]" aria-label="Ouvrir mes replays" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Replay</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{replayCount}</p>
                <p className="mt-2 text-xs text-luxury-muted">Vidéo{replayCount > 1 ? 's' : ''} disponible{replayCount > 1 ? 's' : ''}</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--orange shrink-0">
                <PlayCircle size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            {replayUnread && replayUnread > 0 ? (
              <span className="absolute right-3 top-3 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(255,59,48,0.45)] ring-2 ring-white">
                {replayUnread > 99 ? '99+' : replayUnread}
              </span>
            ) : null}
            <div className="mt-5">
              <Link href="/compte/replays" className="btn-luxury-ghost relative z-20 min-h-[46px] min-w-[160px]">
                Voir mes replays
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="relative p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Mon blog</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">Articles</p>
                <p className="mt-2 text-xs text-luxury-muted">Lis le dernier article, retrouve l’historique et enregistre tes favoris.</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--blue shrink-0">
                <BookOpenText size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            {blogUnread && blogUnread > 0 ? (
              <span className="absolute right-3 top-3 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(255,59,48,0.45)] ring-2 ring-white">
                {blogUnread > 99 ? '99+' : blogUnread}
              </span>
            ) : null}
            <div className="mt-5">
              <Link href="/compte/blog" className="btn-luxury-ghost min-h-[46px] min-w-[160px]">
                Ouvrir mon blog
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <section id="planning" className="scroll-mt-24 space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Planning</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">Tes prochaines séances</h2>
        </div>
        <SmartCalendar />
      </section>

      <section id="replays" className="scroll-mt-24 space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Bibliothèque</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">Tes contenus à la demande</h2>
        </div>
        <MyReplaysSection userId={user.id} />
      </section>
    </div>
  );
}
