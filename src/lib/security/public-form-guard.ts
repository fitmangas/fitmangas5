import { headers } from 'next/headers';

import { A_VALIDER_LOT1 } from '@/content/a-valider';

import { checkRateLimit, type PublicFormScope } from './rate-limit';
import { verifyTurnstileToken } from './turnstile';

export type GuardResult = { ok: true } | { ok: false; status: 403 | 429; error: string };

export function clientIpFromHeaders(h: Headers): string {
  const xf = h.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  return h.get('x-real-ip')?.trim() || 'unknown';
}

const MESSAGES = {
  fr: { turnstile: A_VALIDER_LOT1.antiBot.turnstile.fr, limited: A_VALIDER_LOT1.antiBot.limited.fr },
  es: { turnstile: A_VALIDER_LOT1.antiBot.turnstile.es, limited: A_VALIDER_LOT1.antiBot.limited.es },
} as const;

/** Garde commune des formulaires publics : Turnstile puis limite par IP (chacun derrière son drapeau). */
export async function guardPublicForm(params: {
  scope: PublicFormScope;
  ip: string;
  turnstileToken?: string | null;
  locale?: 'fr' | 'es';
}): Promise<GuardResult> {
  const msg = MESSAGES[params.locale === 'es' ? 'es' : 'fr'];
  const t = await verifyTurnstileToken(params.turnstileToken ?? null, params.ip);
  if (!t.ok) return { ok: false, status: 403, error: msg.turnstile };
  const r = await checkRateLimit(params.scope, params.ip);
  if (!r.ok) return { ok: false, status: 429, error: msg.limited };
  return { ok: true };
}

export async function guardPublicFormRequest(
  request: Request,
  scope: PublicFormScope,
  turnstileToken?: string | null,
  locale?: 'fr' | 'es',
): Promise<GuardResult> {
  return guardPublicForm({ scope, ip: clientIpFromHeaders(request.headers), turnstileToken, locale });
}

/** Pour les actions serveur (pas de Request). */
export async function guardPublicFormAction(
  scope: PublicFormScope,
  turnstileToken?: string | null,
  locale?: 'fr' | 'es',
): Promise<GuardResult> {
  const h = await headers();
  return guardPublicForm({ scope, ip: clientIpFromHeaders(h), turnstileToken, locale });
}

export function turnstileTokenFromBody(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const v = (json as { turnstileToken?: unknown }).turnstileToken;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export function localeFromBody(json: unknown): 'fr' | 'es' {
  if (!json || typeof json !== 'object') return 'fr';
  return (json as { locale?: unknown }).locale === 'es' ? 'es' : 'fr';
}
