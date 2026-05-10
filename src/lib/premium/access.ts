export function hasFullVisioContentAccess(tier: string | null | undefined, role?: string | null): boolean {
  if (role === 'admin') return true;
  return tier === 'online_group_monthly' || tier === 'online_individual_monthly';
}
