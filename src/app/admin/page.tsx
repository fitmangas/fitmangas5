import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Euro, Video } from 'lucide-react';

import { AiBusinessAdvisor } from '@/components/Admin/AiBusinessAdvisor';
import { AdminKpiCardsInteractive } from '@/components/Admin/AdminKpiCardsInteractive';
import { AdminViewSwitchMenuLink } from '@/components/Admin/AdminViewSwitchClient';
import { ClientAvatar } from '@/components/Admin/ClientAvatar';
import { DismissibleDashboardBadge, DismissOnClickLink } from '@/components/Admin/DismissibleDashboardBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { checkIsAdmin, canUseAdminViewSwitch } from '@/lib/auth/admin';
import {
  getCachedAdminKpiDrilldowns,
  getCachedAdminKpis,
  getCachedStripeCollectedCurrentMonthEur,
} from '@/lib/admin/cached-kpis';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_COURSE_TIMEZONE, formatCourseInstant } from '@/lib/course-datetime';
import { getDemoClientMode } from '@/lib/demo-client-mode';
import { LIVE_FROM_ADMIN, liveCourseHref } from '@/lib/live/live-back-url';

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
  last_checkout_course_id: string | null;
  updated_at: string | null;
};

type UpcomingCourseRow = {
  id: string;
  title: string;
  starts_at: string;
  timezone: string | null;
};

type Point = { x: number; y: number };

function pctLabel(value: number | null): string {
  if (value == null) return '—';
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%`;
}

function sparkPoints(values: number[]): Point[] {
  if (!values.length) return [];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * 100;
    const y = 90 - ((v - min) / range) * 70;
    return { x, y };
  });
}

function sparkSmoothPath(points: Point[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx1 = p0.x + (p1.x - p0.x) * 0.4;
    const cy1 = p0.y;
    const cx2 = p0.x + (p1.x - p0.x) * 0.6;
    const cy2 = p1.y;
    d += ` C ${cx1},${cy1} ${cx2},${cy2} ${p1.x},${p1.y}`;
  }
  return d;
}

function sparkAreaPath(points: Point[]): string {
  if (!points.length) return '';
  const linePath = sparkSmoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x},90 L ${first.x},90 Z`;
}

function trendDayLabel(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return isoDate;
  }
}

function RingGauge({
  value,
  color,
  label,
}: {
  value: number | null;
  color: string;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;
  return (
    <div className="group flex items-center gap-3">
      <div className="relative h-[72px] w-[72px] transition-transform duration-300 group-hover:scale-[1.03]">
        <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dash}
            className="transition-[filter,stroke-width] duration-300 group-hover:[stroke-width:7.6]"
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </svg>
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 0 0 1px ${color}33, 0 0 14px ${color}44 inset` }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-luxury-ink">
          {pctLabel(value)}
        </div>
      </div>
      <div>
        <p className="text-xs text-luxury-muted transition-colors duration-300 group-hover:text-luxury-ink">{label}</p>
      </div>
    </div>
  );
}

function monthGrid() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7;
  const days: Array<number | null> = [];
  for (let i = 0; i < startOffset; i += 1) days.push(null);
  for (let d = 1; d <= lastDate; d += 1) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return {
    label: first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    days,
    year,
    month,
  };
}

function formatMonthYear(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const revalidate = 300;

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=auth');
  }

  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) {
    redirect('/login?error=forbidden');
  }

  const [viewSwitchGate, clientView] = await Promise.all([
    canUseAdminViewSwitch(supabase, user),
    getDemoClientMode(),
  ]);
  const showViewSwitch = viewSwitchGate.canSwitch;

  const adminDb = createAdminClient();
  const nowIso = new Date().toISOString();
  const [
    { data: latestProfiles },
    { count: totalReplaysReady },
    kpis,
    { data: me },
    { data: upcomingCoursesData },
    { count: pendingStandaloneCount },
    { count: pendingBlogValidationCount },
    stripeMonthEur,
    kpiDrilldowns,
  ] = await Promise.all([
    adminDb
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, last_checkout_course_id, updated_at')
      .eq('archived', false)
      .eq('role', 'member')
      .order('updated_at', { ascending: false })
      .limit(4),
    adminDb.from('video_recordings').select('*', { count: 'exact', head: true }).eq('is_ready', true),
    getCachedAdminKpis(),
    supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', user.id).maybeSingle(),
    adminDb
      .from('courses')
      .select('id, title, starts_at, timezone')
      .eq('is_published', true)
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(42),
    adminDb.from('standalone_vimeo_videos').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    adminDb
      .from('admin_article_validations')
      .select('*', { count: 'exact', head: true })
      .eq('month_year', formatMonthYear(new Date()))
      .eq('status', 'pending'),
    getCachedStripeCollectedCurrentMonthEur(),
    getCachedAdminKpiDrilldowns(),
  ]);

  const upcomingCourses = (upcomingCoursesData ?? []) as UpcomingCourseRow[];
  const nextThree = upcomingCourses.slice(0, 3);

  const calendar = monthGrid();
  const dayCountMap = new Map<number, number>();
  for (const c of upcomingCourses) {
    const d = new Date(c.starts_at);
    if (d.getFullYear() === calendar.year && d.getMonth() === calendar.month) {
      const day = d.getDate();
      dayCountMap.set(day, (dayCountMap.get(day) ?? 0) + 1);
    }
  }

  const firstName = me?.first_name?.trim() || 'Alejandra';
  const avatarUrl = me?.avatar_url?.trim() || null;
  const mrrLabel =
    kpis.mrrEur != null
      ? `${kpis.mrrEur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
      : '—';
  const mrrHint =
    kpis.mrrSource === 'stripe'
      ? 'Stripe'
      : kpis.mrrSource === 'db'
        ? 'Base (fallback)'
        : 'Non disponible';
  const occupancyLabel = pctLabel(kpis.occupancyPercent);
  const trendValues = kpis.trend.map((p) => p.mrrEur);
  const trendPoints = sparkPoints(trendValues);
  const trendPath = sparkSmoothPath(trendPoints);
  const trendArea = sparkAreaPath(trendPoints);
  const latestPoint = kpis.trend[kpis.trend.length - 1] ?? null;
  const firstPoint = kpis.trend[0] ?? null;
  const firstLabel = firstPoint ? trendDayLabel(firstPoint.date) : '—';
  const lastLabel = latestPoint ? trendDayLabel(latestPoint.date) : '—';
  const lastMrrLabel = latestPoint
    ? `${latestPoint.mrrEur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
    : '—';
  const clientsHeadTr = 'bg-white/85 text-[10px] uppercase tracking-wider text-luxury-ink/65 backdrop-blur';
  const combinedRevenueMonthEur =
    stripeMonthEur == null && kpiDrilldowns.boutiqueRevenueEur <= 0
      ? null
      : (stripeMonthEur ?? 0) + kpiDrilldowns.boutiqueRevenueEur;

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-5 pt-3 md:pt-4 xl:space-y-6">
      <div className="relative z-50 border-b border-white/10 bg-transparent pb-2 pt-3 backdrop-blur-[20px] md:pb-2.5 md:pt-4">
        {/* Sur xl : même grille 4 cols que les KPI pour centrer le texte au-dessus des colonnes Churn + Abonnés */}
        <div className="hidden items-center gap-5 xl:grid xl:grid-cols-4">
          <div className="flex items-center justify-start">
            <AiBusinessAdvisor />
          </div>
          <div className="col-start-2 col-span-2 min-w-0 text-center">
            <h1 className="hero-signature-title text-6xl text-luxury-ink">Bonjour {firstName}</h1>
            <p className="hero-signature-subtitle mt-1 text-sm md:text-base">
              Une nouvelle journée pour faire grandir ton studio.
            </p>
          </div>
          <div className="flex justify-end">
            <details className="relative z-[120]">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/alejandra.png?v=2"
                  alt="Alejandra"
                  className="w-[100px] h-auto max-h-[200px] object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.22)] cursor-pointer"
                />
              </summary>
              <div className="absolute right-0 z-[140] mt-2 w-56 rounded-3xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_42px_rgba(29,29,31,0.15)] backdrop-blur-xl">
                <Link href="/" className="block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
                  Retour site
                </Link>
                {showViewSwitch ? <AdminViewSwitchMenuLink clientView={clientView} /> : null}
                <Link href="/compte/profil" className="mt-1 block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
                  Mon profil
                </Link>
                <form action="/auth/signout" method="post" className="mt-1">
                  <button type="submit" className="w-full rounded-2xl px-4 py-2 text-left text-sm text-luxury-ink transition hover:bg-white/70">
                    Déconnexion
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>

        {/* < xl : layout simple */}
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 xl:hidden">
          <AiBusinessAdvisor />
          <div className="min-w-0 text-center">
            <h1 className="hero-signature-title break-words text-[1.65rem] leading-[0.95] text-luxury-ink sm:text-5xl md:text-6xl">
              Bonjour {firstName}
            </h1>
            <p className="hero-signature-subtitle mt-1 text-sm md:text-base">
              Une nouvelle journée pour faire grandir ton studio.
            </p>
          </div>
          <details className="relative z-[120] shrink-0">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/alejandra.png?v=2"
                alt="Alejandra"
                className="h-auto w-14 max-h-[120px] object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.22)] cursor-pointer sm:w-[88px] md:w-[100px] md:max-h-[200px]"
              />
            </summary>
            <div className="absolute right-0 z-[140] mt-2 w-56 rounded-3xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_42px_rgba(29,29,31,0.15)] backdrop-blur-xl">
              <Link href="/" className="block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
                Retour site
              </Link>
              {showViewSwitch ? <AdminViewSwitchMenuLink clientView={clientView} /> : null}
              <Link href="/compte/profil" className="mt-1 block rounded-2xl px-4 py-2 text-sm text-luxury-ink transition hover:bg-white/70">
                Mon profil
              </Link>
              <form action="/auth/signout" method="post" className="mt-1">
                <button type="submit" className="w-full rounded-2xl px-4 py-2 text-left text-sm text-luxury-ink transition hover:bg-white/70">
                  Déconnexion
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>

      <AdminKpiCardsInteractive
        stripeMonthEur={combinedRevenueMonthEur}
        kpis={kpis}
        drilldowns={kpiDrilldowns}
        pendingBlogValidationCount={pendingBlogValidationCount ?? 0}
      />

      <section className="relative z-10 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <GlassCard variant="dark" className="relative p-5 md:p-6">
          <DismissibleDashboardBadge storageKey="admin_badge_blog_validation" count={pendingBlogValidationCount ?? 0} />
          <DismissOnClickLink
            href="/admin/blog/validation"
            storageKey="admin_badge_blog_validation"
            dismissCount={pendingBlogValidationCount ?? 0}
            className="absolute inset-0 z-10 rounded-[inherit]"
            ariaLabel="Ouvrir la validation blog"
          >
            <span className="sr-only">Validation blog</span>
          </DismissOnClickLink>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">{calendar.label}</h3>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Cours à venir</p>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[10px] text-white/55">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d, idx) => (
              <span key={`${d}-${idx}`}>{d}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {calendar.days.map((day, idx) => {
              if (!day) return <span key={`empty-${idx}`} className="h-8 w-8" />;
              const count = dayCountMap.get(day) ?? 0;
              const active = count > 0;
              return (
                <div key={`day-${day}-${idx}`} className="flex h-8 w-8 items-center justify-center">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${
                      active ? 'bg-emerald-500/85 text-white' : 'text-white/70'
                    }`}
                    title={active ? `${count} cours` : undefined}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="relative p-5 md:p-6">
          <DismissibleDashboardBadge storageKey="admin_badge_upcoming_courses" count={upcomingCourses.length} />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide text-white/90">3 prochains cours</h3>
            <DismissOnClickLink
              href="/admin/courses"
              storageKey="admin_badge_upcoming_courses"
              dismissCount={upcomingCourses.length}
              className="relative z-20 text-[11px] text-white/65 hover:text-white"
            >
              Voir tout
            </DismissOnClickLink>
          </div>
          <div className="mt-4 space-y-3">
            {nextThree.map((course) => (
              <a
                key={course.id}
                href={liveCourseHref(course.id, { from: LIVE_FROM_ADMIN })}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 transition hover:border-white/30 hover:bg-white/20"
                title="Rejoindre le live"
              >
                <p className="truncate text-sm font-semibold text-white">{course.title}</p>
                <p className="mt-1 text-xs text-white/70">
                  {formatCourseInstant(
                    course.starts_at,
                    course.timezone?.trim() || DEFAULT_COURSE_TIMEZONE,
                  )}
                </p>
              </a>
            ))}
            {nextThree.length === 0 ? (
              <p className="text-sm text-white/65">Aucun cours planifié.</p>
            ) : null}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr_1.9fr]">
        <GlassCard elevated className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">MRR Stripe</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{mrrLabel}</p>
              <p className="mt-2 text-xs text-luxury-muted">Source : {mrrHint}</p>
            </div>
            <span className="kpi-icon-wrap kpi-icon-wrap--orange shrink-0">
              <Euro size={20} aria-hidden strokeWidth={2} />
            </span>
          </div>
        </GlassCard>
        <GlassCard elevated className="relative flex flex-col p-5 md:p-6">
          <DismissibleDashboardBadge storageKey="admin_badge_vimeo_pending" count={pendingStandaloneCount ?? 0} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Vimeo</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{totalReplaysReady ?? 0}</p>
              <p className="mt-2 text-xs text-luxury-muted">Replays prêts</p>
            </div>
            <span className="kpi-icon-wrap kpi-icon-wrap--green shrink-0">
              <Video size={20} aria-hidden strokeWidth={2} />
            </span>
          </div>
          <DismissOnClickLink
            href="/admin/vimeo"
            storageKey="admin_badge_vimeo_pending"
            dismissCount={pendingStandaloneCount ?? 0}
            className="btn-luxury-gold relative z-20 mt-6 w-full justify-center text-center text-[10px] tracking-[0.16em]"
          >
            Bibliothèque Vimeo
          </DismissOnClickLink>
        </GlassCard>
        <GlassCard elevated className="p-5 md:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-soft">Derniers clients</h2>
          <div className="mt-1 flex justify-end">
            <Link
              href="/admin/clients"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-orange underline-offset-4 hover:underline"
            >
              Voir tous →
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left">
            <thead>
              <tr className={clientsHeadTr}>
                <th className="rounded-l-full border-b border-t border-l border-[#ece8e0] px-3 py-3">Nom</th>
                <th className="border-y border-[#ece8e0] px-3 py-3">Rôle</th>
                <th className="border-y border-[#ece8e0] px-3 py-3">Dernière offre</th>
                <th className="rounded-r-full border-b border-t border-r border-[#ece8e0] px-3 py-3">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="text-sm text-luxury-ink">
              {(latestProfiles as ProfileRow[] | null)?.map((profile) => (
                <tr key={profile.id} className="border-b border-white/40">
                  <td className="px-2 py-3">
                    <Link
                      href={`/admin/clients/${profile.id}`}
                      className="inline-flex items-center gap-3 font-semibold text-luxury-orange underline-offset-4 hover:underline"
                    >
                      <ClientAvatar
                        avatarUrl={profile.avatar_url}
                        name={[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                        size={32}
                      />
                      {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-luxury-muted">{profile.role || 'member'}</td>
                  <td className="px-2 py-3 text-luxury-muted">{profile.last_checkout_course_id || '—'}</td>
                  <td className="px-2 py-3 text-luxury-muted">
                    {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
              {!latestProfiles?.length ? (
                <tr>
                  <td className="px-2 py-4 text-luxury-muted" colSpan={4}>
                    Aucun profil trouvé pour l’instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
            </table>
          </div>
        </GlassCard>
      </section>

      <section className="relative z-10 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <GlassCard elevated className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Revenus</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-luxury-ink">Tendance MRR</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-luxury-soft">Dernière valeur</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-luxury-ink">{lastMrrLabel}</p>
            </div>
          </div>
          <div className="mt-5">
            {trendPath ? (
              <div>
                <svg viewBox="0 0 100 100" className="h-44 w-full">
                  <defs>
                    <linearGradient id="mrrAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.34" />
                      <stop offset="100%" stopColor="#ff7a00" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="mrrLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff9a3d" />
                      <stop offset="100%" stopColor="#C45D3E" />
                    </linearGradient>
                    <filter id="mrrGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path d={trendArea} fill="url(#mrrAreaGrad)" />
                  <path
                    d={trendPath}
                    fill="none"
                    stroke="url(#mrrLineGrad)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#mrrGlow)"
                  />
                  <circle
                    cx="100"
                    cy={trendPoints[trendPoints.length - 1]?.y ?? 90}
                    r="2.8"
                    fill="#C45D3E"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="1.1"
                  />
                </svg>
                <div className="mt-1 flex items-center justify-between text-[11px] text-luxury-soft">
                  <span>{firstLabel}</span>
                  <span>{lastLabel}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/70 bg-white/35 px-4 py-16 text-center text-sm text-luxury-muted">
                Les snapshots quotidiens seront visibles dès demain.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard elevated className="p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Engagement</p>
          <div className="mt-6 space-y-4">
            <RingGauge value={kpis.replayCompletionRate30d} color="#C45D3E" label="Completion rate replay" />
            <div className="h-px bg-white/60" />
            <RingGauge value={kpis.liveShowUpRate30d} color="#10b981" label="Show-up rate live" />
            <div className="h-px bg-white/60" />
            <div>
              <p className="text-xs text-luxury-muted">Occupation live collectif</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-luxury-ink">{occupancyLabel}</p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
