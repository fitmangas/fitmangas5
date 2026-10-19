import { createAdminClient } from '@/lib/supabase/admin';
import { hasVisioClientAccess } from '@/lib/access-control';
import { A_VALIDER_LOT1, A_VALIDER_LOT3 } from '@/content/a-valider';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { assertEnrollmentOwner, formatCertificateNumber, isStepCompleteAt80, segmentDurationS } from '@/lib/programmes/progress';

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
  const { data, error } = await admin.rpc('start_program', {
    p_user_id: input.userId,
    p_program_id: input.programId,
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
  return startProgramInternal({
    userId,
    programId: row.program_id,
    startDate: new Date().toISOString().slice(0, 10),
    chosenDays: [1, 3, 5],
    reminderTime: '18:00',
    reminderEmail: true,
    reminderInapp: true,
    reminderPush: false,
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
  const complete = input.autoComplete || isStepCompleteAt80(input.watchedS, duration);
  const { error } = await admin.from('program_step_progress').upsert(
    {
      enrollment_id: input.enrollmentId,
      step_id: input.stepId,
      watched_s: input.watchedS,
      completed_at: complete ? new Date().toISOString() : null,
    },
    { onConflict: 'enrollment_id,step_id' },
  );
  if (error) {
    console.error('[programmes] watched', error.message);
    return { ok: false, message: GENERIC };
  }
  return { ok: true };
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
