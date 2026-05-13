import { isListedAdminEmail } from '@/lib/auth/admin';

export function hasFullVisioContentAccess(
  tier: string | null | undefined,
  role?: string | null,
  email?: string | null,
): boolean {
  if (role === 'admin' && isListedAdminEmail(email)) return true;
  return tier === 'online_group_monthly' || tier === 'online_individual_monthly';
}
