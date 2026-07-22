/** Délai après `ends_at` avant de forcer le replay Vimeo (laisse rejoindre le live en fin de séance). */
export const LIVE_TO_REPLAY_GRACE_MS = 20 * 60 * 1000;

export function isCoursePastForReplay(endsAt: Date | string, nowMs = Date.now()): boolean {
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() + LIVE_TO_REPLAY_GRACE_MS < nowMs;
}
