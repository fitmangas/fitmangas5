import { isDemoOrTestHandle } from '@/components/acquisition/avatar-guards';

/**
 * Contact de test ou de l'équipe (SPEC §12.1) : fils démo / labo (handle), étiquettes « test », « demo »,
 * « équipe », « prestataire ». Ces contacts restent visibles dans les conversations ; ils sortent seulement des compteurs.
 * La liste « comptes de l'équipe » (table `acq_team_accounts`, après GO) viendra compléter cette règle.
 */
const TEST_TAGS = new Set(['test', 'tests', 'demo', 'démo', 'sandbox', 'equipe', 'équipe', 'team', 'prestataire', 'vendor']);

export function isTestOrTeamContact(contact: { handle?: string | null; email?: string | null; tags?: string[] | null }): boolean {
  if (isDemoOrTestHandle(contact.handle) || isDemoOrTestHandle(contact.email)) return true;
  return (contact.tags ?? []).some((t) => TEST_TAGS.has(String(t).trim().toLowerCase()));
}
