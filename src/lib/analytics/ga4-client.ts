'use client';

import { GA4_EVENTS, type Ga4EventName, type Ga4EventParams } from '@/lib/analytics/ga4-events';

const DEDUPE_PREFIX = 'fm_ga4_evt:';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function dedupeKey(event: Ga4EventName, transactionId?: string): string {
  return `${DEDUPE_PREFIX}${event}:${transactionId || 'once'}`;
}

function alreadyFired(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function markFired(key: string): void {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

/**
 * Envoie un événement gtag. Échec → log console, jamais de crash.
 * Déduplication : une fois par (event + transaction_id) et session navigateur.
 */
export function trackGa4Event(
  event: Ga4EventName,
  params: Ga4EventParams = {},
  options?: { skipDedupe?: boolean },
): boolean {
  const key = dedupeKey(event, params.transaction_id);
  if (!options?.skipDedupe && alreadyFired(key)) {
    return false;
  }

  if (typeof window === 'undefined') return false;
  if (typeof window.gtag !== 'function') {
    console.warn('[ga4] gtag absent — événement non envoyé', event, params);
    return false;
  }

  try {
    const payload: Record<string, unknown> = { ...params };
    // Nettoyer undefined
    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) delete payload[k];
    }
    window.gtag('event', event, payload);
    if (!options?.skipDedupe) markFired(key);
    return true;
  } catch (e) {
    console.error('[ga4] envoi échoué', event, e);
    return false;
  }
}

export function trackBeginTrialClick(params: { courseId?: string; source?: string }): boolean {
  // Chaque clic CTA = une action réelle (pas de dédup session).
  return trackGa4Event(
    GA4_EVENTS.beginTrialClick,
    {
      course_id: params.courseId,
      engagement_source: params.source,
    },
    { skipDedupe: true },
  );
}

export function trackBeginCheckout(params: {
  courseId: string;
  value?: number;
  currency?: string;
  transactionId?: string;
}): boolean {
  const price = params.value;
  return trackGa4Event(
    GA4_EVENTS.beginCheckout,
    {
      transaction_id: params.transactionId,
      currency: params.currency ?? 'EUR',
      value: price,
      course_id: params.courseId,
      items: [
        {
          item_id: params.courseId,
          item_name: params.courseId,
          price,
          quantity: 1,
        },
      ],
    },
    // Un envoi par tentative de checkout (avant redirect Stripe).
    { skipDedupe: true },
  );
}

export function trackTrialStarted(params: {
  courseId: string;
  transactionId: string;
  currency?: string;
}): boolean {
  return trackGa4Event(GA4_EVENTS.trialStarted, {
    transaction_id: params.transactionId,
    currency: params.currency ?? 'EUR',
    value: 0,
    course_id: params.courseId,
    items: [{ item_id: params.courseId, item_name: params.courseId, price: 0, quantity: 1 }],
  });
}

export function trackPurchase(params: {
  courseId?: string | null;
  transactionId: string;
  value: number;
  currency?: string;
}): boolean {
  return trackGa4Event(GA4_EVENTS.purchase, {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency ?? 'EUR',
    course_id: params.courseId ?? undefined,
    items: params.courseId
      ? [{ item_id: params.courseId, item_name: params.courseId, price: params.value, quantity: 1 }]
      : undefined,
  });
}
