/**
 * Délai humain avant réponse auto (30–90 s).
 * Meta exige un ACK webhook rapide → le délai se joue en arrière-plan (after()).
 */

export function shouldSkipHumanDelay(): boolean {
  if (process.env.ACQUISITION_HUMAN_DELAY === '0') return true;
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') return true;
  return false;
}

/** ms aléatoire entre 30s et 90s. */
export function randomHumanDelayMs(): number {
  return 30_000 + Math.floor(Math.random() * 60_001);
}

export async function waitHumanReplyDelay(opts?: { skip?: boolean }): Promise<number> {
  if (opts?.skip || shouldSkipHumanDelay()) return 0;
  const ms = randomHumanDelayMs();
  await new Promise((r) => setTimeout(r, ms));
  return ms;
}
