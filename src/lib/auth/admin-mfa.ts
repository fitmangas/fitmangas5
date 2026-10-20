import type { SupabaseClient } from '@supabase/supabase-js';

/** Double authentification (TOTP, AAL2) exigée pour l’admin seulement si ADMIN_REQUIRE_MFA=1. */
export function isAdminMfaRequired(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.ADMIN_REQUIRE_MFA ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

export const ADMIN_MFA_PATH = '/auth/admin-mfa';

export type AdminMfaState = { ok: true } | { ok: false; reason: 'mfa_required' | 'mfa_check_failed' };

export async function checkAdminMfa(supabase: SupabaseClient): Promise<AdminMfaState> {
  if (!isAdminMfaRequired()) return { ok: true };
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) {
    console.error('[admin-mfa] lecture du niveau AAL impossible', error.message);
    return { ok: false, reason: 'mfa_check_failed' };
  }
  return data?.currentLevel === 'aal2' ? { ok: true } : { ok: false, reason: 'mfa_required' };
}
