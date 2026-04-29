import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenText, PlayCircle, Target } from 'lucide-react';

import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { NextLiveCompteCard } from '@/components/Compte/NextLiveCompteCard';
import { MonthlyProgressRing } from '@/components/Compte/MonthlyProgressRing';
import { MyReplaysSection } from '@/components/Replay/MyReplaysSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { resolveFirstName } from '@/lib/compte/i18n';
import { getNextAppointment, getMonthlyProgress } from '@/lib/compte/dashboard';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';
import { getReplayLibraryForUser } from '@/lib/replay-library';
import { createClient } from '@/lib/supabase/server';

function weeklyMotivation(firstName: string, lang: 'fr' | 'en' | 'es'): string {
  const lines =
    lang === 'en'
      ? [
          `New week ${firstName}: keep moving with consistency, one step at a time.`,
          `${firstName}, every session counts. This week, we stay on track.`,
          `Weekly focus ${firstName}: stay steady and proud of your energy.`,
          `${firstName}, this week is about breath, consistency and progress.`,
          `Gentle discipline, lasting results. You are on the right path, ${firstName}.`,
        ]
      : lang === 'es'
        ? [
            `Nueva semana ${firstName}: avanza con constancia, paso a paso.`,
            `${firstName}, cada sesión cuenta. Esta semana mantenemos el ritmo.`,
            `Objetivo de la semana ${firstName}: constancia y energía.`,
            `${firstName}, esta semana: presencia, respiración y progreso.`,
            `Disciplina suave, resultados duraderos. Vas por buen camino, ${firstName}.`,
          ]
        : [
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
    supabase.from('profiles').select('first_name, last_name, preferred_blog_language').eq('id', user.id).maybeSingle(),
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

  const lang = profile?.preferred_blog_language === 'en' || profile?.preferred_blog_language === 'es' ? profile.preferred_blog_language : 'fr';
  const firstName = resolveFirstName(profile?.first_name, user.user_metadata);
  const motivation = weeklyMotivation(firstName, lang);
  const t =
    lang === 'en'
      ? {
          hello: 'Hello',
          paid: 'Payment recorded. You will receive a confirmation by email (Stripe receipt). Your calendar access has been updated.',
          profile: 'My profile',
          notifications: 'Notifications',
          backSite: 'Back to website',
          signout: 'Sign out',
          dashboard: 'Dashboard',
          liveTracking: 'Your live tracking',
          monthlyProgress: 'Monthly progress',
          coursesMonth: 'Courses followed this month',
          replay: 'Replay',
          availableVideos: 'available video',
          seeReplays: 'See my replays',
          blog: 'My blog',
          articles: 'Articles',
          blogHint: 'Read the latest article, find history and save favorites.',
          openBlog: 'Open my blog',
          planning: 'Schedule',
          nextSessions: 'Your upcoming sessions',
          library: 'Library',
          onDemand: 'Your on-demand content',
          openProgress: 'Open detailed progress',
        }
      : lang === 'es'
        ? {
            hello: 'Hola',
            paid: 'Pago registrado. Recibirás una confirmación por correo (recibo Stripe). Tu acceso al calendario ha sido actualizado.',
            profile: 'Mi perfil',
            notifications: 'Notificaciones',
            backSite: 'Volver al sitio',
            signout: 'Cerrar sesión',
            dashboard: 'Panel',
            liveTracking: 'Tu seguimiento en vivo',
            monthlyProgress: 'Progreso mensual',
            coursesMonth: 'Cursos seguidos este mes',
            replay: 'Replay',
            availableVideos: 'video disponible',
            seeReplays: 'Ver mis replays',
            blog: 'Mi blog',
            articles: 'Artículos',
            blogHint: 'Lee el último artículo, revisa el historial y guarda favoritos.',
            openBlog: 'Abrir mi blog',
            planning: 'Planificación',
            nextSessions: 'Tus próximas sesiones',
            library: 'Biblioteca',
            onDemand: 'Tus contenidos a la carta',
            openProgress: 'Abrir progreso detallado',
          }
        : {
            hello: 'Bonjour',
            paid: 'Paiement enregistré. Tu recevras la confirmation par e-mail (reçu Stripe). Ton accès au calendrier est mis à jour.',
            profile: 'Mon profil',
            notifications: 'Notifications',
            backSite: 'Retour au site',
            signout: 'Déconnexion',
            dashboard: 'Tableau de bord',
            liveTracking: 'Ton suivi en direct',
            monthlyProgress: 'Progression mensuelle',
            coursesMonth: 'Cours suivis ce mois-ci',
            replay: 'Replay',
            availableVideos: 'vidéo disponible',
            seeReplays: 'Voir mes replays',
            blog: 'Mon blog',
            articles: 'Articles',
            blogHint: 'Lis le dernier article, retrouve l’historique et enregistre tes favoris.',
            openBlog: 'Ouvrir mon blog',
            planning: 'Planning',
            nextSessions: 'Tes prochaines séances',
            library: 'Bibliothèque',
            onDemand: 'Tes contenus à la demande',
            openProgress: 'Ouvrir la progression détaillée',
          };
  const replayCount = replayItems.length;
  const remainingToGoal = Math.max(monthly.goal - monthly.followedCount, 0);
  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 pb-16 md:space-y-10 md:px-8">
      <section className="grid items-center gap-4 pt-2 md:grid-cols-[1fr_auto]">
        <div className="text-center md:text-center">
          <h1 className="hero-signature-title text-5xl text-luxury-ink md:text-6xl">{t.hello} {firstName}</h1>
          <p className="hero-signature-subtitle mt-1 text-sm md:text-base">{motivation}</p>
          {checkoutOk ? (
            <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-emerald-300/60 bg-emerald-50/90 px-5 py-3.5 text-sm font-medium leading-relaxed text-emerald-950">
              {t.paid}
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
              {t.profile}
            </Link>
            <Link href="/compte/profil#notifications" className="mt-1 flex items-center justify-between rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
              <span>{t.notifications}</span>
              {unreadNotifications && unreadNotifications > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_rgba(255,59,48,0.45)]">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              ) : null}
            </Link>
            <Link href="/" className="mt-1 block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
              {t.backSite}
            </Link>
            <form action="/auth/signout" method="post" className="mt-1">
              <button type="submit" className="w-full rounded-2xl px-4 py-2 text-left text-sm text-luxury-ink transition hover:bg-white/70">
                {t.signout}
              </button>
            </form>
          </div>
        </details>
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.dashboard}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">{t.liveTracking}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <GlassCard className="relative p-5 md:p-6">
            <Link href="/compte/progression" className="absolute inset-0 z-10 rounded-[inherit]" aria-label={t.openProgress} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.monthlyProgress}</p>
                <p className="mt-2 text-xs text-luxury-muted">{t.coursesMonth}</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--green shrink-0">
                <Target size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            <div className="mt-1 flex justify-center">
              <MonthlyProgressRing followedCount={monthly.followedCount} goal={monthly.goal} />
            </div>
          </GlassCard>

          <NextLiveCompteCard nextAppointment={nextAppointment} liveUnread={liveUnread} lang={lang} />

          <GlassCard className="relative p-5 md:p-6">
            <Link href="/compte/replays" className="absolute inset-0 z-10 rounded-[inherit]" aria-label="Ouvrir mes replays" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.replay}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{replayCount}</p>
                <p className="mt-2 text-xs text-luxury-muted">
                  {replayCount} {t.availableVideos}
                  {replayCount > 1 ? (lang === 'en' ? 's' : 's') : ''}
                </p>
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
                {t.seeReplays}
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="relative p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.blog}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{t.articles}</p>
                <p className="mt-2 text-xs text-luxury-muted">{t.blogHint}</p>
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
                {t.openBlog}
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <section id="planning" className="scroll-mt-24 space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.planning}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">{t.nextSessions}</h2>
        </div>
        <SmartCalendar lang={lang} />
      </section>

      <section id="replays" className="scroll-mt-24 space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.library}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">{t.onDemand}</h2>
        </div>
        <MyReplaysSection userId={user.id} lang={lang} />
      </section>
    </div>
  );
}
