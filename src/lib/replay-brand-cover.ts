/**
 * Couvertures de marque pour les replays (pas les frames Vimeo/Jibri).
 * Fichiers préparés dans public/replays/covers/ (sans espaces).
 */

export const REPLAY_BRAND_COVERS = [
  '/replays/covers/cover-1.jpg',
  '/replays/covers/cover-2.jpg',
  '/replays/covers/cover-3.jpg',
  '/replays/covers/cover-4.jpg',
  '/replays/covers/cover-5.jpg',
  '/replays/covers/cover-6.jpg',
  '/replays/covers/cover-7.jpg',
] as const;

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Image de marque stable pour un replay (même ID → même cover). */
export function getReplayBrandCoverSrc(seed: string | null | undefined): string {
  const key = (seed ?? 'replay').trim() || 'replay';
  const idx = stableHash(key) % REPLAY_BRAND_COVERS.length;
  return REPLAY_BRAND_COVERS[idx]!;
}
