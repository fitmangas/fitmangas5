import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/auth/admin';
import { ADMIN_MFA_PATH, checkAdminMfa } from '@/lib/auth/admin-mfa';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=auth');
  }

  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) {
    redirect('/login?error=forbidden');
  }

  const mfa = await checkAdminMfa(supabase);
  if (!mfa.ok) {
    redirect(ADMIN_MFA_PATH);
  }

  return { user, supabase };
}

/**
 * Même contrôle que `requireAdmin` (admin + double authentification si exigée), sans redirection :
 * pour les routes API qui doivent répondre 404 plutôt que rediriger.
 */
export async function isAdminWithMfa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null },
): Promise<boolean> {
  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) return false;
  const mfa = await checkAdminMfa(supabase);
  return mfa.ok;
}
