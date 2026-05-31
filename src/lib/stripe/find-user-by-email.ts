import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Résout un utilisateur auth par e-mail via l’API Admin (évite listUsers page 1 / 50).
 */
export async function findUserIdByEmail(admin: AdminClient, email: string | null | undefined): Promise<string | null> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.warn('[findUserIdByEmail] SUPABASE_URL ou SERVICE_ROLE_KEY manquant');
    return null;
  }

  try {
    const params = new URLSearchParams({ page: '1', per_page: '50' });
    params.set('filter', normalized);
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn('[findUserIdByEmail] admin users lookup failed', res.status);
      return null;
    }
    const body = (await res.json()) as { users?: { id: string; email?: string | null }[] };
    const match = (body.users ?? []).find((u) => u.email?.trim().toLowerCase() === normalized);
    return match?.id ?? null;
  } catch (err) {
    console.warn('[findUserIdByEmail] error', err);
    return null;
  }
}
