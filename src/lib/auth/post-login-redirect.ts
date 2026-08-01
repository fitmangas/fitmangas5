import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

import { checkIsAdmin } from '@/lib/auth/admin';

export type PostLoginPath = '/admin' | '/compte';

/** Ancien cookie mode démo — nettoyé à la connexion pour ne laisser aucun vestige. */
const LEGACY_DEMO_CLIENT_COOKIE = 'fm_demo_client';

export async function clearDemoClientModeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(LEGACY_DEMO_CLIENT_COOKIE);
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
