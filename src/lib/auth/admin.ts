import type { SupabaseClient } from '@supabase/supabase-js';

type AdminCheckResult = {
  isAdmin: boolean;
  source: 'email' | 'role' | 'none';
};

type AdminSwitchCheckResult = {
  canSwitch: boolean;
  role: string | null;
  emailAllowed: boolean;
};

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/** Aligné avec `checkIsAdmin` — utilisé hors pages admin (ex. `/live`). */
export function isListedAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return parseAdminEmails().includes(normalized);
}

export async function checkIsAdmin(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<AdminCheckResult> {
  const normalizedEmail = user.email?.trim().toLowerCase();

  if (normalizedEmail && isListedAdminEmail(normalizedEmail)) {
    return { isAdmin: true, source: 'email' };
  }

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (data?.role === 'admin') {
    return { isAdmin: true, source: 'role' };
  }

  return { isAdmin: false, source: 'none' };
}

export async function canUseAdminViewSwitch(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<AdminSwitchCheckResult> {
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = typeof data?.role === 'string' ? data.role : null;
  const emailAllowed = isListedAdminEmail(user.email);
  return {
    canSwitch: role === 'admin' && emailAllowed,
    role,
    emailAllowed,
  };
}
