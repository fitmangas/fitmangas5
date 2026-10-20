import { createAdminClient } from '@/lib/supabase/admin';

/** Vercel Cron et cron-job.org : `Authorization: Bearer <CRON_SECRET>`. */
export function verifyCronSecret(request: Request, env: Record<string, string | undefined> = process.env): boolean {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/**
 * Supabase Cron (pg_cron + pg_net) : le secret est généré dans la base et rangé dans Vault (`cron_secret`) ;
 * il n'est jamais copié ailleurs. La base compare elle-même la valeur reçue (`public.cron_secret_matches`,
 * réservée à la clé de service). Sans la fonction ou sans le secret : refus.
 */
export async function verifySupabaseCronSecret(
  request: Request,
  matches?: (candidate: string) => Promise<boolean>,
): Promise<boolean> {
  const auth = request.headers.get('authorization') ?? '';
  const candidate = /^Bearer\s+(\S+)$/.exec(auth)?.[1] ?? '';
  // Le secret Vault est toujours 32 octets en hexadécimal : rien d'autre n'interroge la base.
  if (!/^[0-9a-f]{64}$/i.test(candidate)) return false;
  try {
    if (matches) return await matches(candidate);
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('cron_secret_matches', { candidate });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Routes appelées par cron-job.org, Vercel Cron ou Supabase Cron. */
export async function verifyAnyCronSecret(request: Request): Promise<boolean> {
  return verifyCronSecret(request) || (await verifySupabaseCronSecret(request));
}
