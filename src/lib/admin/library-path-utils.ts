/**
 * Helpers purs (pas de fs) — utilisables client + serveur.
 * Anti-répétition biblio Feed / cover carousel.
 */

/** Photos biblio trackées pour rotation (pas les uploads /library/social/). */
export function isBoardLibraryPath(path: string | null | undefined): boolean {
  const p = (path ?? '').trim();
  if (!p) return false;
  if (p.startsWith('/library/social/')) return false;
  if (p.startsWith('/library/')) return true;
  if (p.startsWith('/Photo ') || p === '/alejandra.jpg') return true;
  return false;
}

/**
 * Même photo sous d’autres suffixes de ratio (−4x5 / −1x1 / base).
 * Sert à bloquer portrait-03.webp si portrait-03-4x5.webp est déjà pris.
 */
export function libraryPathAliases(path: string): string[] {
  const p = path.trim();
  if (!p) return [];
  const aliases = new Set<string>([p]);
  const stripped = p.replace(/-(4x5|1x1)(\.(webp|jpe?g|png))$/i, '$2');
  aliases.add(stripped);
  const m = stripped.match(/^(.*?)(\.(webp|jpe?g|png))$/i);
  if (m) {
    const stem = m[1]!;
    const ext = m[2]!;
    aliases.add(`${stem}-4x5${ext}`);
    aliases.add(`${stem}-4x5.webp`);
    aliases.add(`${stem}-1x1${ext}`);
    aliases.add(`${stem}-1x1.webp`);
    aliases.add(`${stem}.webp`);
  }
  return [...aliases];
}

export function addLibraryPathAliases(target: Set<string>, path: string | null | undefined) {
  if (!path || !isBoardLibraryPath(path)) return;
  for (const alias of libraryPathAliases(path)) target.add(alias);
}

/** Seed stable et dispersé (≠ id.length qui est quasi constant sur les UUID). */
export function hashVariationSeed(...parts: Array<string | number | null | undefined>): number {
  const input = parts.map((p) => String(p ?? '')).join('|');
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function libraryPathIsBlocked(candidate: string, blocked: Set<string>): boolean {
  return libraryPathAliases(candidate).some((alias) => blocked.has(alias));
}
