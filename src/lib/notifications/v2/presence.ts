/** Présence live calculée à la lecture (SPEC §3.11). Aucune écriture. */

export function isLivePresence(
  visitAt: Date,
  startsAt: Date,
  endsAt: Date,
): boolean {
  const windowStart = startsAt.getTime() - 15 * 60 * 1000;
  const t = visitAt.getTime();
  return t >= windowStart && t <= endsAt.getTime();
}
