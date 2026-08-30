import { getAppBaseUrl } from '@/lib/stripe/create-checkout-session';
import { VISIO_FREE_TRIAL_DAYS } from '@/lib/stripe/create-checkout-session';

/**
 * Lien public vers le parcours d'inscription + essai existant (aucun appel Stripe côté Acquisition).
 * Le checkout Stripe réel est créé après connexion via /api/checkout (createStripeCheckoutSession).
 */
export function getPublicTrialSignupUrl(options?: {
  courseId?: 'v-coll' | 'v-ind';
  utmSource?: string;
  utmCampaign?: string;
}): string {
  const base = getAppBaseUrl();
  const courseId = options?.courseId ?? 'v-coll';
  const params = new URLSearchParams({
    course: courseId,
    utm_source: options?.utmSource ?? 'acquisition',
    utm_medium: 'dm',
  });
  if (options?.utmCampaign) params.set('utm_campaign', options.utmCampaign);
  return `${base}/connexion?${params.toString()}`;
}

export function getTrialOfferLabel(locale: 'fr' | 'es' = 'fr'): string {
  if (locale === 'es') {
    return `Prueba gratis ${VISIO_FREE_TRIAL_DAYS} días en FitMangas`;
  }
  return `Essai gratuit ${VISIO_FREE_TRIAL_DAYS} jours sur FitMangas`;
}
