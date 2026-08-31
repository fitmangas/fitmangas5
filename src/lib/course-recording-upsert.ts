import type { SupabaseClient } from '@supabase/supabase-js';

import type { VimeoVideoMetadata } from '@/lib/vimeo';
import { normalizeDurationSeconds } from '@/lib/vimeo';

type CourseRecordingRow = {
  id: string;
  vimeo_video_id: string | null;
  validation_status: string;
  is_ready: boolean;
  available_at: string | null;
  created_at?: string;
};

export type CourseRecordingUpsertResult =
  | { action: 'inserted' | 'updated'; vimeoId: string }
  | { action: 'skipped_duplicate'; vimeoId: string; existingRecordingId: string };

function buildRecordingPayload(
  courseId: string,
  metadata: VimeoVideoMetadata,
  existing: Pick<CourseRecordingRow, 'validation_status' | 'is_ready' | 'available_at'> | null,
  createdBy?: string | null,
) {
  const approved = existing?.validation_status === 'approved' && existing.is_ready === true;
  return {
    course_id: courseId,
    vimeo_video_id: metadata.vimeoId,
    vimeo_uri: metadata.vimeoUri,
    title: metadata.title,
    description: metadata.description,
    embed_url: metadata.embedUrl ?? metadata.link,
    thumbnail_url: metadata.thumbnailUrl,
    duration_seconds: normalizeDurationSeconds(metadata.durationSeconds),
    privacy_view: metadata.privacyView ?? 'unlisted',
    upload_status: metadata.isReady ? ('ready' as const) : ('transcoding' as const),
    validation_status: (existing?.validation_status as 'pending' | 'approved' | 'rejected' | undefined) ?? 'pending',
    is_ready: approved,
    available_at: approved ? (existing?.available_at ?? new Date().toISOString()) : null,
    metadata: {
      link: metadata.link,
      transcode_status: metadata.transcodeStatus,
    },
    created_by: createdBy ?? null,
  };
}

/**
 * Un seul replay actif par cours (hors rejected).
 * - Même vimeo_id → upsert classique.
 * - Cours déjà validé avec un autre vimeo_id → ignore (évite les doublons client).
 * - Cours en attente avec un autre vimeo_id → remplace la ligne pending (re-upload VPS).
 */
export async function upsertCourseRecordingForCourse(
  admin: SupabaseClient,
  params: {
    courseId: string;
    metadata: VimeoVideoMetadata;
    createdBy?: string | null;
  },
): Promise<CourseRecordingUpsertResult> {
  const { courseId, metadata, createdBy } = params;

  const { data: byVimeo, error: vimeoErr } = await admin
    .from('video_recordings')
    .select('id, vimeo_video_id, validation_status, is_ready, available_at')
    .eq('vimeo_video_id', metadata.vimeoId)
    .maybeSingle();
  if (vimeoErr) throw new Error(`Lecture replay Vimeo: ${vimeoErr.message}`);

  if (byVimeo) {
    const payload = buildRecordingPayload(courseId, metadata, byVimeo as CourseRecordingRow, createdBy);
    const { error } = await admin.from('video_recordings').upsert(payload, { onConflict: 'vimeo_video_id' });
    if (error) throw new Error(`Sync video_recordings failed: ${error.message}`);
    return { action: 'updated', vimeoId: metadata.vimeoId };
  }

  const { data: siblings, error: sibErr } = await admin
    .from('video_recordings')
    .select('id, vimeo_video_id, validation_status, is_ready, available_at, created_at')
    .eq('course_id', courseId)
    .neq('validation_status', 'rejected')
    .order('created_at', { ascending: true });
  if (sibErr) throw new Error(`Lecture replays cours: ${sibErr.message}`);

  const active = (siblings ?? []) as CourseRecordingRow[];
  const approvedSibling = active.find((r) => r.validation_status === 'approved' && r.is_ready === true);
  if (approvedSibling && approvedSibling.vimeo_video_id !== metadata.vimeoId) {
    console.warn('[course-recording-upsert] doublon ignoré — cours déjà validé', {
      courseId,
      existingId: approvedSibling.id,
      existingVimeo: approvedSibling.vimeo_video_id,
      incomingVimeo: metadata.vimeoId,
    });
    return { action: 'skipped_duplicate', vimeoId: metadata.vimeoId, existingRecordingId: approvedSibling.id };
  }

  const pendingSibling = active.find((r) => r.validation_status === 'pending');
  if (pendingSibling) {
    const payload = buildRecordingPayload(courseId, metadata, pendingSibling, createdBy);
    const { error } = await admin.from('video_recordings').update(payload).eq('id', pendingSibling.id);
    if (error) throw new Error(`Mise à jour replay pending: ${error.message}`);
    return { action: 'updated', vimeoId: metadata.vimeoId };
  }

  const payload = buildRecordingPayload(courseId, metadata, null, createdBy);
  const { error } = await admin.from('video_recordings').insert(payload);
  if (error) throw new Error(`Création replay: ${error.message}`);
  return { action: 'inserted', vimeoId: metadata.vimeoId };
}

/** Rejette les autres replays actifs du même cours (garde celui qu’on vient de valider). */
export async function rejectSiblingCourseRecordings(
  admin: SupabaseClient,
  courseId: string,
  keepRecordingId: string,
): Promise<number> {
  const { data, error } = await admin
    .from('video_recordings')
    .select('id')
    .eq('course_id', courseId)
    .neq('id', keepRecordingId)
    .neq('validation_status', 'rejected');
  if (error) throw error;
  const ids = (data ?? []).map((r) => r.id);
  if (ids.length === 0) return 0;

  const { error: updErr, count } = await admin
    .from('video_recordings')
    .update({ validation_status: 'rejected', is_ready: false, available_at: null })
    .in('id', ids);
  if (updErr) throw updErr;
  return count ?? ids.length;
}
