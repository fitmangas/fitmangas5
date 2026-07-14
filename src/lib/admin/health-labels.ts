import type { MemberHealthBadge } from '@/lib/admin/member-health';

/** Libellés UI santé client. */
export const MEMBER_HEALTH_LABELS: Record<MemberHealthBadge, string> = {
  new: 'Nouveau',
  watch: 'Sans activité',
  green: 'Actif',
  orange: 'À relancer',
  red: 'À risque',
  incomplete: 'Pas finalisé',
};

export const MEMBER_HEALTH_DESCRIPTIONS: Record<MemberHealthBadge, string> = {
  new: 'Abonnée récente (< 14 j) — première séance / replay encore à venir',
  watch: 'Abonnée depuis 14–30 j sans cours ni replay',
  green: 'Activité dans les 4 derniers jours',
  orange: 'Dernière activité entre 4 et 14 jours',
  red: 'Aucune activité depuis plus de 14 jours (ou abonnée inactive > 30 j)',
  incomplete: 'Compte créé sans abonnement Stripe finalisé (pas de carte / checkout incomplet)',
};
