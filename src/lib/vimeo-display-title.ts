/**
 * Titre d’affichage propre pour les vidéos Vimeo (évite les noms de fichier Jibri .mp4).
 */

const SLUG_LABELS: Record<string, string> = {
  'pilates-mat': 'Pilates Mat',
  pilates: 'Pilates Mat',
  'yoga-flow': 'Yoga Flow',
  yoga: 'Yoga Flow',
  'renfo-core': 'Renfo Core',
  renfo: 'Renfo Core',
  core: 'Renfo Core',
  postural: 'Postural',
  'barre-flow': 'Barre Flow',
  barre: 'Barre Flow',
  'booty-power-sculpt': 'Booty Power Sculpt',
  booty: 'Booty Power Sculpt',
  'box-dance': 'Box-Dance',
  boxdance: 'Box-Dance',
};

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function looksLikeRawFilename(title: string): boolean {
  const t = title.trim();
  if (/\.mp4$/i.test(t)) return true;
  if (/^fitmangas[-_]/i.test(t)) return true;
  if (/\d{8,}[_-]\d{2}-\d{2}-\d{2}/.test(t)) return true;
  return false;
}

export function cleanVimeoDisplayTitle(
  raw: string | null | undefined,
  options?: { folderName?: string | null; fallback?: string },
): string {
  const folder = options?.folderName?.trim() || null;
  const fallback = options?.fallback?.trim() || folder || 'Vidéo';
  const original = (raw ?? '').trim();
  if (!original) return fallback;

  if (!looksLikeRawFilename(original)) {
    return original.replace(/\s+/g, ' ').trim();
  }

  let base = original.replace(/\.mp4$/i, '').trim();
  // fitmangas-renfo-core-202606010140_2026-06-01...
  const m = base.match(/^fitmangas[-_]([a-z0-9]+(?:[-_][a-z0-9]+)*?)(?:[-_]\d|$)/i);
  if (m?.[1]) {
    const slug = m[1].toLowerCase().replace(/_/g, '-');
    if (SLUG_LABELS[slug]) return SLUG_LABELS[slug]!;
    // renfo-core → Renfo Core
    return titleCaseWords(slug.replace(/-/g, ' '));
  }

  if (folder && folder !== 'Sans dossier' && folder.toLowerCase() !== 'non classé') {
    return folder;
  }

  return fallback;
}
