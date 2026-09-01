import { isJibriRecordingFileNameOrTitle } from '@/lib/jibri-recording-filename';

export type StandaloneImportSkipReason = 'jibri' | 'course_recording';

/** Empêche les replays Jibri / séances d'atterrir en bibliothèque standalone. */
export function shouldSkipStandaloneImport(
  meta: { title?: string | null; description?: string | null; vimeoId?: string | number | null },
  courseRecordingVimeoIds: Set<string>,
): StandaloneImportSkipReason | null {
  const id = meta.vimeoId != null ? String(meta.vimeoId) : '';
  if (id && courseRecordingVimeoIds.has(id)) return 'course_recording';
  if (isJibriRecordingFileNameOrTitle(meta.title) || isJibriRecordingFileNameOrTitle(meta.description)) {
    return 'jibri';
  }
  return null;
}
