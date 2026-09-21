/**
 * Wearables v2 — stub (flag OFF).
 * Apple Health / HealthKit nécessite une app mobile native ; pas disponible depuis le web seul.
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
  /** OAuth ou deep link — non implémenté */
  connect(): Promise<{ ok: boolean; error?: string }>;
  disconnect(): Promise<void>;
  syncMetrics(): Promise<WearableSyncPayload | null>;
}

/** Placeholder Strava — nécessite OAuth app + redirect URI */
export const stravaAdapter: WearableAdapter = {
  provider: 'strava',
  async connect() {
    if (!WEARABLES_V2_ENABLED) {
      return { ok: false, error: 'Intégration wearables désactivée.' };
    }
    return { ok: false, error: 'Strava : bientôt disponible.' };
  },
  async disconnect() {},
  async syncMetrics() {
    return null;
  },
};

/** Placeholder Fitbit — nécessite OAuth Web API */
export const fitbitAdapter: WearableAdapter = {
  provider: 'fitbit',
  async connect() {
    if (!WEARABLES_V2_ENABLED) {
      return { ok: false, error: 'Intégration wearables désactivée.' };
    }
    return { ok: false, error: 'Fitbit : bientôt disponible.' };
  },
  async disconnect() {},
  async syncMetrics() {
    return null;
  },
};

/** Apple Health — uniquement via app iOS native (HealthKit) */
export const appleHealthNote =
  'Apple Health nécessite l’application mobile FitMangas (HealthKit). Non disponible depuis le navigateur.';
