import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Activity, Droplets, Flame, MoonStar, Target, Utensils, Video } from 'lucide-react';

import { resolveFirstName } from '@/lib/compte/i18n';
import { getMonthlyProgress, getNextAppointment } from '@/lib/compte/dashboard';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';
import { createClient } from '@/lib/supabase/server';

function fmtHours(hours: number): string {
  return `${hours.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}h`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export default async function CompteProgressionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const goal = getMonthlySessionGoal();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [{ data: profile }, monthly, nextAppointment, { data: liveRows }, { data: replayRows }] = await Promise.all([
    supabase.from('profiles').select('first_name, avatar_url, preferred_blog_language').eq('id', user.id).maybeSingle(),
    getMonthlyProgress(user.id, goal),
    getNextAppointment(user.id),
    supabase
      .from('enrollments')
      .select('status, courses ( starts_at, ends_at )')
      .eq('user_id', user.id)
      .in('status', ['booked', 'attended']),
    supabase
      .from('replay_playback_progress')
      .select('recording_id, position_seconds, updated_at')
      .eq('user_id', user.id),
  ]);

  let totalLiveSeconds = 0;
  let monthLiveSeconds = 0;
  for (const row of liveRows ?? []) {
    const rawCourse = row.courses as { starts_at?: string; ends_at?: string } | { starts_at?: string; ends_at?: string }[] | null;
    const course = Array.isArray(rawCourse) ? rawCourse[0] : rawCourse;
    if (!course?.starts_at || !course?.ends_at) continue;
    const start = new Date(course.starts_at);
    const end = new Date(course.ends_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end >= now) continue;
    const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    totalLiveSeconds += seconds;
    if (end.toISOString() >= monthStart && end.toISOString() < monthEnd) {
      monthLiveSeconds += seconds;
    }
  }

  const byRecording = new Map<string, { all: number; month: number }>();
  for (const row of replayRows ?? []) {
    if (!row.recording_id || !row.updated_at) continue;
    const prev = byRecording.get(row.recording_id) ?? { all: 0, month: 0 };
    const pos = Math.max(0, Number(row.position_seconds) || 0);
    prev.all = Math.max(prev.all, pos);
    if (row.updated_at >= monthStart && row.updated_at < monthEnd) {
      prev.month = Math.max(prev.month, pos);
    }
    byRecording.set(row.recording_id, prev);
  }

  const totalReplaySeconds = Array.from(byRecording.values()).reduce((sum, item) => sum + item.all, 0);
  const monthReplaySeconds = Array.from(byRecording.values()).reduce((sum, item) => sum + item.month, 0);
  const replayViewedThisMonth = Array.from(byRecording.values()).filter((item) => item.month > 0).length;

  const completionRatio = clamp01(monthly.goal > 0 ? monthly.followedCount / monthly.goal : 0);
  const percent = Math.round(completionRatio * 100);
  const firstName = resolveFirstName(profile?.first_name, user.user_metadata);
  const avatarUrl = profile?.avatar_url?.trim() || '/client-contact-photo.png';
  const lang = profile?.preferred_blog_language === 'en' || profile?.preferred_blog_language === 'es' ? profile.preferred_blog_language : 'fr';
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR';
  const monthLabel = now.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  const minutesAgo = Math.max(1, now.getMinutes());
  const t =
    lang === 'en'
      ? {
          morning: 'Good morning',
          back: 'Back',
          summary: 'Summary',
          performance: 'Performance',
          body: 'Body battery',
          rest: 'Rest status',
          sessions: 'sessions',
          objective: 'goal',
          live: 'live',
          vimeo: 'vimeo',
          hello: 'Hello',
          minutesAgo: 'minutes ago',
          nutrition: 'Nutrition',
          hydration: 'Hydration',
          videosMonth: 'videos this month',
          noLive: 'No live',
          liveHoursMonth: 'Live hours this month',
          vimeoHoursMonth: 'Vimeo hours this month',
          monthRhythm: 'Monthly rhythm',
          sessionsLeft: 'session(s) left',
          engagement: 'Engagement',
        }
      : lang === 'es'
        ? {
            morning: 'Buenos días',
            back: 'Volver',
            summary: 'Resumen',
            performance: 'Rendimiento',
            body: 'Energía corporal',
            rest: 'Estado de descanso',
            sessions: 'sesiones',
            objective: 'objetivo',
            live: 'en vivo',
            vimeo: 'vimeo',
            hello: 'Hola',
            minutesAgo: 'minutos',
            nutrition: 'Nutrición',
            hydration: 'Hidratación',
            videosMonth: 'videos este mes',
            noLive: 'Sin live',
            liveHoursMonth: 'Horas live del mes',
            vimeoHoursMonth: 'Horas Vimeo del mes',
            monthRhythm: 'Ritmo del mes',
            sessionsLeft: 'sesión(es) restantes',
            engagement: 'Compromiso',
          }
        : {
            morning: 'Bonjour',
            back: 'Retour',
            summary: 'Résumé',
            performance: 'Performance',
            body: 'Énergie corporelle',
            rest: 'État de récupération',
            sessions: 'séances',
            objective: 'objectif',
            live: 'live',
            vimeo: 'vimeo',
            hello: 'Bonjour',
            minutesAgo: 'minutes',
            nutrition: 'Nutrition',
            hydration: 'Hydratation',
            videosMonth: 'vidéos ce mois',
            noLive: 'Aucun live',
            liveHoursMonth: 'Heures live ce mois',
            vimeoHoursMonth: 'Heures Vimeo ce mois',
            monthRhythm: 'Rythme du mois',
            sessionsLeft: 'séance(s) restantes',
            engagement: 'Engagement',
          };

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-2 md:px-8">
      <div className="mb-3">
        <Link href="/compte" className="inline-flex rounded-full border border-black/5 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-ink shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5">
          {t.back}
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[38px] border border-white/70 bg-[#eceef1] p-5 shadow-[0_24px_52px_rgba(20,20,30,0.18)] md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_42%)]" />
        <div className="absolute right-10 top-9 text-sm text-[#252833]">
          <span className="mr-3">11:10</span>
          <span>22°</span>
        </div>

        <div className="relative min-h-[560px] md:min-h-[580px]">
          <div className="absolute left-5 top-[136px] z-20 space-y-7 md:left-10 lg:left-12 lg:top-[140px]">
            <StatPill icon={<Target size={15} />} tone="bg-[#4e63ff] text-white" label={t.summary} value={`${monthly.followedCount}/${monthly.goal} ${t.sessions}`} />
            <StatPill icon={<Activity size={15} />} tone="bg-[#b74dff] text-white" label={t.performance} value={`${percent}% ${t.objective}`} />
            <StatPill icon={<Flame size={15} />} tone="bg-[#2f333f] text-[#6ef2bf]" label={t.body} value={`${fmtHours(monthLiveSeconds / 3600)} ${t.live}`} />
            <StatPill icon={<MoonStar size={15} />} tone="bg-[#2f333f] text-[#d7e5ff]" label={t.rest} value={`${fmtHours(monthReplaySeconds / 3600)} ${t.vimeo}`} />
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Coach"
            className="absolute bottom-16 left-[49%] z-10 h-[350px] w-auto -translate-x-1/2 rounded-[26px] object-cover shadow-[0_24px_42px_rgba(0,0,0,0.24)] md:left-[48%] md:h-[420px] lg:bottom-20 lg:left-[46%] lg:h-[400px]"
          />

          <div className="absolute right-4 top-[130px] z-20 w-[200px] md:right-10 md:w-[225px] lg:right-16 lg:top-[132px] lg:w-[250px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6e7380]">{monthLabel}</p>
            <h1 className="mt-2 text-[52px] font-semibold leading-[0.9] tracking-tight text-[#14151a] lg:text-[56px]">{t.hello} {firstName}</h1>
            <p className="mt-3 text-[15px] text-[#676d7a]">{minutesAgo} {t.minutesAgo}</p>

            <div className="mt-12 space-y-8 lg:mt-16">
              <MetricDot icon={<Utensils size={14} />} label={t.nutrition} value={`${replayViewedThisMonth} ${t.videosMonth}`} />
              <MetricDot
                icon={<Droplets size={14} />}
                label={t.hydration}
                value={nextAppointment ? new Date(nextAppointment.startsAt).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : t.noLive}
              />
            </div>
          </div>

          <div className="absolute bottom-2 left-5 right-5 z-20 grid gap-2 sm:grid-cols-2 md:bottom-3 md:left-4 md:right-4 lg:bottom-4 lg:left-6 lg:right-6 lg:grid-cols-4">
            <BottomChip icon={<Video size={14} />} title={t.liveHoursMonth} value={fmtHours(monthLiveSeconds / 3600)} />
            <BottomChip icon={<Activity size={14} />} title={t.vimeoHoursMonth} value={fmtHours(monthReplaySeconds / 3600)} />
            <BottomChip icon={<Target size={14} />} title={t.monthRhythm} value={`${Math.max(0, monthly.goal - monthly.followedCount)} ${t.sessionsLeft}`} />
            <BottomChip icon={<Flame size={14} />} title={t.engagement} value={`${percent}%`} />
          </div>
        </div>
      </section>
    </div>
  );
}

function BottomChip({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] border border-white/70 bg-white/72 px-3 py-2 shadow-[0_5px_12px_rgba(0,0,0,0.05)] backdrop-blur">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eef0f6] text-[#242833]">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[#6a7080]">{title}</p>
        <p className="truncate text-[13px] font-semibold text-[#171a22]">{value}</p>
      </div>
    </div>
  );
}

function StatPill({
  icon,
  tone,
  label,
  value,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] shadow-[0_10px_20px_rgba(0,0,0,0.12)] ${tone}`}>{icon}</span>
      <div>
        <p className="text-[15px] font-medium text-[#232733]">{label}</p>
        <p className="text-[11px] text-[#697082]">{value}</p>
      </div>
    </div>
  );
}

function MetricDot({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f8f9fc] text-[#1f2230] shadow-[0_10px_20px_rgba(0,0,0,0.1)]">{icon}</span>
      <div>
        <p className="text-[28px] font-medium leading-none text-[#232733]">{label}</p>
        <p className="mt-1 text-[11px] text-[#697082]">{value}</p>
      </div>
    </div>
  );
}
