import { getAppBaseUrl } from '@/lib/stripe/create-checkout-session';
import { VISIO_FREE_TRIAL_DAYS } from '@/lib/stripe/create-checkout-session';

/**
 * Lien public vers le parcours d'inscription + essai existant (aucun appel Stripe côté Acquisition).
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

/**
 * Message DM offre essai — logique Hormozi appliquée au positionnement FitMangas :
 * valeur (rendez-vous fixe + correction live + être vue) + inversion du risque (7j gratuits).
 */
export function getTrialDmMessage(options?: {
  locale?: 'fr' | 'es';
  utmSource?: string;
  utmCampaign?: string;
}): string {
  const locale = options?.locale ?? 'fr';
  const url = getPublicTrialSignupUrl({
    utmSource: options?.utmSource,
    utmCampaign: options?.utmCampaign ?? 'acquisition_dm',
  });

  if (locale === 'es') {
    return [
      `FitMangas no es un vídeo más: es una cita fija en visio, Alejandra te corrige en directo y te ve.`,
      `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis — la tarjeta solo al final si sigues.`,
      url,
    ].join('\n\n');
  }

  return [
    `FitMangas, ce n’est pas une vidéo de plus : c’est un rendez-vous fixe en visio, Alejandra te corrige en direct et te voit vraiment.`,
    `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits — carte demandée seulement à la fin si tu continues.`,
    url,
  ].join('\n\n');
}
