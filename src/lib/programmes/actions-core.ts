import { createAdminClient } from '@/lib/supabase/admin';
import { hasVisioClientAccess } from '@/lib/access-control';
import { A_VALIDER_LOT1, A_VALIDER_LOT3 } from '@/content/a-valider';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { assertEnrollmentOwner, formatCertificateNumber, isStepCompleteAt80, segmentDurationS } from '@/lib/programmes/progress';
import { addDays, dayKeyInTimeZone } from '@/lib/programmes/engine';
import { resolveDisplayTimeZone } from '@/lib/time/tz-label';

/** Fuseau de la cliente (pour « aujourd'hui » / « demain » côté serveur). */
async function userTimeZone(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string> {
  const { data } = await admin.from('profiles').select('display_timezone, preferred_locale').eq('id', userId).maybeSingle();
  return resolveDisplayTimeZone((data?.display_timezone as string | null) ?? null, (data?.preferred_locale as string | null) ?? 'fr');
}

export type ProgramActionResult = { ok: true; id?: string } | { ok: false; message: string };

const GENERIC = A_VALIDER_LOT1.errors.generic.fr;

export function programmesGate(): ProgramActionResult | null {
  if (!isProgrammesEnabled()) return { ok: false, message: A_VALIDER_LOT3.flagOff.fr };
  return null;
}

export async function requireVisioUser(userId: string): Promise<ProgramActionResult | null> {
  if (!(await hasVisioClientAccess(userId))) return { ok: false, message: A_VALIDER_LOT3.visioRequired.fr };
  return null;
}

type EnrollmentRow = { id: string; user_id: string; program_id: string; status: string };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveProgramUuid(
  admin: ReturnType<typeof createAdminClient>,
  programIdOrSlug: string,
): Promise<string | null> {
  const query = isUuid(programIdOrSlug)
    ? admin.from('programs').select('id').eq('id', programIdOrSlug).maybeSingle()
    : admin.from('programs').select('id').eq('slug', programIdOrSlug).maybeSingle();
  const { data, error } = await query;
  if (error) {
    console.error('[programmes] resolve program', error.message);
    return null;
  }
  return data?.id ? String(data.id) : null;
}

export async function loadOwnedEnrollment(enrollmentId: string, userId: string): Promise<EnrollmentRow | ProgramActionResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('program_enrollments')
    .select('id, user_id, program_id, status')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (error) {
    console.error('[programmes] load enrollment', error.message);
    return { ok: false, message: GENERIC };
  }
  if (!data || !assertEnrollmentOwner(String(data.user_id), userId)) {
    return { ok: false, message: A_VALIDER_LOT3.notOwner.fr };
  }
  return data as EnrollmentRow;
}

export async function startProgramInternal(input: {
  userId: string;
  programId: string;
  startDate: string;
  chosenDays: number[];
  reminderTime: string;
  reminderEmail: boolean;
  reminderInapp: boolean;
  reminderPush: boolean;
}): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(input.userId));
  if (gated) return gated;
  const admin = createAdminClient();
  const programUuid = await resolveProgramUuid(admin, input.programId);
  if (!programUuid) return { ok: false, message: GENERIC };
  const { data, error } = await admin.rpc('start_program', {
    p_user_id: input.userId,
    p_program_id: programUuid,
    p_start_date: input.startDate,
    p_chosen_days: input.chosenDays,
    p_reminder_time: input.reminderTime,
    p_reminder_email: input.reminderEmail,
    p_reminder_inapp: input.reminderInapp,
    p_reminder_push: input.reminderPush,
  });
  if (error) {
    console.error('[programmes] start_program', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true, id: data ? String(data) : undefined };
}

export async function setEnrollmentStatusInternal(
  enrollmentId: string,
  userId: string,
  status: 'paused' | 'active' | 'abandoned',
): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(enrollmentId, userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  if (status === 'active') {
    await admin
      .from('program_enrollments')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('id', enrollmentId);
  }
  const patch: Record<string, unknown> = { status };
  if (status === 'paused') patch.paused_at = new Date().toISOString();
  if (status === 'active') patch.paused_at = null;
  const { error } = await admin.from('program_enrollments').update(patch).eq('id', enrollmentId);
  if (error) {
    console.error('[programmes] status', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true, id: enrollmentId };
}

export async function restartProgramInternal(enrollmentId: string, userId: string): Promise<ProgramActionResult> {
  const row = await loadOwnedEnrollment(enrollmentId, userId);
  if ('ok' in row) return row;
  // Nouvelle inscription avec les mêmes réglages ; l'ancienne reste dans l'historique (SPEC §4.2).
  const admin = createAdminClient();
  const [{ data: prev }, tz] = await Promise.all([
    admin
      .from('program_enrollments')
      .select('chosen_days, reminder_time, reminder_email, reminder_inapp, reminder_push')
      .eq('id', enrollmentId)
      .maybeSingle(),
    userTimeZone(admin, userId),
  ]);
  return startProgramInternal({
    userId,
    programId: row.program_id,
    startDate: dayKeyInTimeZone(new Date(), tz),
    chosenDays: Array.isArray(prev?.chosen_days) && prev.chosen_days.length ? (prev.chosen_days as number[]) : [1, 3, 5],
    reminderTime: typeof prev?.reminder_time === 'string' ? prev.reminder_time.slice(0, 5) : '18:00',
    reminderEmail: prev?.reminder_email !== false,
    reminderInapp: prev?.reminder_inapp !== false,
    reminderPush: prev?.reminder_push === true,
  });
}

export async function recordWatchedInternal(input: {
  userId: string;
  enrollmentId: string;
  stepId: string;
  watchedS: number;
  autoComplete: boolean;
}): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(input.userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(input.enrollmentId, input.userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const { data: step } = await admin
    .from('program_steps')
    .select('id, start_s, end_s, video_id')
    .eq('id', input.stepId)
    .maybeSingle();
  if (!step) return { ok: false, message: GENERIC };
  let duration = segmentDurationS(step.start_s as number | null, step.end_s as number | null, null);
  if (duration <= 0 && step.video_id) {
    const { data: vid } = await admin
      .from('standalone_vimeo_videos')
      .select('duration_seconds')
      .eq('id', step.video_id)
      .maybeSingle();
    duration = Number(vid?.duration_seconds ?? 0);
  }
  // Lecture de la ligne existante : la validation est définitive (revoir une séance ne la « dé-valide » pas)
  // et le temps regardé ne diminue jamais.
  const { data: existing } = await admin
    .from('program_step_progress')
    .select('watched_s, completed_at')
    .eq('enrollment_id', input.enrollmentId)
    .eq('step_id', input.stepId)
    .maybeSingle();
  const watched = Math.max(Number(existing?.watched_s ?? 0), Math.max(0, Math.round(input.watchedS)));
  const complete = input.autoComplete || isStepCompleteAt80(watched, duration);
  const completedAt = (existing?.completed_at as string | null) ?? (complete ? new Date().toISOString() : null);
  const { error } = await admin.from('program_step_progress').upsert(
    {
      enrollment_id: input.enrollmentId,
      step_id: input.stepId,
      watched_s: watched,
      completed_at: completedAt,
    },
    { onConflict: 'enrollment_id,step_id' },
  );
  if (error) {
    console.error('[programmes] watched', error.message);
    return { ok: false, message: GENERIC };
  }
  if (completedAt && !existing?.completed_at) {
    // Une séance faite annule un éventuel « Décaler à demain ».
    await admin.from('program_enrollments').update({ postponed_until: null }).eq('id', input.enrollmentId);
  }
  return { ok: true };
}

/** Jours d'entraînement et heure du rappel (« Mes réglages »). */
export async function updateEnrollmentSettingsInternal(input: {
  userId: string;
  enrollmentId: string;
  chosenDays: number[];
  reminderTime: string;
}): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(input.userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(input.enrollmentId, input.userId);
  if ('ok' in row) return row;
  const days = Array.from(new Set(input.chosenDays.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort((a, b) => a - b);
  if (!days.length) return { ok: false, message: A_VALIDER_LOT3.pickDay.fr };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime)) return { ok: false, message: A_VALIDER_LOT3.badTime.fr };
  const admin = createAdminClient();
  const { error } = await admin
    .from('program_enrollments')
    .update({ chosen_days: days, reminder_time: input.reminderTime })
    .eq('id', input.enrollmentId);
  if (error) {
    console.error('[programmes] settings', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true, id: input.enrollmentId };
}

export async function recordFeelingInternal(input: {
  userId: string;
  enrollmentId: string;
  stepId: string;
  feeling: 'easy' | 'right' | 'hard';
}): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(input.userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(input.enrollmentId, input.userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const { error } = await admin.from('program_step_progress').upsert(
    { enrollment_id: input.enrollmentId, step_id: input.stepId, feeling: input.feeling },
    { onConflict: 'enrollment_id,step_id' },
  );
  if (error) {
    console.error('[programmes] feeling', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true };
}

export async function recordTestInternal(input: {
  userId: string;
  enrollmentId: string;
  phase: 'start' | 'end';
  results: Record<string, unknown>;
}): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(input.userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(input.enrollmentId, input.userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const { error } = await admin.from('program_test_results').upsert(
    { enrollment_id: input.enrollmentId, phase: input.phase, results: input.results },
    { onConflict: 'enrollment_id,phase' },
  );
  if (error) {
    console.error('[programmes] tests', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true };
}

export async function completeProgramInternal(enrollmentId: string, userId: string): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(enrollmentId, userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const { data: seq, error: seqErr } = await admin.rpc('nextval_program_certificate');
  let n = typeof seq === 'number' ? seq : null;
  if (seqErr || n == null) {
    const { data: fallback } = await admin.from('program_enrollments').select('id').not('certificate_number', 'is', null);
    n = (fallback?.length ?? 0) + 1;
  }
  const completedAt = new Date();
  const certificate = formatCertificateNumber(completedAt, n);
  const { error } = await admin
    .from('program_enrollments')
    .update({ status: 'completed', completed_at: completedAt.toISOString(), certificate_number: certificate })
    .eq('id', enrollmentId);
  if (error) {
    console.error('[programmes] complete', error.message);
    return { ok: false, message: GENERIC };
  }
  try {
    const { dispatch } = await import('@/lib/notifications/dispatcher');
    const { getEmailPublicBaseUrl } = await import('@/lib/email/base-template');
    const base = getEmailPublicBaseUrl();
    await dispatch(admin, {
      event_type: 'program.completed',
      user_id: userId,
      payload: {
        title: 'Bravo, programme terminé',
        body: 'Ton certificat est prêt.',
        joinUrl: `${base}/api/programmes/certificat/${enrollmentId}`,
        programUrl: `${base}/compte/programmes`,
      },
      channel_hints: ['email', 'in_app'],
      idempotency_key: `program.completed:${enrollmentId}`,
    });
  } catch (e) {
    console.error('[programmes] complete notify', e);
  }
  return { ok: true, id: certificate };
}

export async function recordFeedbackInternal(input: {
  userId: string;
  enrollmentId: string;
  rating: number | null;
  message: string;
  publishConsent: boolean;
}): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(input.userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(input.enrollmentId, input.userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const { error } = await admin.from('program_feedback').insert({
    enrollment_id: input.enrollmentId,
    rating: input.rating,
    message: input.message,
    publish_consent: input.publishConsent === true,
  });
  if (error) {
    console.error('[programmes] feedback', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true };
}

/** Retire l'accord de publication des messages laissés pour Alejandra sur cette inscription. */
export async function withdrawFeedbackConsentInternal(enrollmentId: string, userId: string): Promise<ProgramActionResult> {
  const row = await loadOwnedEnrollment(enrollmentId, userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const { error } = await admin
    .from('program_feedback')
    .update({ consent_withdrawn_at: new Date().toISOString() })
    .eq('enrollment_id', enrollmentId)
    .eq('publish_consent', true)
    .is('consent_withdrawn_at', null);
  if (error) {
    console.error('[programmes] feedback consent', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true };
}

export async function postponeSessionInternal(enrollmentId: string, userId: string): Promise<ProgramActionResult> {
  const gated = programmesGate() ?? (await requireVisioUser(userId));
  if (gated) return gated;
  const row = await loadOwnedEnrollment(enrollmentId, userId);
  if ('ok' in row) return row;
  const admin = createAdminClient();
  const tz = await userTimeZone(admin, userId);
  const until = addDays(dayKeyInTimeZone(new Date(), tz), 1);
  const { error } = await admin.from('program_enrollments').update({ postponed_until: until }).eq('id', enrollmentId);
  if (error) {
    console.error('[programmes] postpone', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true };
}
