export function normalizeVideoTitle(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/[\u2018\u2019\u02BC\u00B4`]/g, "'")
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fr-FR');
}

export type TitleMatch = { status: 'exact' | 'missing' | 'ambiguous'; ids: string[] };

export function matchPublishedTitles(
  wanted: string,
  catalog: Array<{ id: string; title: string | null }>,
): TitleMatch {
  const key = normalizeVideoTitle(wanted);
  const hits = catalog.filter((v) => v.title && normalizeVideoTitle(v.title) === key);
  if (hits.length === 1) return { status: 'exact', ids: [hits[0].id] };
  if (hits.length === 0) return { status: 'missing', ids: [] };
  return { status: 'ambiguous', ids: hits.map((h) => h.id) };
}

/** Un seul actif : démarrer un autre met le premier en pause. */
export function nextEnrollmentStatuses(
  currentActiveId: string | null,
  startingNew: boolean,
): { pauseId: string | null; createNew: boolean } {
  if (!startingNew) return { pauseId: null, createNew: false };
  return { pauseId: currentActiveId, createNew: true };
}
