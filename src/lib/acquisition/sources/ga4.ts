import { getConversionRate, getPageViews } from '@/lib/google/analytics';
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
    const [views, conversion] = await Promise.all([
      getPageViews(days),
      getConversionRate(days),
    ]);
    const totalViews = views.reduce((sum, p) => sum + p.views, 0);
    return {
      ok: true,
      data: {
        sessions: conversion.sessions || totalViews || null,
        trialClicks: conversion.keyEvents || null,
        beginCheckout: conversion.keyEvents || null,
      },
      warnings: [`Property GA4 : ${propertyId}`, 'trialClicks = keyEvents GA4 (proxy jusqu’à events nommés).'],
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur GA4',
    };
  }
}
