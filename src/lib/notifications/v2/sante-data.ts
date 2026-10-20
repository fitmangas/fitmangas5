import type { SupabaseClient } from '@supabase/supabase-js';

import { countDigestBacklog } from '@/lib/notifications/v2/cutoff';
import { HEARTBEAT_JOBS, isHeartbeatLate, type HeartbeatJob } from '@/lib/notifications/v2/heartbeats';
import { isVisioLiveRecipient, type LiveLanguage } from '@/lib/notifications/v2/recipients';
import { visioProfiles } from '@/lib/notifications/v2/reminders';

const TZ = 'Europe/Paris';

export type SanteTask = {
  job: HeartbeatJob | 'push';
  label: string;
  frequency: string;
  last: string;
  result: string;
  next: string;
  state: 'ok' | 'late' | 'never' | 'info';
};

export type SanteLiveRow = {
  label: string;
  recipients: number;
  eve: { done: boolean; text: string };
  hour: { done: boolean; text: string };
};

export type SanteData = {
  checkedAt: string;
  noLiveAfter: string | null;
  noLiveAlert: boolean;
  backlog: number;
  backlogDetail: Array<{ digest_bucket: string; event_type: string; n: number }>;
  tasks: SanteTask[];
  lives: SanteLiveRow[];
  sent7d: { email: number; failed: number; push: number; inApp: number; pushEquipped: number };
  errors: string[];
};

const TASK_LABELS: Record<HeartbeatJob, { label: string; frequency: string }> = {
  'course-reminders': { label: 'Rappels des lives', frequency: 'toutes les 10 min' },
  social: { label: 'Publication réseaux sociaux', frequency: 'toutes les 10 min' },
  hourly: { label: 'Récapitulatifs, « Ta semaine », séances du jour', frequency: 'toutes les heures (:05)' },
  'daily-jobs': { label: 'Tâches quotidiennes', frequency: 'chaque jour' },
};

function fmt(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...opts }).format(date);
}

function relativePast(iso: string, now: Date): string {
  const min = Math.round((now.getTime() - Date.parse(iso)) / 60_000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return fmt(new Date(iso), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function relativeFuture(ms: number, now: Date): string {
  const min = Math.round((ms - now.getTime()) / 60_000);
  if (min <= 0) return 'imminent';
  if (min < 60) return `dans ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `dans ${h} h`;
  return fmt(new Date(ms), { weekday: 'short', day: 'numeric', month: 'short' });
}

function summarizeMeta(job: HeartbeatJob, meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return '—';
  const pick = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  if (job === 'course-reminders') {
    const v2 = meta.v2 as { sent?: number } | undefined;
    const sent = pick(v2?.sent) ?? pick(meta.sent);
    return sent !== null ? `${sent} rappel${sent > 1 ? 's' : ''} envoyé${sent > 1 ? 's' : ''}` : 'terminé';
  }
  if (job === 'social') {
    const r = meta.social as { published?: number; due?: number } | undefined;
    const published = pick(r?.published) ?? pick(meta.published);
    return published ? `${published} publication${published > 1 ? 's' : ''}` : 'rien à publier';
  }
  if (job === 'hourly') {
    const d = meta.digest as { sent?: number; skipped?: string } | undefined;
    if (d?.skipped) return 'récapitulatifs en pause (drapeau)';
    const sent = pick(d?.sent);
    return sent !== null ? `${sent} récapitulatif${sent > 1 ? 's' : ''}` : 'terminé';
  }
  return 'terminé';
}

function maskEmail(text: string): string {
  return text.replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '$1•••@$2');
}

/** Données de l'écran Santé des envois (A10). Chaque bloc est isolé : une erreur n'empêche pas les autres. */
export async function loadSanteData(admin: SupabaseClient, now: Date = new Date()): Promise<SanteData> {
  const out: SanteData = {
    checkedAt: fmt(now, { hour: '2-digit', minute: '2-digit' }),
    noLiveAfter: null,
    noLiveAlert: false,
    backlog: 0,
    backlogDetail: [],
    tasks: [],
    lives: [],
    sent7d: { email: 0, failed: 0, push: 0, inApp: 0, pushEquipped: 0 },
    errors: [],
  };

  try {
    out.backlogDetail = (await countDigestBacklog(admin)).sort((a, b) => b.n - a.n);
    out.backlog = out.backlogDetail.reduce((s, r) => s + r.n, 0);
  } catch (e) {
    console.error('[sante] backlog', e);
  }

  try {
    const { data: beats } = await admin.from('cron_heartbeats').select('job, last_run_at, meta');
    for (const job of Object.keys(HEARTBEAT_JOBS) as HeartbeatJob[]) {
      const row = (beats ?? []).find((b) => (b as { job: string }).job === job) as
        | { last_run_at?: string | null; meta?: Record<string, unknown> | null }
        | undefined;
      const last = row?.last_run_at ?? null;
      const late = isHeartbeatLate(last, HEARTBEAT_JOBS[job], now);
      out.tasks.push({
        job,
        ...TASK_LABELS[job],
        last: last ? relativePast(last, now) : 'jamais',
        result: last ? summarizeMeta(job, row?.meta) : '—',
        next: last ? relativeFuture(Date.parse(last) + HEARTBEAT_JOBS[job], now) : '—',
        state: !last ? 'never' : late ? 'late' : 'ok',
      });
    }
  } catch (e) {
    console.error('[sante] heartbeats', e);
  }

  try {
    const { count } = await admin.from('push_subscriptions').select('user_id', { count: 'exact', head: true });
    out.sent7d.pushEquipped = count ?? 0;
    out.tasks.push({
      job: 'push',
      label: 'Push téléphone',
      frequency: 'à chaque envoi',
      last: '—',
      result: `${count ?? 0} appareil${(count ?? 0) > 1 ? 's' : ''} équipé${(count ?? 0) > 1 ? 's' : ''}`,
      next: '—',
      state: 'info',
    });
  } catch (e) {
    console.error('[sante] push', e);
  }

  try {
    const until = new Date(now.getTime() + 7 * 86_400_000).toISOString();
    const { data: courses } = await admin
      .from('courses')
      .select('id, title, starts_at, course_language')
      .eq('course_format', 'online')
      .eq('is_published', true)
      .gte('starts_at', now.toISOString())
      .order('starts_at', { ascending: true })
      .limit(20);
    const upcoming = (courses ?? []) as Array<{ id: string; title: string; starts_at: string; course_language?: string | null }>;
    const inWeek = upcoming.filter((c) => c.starts_at <= until);
    out.noLiveAlert = inWeek.length === 0;
    const lastPublished = upcoming.at(-1)?.starts_at ?? null;
    out.noLiveAfter = lastPublished ? fmt(new Date(lastPublished), { weekday: 'short', day: 'numeric', month: 'short' }) : null;

    if (upcoming.length) {
      const profiles = await visioProfiles(admin).catch(() => []);
      for (const c of upcoming.slice(0, 4)) {
        const lang: LiveLanguage = c.course_language === 'es' ? 'es' : 'fr';
        const recipients = profiles.filter((p) => isVisioLiveRecipient(p, lang)).length;
        const [{ count: eveCount }, { count: hourCount }] = await Promise.all([
          admin.from('notification_log').select('id', { count: 'exact', head: true }).like('idempotency_key', `course.visio.reminder_J-1:${c.id}:%`),
          admin.from('notification_log').select('id', { count: 'exact', head: true }).like('idempotency_key', `course.visio.reminder_H-1:${c.id}:%`),
        ]);
        const start = new Date(c.starts_at);
        const eveDate = new Date(start.getTime() - 86_400_000);
        out.lives.push({
          label: `${c.title} · ${lang.toUpperCase()} · ${fmt(start, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
          recipients,
          eve: (eveCount ?? 0) > 0
            ? { done: true, text: `envoyé (${eveCount})` }
            : { done: false, text: `prévu ${fmt(eveDate, { weekday: 'short' })} dès 18:00 (heure cliente)` },
          hour: (hourCount ?? 0) > 0
            ? { done: true, text: `envoyé (${hourCount})` }
            : { done: false, text: `prévu ${fmt(new Date(start.getTime() - 3_600_000), { hour: '2-digit', minute: '2-digit' })}` },
        });
      }
    }
  } catch (e) {
    console.error('[sante] lives', e);
  }

  try {
    const since = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const [{ count: email }, { count: push }, { count: inApp }, { data: errs }] = await Promise.all([
      admin.from('notification_log').select('id', { count: 'exact', head: true }).eq('channel', 'email').gte('created_at', since),
      admin.from('notification_log').select('id', { count: 'exact', head: true }).eq('channel', 'push').gte('created_at', since),
      admin.from('user_notifications').select('id', { count: 'exact', head: true }).gte('created_at', since),
      admin
        .from('notification_log')
        .select('created_at, event_type, payload')
        .gte('created_at', since)
        .not('payload->>error', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    out.sent7d.email = email ?? 0;
    out.sent7d.push = push ?? 0;
    out.sent7d.inApp = inApp ?? 0;
    const errorRows = (errs ?? []) as Array<{ created_at: string; event_type: string; payload: { error?: unknown } | null }>;
    out.sent7d.failed = errorRows.length;
    out.errors = errorRows.map(
      (r) =>
        `${fmt(new Date(r.created_at), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${r.event_type} · ${maskEmail(String(r.payload?.error ?? ''))}`,
    );
  } catch (e) {
    console.error('[sante] envois 7 j', e);
  }

  return out;
}
