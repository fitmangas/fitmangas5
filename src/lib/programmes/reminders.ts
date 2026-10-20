import type { SupabaseClient } from '@supabase/supabase-js';

import { dispatch } from '@/lib/notifications/dispatcher';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { A_VALIDER_LOT3 } from '@/content/a-valider';
import {
  chosenDaysLabel,
  computeProgramState,
  dayKeyInTimeZone,
  isoWeekKey,
  type EngineEnrollment,
  type EngineProgress,
  type Lang,
  type ProgramState,
} from '@/lib/programmes/engine';
import { loadProgramDefinition, type ProgramDefinition } from '@/lib/programmes/load';
import { sessionHref } from '@/lib/programmes/view-models';
import { resolveDisplayTimeZone } from '@/lib/time/tz-label';
import { hasVisioClientAccessServiceRole } from '@/lib/access-control';

/**
 * Rappels des programmes, lancés par la tâche horaire (:05) :
 * - « Ta séance du jour » (A07) : à l'heure choisie (heure locale de la cliente), seulement si une séance
 *   est prévue aujourd'hui par le moteur (jours choisis, report, séance déjà faite, début futur, pause) ;
 *   exemptée du mode silence (c'est la cliente qui a choisi l'heure).
 * - Relance douce : aucune séance depuis 4 jours, au plus une fois par semaine, un jour sans séance prévue,
 *   à la même heure.
 * Rappel à 12:30 → envoyé par la tâche de 12:05 (l'heure compte, pas les minutes).
 */

type Row = {
  id: string;
  user_id: string;
  program_id: string;
  status: string;
  start_date: string;
  chosen_days: number[] | null;
  reminder_time: string | null;
  postponed_until: string | null;
  reminder_email: boolean | null;
  reminder_inapp: boolean | null;
  reminder_push: boolean | null;
  created_at: string | null;
  programs: { slug?: string } | Array<{ slug?: string }> | null;
};

type Prefs = {
  program_session_email?: boolean | null;
  program_session_inapp?: boolean | null;
  program_session_push?: boolean | null;
  program_nudge_email?: boolean | null;
  program_nudge_inapp?: boolean | null;
};

function hourIn(now: Date, timeZone: string): number {
  const v = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).formatToParts(now).find((p) => p.type === 'hour')?.value;
  const h = Number(v ?? NaN);
  return h === 24 ? 0 : h;
}

function sessionPayload(def: ProgramDefinition, state: ProgramState, data: { chosenDays: number[]; reminderTime: string }, lang: Lang) {
  const next = state.next!;
  const p = def.program;
  const week = (p.weeks_detail ?? []).find((w) => w.week === next.step.week);
  const title = next.step.title[lang] || next.step.title.fr || next.step.videoTitle || '';
  return {
    programTitle: p.title[lang] || p.title.fr,
    title,
    minutes: next.step.minutes ?? 0,
    equipment: p.equipment?.[0] ? p.equipment[0][lang] || p.equipment[0].fr : null,
    weekIndex: next.step.week,
    weekTheme: week?.focus?.[lang] || week?.focus?.fr || null,
    stepIndex: next.n,
    stepTotal: state.total,
    doneCount: state.done,
    tip: week?.cues?.[0]?.[lang] || week?.cues?.[0]?.fr || null,
    scheduleLabel:
      lang === 'es'
        ? `Recordatorio: ${chosenDaysLabel(data.chosenDays, lang)} a las ${data.reminderTime}.`
        : `Rappel : ${chosenDaysLabel(data.chosenDays, lang)} à ${data.reminderTime}.`,
  };
}

export async function enqueueProgramSessionReminders(admin: SupabaseClient, now = new Date()) {
  if (!isProgrammesEnabled() || !isNotifV2Enabled()) return { skipped: 'flag' as const, queued: 0, nudges: 0 };
  try {
    const { data, error } = await admin
      .from('program_enrollments')
      .select(
        'id, user_id, program_id, status, start_date, chosen_days, reminder_time, postponed_until, reminder_email, reminder_inapp, reminder_push, created_at, programs(slug)',
      )
      .eq('status', 'active');
    if (error) {
      console.error('[programmes] reminders select', error.message);
      return { skipped: 'tables' as const, queued: 0, nudges: 0 };
    }
    const rows = (data ?? []) as Row[];
    if (!rows.length) return { queued: 0, nudges: 0 };

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const [{ data: profiles }, prefsRes] = await Promise.all([
      admin.from('profiles').select('id, preferred_locale, display_timezone').in('id', userIds),
      admin
        .from('notification_preferences')
        .select('user_id, program_session_email, program_session_inapp, program_session_push, program_nudge_email, program_nudge_inapp')
        .in('user_id', userIds),
    ]);
    const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));
    // Colonnes du lot 2 absentes : valeurs par défaut (séance du jour et relance : email + appli).
    const prefsById = new Map(((prefsRes.error ? [] : prefsRes.data) ?? []).map((p) => [String((p as { user_id: string }).user_id), p as Prefs]));

    // Seulement les inscriptions dont c'est l'heure de rappel (heure locale).
    const due = rows.filter((r) => {
      const prof = profileById.get(r.user_id);
      const lang: Lang = prof?.preferred_locale === 'es' ? 'es' : 'fr';
      const tz = resolveDisplayTimeZone((prof?.display_timezone as string | null) ?? null, lang);
      const reminderHour = Number(String(r.reminder_time ?? '18:00').slice(0, 2));
      return hourIn(now, tz) === reminderHour;
    });
    if (!due.length) return { queued: 0, nudges: 0 };

    // Accès Visio actuel (même règle que l'espace client) : une ancienne abonnée ne reçoit plus de rappel
    // vers des pages qu'elle ne peut plus ouvrir. Peu de personnes par heure : une vérification chacune.
    const access = new Map<string, boolean>();
    for (const uid of Array.from(new Set(due.map((r) => r.user_id)))) {
      try {
        access.set(uid, await hasVisioClientAccessServiceRole(uid));
      } catch {
        access.set(uid, false);
      }
    }
    const dueWithAccess = due.filter((r) => access.get(r.user_id));
    if (!dueWithAccess.length) return { queued: 0, nudges: 0 };

    const { data: progressRows } = await admin
      .from('program_step_progress')
      .select('enrollment_id, step_id, completed_at, watched_s, feeling')
      .in(
        'enrollment_id',
        dueWithAccess.map((r) => r.id),
      );
    const progressBy = new Map<string, EngineProgress[]>();
    for (const p of progressRows ?? []) {
      const k = String(p.enrollment_id);
      if (!progressBy.has(k)) progressBy.set(k, []);
      progressBy.get(k)!.push({
        stepId: String(p.step_id),
        completedAt: (p.completed_at as string | null) ?? null,
        watchedS: Number(p.watched_s ?? 0),
        feeling: (p.feeling as EngineProgress['feeling']) ?? null,
      });
    }

    const defs = new Map<string, ProgramDefinition | null>();
    const base = getEmailPublicBaseUrl();
    let queued = 0;
    let nudges = 0;

    for (const r of dueWithAccess) {
      const rel = Array.isArray(r.programs) ? r.programs[0] : r.programs;
      const slug = rel?.slug;
      if (!slug) continue;
      if (!defs.has(slug)) defs.set(slug, await loadProgramDefinition(slug, { includeDrafts: true }));
      const def = defs.get(slug);
      if (!def) continue;
      const prof = profileById.get(r.user_id);
      const lang: Lang = prof?.preferred_locale === 'es' ? 'es' : 'fr';
      const tz = resolveDisplayTimeZone((prof?.display_timezone as string | null) ?? null, lang);
      const todayKey = dayKeyInTimeZone(now, tz);
      const enrollment: EngineEnrollment = {
        id: r.id,
        status: 'active',
        startDate: String(r.start_date).slice(0, 10),
        chosenDays: Array.isArray(r.chosen_days) ? r.chosen_days : [],
        postponedUntil: r.postponed_until,
        reminderTime: r.reminder_time ? String(r.reminder_time).slice(0, 5) : '18:00',
        createdAt: r.created_at,
      };
      const state = computeProgramState({ steps: def.steps, progress: progressBy.get(r.id) ?? [], enrollment, todayKey, timeZone: tz });
      if (!state.next || state.isComplete) continue;
      const session = sessionPayload(def, state, { chosenDays: state.chosenDays, reminderTime: enrollment.reminderTime ?? '18:00' }, lang);
      const sessionUrl = `${base}${sessionHref(def.program.slug, state.next.step)}`;
      const programUrl = `${base}/compte/programmes/${def.program.slug}`;
      const prefs = prefsById.get(r.user_id) ?? {};

      if (state.next.status === 'today') {
        const hints: Array<'email' | 'in_app' | 'push'> = [];
        if (r.reminder_email !== false && prefs.program_session_email !== false) hints.push('email');
        if (r.reminder_inapp !== false && prefs.program_session_inapp !== false) hints.push('in_app');
        if (r.reminder_push === true && prefs.program_session_push !== false) hints.push('push');
        if (!hints.length) continue;
        await dispatch(admin, {
          event_type: 'program.session.reminder',
          user_id: r.user_id,
          payload: {
            title: lang === 'es' ? `Tu sesión del día: ${session.title}` : `Ta séance du jour : ${session.title}`,
            body: `${session.minutes ? `${session.minutes} min · ` : ''}${session.programTitle}`,
            url: sessionUrl,
            courseTitle: session.title,
            programUrl,
            joinUrl: sessionUrl,
            session,
          },
          channel_hints: hints,
          idempotency_key: `program.session.reminder:${r.id}:${todayKey}`,
        });
        queued += 1;
        continue;
      }

      // Relance douce : un jour sans séance prévue, après 4 jours sans séance, une fois par semaine au plus.
      if (state.daysSinceActivity >= 4) {
        const hints: Array<'email' | 'in_app'> = [];
        if (prefs.program_nudge_email !== false) hints.push('email');
        if (prefs.program_nudge_inapp !== false) hints.push('in_app');
        if (!hints.length) continue;
        await dispatch(admin, {
          event_type: 'program.nudge',
          user_id: r.user_id,
          payload: {
            title: A_VALIDER_LOT3.nudge.headline[lang],
            body: A_VALIDER_LOT3.nudge.inApp[lang],
            url: sessionUrl,
            programUrl,
            joinUrl: sessionUrl,
            session,
          },
          channel_hints: hints,
          idempotency_key: `program.nudge:${r.id}:${isoWeekKey(todayKey)}`,
        });
        nudges += 1;
      }
    }
    return { queued, nudges };
  } catch (e) {
    console.error('[programmes] reminders', e);
    return { skipped: 'tables' as const, queued: 0, nudges: 0 };
  }
}
