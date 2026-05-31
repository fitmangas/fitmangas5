import type { MemberHealthBadge } from '@/lib/admin/member-health';

/** Libellés UI — « À surveiller » = pas encore d’activité (7–14 j) ; « À relancer » = inactivité 4–14 j. */
export const MEMBER_HEALTH_LABELS: Record<MemberHealthBadge, string> = {
  new: 'Nouveau',
  watch: 'En attente',
  green: 'Actif',
  orange: 'À relancer',
  red: 'À risque',
};

export const MEMBER_HEALTH_DESCRIPTIONS: Record<MemberHealthBadge, string> = {
  new: 'Compte créé il y a moins de 7 jours',
  watch: 'Inscrite depuis 7–14 j, pas encore de cours ni replay',
  green: 'Activité dans les 4 derniers jours',
  orange: 'Dernière activité entre 4 et 14 jours',
  red: 'Aucune activité depuis plus de 14 jours',
};
