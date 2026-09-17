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
    return `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis ✨`;
  }
  return `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits ✨`;
}

/**
 * Message DM offre essai.
 * Voix Alejandra + « Essai 7 jours gratuits ✨ ».
 * Ne jamais mentir sur la carte (prise à l’inscription, prélèvement après essai).
 */
export type TrialDmStyle = 'full' | 'compact' | 'reminder_j1' | 'social_proof' | 'last_chance';

export function getTrialDmMessage(options?: {
  locale?: 'fr' | 'es';
  utmSource?: string;
  utmCampaign?: string;
  style?: TrialDmStyle;
}): string {
  const locale = options?.locale ?? 'fr';
  const style = options?.style ?? 'full';
  const url = getPublicTrialSignupUrl({
    utmSource: options?.utmSource,
    utmCampaign: options?.utmCampaign ?? 'acquisition_dm',
  });

  if (style === 'compact') {
    return locale === 'es'
      ? `Aquí tienes el enlace ✨\n\n${url}`
      : `Voici ton lien ✨\n\n${url}`;
  }

  if (style === 'reminder_j1') {
    if (locale === 'es') {
      return [
        'Solo un recordatorio 💛',
        '',
        'El enlace de la prueba sigue disponible.',
        'Una cita fija conmigo, corrección en directo — ya no estás sola.',
        '',
        `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis ✨`,
        '',
        'Haz clic aquí →',
        url,
      ].join('\n');
    }
    return [
      'Juste un rappel 💛',
      '',
      'Le lien de l’essai est toujours là.',
      'Un rendez-vous fixe avec moi, correction en direct — tu n’es plus seule.',
      '',
      `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits ✨`,
      '',
      'Clique ici →',
      url,
    ].join('\n');
  }

  if (style === 'social_proof') {
    if (locale === 'es') {
      return [
        'Una cosa que oigo mucho de mis Mangitas 💛',
        '',
        '« Lo que me retenía no era el ejercicio — era hacerlo sola. »',
        '',
        'Conmigo en visio: cita fija, te corrijo, te veo.',
        '',
        `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis ✨`,
        '',
        'Pruébalo esta semana →',
        url,
      ].join('\n');
    }
    return [
      'Un truc que j’entends souvent de mes Mangitas 💛',
      '',
      '« Ce qui me retenait, ce n’était pas l’exo — c’était de le faire seule. »',
      '',
      'Avec moi en visio : rendez-vous fixe, je te corrige, je te vois.',
      '',
      `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits ✨`,
      '',
      'Teste cette semaine →',
      url,
    ].join('\n');
  }

  if (style === 'last_chance') {
    if (locale === 'es') {
      return [
        'Último mensaje de mi parte 💛',
        '',
        'Si aún te lo estás pensando: la prueba es sin compromiso de permanecer.',
        'Vienes a una cita conmigo y decides.',
        '',
        `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis ✨`,
        '',
        'Aquí está el enlace →',
        url,
      ].join('\n');
    }
    return [
      'Dernier message de mon côté 💛',
      '',
      'Si tu hésites encore : l’essai, c’est sans engagement de rester.',
      'Tu viens à un rendez-vous avec moi, et tu décides.',
      '',
      `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits ✨`,
      '',
      'Voici le lien →',
      url,
    ].join('\n');
  }

  if (locale === 'es') {
    return [
      'Yo no te dejo sola frente a un vídeo.',
      'Cita fija conmigo, te corrijo en directo, te veo.',
      '',
      `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis ✨`,
      '',
      'Haz clic aquí →',
      url,
    ].join('\n');
  }

  return [
    'Moi, je ne te laisse pas seule devant une vidéo.',
    'Rendez-vous fixe avec moi, je te corrige en direct, je te vois.',
    '',
    `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits ✨`,
    '',
    'Clique ici →',
    url,
  ].join('\n');
}

/** Pitch + lien dans UNE seule bulle. */
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
    (locale === 'es' ? 'Gracias por escribir 💛 Soy Alejandra.' : 'Merci pour ton message 💛 C’est Alejandra.');

  if (locale === 'es') {
    return [
      opener,
      '',
      'Conmigo: cita fija + corrección en directo + te veo de verdad.',
      '',
      `Prueba ${VISIO_FREE_TRIAL_DAYS} días gratis ✨`,
      '',
      'Haz clic aquí →',
      url,
    ].join('\n');
  }

  return [
    opener,
    '',
    'Avec moi : rendez-vous fixe + correction en direct + je te vois vraiment.',
    '',
    `Essai ${VISIO_FREE_TRIAL_DAYS} jours gratuits ✨`,
    '',
    'Clique ici →',
    url,
  ].join('\n');
}
