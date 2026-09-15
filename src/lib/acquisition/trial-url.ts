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
 *
 * style:
 * - full = message complet (1 bulle autonome)
 * - compact = juste le lien (2e bulle, sans répéter le pitch)
 */
export function getTrialDmMessage(options?: {
  locale?: 'fr' | 'es';
  utmSource?: string;
  utmCampaign?: string;
  style?: 'full' | 'compact';
}): string {
  const locale = options?.locale ?? 'fr';
  const style = options?.style ?? 'full';
  const url = getPublicTrialSignupUrl({
    utmSource: options?.utmSource,
    utmCampaign: options?.utmCampaign ?? 'acquisition_dm',
  });

  if (style === 'compact') {
    return locale === 'es'
      ? `Aquí tienes el enlace para tus ${VISIO_FREE_TRIAL_DAYS} días 💛\n\n${url}`
      : `Voici ton lien pour les ${VISIO_FREE_TRIAL_DAYS} jours 💛\n\n${url}`;
  }

  if (locale === 'es') {
    return [
      'No pagas un vídeo más.',
      'Pagas una cita fija en visio, corrección en directo, y ser vista de verdad.',
      '',
      `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis.`,
      'La tarjeta solo al final — si sigues.',
      '',
      url,
    ].join('\n');
  }

  return [
    'Tu ne paies pas une vidéo de plus.',
    'Tu paies un rendez-vous fixe en visio, la correction en direct, et le fait d’être vraiment vue.',
    '',
    `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits.`,
    'La carte n’est demandée qu’à la fin — seulement si tu continues.',
    '',
    url,
  ].join('\n');
}

/** Pitch + lien dans UNE seule bulle (saluts, commentaires) — évite le double DM robot. */
export function getNaturalTrialInviteMessage(options?: {
  locale?: 'fr' | 'es';
  utmSource?: string;
  utmCampaign?: string;
  opener?: string;
}): string {
  const locale = options?.locale ?? 'fr';
  const url = getPublicTrialSignupUrl({
    utmSource: options?.utmSource,
    utmCampaign: options?.utmCampaign ?? 'acquisition_dm',
  });
  const opener =
    options?.opener?.trim() ||
    (locale === 'es' ? 'Gracias por escribir 💛' : 'Merci pour ton message 💛');

  if (locale === 'es') {
    return [
      opener,
      '',
      'FitMangas = cita fija + corrección en directo + ser vista.',
      'Ya no estás sola frente a YouTube.',
      '',
      `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis — tarjeta solo al final si sigues.`,
      '',
      url,
    ].join('\n');
  }

  return [
    opener,
    '',
    'FitMangas = rendez-vous fixe + correction en direct + être vue.',
    'Tu n’es plus seule devant YouTube.',
    '',
    `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits — carte seulement à la fin si tu continues.`,
    '',
    url,
  ].join('\n');
}
