/** Occurrences hebdo d’un live (SPEC §3.10). Sans drapeau ni date de fin : une seule date. */

export function weeklyOccurrences(
  startsAt: string,
  endsAt: string,
  repeatUntil: string | null | undefined,
  enabled: boolean,
): Array<{ starts: string; ends: string }> {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const duration = end.getTime() - start.getTime();
  const first = { starts: start.toISOString(), ends: end.toISOString() };
  if (!enabled || !repeatUntil) return [first];
  const until = new Date(repeatUntil);
  if (Number.isNaN(until.getTime()) || until <= start) return [first];
  const out = [first];
  let cursor = start.getTime() + 7 * 86400000;
  while (cursor <= until.getTime() && out.length < 52) {
    out.push({ starts: new Date(cursor).toISOString(), ends: new Date(cursor + duration).toISOString() });
    cursor += 7 * 86400000;
  }
  return out;
}

export const LIVE_STYLES = ['Pilates', 'Barre', 'Fit-Dance', 'Boot Camp', 'Stretching', 'Booty'] as const;
export type LiveStyle = (typeof LIVE_STYLES)[number];
