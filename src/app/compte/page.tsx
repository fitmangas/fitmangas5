import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { BookOpenText, PlayCircle, Target } from 'lucide-react';

import { CheckoutPurchaseTracker } from '@/components/Marketing/CheckoutPurchaseTracker';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { NextLiveCompteCard } from '@/components/Compte/NextLiveCompteCard';
import { MonthlyProgressRing } from '@/components/Compte/MonthlyProgressRing';
import { VisioLock } from '@/components/Premium/VisioLock';
import { MyReplaysSection } from '@/components/Replay/MyReplaysSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { computeGamificationGrade, gradeLabel } from '@/lib/gamification';
import { formatCompteGreeting, getClientLang, resolveFirstName } from '@/lib/compte/i18n';
import { getNextAppointment, getMonthlyProgress } from '@/lib/compte/dashboard';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';
import { hasVisioClientAccess } from '@/lib/access-control';
import { COURSE_PRICE_CENTS } from '@/lib/checkout-courses';
import { getMarketingSettings } from '@/lib/admin/marketing-settings';
import { getReplayLibraryForUser } from '@/lib/replay-library';
import { getStandaloneVimeoLibraryForUser } from '@/lib/standalone-vimeo-library';
import { createClient } from '@/lib/supabase/server';

function weeklyMotivation(firstName: string | null, lang: 'fr' | 'en' | 'es'): string {
  const lines =
    lang === 'en'
      ? firstName
        ? [
            `New week ${firstName}: keep moving with consistency, one step at a time.`,
            `${firstName}, every session counts. This week, we stay on track.`,
            `Weekly focus ${firstName}: stay steady and proud of your energy.`,
            `${firstName}, this week is about breath, consistency and progress.`,
            `Gentle discipline, lasting results. You are on the right path, ${firstName}.`,
          ]
        : [
            'New week: keep moving with consistency, one step at a time.',
            'Every session counts. This week, we stay on track.',
            'Weekly focus: stay steady and proud of your energy.',
            'This week is about breath, consistency and progress.',
            'Gentle discipline, lasting results. You are on the right path.',
          ]
      : lang === 'es'
        ? firstName
          ? [
              `Nueva semana ${firstName}: avanza con constancia, paso a paso.`,
              `${firstName}, cada sesión cuenta. Esta semana mantenemos el ritmo.`,
              `Objetivo de la semana ${firstName}: constancia y energía.`,
              `${firstName}, esta semana: presencia, respiración y progreso.`,
              `Disciplina suave, resultados duraderos. Vas por buen camino, ${firstName}.`,
            ]
          : [
              'Nueva semana: avanza con constancia, paso a paso.',
              'Cada sesión cuenta. Esta semana mantenemos el ritmo.',
              'Objetivo de la semana: constancia y energía.',
              'Esta semana: presencia, respiración y progreso.',
              'Disciplina suave, resultados duraderos. Vas por buen camino.',
            ]
        : firstName
          ? [
              `Nouvelle semaine ${firstName} : avance avec constance, même à petits pas.`,
              `${firstName}, chaque séance compte. Cette semaine, on garde le rythme.`,
              `Objectif de la semaine ${firstName} : rester régulière et fière de ton énergie.`,
              `${firstName}, focus sur toi cette semaine : présence, souffle et progression.`,
              `Semaine en cours : discipline douce, résultats durables. Tu es sur la bonne voie ${firstName}.`,
            ]
          : [
              'Nouvelle semaine : avance avec constance, même à petits pas.',
              'Chaque séance compte. Cette semaine, on garde le rythme.',
              'Objectif de la semaine : rester régulière et fière de ton énergie.',
              'Focus sur toi cette semaine : présence, souffle et progression.',
              'Semaine en cours : discipline douce, résultats durables. Tu es sur la bonne voie.',
            ];
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekIndex = Math.floor((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return lines[((weekIndex % lines.length) + lines.length) % lines.length];
}

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string;
    purchase_value?: string;
    purchase_currency?: string;
    course_id?: string;
  }>;
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
  const purchaseValue = checkoutOk ? Number.parseFloat(params.purchase_value ?? '') : NaN;
  const purchaseCurrency = params.purchase_currency?.trim() || 'EUR';
  const purchaseCourseId = params.course_id?.trim() || null;
  const goal = getMonthlySessionGoal();

  const [marketingSettings, lang, hasVisioAccess, { data: profile }, monthly, nextAppointment, replayItems, standaloneVimeoItems, { count: unreadNotifications }, { count: replayUnread }, { count: blogUnread }, { count: liveUnread }, { count: publishedBlogCount }] = await Promise.all([
    getMarketingSettings(),
    getClientLang(supabase, user.id),
    hasVisioClientAccess(user.id),
    supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, preferred_blog_language, gamification_grade, gamification_points, live_visit_count, total_replay_watch_seconds, onsite_presence_count')
      .eq('id', user.id)
      .maybeSingle(),
    getMonthlyProgress(user.id, goal),
    getNextAppointment(user.id),
    getReplayLibraryForUser(user.id),
    getStandaloneVimeoLibraryForUser(),
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
    supabase.from('blog_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  const avatarUrl = profile?.avatar_url?.trim() || '/client-contact-photo.png';
  const firstName = resolveFirstName(profile?.first_name, user.user_metadata);
  const greeting = formatCompteGreeting(lang, firstName);
  const grade = profile?.gamification_grade ??
    computeGamificationGrade({
      points: profile?.gamification_points ?? 0,
      liveVisits: profile?.live_visit_count ?? 0,
      replaySeconds: profile?.total_replay_watch_seconds ?? 0,
      onsitePresences: profile?.onsite_presence_count ?? 0,
    });
  const level = gradeLabel(grade, lang);
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
          replayLibraryTitle: 'Replay & Library',
          availableVideos: 'available video',
            replayHoursAvailable: 'Replay',
            vimeoHoursLibrary: 'Library',
          seeReplays: 'See my replays',
          myLibrary: 'My library',
          blog: 'My blog',
          articles: 'Articles',
          publishedArticles: 'published articles',
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
            replayLibraryTitle: 'Replay & Biblioteca',
            availableVideos: 'video disponible',
            replayHoursAvailable: 'Replay',
            vimeoHoursLibrary: 'Biblioteca',
            seeReplays: 'Ver mis replays',
            myLibrary: 'Mi biblioteca',
            blog: 'Mi blog',
            articles: 'Artículos',
            publishedArticles: 'artículos publicados',
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
            liveTracking: 'Le tableau de bord',
            monthlyProgress: 'Progression mensuelle',
            coursesMonth: 'Cours suivis ce mois-ci',
            replay: 'Replay',
            replayLibraryTitle: 'Replay & Bibliothèque',
            availableVideos: 'vidéo disponible',
            replayHoursAvailable: 'Replay',
            vimeoHoursLibrary: 'Bibliothèque',
            seeReplays: 'Voir mes replays',
            myLibrary: 'Ma bibliothèque',
            blog: 'Mon blog',
            articles: 'Articles',
            publishedArticles: 'articles publiés',
            blogHint: 'Lis le dernier article, retrouve l’historique et enregistre tes favoris.',
            openBlog: 'Ouvrir mon blog',
            planning: 'Planning',
            nextSessions: 'Tes prochaines séances',
            library: 'Bibliothèque',
            onDemand: 'Tes contenus à la demande',
            openProgress: 'Ouvrir la progression détaillée',
          };
  const replayCount = replayItems.length;
  const replaySecondsTotal = replayItems.reduce((sum, item) => sum + Math.max(0, item.durationSeconds ?? 0), 0);
  const replayHoursAvailable = replaySecondsTotal / 3600;
  const vimeoLibraryHours = standaloneVimeoItems.reduce((sum, item) => sum + Math.max(0, item.durationSeconds ?? 0), 0) / 3600;
  const replayHoursRounded = Math.ceil(replayHoursAvailable);
  const vimeoHoursRounded = Math.ceil(vimeoLibraryHours);
  const replayStatIsCountFallback = replayHoursRounded <= 0 && replayCount > 0;
  const remainingToGoal = Math.max(monthly.goal - monthly.followedCount, 0);
  const gaId = marketingSettings.google_analytics_id?.startsWith('G-') ? marketingSettings.google_analytics_id : null;
  const metaPixelId = marketingSettings.meta_pixel_id ?? null;
  const trackedPurchaseValue =
    checkoutOk && Number.isFinite(purchaseValue) && purchaseValue > 0
      ? purchaseValue
      : checkoutOk && purchaseCourseId && COURSE_PRICE_CENTS[purchaseCourseId]
        ? COURSE_PRICE_CENTS[purchaseCourseId] / 100
        : 0;

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-3 pb-16 md:space-y-10 md:px-8">
      {checkoutOk && trackedPurchaseValue > 0 ? (
        <CheckoutPurchaseTracker
          gaId={gaId}
          metaPixelId={metaPixelId}
          value={trackedPurchaseValue}
          currency={purchaseCurrency}
          courseId={purchaseCourseId}
        />
      ) : null}
      <section className="grid items-center gap-3 pt-1 text-center md:grid-cols-[1fr_auto] md:gap-5 md:pt-2 md:text-left">
        <div>
          <h1 className="hero-signature-title break-words text-2xl text-luxury-ink sm:text-4xl md:text-6xl">{greeting}</h1>
          <p className="hero-signature-subtitle mt-1 text-xs md:text-base">{motivation}</p>
          {checkoutOk ? (
            <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-emerald-300/60 bg-emerald-50/90 px-5 py-3.5 text-sm font-medium leading-relaxed text-emerald-950">
              {t.paid}
            </p>
          ) : null}
        </div>
        <details className="relative z-10 mx-auto w-full max-w-[178px] md:mx-0 md:w-auto md:max-w-none">
          {unreadNotifications && unreadNotifications > 0 ? (
            <Link
              href="/compte/notifications"
              className="absolute right-2 top-2 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_rgba(255,59,48,0.45)] ring-2 ring-white"
              aria-label={t.notifications}
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </Link>
          ) : null}
          <summary className="relative flex cursor-pointer list-none flex-col items-center gap-1.5 rounded-[1.6rem] border border-white/60 bg-white/65 px-3 py-2.5 shadow-[0_12px_32px_rgba(29,29,31,0.12)] backdrop-blur-xl md:gap-2 md:rounded-[2rem] md:px-4 md:py-3 [&::-webkit-details-marker]:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="flex flex-col items-center">
              <img
                src={avatarUrl}
                alt={firstName ? `Photo de ${firstName}` : 'Photo de profil'}
                className="h-[66px] w-[66px] rounded-full object-cover object-top ring-1 ring-white/70 md:h-[88px] md:w-[88px]"
              />
              <span
                className={`premium-badge mt-1.5 inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] backdrop-blur-md ${
                  grade === 'debutant'
                    ? 'border-amber-100/75 bg-gradient-to-r from-amber-200/75 to-yellow-300/65 text-[#1f2937]'
                    : grade === 'confirme'
                      ? 'border-sky-100/70 bg-gradient-to-r from-sky-400/60 to-blue-500/55 text-[#0f172a]'
                      : 'border-blue-200/55 bg-gradient-to-r from-blue-700/65 to-blue-900/60 text-white'
                }`}
              >
                {level}
              </span>
            </div>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/85 text-sm font-semibold text-luxury-ink md:h-8 md:w-8 md:text-base">
              +
            </span>
          </summary>
          <div className="absolute left-1/2 z-20 mt-2 w-56 -translate-x-1/2 rounded-3xl border border-white/70 bg-white/90 p-2 text-left shadow-[0_18px_42px_rgba(29,29,31,0.15)] backdrop-blur-xl md:left-auto md:right-0 md:translate-x-0">
            <Link href="/compte/profil" className="block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
              {t.profile}
            </Link>
            <Link href="/compte/notifications" className="mt-1 flex items-center justify-between rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
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

      <section className="relative isolate space-y-3 md:space-y-4">
        <div className="relative z-10 flex items-center gap-2 px-1 md:gap-3">
          <Image
            src="/logo.png"
            alt="Logo FitMangas"
            width={56}
            height={56}
            className="h-9 w-9 shrink-0 object-contain md:h-[56px] md:w-[56px]"
          />
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">{t.liveTracking}</h2>
          </div>
        </div>
        <div className="relative z-0 grid grid-cols-2 items-stretch gap-3 md:gap-5 xl:grid-cols-4">
          <GlassCard className="relative order-1 flex h-full flex-col p-3 md:order-none md:p-6">
            <Link href="/compte/progression" className="absolute inset-0 z-10 rounded-[inherit]" aria-label={t.openProgress} />
            <div className="max-md:mb-6">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.monthlyProgress}</p>
                  <p className="mt-1 text-luxury-muted max-md:whitespace-nowrap max-md:pb-3 max-md:text-[9px] max-md:tracking-[0.1em] md:mt-2 md:pb-0 md:text-xs">
                    {t.coursesMonth}
                  </p>
                </div>
                <span className="kpi-icon-wrap kpi-icon-wrap--logo shrink-0 scale-90 md:scale-100">
                  <Target size={20} aria-hidden strokeWidth={2} />
                </span>
              </div>
            </div>
            <div className="flex justify-center md:mt-1">
              <MonthlyProgressRing followedCount={monthly.followedCount} goal={monthly.goal} />
            </div>
          </GlassCard>

          <NextLiveCompteCard nextAppointment={nextAppointment} liveUnread={liveUnread} lang={lang} iconToneClass="kpi-icon-wrap--logo" />

          <VisioLock
            hasAccess={hasVisioAccess}
            locale={lang === 'es' ? 'es' : 'fr'}
            featureDescription_fr="Les replays sont inclus dans l’abonnement Visio collectif à 39€/mois."
            featureDescription_es="Los replays están incluidos en la suscripción Visio grupal a 39€/mes."
            className="order-4 col-span-2 md:order-none md:col-span-1"
          >
          <GlassCard className="relative order-4 col-span-2 flex h-full flex-col p-4 md:order-none md:col-span-1 md:p-6">
            <Link href="/compte/replays" className="absolute inset-0 z-10 rounded-[inherit]" aria-label={t.myLibrary} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.replayLibraryTitle}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 md:mt-8 md:flex md:flex-col">
                  <p className="flex min-w-0 flex-col gap-1 text-center text-[11px] text-luxury-muted md:flex-row md:items-baseline md:gap-2 md:text-left md:text-sm">
                    <span className="text-xl font-semibold tabular-nums tracking-tight text-luxury-ink md:text-2xl">
                      {replayStatIsCountFallback ? replayCount : `${replayHoursRounded}h`}
                    </span>
                    <span className="leading-snug">
                      {replayStatIsCountFallback
                        ? lang === 'en'
                          ? 'Replays'
                          : lang === 'es'
                            ? 'Replays'
                            : 'Replays'
                        : t.replayHoursAvailable}
                    </span>
                  </p>
                  <p className="flex min-w-0 flex-col gap-1 text-center text-[11px] text-luxury-muted md:flex-row md:items-baseline md:gap-2 md:text-left md:text-sm">
                    <span className="text-xl font-semibold tabular-nums tracking-tight text-luxury-ink md:text-2xl">
                      {vimeoHoursRounded}h
                    </span>
                    <span className="leading-snug">{t.vimeoHoursLibrary}</span>
                  </p>
                </div>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--logo shrink-0">
                <PlayCircle size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            {replayUnread && replayUnread > 0 ? (
              <span className="absolute right-3 top-3 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(255,59,48,0.45)] ring-2 ring-white">
                {replayUnread > 99 ? '99+' : replayUnread}
              </span>
            ) : null}
            <div className="mt-auto pt-4 md:mt-5 md:pt-0">
              <Link href="/compte/replays" className="btn-luxury-ghost relative z-20 flex min-h-[40px] w-full items-center justify-center px-3 text-center text-[9px] tracking-[0.1em] md:min-h-[46px] md:w-auto md:min-w-[160px] md:text-[11px]">
                {t.myLibrary}
              </Link>
            </div>
          </GlassCard>
          </VisioLock>

          <VisioLock
            hasAccess={hasVisioAccess}
            locale={lang === 'es' ? 'es' : 'fr'}
            featureDescription_fr="Le blog complet est inclus dans l’abonnement Visio collectif à 39€/mois."
            featureDescription_es="El blog completo está incluido en la suscripción Visio grupal a 39€/mes."
            className="order-2 md:order-none"
          >
          <GlassCard className="relative order-2 flex h-full flex-col p-3 md:order-none md:p-6">
            <div className="flex items-start justify-between gap-2 md:gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.blog}</p>
                <p className="mt-2 hidden text-xl font-semibold tabular-nums tracking-tight text-luxury-ink md:mt-3 md:block md:text-3xl">{t.articles}</p>
                <p className="mt-2 hidden text-xs text-luxury-muted md:block">{t.blogHint}</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--logo shrink-0 scale-90 md:scale-100">
                <BookOpenText size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center py-3 md:hidden">
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-luxury-ink">{publishedBlogCount ?? 0}</p>
              <p className="mt-1 text-center text-[10px] leading-snug text-luxury-muted">{t.publishedArticles}</p>
            </div>
            {blogUnread && blogUnread > 0 ? (
              <span className="absolute right-3 top-3 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(255,59,48,0.45)] ring-2 ring-white">
                {blogUnread > 99 ? '99+' : blogUnread}
              </span>
            ) : null}
            <div className="mt-auto pt-2 md:mt-5 md:pt-0">
              <Link href="/compte/blog" className="btn-luxury-ghost flex min-h-[40px] w-full items-center justify-center px-3 text-center text-[9px] tracking-[0.1em] md:min-h-[46px] md:w-auto md:min-w-[160px] md:text-[11px]">
                {t.openBlog}
              </Link>
            </div>
          </GlassCard>
          </VisioLock>
        </div>
      </section>

      <section id="planning" className="relative isolate scroll-mt-24 space-y-3 md:space-y-4">
        <div className="relative z-10 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.planning}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-luxury-ink md:mt-2 md:text-[1.7rem]">{t.nextSessions}</h2>
        </div>
        <div className="relative z-0">
          <SmartCalendar lang={lang} />
        </div>
      </section>

      <section id="replays" className="relative isolate scroll-mt-24 space-y-3 md:space-y-4">
        <VisioLock
          hasAccess={hasVisioAccess}
          locale={lang === 'es' ? 'es' : 'fr'}
          featureDescription_fr="La bibliothèque vidéo est incluse dans l’abonnement Visio collectif à 39€/mois."
          featureDescription_es="La biblioteca de videos está incluida en la suscripción Visio grupal a 39€/mes."
        >
          <MyReplaysSection
            userId={user.id}
            lang={lang}
            limitReplays={3}
            limitLibrary={3}
            showSeeAll
          />
        </VisioLock>
      </section>
    </div>
  );
}
