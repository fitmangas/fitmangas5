/** Nom affiché quand la vidéo est un replay live (table video_recordings) sans dossier Vimeo. */
export const VIMEO_FOLDER_REPLAYS_LIVES = 'Replays Lives';

/** Vidéos hors dossier Vimeo et hors replay Jitsi enregistré. */
export const VIMEO_FOLDER_UNCATEGORIZED = 'Non classé';

/**
 * Nom de dossier affiché : API Vimeo d’abord, sinon replay Jitsi → Replays Lives, sinon Non classé.
 */
export function resolveVimeoFolderDisplayName(
  apiFolderName: string | null | undefined,
  vimeoVideoId: string,
  jitsiVimeoIds: Set<string>,
): string {
  const t = apiFolderName?.trim();
  if (t) return t;
  if (jitsiVimeoIds.has(vimeoVideoId)) return VIMEO_FOLDER_REPLAYS_LIVES;
  return VIMEO_FOLDER_UNCATEGORIZED;
}

/** Ordre d’affichage des dossiers (admin + compte). */
export function sortFolderKeys(keys: string[]): string[] {
  const unc = VIMEO_FOLDER_UNCATEGORIZED;
  const rest = keys.filter((k) => k !== unc).sort((a, b) => a.localeCompare(b, 'fr'));
  if (keys.includes(unc)) rest.push(unc);
  return rest;
}

/** Clé de groupement stable : trim, espaces multiples → un seul (évite doublons « Barre flow » / « Barre flow  »). */
export function normalizeFolderLabelForGroup(name: string | null | undefined): string {
  const t = name?.trim().replace(/\s+/g, ' ');
  return t || VIMEO_FOLDER_UNCATEGORIZED;
}

/** Erreur PostgREST / Postgres quand la colonne dossier n’existe pas encore (migration 011). */
export function isMissingVimeoFolderColumnError(message: string): boolean {
  return /vimeo_folder_name|Could not find the .*column|schema cache|PGRST204|42703/i.test(message);
}
