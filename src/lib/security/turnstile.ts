/** Cloudflare Turnstile (vérification serveur). Off tant que TURNSTILE_ENABLED ≠ 1. */

export function isTurnstileEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = (env.TURNSTILE_ENABLED ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}

export type TurnstileResult = { ok: true; skipped?: true } | { ok: false; reason: string };

export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (!isTurnstileEnabled()) return { ok: true, skipped: true };
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    console.error('[turnstile] TURNSTILE_ENABLED=1 mais TURNSTILE_SECRET_KEY manquant.');
    return { ok: false, reason: 'turnstile_misconfigured' };
  }
  if (!token) return { ok: false, reason: 'turnstile_missing' };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const json = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (json.success) return { ok: true };
    return { ok: false, reason: (json['error-codes'] ?? ['turnstile_failed']).join(',') };
  } catch (e) {
    console.error('[turnstile] vérification impossible', e);
    return { ok: false, reason: 'turnstile_unreachable' };
  }
}
