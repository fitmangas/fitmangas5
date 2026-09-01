import type { SupabaseClient } from '@supabase/supabase-js';

import { dispatchReplayReady } from '@/lib/notifications/phase2';
import { rejectSiblingCourseRecordings, upsertCourseRecordingForCourse } from '@/lib/course-recording-upsert';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseVimeoVideoId } from '@/lib/vimeo-parse-id';
import { probeVimeoPlayback } from '@/lib/vimeo-playback';
import { getVideoMetadata, normalizeDurationSeconds, type VimeoVideoMetadata } from '@/lib/vimeo';

export type CourseRecordingValidationStatus = 'pending' | 'approved' | 'rejected';
/**
 * Lie un replay Vimeo à un cours (statut pending, pas de publication client).
 */
export async function linkCourseReplay(params: {
  courseId: string;
  vimeoInput: string;
  createdBy?: string | null;
}): Promise<VimeoVideoMetadata> {
  const vimeoId = parseVimeoVideoId(params.vimeoInput);
  if (!vimeoId) {
    throw new Error('URL ou identifiant Vimeo invalide.');
  }

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, course_format')
    .eq('id', params.courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) throw new Error('Séance introuvable.');
  if (String(course.course_format) !== 'online') {
    throw new Error('Le replay Vimeo concerne uniquement les séances en ligne.');
  }

  const metadata = await getVideoMetadata(vimeoId);

  await upsertCourseRecordingForCourse(admin, {
    courseId: params.courseId,
    metadata,
    createdBy: params.createdBy ?? null,
  });

  return metadata;
}

export async function approveCourseReplay(
  admin: SupabaseClient,
  recordingId: string,
): Promise<{ ok: true; already?: boolean } | { ok: false; error: string; status: number }> {
  const { data: rec, error: fetchError } = await admin
    .from('video_recordings')
    .select('id, course_id, validation_status, vimeo_video_id')
    .eq('id', recordingId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!rec) return { ok: false, error: 'Replay introuvable.', status: 404 };
  if (rec.validation_status === 'approved') return { ok: true, already: true };

  const vimeoId = typeof rec.vimeo_video_id === 'string' ? rec.vimeo_video_id.trim() : '';
  if (!vimeoId) {
    return { ok: false, error: 'Aucun identifiant Vimeo sur ce replay.', status: 400 };
  }

  const probe = await probeVimeoPlayback(vimeoId);
  if (!probe.isPlayable) {
    return {
      ok: false,
      error:
        probe.status === 'not_found' || probe.status === 'uploading' || probe.status === 'invalid'
          ? `Vimeo non prêt (statut: ${probe.status ?? 'inconnu'}). L’upload est incomplet ou la vidéo est introuvable — ne pas valider.`
          : `Vimeo non lisible pour le moment (statut: ${probe.status ?? 'inconnu'}). Réessaie quand le transcodage est terminé.`,
      status: 409,
    };
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from('video_recordings')
    .update({
      validation_status: 'approved',
      is_ready: true,
      available_at: now,
      upload_status: 'ready',
      duration_seconds: probe.durationSeconds ?? undefined,
    })
    .eq('id', recordingId);
  if (error) throw error;

  await rejectSiblingCourseRecordings(admin, String(rec.course_id), recordingId);
  await dispatchReplayReady(admin, String(rec.course_id));
  return { ok: true };
}

/** Réintègre des replays côté client sans notifier les adhérentes (restauration bulk). */
export async function approveCourseReplaysSilentBulk(
  admin: SupabaseClient,
  recordingIds: string[],
): Promise<{ updated: number; skipped: number }> {
  const ids = [...new Set(recordingIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return { updated: 0, skipped: 0 };

  const { data: rows, error: fetchError } = await admin
    .from('video_recordings')
    .select('id, validation_status, is_ready, available_at, created_at, course_id')
    .in('id', ids);
  if (fetchError) throw fetchError;

  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const row of rows ?? []) {
    if (row.validation_status === 'approved' && row.is_ready === true) {
      skipped += 1;
      continue;
    }
    const availableAt = row.available_at ?? row.created_at ?? now;
    const { error } = await admin
      .from('video_recordings')
      .update({
        validation_status: 'approved',
        is_ready: true,
        available_at: availableAt,
        upload_status: 'ready',
      })
      .eq('id', row.id);
    if (error) throw error;
    if (row.course_id) {
      await rejectSiblingCourseRecordings(admin, String(row.course_id), String(row.id));
    }
    updated += 1;
  }

  return { updated, skipped };
}

export async function rejectCourseReplay(
  admin: SupabaseClient,
  recordingId: string,
): Promise<{ ok: true; already?: boolean } | { ok: false; error: string; status: number }> {
  const { data: rec, error: fetchError } = await admin
    .from('video_recordings')
    .select('id, validation_status')
    .eq('id', recordingId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!rec) return { ok: false, error: 'Replay introuvable.', status: 404 };
  if (rec.validation_status === 'rejected') return { ok: true, already: true };

  const { error } = await admin
    .from('video_recordings')
    .update({ validation_status: 'rejected', is_ready: false, available_at: null })
    .eq('id', recordingId);
  if (error) throw error;

  return { ok: true };
}

/**
 * Mise à jour webhook Vimeo pour un replay de cours existant.
 * Ne publie jamais côté client : is_ready reste false tant que validation_status ≠ approved.
 */
export async function updateCourseRecordingFromWebhook(
  admin: SupabaseClient,
  vimeoId: string,
  meta: VimeoVideoMetadata | null,
): Promise<{ course_recording_id: string } | null> {
  const { data: courseRec, error: fetchError } = await admin
    .from('video_recordings')
    .select('id, validation_status, is_ready, available_at')
    .eq('vimeo_video_id', vimeoId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!courseRec) return null;

  const approved = courseRec.validation_status === 'approved' && courseRec.is_ready === true;
  const payload: Record<string, unknown> = {
    upload_status: meta?.isReady ? 'ready' : 'transcoding',
    is_ready: approved,
    available_at: approved ? courseRec.available_at : null,
  };

  if (meta) {
    payload.embed_url = meta.embedUrl ?? meta.link;
    payload.thumbnail_url = meta.thumbnailUrl;
    const duration = normalizeDurationSeconds(meta.durationSeconds);
    if (duration != null) {
      payload.duration_seconds = duration;
    }
    payload.title = meta.title;
    payload.description = meta.description;
    payload.vimeo_uri = meta.vimeoUri;
    payload.metadata = {
      link: meta.link,
      transcode_status: meta.transcodeStatus,
    };
  }

  const { error } = await admin.from('video_recordings').update(payload).eq('id', courseRec.id);
  if (error) throw error;

  return { course_recording_id: courseRec.id };
}
