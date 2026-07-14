import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Jeton d’abonnement calendrier (stateless) : userId + HMAC.
 * Secret : CALENDAR_FEED_SECRET si défini, sinon SUPABASE_SERVICE_ROLE_KEY
 * (déjà présent sur le serveur — pas de migration ni de colonne dédiée).
 */

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64url(value: string): Buffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

export function getCalendarFeedSecret(): string | null {
  const dedicated = process.env.CALENDAR_FEED_SECRET?.trim();
  if (dedicated) return dedicated;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return fallback || null;
}

function signPayload(userId: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(`fitmangas-cal-feed:v1:${userId}`).digest());
}

/** Jeton URL-safe : `<userIdB64>.<sig>` */
export function createCalendarFeedToken(userId: string): string {
  const secret = getCalendarFeedSecret();
  if (!secret) {
    throw new Error('Secret calendrier manquant (CALENDAR_FEED_SECRET ou SUPABASE_SERVICE_ROLE_KEY).');
  }
  const id = userId.trim();
  if (!id) throw new Error('Identifiant cliente manquant.');
  return `${base64url(id)}.${signPayload(id, secret)}`;
}

/**
 * Accepte le segment d’URL (éventuellement suffixé par `.ics`).
 * Retourne l’userId si la signature est valide.
 */
export function verifyCalendarFeedToken(rawToken: string): string | null {
  const secret = getCalendarFeedSecret();
  if (!secret) return null;

  const cleaned = rawToken.trim().replace(/\.ics$/i, '');
  const dot = cleaned.lastIndexOf('.');
  if (dot <= 0 || dot === cleaned.length - 1) return null;

  const userPart = cleaned.slice(0, dot);
  const sigPart = cleaned.slice(dot + 1);
  if (!userPart || !sigPart) return null;

  let userId: string;
  try {
    userId = fromBase64url(userPart).toString('utf8').trim();
  } catch {
    return null;
  }
  if (!userId) return null;

  const expected = signPayload(userId, secret);
  const a = Buffer.from(sigPart);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  try {
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return userId;
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Construction historique (262c3ea → d5608e1) :
 * `${APP_URL}/api/calendar/feed.ics?token=${encodeURIComponent(token)}`
 * puis remplacement https?:// → webcal://
 * Seul écart volontaire vs l’époque : le token est un HMAC signé (plus un UUID en base).
 */
export function calendarFeedHttpsUrl(token: string): string {
  return `${appBaseUrl()}/api/calendar/feed.ics?token=${encodeURIComponent(token)}`;
}

/** Lien d’abonnement Apple — webcal:// uniquement (comme avant). */
export function calendarFeedWebcalUrl(token: string): string {
  return calendarFeedHttpsUrl(token).replace(/^https?:\/\//, 'webcal://');
}

/** Abonnement Google Agenda — URL https du flux. */
export function calendarFeedGoogleSubscribeUrl(token: string): string {
  const https = calendarFeedHttpsUrl(token);
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(https)}`;
}
