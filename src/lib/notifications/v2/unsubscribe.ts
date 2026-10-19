import { createHmac, timingSafeEqual } from 'crypto';

function secret(env: Record<string, string | undefined> = process.env): string {
  return (env.NOTIF_UNSUB_SECRET ?? env.CRON_SECRET ?? '').trim();
}

export function signUnsubscribeToken(
  userId: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const s = secret(env);
  if (!s) throw new Error('NOTIF_UNSUB_SECRET ou CRON_SECRET manquant');
  const payload = Buffer.from(JSON.stringify({ u: userId, t: Date.now() }), 'utf8').toString('base64url');
  const sig = createHmac('sha256', s).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyUnsubscribeToken(
  token: string,
  env: Record<string, string | undefined> = process.env,
): { userId: string } | null {
  const s = secret(env);
  if (!s) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', s).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: string };
    if (!json.u) return null;
    return { userId: json.u };
  } catch {
    return null;
  }
}

export function unsubscribeUrlForUser(userId: string, env: Record<string, string | undefined> = process.env): string {
  const base = (env.NEXT_PUBLIC_APP_URL || env.APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
  return `${base}/api/notifications/unsubscribe?token=${encodeURIComponent(signUnsubscribeToken(userId, env))}`;
}
