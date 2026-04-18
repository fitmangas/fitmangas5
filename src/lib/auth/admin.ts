import type { SupabaseClient } from '@supabase/supabase-js';

type AdminCheckResult = {
  isAdmin: boolean;
  source: 'email' | 'role' | 'none';
};

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function checkIsAdmin(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<AdminCheckResult> {
  const normalizedEmail = user.email?.trim().toLowerCase();
  const adminEmails = parseAdminEmails();

  if (normalizedEmail && adminEmails.includes(normalizedEmail)) {
    return { isAdmin: true, source: 'email' };
  }

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (data?.role === 'admin') {
    return { isAdmin: true, source: 'role' };
  }

  return { isAdmin: false, source: 'none' };
}
