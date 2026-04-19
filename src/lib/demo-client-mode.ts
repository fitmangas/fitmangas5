/**
 * Mode démo « vue client » : cookie + simulation côté serveur pour les admins.
 */

import { cookies } from 'next/headers';

import type { CustomerTier } from '@/lib/domain/calendar-types';

export const DEMO_CLIENT_COOKIE = 'fm_demo_client';

/** Abonnement simulé pour le calendrier et les politiques d’accès (visio collectif mensuel). */
export const DEMO_SIMULATED_CUSTOMER_TIER: CustomerTier = 'online_group_monthly';

export async function getDemoClientMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_CLIENT_COOKIE)?.value === '1';
}
