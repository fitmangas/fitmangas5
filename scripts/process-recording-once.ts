/**
 * Traite un fichier recordings-local/{courseId}.mp4 comme la route POST /api/video/process-recording
 * (utile sans cookie admin). Usage :
 * npx tsx --env-file=.env.local scripts/process-recording-once.ts <courseUUID>
 */

import path from 'node:path';

import { createAdminClient } from '@/lib/supabase/admin';
import { syncVideoRecording, uploadToVimeo } from '@/lib/vimeo';

/** Même logique que la route API `process-recording`. */
function resolveRecordingAbsolutePath(courseId: string): string {
  const base = process.env.VIDEO_RECORDINGS_DIR?.trim();
  if (!base) throw new Error('VIDEO_RECORDINGS_DIR manquant.');
  const safeName = `${courseId}.mp4`;
  if (safeName.includes('..') || path.isAbsolute(safeName)) {
    throw new Error('Nom de fichier invalide.');
  }
  const resolvedFile = path.resolve(base, safeName);
  const normalizedBase = path.resolve(base);
  const relative = path.relative(normalizedBase, resolvedFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Le fichier doit être sous VIDEO_RECORDINGS_DIR.');
  }
  return resolvedFile;
}

async function main() {
  const courseId = process.argv[2]?.trim();
  if (!courseId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/process-recording-once.ts <courseUUID>');
    process.exit(1);
  }

  const admin = createAdminClient();

  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, title, description, ends_at, is_published')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError || !course || !course.is_published) {
    throw new Error(courseError?.message ?? 'Cours introuvable ou non publié.');
  }

  const endsAt = new Date(course.ends_at);
  if (Number.isNaN(endsAt.getTime()) || endsAt >= new Date()) {
    throw new Error('Le cours doit être terminé (ends_at dans le passé).');
  }

  const absolutePath = resolveRecordingAbsolutePath(courseId);
  const title = course.title.trim() || 'Replay';
  const description = course.description?.trim() ?? '';

  console.log('Fichier:', absolutePath);
  const { vimeoId } = await uploadToVimeo(absolutePath, title, description);
  console.log('Upload Vimeo OK, vimeoId:', vimeoId);

  const meta = await syncVideoRecording({ courseId, vimeoId, createdBy: null });
  console.log('syncVideoRecording OK:', { embedUrl: meta.embedUrl ?? meta.link, isReady: meta.isReady });

  const { data: row, error: rowError } = await admin
    .from('video_recordings')
    .select('id, course_id, vimeo_video_id, embed_url, upload_status, is_ready, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rowError) throw rowError;
  console.log('\nLigne video_recordings (dernière pour ce cours):');
  console.log(JSON.stringify(row, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
