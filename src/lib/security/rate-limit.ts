import { createHmac } from 'node:crypto';

import { createAdminClient } from '@/lib/supabase/admin';

/** Limite par IP (table `rate_limits`, IP hachées). Off tant que RATE_LIMIT_ENABLED ≠ 1. */
export function isRateLimitEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.RATE_LIMIT_ENABLED ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

export function hashIp(ip: string, env: Record<string, string | undefined> = process.env): string {
  const key = env.RATE_LIMIT_SALT?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'fitmangas-rate-limit';
  return createHmac('sha256', key).update(ip.trim().toLowerCase()).digest('hex').slice(0, 40);
}

export type RateLimitRule = { max: number; windowSec: number };

export const PUBLIC_FORM_LIMITS = {
  newsletter: { max: 5, windowSec: 3600 },
  quiz_lead: { max: 10, windowSec: 3600 },
  self_test_submit: { max: 20, windowSec: 3600 },
  invite_email: { max: 10, windowSec: 3600 },
  invite_remind: { max: 5, windowSec: 3600 },
  invite_share: { max: 20, windowSec: 3600 },
  support: { max: 10, windowSec: 3600 },
  gift_activation: { max: 10, windowSec: 3600 },
} as const satisfies Record<string, RateLimitRule>;

export type PublicFormScope = keyof typeof PUBLIC_FORM_LIMITS;

export type RateLimitResult =
  | { ok: true; skipped?: 'disabled' }
  | { ok: false; retryAfterSec: number };

export async function checkRateLimit(scope: PublicFormScope, ip: string): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) return { ok: true, skipped: 'disabled' };
  const rule = PUBLIC_FORM_LIMITS[scope];
  const ipHash = hashIp(ip || 'unknown');
  const since = new Date(Date.now() - rule.windowSec * 1000).toISOString();
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('scope', scope)
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if (error) throw error;
    if ((count ?? 0) >= rule.max) return { ok: false, retryAfterSec: rule.windowSec };
    const { error: insertError } = await admin.from('rate_limits').insert({ scope, ip_hash: ipHash });
    if (insertError) throw insertError;
    return { ok: true };
  } catch (e) {
    // Drapeau allumé + table absente : on refuse (pas de laisser-passer silencieux).
    console.error('[rate-limit] indisponible — requête refusée', scope, e instanceof Error ? e.message : e);
    return { ok: false, retryAfterSec: rule.windowSec };
  }
}
