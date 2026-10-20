/**
 * Trafic interne (Kevin, Alejandra) exclu des statistiques GA4.
 * Le cookie est posé à chaque visite de l'admin ; sur les pages publiques, GA4 reçoit alors
 * `traffic_type: 'internal'`, que le filtre de données GA4 « Internal Traffic » (à l'état Actif) écarte.
 */
export const INTERNAL_TRAFFIC_COOKIE = 'fm_internal';
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function isInternalTrafficCookie(cookieHeader: string | null | undefined): boolean {
  return /(?:^|;\s*)fm_internal=1(?:;|$)/.test(cookieHeader ?? '');
}

export function internalTrafficCookieValue(secure: boolean): string {
  return `${INTERNAL_TRAFFIC_COOKIE}=1; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** Paramètres de `gtag('config', …)`, sérialisés pour le script inline. */
export function ga4ConfigParams(internal: boolean, base: Record<string, string | boolean> = {}): string {
  return JSON.stringify(internal ? { ...base, traffic_type: 'internal' } : base);
}
