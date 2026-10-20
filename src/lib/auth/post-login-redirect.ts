import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

import { checkIsAdmin } from '@/lib/auth/admin';

export type PostLoginPath = '/admin' | '/compte';

/** Ancien cookie mode démo — nettoyé à la connexion pour ne laisser aucun vestige. */
const LEGACY_DEMO_CLIENT_COOKIE = 'fm_demo_client';

export async function clearDemoClientModeCookie(): Promise<void> {
  const store = await cookies();
  if (!store.has(LEGACY_DEMO_CLIENT_COOKIE)) return;
  try {
    store.delete(LEGACY_DEMO_CLIENT_COOKIE);
  } catch {
    // Appelé depuis une page serveur (ex. /connexion ouverte par une admin déjà connectée) : Next interdit d'y
    // modifier les cookies. Sans importance (cookie d'un ancien mode démo) : on continue la redirection.
  }
}

export async function resolvePostLoginPath(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<PostLoginPath> {
  const adminCheck = await checkIsAdmin(supabase, user);
  if (adminCheck.isAdmin) {
    await clearDemoClientModeCookie();
    return '/admin';
  }
  return '/compte';
}
