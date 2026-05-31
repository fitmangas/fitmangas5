import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

import { checkIsAdmin } from '@/lib/auth/admin';
import { DEMO_CLIENT_COOKIE } from '@/lib/demo-client-mode';

export type PostLoginPath = '/admin' | '/compte';

/** Réinitialise le mode démo « vue client » (nouvelle connexion admin = vue admin). */
export async function clearDemoClientModeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_CLIENT_COOKIE);
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
