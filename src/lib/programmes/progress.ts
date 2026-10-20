export function segmentDurationS(
  startS: number | null | undefined,
  endS: number | null | undefined,
  videoDurationS: number | null | undefined,
): number {
  if (startS != null && endS != null && endS > startS) return endS - startS;
  return videoDurationS ?? 0;
}

/** Validation automatique à 80 % du temps regardé dans l’extrait (SPEC §4.2). */
export function isStepCompleteAt80(watchedS: number, durationS: number): boolean {
  if (durationS <= 0) return false;
  return watchedS / durationS >= 0.8;
}

export function formatCertificateNumber(completedAt: Date, seq: number): string {
  const y = completedAt.getUTCFullYear();
  const mm = String(completedAt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(completedAt.getUTCDate()).padStart(2, '0');
  return `FM-${y}-${mm}${dd}-${String(seq).padStart(4, '0')}`;
}

export function assertEnrollmentOwner(rowUserId: string, sessionUserId: string): boolean {
  return rowUserId === sessionUserId;
}
