/**
 * Planning sur téléphone (une carte par jour) : quels jours afficher.
 *
 * Semaine en cours : les jours à venir d'abord ; s'il reste de la place, les derniers jours passés
 * (affichés grisés) complètent, pour que la semaine ne paraisse pas vide le vendredi ou le samedi.
 * Autres semaines : les premiers jours qui ont du contenu. Toujours dans l'ordre chronologique.
 */
export function pickMobilePlanningDays(dayKeysWithContent: string[], todayKey: string | null, limit: number): string[] {
  const sorted = [...dayKeysWithContent].sort();
  if (!todayKey) return sorted.slice(0, limit);
  const upcoming = sorted.filter((k) => k >= todayKey).slice(0, limit);
  const room = Math.max(0, limit - upcoming.length);
  const past = room > 0 ? sorted.filter((k) => k < todayKey).slice(-room) : [];
  return [...past, ...upcoming];
}
