import { getConversionRate, getNamedEventCount, getPageViews } from '@/lib/google/analytics';
import { hasGoogleServiceAccountJson } from '@/lib/google/service-account';

import type { Ga4AcquisitionMetrics, SourceResult } from './types';

const PROVIDER = 'ga4';

export async function fetchGa4AcquisitionMetrics(days = 30): Promise<SourceResult<Ga4AcquisitionMetrics>> {
  if (!hasGoogleServiceAccountJson()) {
    return {
      ok: false,
      provider: PROVIDER,
      error: 'GOOGLE_SERVICE_ACCOUNT_JSON absent — GA4 indisponible.',
    };
  }
  try {
    const propertyId = process.env.GA4_PROPERTY_ID?.trim() || '537748245';
    const [views, conversion, trialClicksNamed, beginCheckoutNamed] = await Promise.all([
      getPageViews(days),
      getConversionRate(days),
      getNamedEventCount('begin_trial_click', days),
      getNamedEventCount('begin_checkout', days),
    ]);
    const totalViews = views.reduce((sum, p) => sum + p.views, 0);
    const trialClicks =
      trialClicksNamed > 0 ? trialClicksNamed : conversion.keyEvents || null;
    const beginCheckout =
      beginCheckoutNamed > 0 ? beginCheckoutNamed : conversion.keyEvents || null;
    const warnings = [`Property GA4 : ${propertyId}`];
    if (trialClicksNamed > 0) {
      warnings.push('Clics essai = event begin_trial_click (nommé).');
    } else {
      warnings.push('begin_trial_click absent — fallback keyEvents GA4 (proxy).');
    }
    return {
      ok: true,
      data: {
        sessions: conversion.sessions || totalViews || null,
        trialClicks,
        beginCheckout,
      },
      warnings,
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur GA4',
    };
  }
}
