/** Helpers messages DM bilingues (Alejandra + Essai 7 jours gratuits ✨). */

import { getPublicTrialSignupUrl, type TrialCourseId } from '@/lib/acquisition/trial-url';
import type { WorkflowActionSpec } from '@/lib/acquisition/types';

/** Lien essai pour boutons URL dans la bulle (ouvre modal inscription, pas /connexion). */
function trialButtonUrl(courseId: TrialCourseId = 'v-coll', locale: 'fr' | 'es' = 'fr'): string {
  return getPublicTrialSignupUrl({
    courseId,
    locale,
    utmSource: 'instagram',
    utmCampaign: 'acquisition_dm',
  });
}

export function lines(...rows: string[]): string {
  return rows.join('\n');
}

/**
 * Séquence relances conversion (standard ManyChat / GHL) :
 * J+1 rappel · J+3 preuve sociale · J+7 dernier message.
 */
export function trialFollowupSequence(): WorkflowActionSpec[] {
  return [
    {
      type: 'schedule_followup',
      config: { delayHours: 24, actionType: 'send_trial_link', style: 'reminder_j1' },
    },
    {
      type: 'schedule_followup',
      config: { delayHours: 72, actionType: 'send_trial_link', style: 'social_proof' },
    },
    {
      type: 'schedule_followup',
      config: { delayHours: 168, actionType: 'send_trial_link', style: 'last_chance' },
    },
  ];
}

export function trialCta(locale: 'fr' | 'es'): { offer: string; cta: string } {
  if (locale === 'es') {
    return { offer: 'Prueba 7 días gratis ✨', cta: 'Haz clic aquí para empezar →' };
  }
  return { offer: 'Essai 7 jours gratuits ✨', cta: 'Clique ici pour démarrer →' };
}

export type BilingualSendConfig = {
  body: string;
  bodyFr: string;
  bodyEs: string;
  appendTrialLink?: boolean;
  /** Boutons DANS la bulle (template Meta) — titre max 20 car. */
  buttons?: Array<{ title: string; payload: string; url?: string }>;
};

export function bilingualSend(
  fr: string,
  es: string,
  appendTrialLink = true,
  buttons?: Array<{ title: string; payload: string; url?: string }>,
): BilingualSendConfig {
  return {
    body: fr,
    bodyFr: fr,
    bodyEs: es,
    appendTrialLink,
    ...(buttons?.length ? { buttons } : {}),
  };
}

/** Boutons d’accueil DM — style ManyChat (pas de lien brut d’abord). */
export const QR_ACCUEIL = [
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl('v-coll') },
  { title: 'Prix / info', payload: 'PRICE_INFO' },
  { title: 'Horaires', payload: 'SCHEDULE' },
];

/** Après « Prix / info » — choix formule (≤20 car., jamais « basique »). */
export const QR_PRICE_CHOICE = [
  { title: 'En groupe', payload: 'PRICE_GROUP' },
  { title: 'Juste toi & moi', payload: 'PRICE_SOLO' },
];

/** CTA essai après détail prix groupe. */
export const QR_TRIAL_GROUP = [
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl('v-coll') },
];

/** CTA essai après détail prix individuel. */
export const QR_TRIAL_SOLO = [
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_IND', url: trialButtonUrl('v-ind') },
];

/** Boutons après pitch — CTA propres (défaut = groupe, offre phare). */
export const QR_AFTER_PITCH = [
  { title: 'Obtenir le lien', payload: 'GET_RESOURCE', url: trialButtonUrl('v-coll') },
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl('v-coll') },
];

/** Boutons gate abonnement → ressource. */
export const QR_FOLLOW_GATE = [
  { title: "Je m'abonne ✅", payload: 'FOLLOW_CLAIM' },
];

export const QR_FOLLOW_DONE = [
  { title: "C'est bon ✅", payload: 'FOLLOW_DONE' },
];

/** Message demande d’abonnement (conversation déjà engagée — pas de Bonjour). */
export function followGateAskFr(): string {
  return lines(
    'Pour que je puisse t’accompagner au mieux dans ce choix 💛',
    '',
    'Abonne-toi d’abord à mon compte Instagram —',
    'ensuite je te réponds avec les infos / l’essai.',
    '',
    'Quand c’est fait, clique ici ↓',
  );
}

export function followGateAskEs(): string {
  return lines(
    'Para acompañarte mejor en esta elección 💛',
    '',
    'Suscríbete primero a mi cuenta de Instagram —',
    'después te respondo con la info / la prueba.',
    '',
    'Cuando esté listo, pulsa aquí ↓',
  );
}

export function followGateThanksFr(): string {
  return lines(
    'Merci pour ton abonnement 💛',
    '',
    'On reprend exactement là où on en était.',
  );
}

export function followGateThanksEs(): string {
  return lines(
    'Gracias por tu suscripción 💛',
    '',
    'Retomamos exactamente donde lo dejamos.',
  );
}

export function followGateRetryFr(): string {
  return lines(
    'Je ne te vois pas encore parmi mes abonnées 💛',
    '',
    'Abonne-toi à mon compte, puis clique ici —',
    'je vérifie et je te réponds tout de suite.',
  );
}

export function followGateRetryEs(): string {
  return lines(
    'Aún no te veo entre mis suscriptoras 💛',
    '',
    'Suscríbete a mi cuenta y pulsa aquí —',
    'verifico y te respondo al momento.',
  );
}

export const QR_RESOURCE = [
  { title: 'Obtenir le lien', payload: 'GET_RESOURCE', url: trialButtonUrl('v-coll') },
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl('v-coll') },
];

/** Détail prix Visio en groupe — 39€ / 8 cours ≈ 4,90€. */
export function priceGroupBodyFr(): string {
  return lines(
    'Visio en groupe avec moi 💛',
    '',
    '39 € / mois',
    '→ 8 cours live / mois (2 par semaine)',
    '→ soit environ 4,90 € par cours',
    '',
    'Inclus aussi :',
    '• replays illimités',
    '• bibliothèque Pilates & Barre',
    '• je te corrige en direct, tu n’es plus seule',
    '',
    'Essai 7 jours gratuits ✨',
    'Carte à l’inscription — prélèvement après l’essai.',
  );
}

export function priceGroupBodyEs(): string {
  return lines(
    'Visio en grupo conmigo 💛',
    '',
    '39 € / mes',
    '→ 8 clases en vivo / mes (2 por semana)',
    '→ unos 4,90 € por clase',
    '',
    'También incluido:',
    '• replays ilimitados',
    '• biblioteca Pilates & Barre',
    '• te corrijo en directo, ya no estás sola',
    '',
    'Prueba 7 días gratis ✨',
    'Tarjeta al registrarte — cobro después de la prueba.',
  );
}

/** Détail prix Visio individuelle — 269€ / 5 cours ≈ 54€ + accès groupe. */
export function priceSoloBodyFr(): string {
  return lines(
    'Visio juste toi et moi 💛',
    '',
    '269 € / mois',
    '→ 5 cours individuels / mois',
    '→ soit environ 54 € par cours avec moi seule',
    '',
    'En plus : accès aux 8 cours en groupe du mois',
    '(replays + biblio inclus aussi).',
    '',
    'Essai 7 jours gratuits ✨',
    'Carte à l’inscription — prélèvement après l’essai.',
  );
}

export function priceSoloBodyEs(): string {
  return lines(
    'Visio solo tú y yo 💛',
    '',
    '269 € / mes',
    '→ 5 clases individuales / mes',
    '→ unos 54 € por clase solo conmigo',
    '',
    'Además: acceso a las 8 clases en grupo del mes',
    '(replays + biblioteca también incluidos).',
    '',
    'Prueba 7 días gratis ✨',
    'Tarjeta al registrarte — cobro después de la prueba.',
  );
}
