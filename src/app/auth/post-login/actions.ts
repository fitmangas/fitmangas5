'use server';

import { resolvePostLoginPath } from '@/lib/auth/post-login-redirect';
import { createClient } from '@/lib/supabase/server';

/** Destination après connexion mot de passe (client ou admin). */
export async function resolvePostLoginRedirectAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { path: '/compte' as const };
  }
  const path = await resolvePostLoginPath(supabase, user);
  return { path };
}
