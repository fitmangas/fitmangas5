/** Fenêtre glissante simple (mémoire process) — suffisant pour un webhook unique. */
const buckets = new Map<string, number[]>();

export function assertWebhookRateLimit(
  key: string,
  maxPerWindow: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= maxPerWindow) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

export function clientIpFromRequest(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip')?.trim() ?? 'unknown';
}
