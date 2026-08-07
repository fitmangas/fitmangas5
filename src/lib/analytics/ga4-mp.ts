import { getMarketingSettings } from '@/lib/admin/marketing-settings';
import { GA4_EVENTS, type Ga4EventName, type Ga4EventParams } from '@/lib/analytics/ga4-events';

type MpPayload = {
  client_id: string;
  user_id?: string;
  events: Array<{ name: string; params?: Record<string, unknown> }>;
};

function measurementIdFromEnvOrSettings(settingsId: string | null | undefined): string | null {
  const fromEnv = process.env.GA4_MEASUREMENT_ID?.trim() || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
  if (fromEnv?.startsWith('G-')) return fromEnv;
  if (settingsId?.startsWith('G-')) return settingsId;
  return null;
}

async function resolveMeasurementId(): Promise<string | null> {
  const fromEnv = measurementIdFromEnvOrSettings(null);
  if (fromEnv) return fromEnv;
  try {
    const settings = await getMarketingSettings();
    return measurementIdFromEnvOrSettings(settings.google_analytics_id ?? null);
  } catch (e) {
    console.error('[ga4-mp] lecture google_analytics_id', e);
    return null;
  }
}

function apiSecret(): string | null {
  return (
    process.env.GA4_MEASUREMENT_PROTOCOL_SECRET?.trim() ||
    process.env.GA4_API_SECRET?.trim() ||
    null
  );
}

/**
 * Measurement Protocol GA4 (serveur).
 * Requis pour les confirmations Stripe hors navigateur (webhook).
 * Sans secret → log + no-op (pas de crash, pas de comptage fantôme).
 */
export async function sendGa4MeasurementProtocolEvent(params: {
  event: Ga4EventName;
  clientId: string;
  userId?: string | null;
  eventParams?: Ga4EventParams;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const secret = apiSecret();
  const measurementId = await resolveMeasurementId();
  if (!secret || !measurementId) {
    console.warn(
      '[ga4-mp] secret ou Measurement ID manquant — événement non envoyé',
      params.event,
      { hasSecret: Boolean(secret), measurementId },
    );
    return { ok: false, skipped: true, error: 'GA4_MEASUREMENT_PROTOCOL_SECRET ou G-xxx manquant' };
  }

  const body: MpPayload = {
    client_id: params.clientId,
    ...(params.userId ? { user_id: params.userId } : {}),
    events: [
      {
        name: params.event,
        params: {
          ...(params.eventParams ?? {}),
          engagement_time_msec: 1,
        },
      },
    ],
  };

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(secret)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // MP renvoie souvent 204 sans body ; 2xx = OK
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[ga4-mp] HTTP', res.status, params.event, text);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error('[ga4-mp] réseau', params.event, e);
    return { ok: false, error: e instanceof Error ? e.message : 'network' };
  }
}

/** client_id stable dérivé d’un id Stripe / user (pas de cookie navigateur côté webhook). */
export function ga4ClientIdFromSeed(seed: string): string {
  const clean = seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36) || 'fitmangas';
  // Format GA4 client_id : deux nombres séparés par un point — on utilise un hash simple.
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < clean.length; i += 1) {
    h1 = (h1 * 31 + clean.charCodeAt(i)) >>> 0;
    h2 = (h2 * 17 + clean.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return `${h1}.${h2}`;
}

export async function trackTrialStartedServer(params: {
  stripeEventId: string;
  userId: string;
  courseId: string;
  sessionId?: string | null;
}): Promise<void> {
  const transactionId = params.sessionId || params.stripeEventId;
  const result = await sendGa4MeasurementProtocolEvent({
    event: GA4_EVENTS.trialStarted,
    clientId: ga4ClientIdFromSeed(params.userId),
    userId: params.userId,
    eventParams: {
      transaction_id: transactionId,
      value: 0,
      currency: 'EUR',
      course_id: params.courseId,
      engagement_source: 'stripe_webhook',
    },
  });
  if (!result.ok && !result.skipped) {
    console.error('[ga4-mp] trial_started échoué', result.error);
  }
}

export async function trackSubscriptionActiveServer(params: {
  stripeEventId: string;
  userId: string;
  courseId?: string | null;
  invoiceId?: string | null;
  valueEur?: number | null;
  currency?: string | null;
}): Promise<void> {
  const transactionId = params.invoiceId || params.stripeEventId;
  const value = params.valueEur != null && params.valueEur > 0 ? params.valueEur : undefined;
  const result = await sendGa4MeasurementProtocolEvent({
    event: GA4_EVENTS.subscriptionActive,
    clientId: ga4ClientIdFromSeed(params.userId),
    userId: params.userId,
    eventParams: {
      transaction_id: transactionId,
      value,
      currency: (params.currency ?? 'EUR').toUpperCase(),
      course_id: params.courseId ?? undefined,
      engagement_source: 'stripe_webhook',
    },
  });
  if (!result.ok && !result.skipped) {
    console.error('[ga4-mp] subscription_active échoué', result.error);
  }
}

export async function trackPurchaseServer(params: {
  stripeEventId: string;
  userId: string;
  courseId?: string | null;
  sessionId?: string | null;
  valueEur: number;
  currency?: string | null;
}): Promise<void> {
  const transactionId = params.sessionId || params.stripeEventId;
  const result = await sendGa4MeasurementProtocolEvent({
    event: GA4_EVENTS.purchase,
    clientId: ga4ClientIdFromSeed(params.userId),
    userId: params.userId,
    eventParams: {
      transaction_id: transactionId,
      value: params.valueEur,
      currency: (params.currency ?? 'EUR').toUpperCase(),
      course_id: params.courseId ?? undefined,
      engagement_source: 'stripe_webhook',
    },
  });
  if (!result.ok && !result.skipped) {
    console.error('[ga4-mp] purchase (MP) échoué', result.error);
  }
}
