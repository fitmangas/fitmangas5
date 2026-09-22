/**
 * Wearables v2 — OAuth Strava / Fitbit prêt, flag OFF jusqu’aux secrets.
 * Apple Health = chantier app iOS (HealthKit), pas le web.
 */

export const WEARABLES_V2_ENABLED = false;

export type WearableProvider = 'strava' | 'fitbit' | 'apple_health';

export type WearableConnection = {
  provider: WearableProvider;
  connected: boolean;
  lastSyncAt: string | null;
};

export type WearableSyncPayload = {
  restingHr?: number | null;
  hrvMs?: number | null;
  activeMinutes?: number | null;
  sleepHours?: number | null;
};

export interface WearableAdapter {
  provider: WearableProvider;
  connect(): Promise<{ ok: boolean; error?: string }>;
  disconnect(): Promise<void>;
  syncMetrics(): Promise<WearableSyncPayload | null>;
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
}

export function stravaAuthorizeUrl(state: string): string | null {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) return null;
  const redirect = `${appBaseUrl()}/api/self-knowledge/wearables/strava/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirect,
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,profile:read_all',
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export function fitbitAuthorizeUrl(state: string): string | null {
  const clientId = process.env.FITBIT_CLIENT_ID;
  if (!clientId) return null;
  const redirect = `${appBaseUrl()}/api/self-knowledge/wearables/fitbit/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirect,
    scope: 'activity heartrate sleep profile',
    state,
  });
  return `https://www.fitbit.com/oauth2/authorize?${params}`;
}

/** Placeholder Strava — OAuth réel quand flag + secrets */
export const stravaAdapter: WearableAdapter = {
  provider: 'strava',
  async connect() {
    if (!WEARABLES_V2_ENABLED) {
      return { ok: false, error: 'Intégration wearables désactivée.' };
    }
    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
      return { ok: false, error: 'STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET manquants.' };
    }
    return { ok: true };
  },
  async disconnect() {},
  async syncMetrics() {
    return null;
  },
};

/** Placeholder Fitbit */
export const fitbitAdapter: WearableAdapter = {
  provider: 'fitbit',
  async connect() {
    if (!WEARABLES_V2_ENABLED) {
      return { ok: false, error: 'Intégration wearables désactivée.' };
    }
    if (!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_CLIENT_SECRET) {
      return { ok: false, error: 'FITBIT_CLIENT_ID / FITBIT_CLIENT_SECRET manquants.' };
    }
    return { ok: true };
  },
  async disconnect() {},
  async syncMetrics() {
    return null;
  },
};

export const appleHealthNote =
  'Apple Health nécessite l’application mobile FitMangas (HealthKit). Non disponible depuis le navigateur.';

/**
 * Clés à fournir pour activer (document produit) :
 * - STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
 * - FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET
 * - Redirect URI Strava : {APP}/api/self-knowledge/wearables/strava/callback
 * - Redirect URI Fitbit : {APP}/api/self-knowledge/wearables/fitbit/callback
 * Puis WEARABLES_V2_ENABLED = true
 */
export const WEARABLES_SETUP_DOC = {
  env: [
    'STRAVA_CLIENT_ID',
    'STRAVA_CLIENT_SECRET',
    'FITBIT_CLIENT_ID',
    'FITBIT_CLIENT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ],
  redirects: [
    '/api/self-knowledge/wearables/strava/callback',
    '/api/self-knowledge/wearables/fitbit/callback',
  ],
} as const;
