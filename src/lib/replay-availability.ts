/**
 * Décide si un replay de cours est lisible côté cliente (sans bloquer sur upload_status).
 * Lisible dès qu’un ID Vimeo OU un embed est présent. La sonde Vimeo `is_playable`
 * est appliquée en amont (listes) ou sur la page /live.
 */

export type ReplayAvailability =
  | { status: 'ready'; embedUrl: string; title: string | null; recordingId: string }
  | { status: 'unavailable'; reason: 'missing' };

function playerUrlFromVimeoId(vimeoId: string): string {
  return `https://player.vimeo.com/video/${vimeoId}`;
}

export function resolvePlayableCourseReplay(params: {
  recording?: {
    id: string;
    embed_url: string | null;
    title: string | null;
    vimeo_video_id: string | null;
  } | null;
}): ReplayAvailability {
  const recording = params.recording;
  if (!recording?.id) return { status: 'unavailable', reason: 'missing' };

  const embed = recording.embed_url?.trim() ?? '';
  const vimeoId = recording.vimeo_video_id?.trim() ?? '';
  if (!vimeoId && !embed) return { status: 'unavailable', reason: 'missing' };

  return {
    status: 'ready',
    embedUrl: embed || playerUrlFromVimeoId(vimeoId),
    title: recording.title,
    recordingId: recording.id,
  };
}
