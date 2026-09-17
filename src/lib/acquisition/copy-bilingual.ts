/** Helpers messages DM bilingues (Alejandra + Essai 7 jours gratuits ✨). */

import { getPublicTrialSignupUrl } from '@/lib/acquisition/trial-url';
import type { WorkflowActionSpec } from '@/lib/acquisition/types';

/** Lien essai pour boutons URL dans la bulle. */
function trialButtonUrl(): string {
  return getPublicTrialSignupUrl({
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
  /** Boutons DANS la bulle (template Meta) */
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
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl() },
  { title: 'Prix / info', payload: 'PRICE_INFO' },
  { title: 'Horaires', payload: 'SCHEDULE' },
];

/** Boutons après pitch / prix — CTA propres. */
export const QR_AFTER_PITCH = [
  { title: 'Obtenir le lien', payload: 'GET_RESOURCE', url: trialButtonUrl() },
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl() },
];

/** Boutons gate abonnement → ressource. */
export const QR_FOLLOW_GATE = [
  { title: 'Je te suis ✅', payload: 'FOLLOW_CLAIM' },
];

export const QR_FOLLOW_DONE = [
  { title: "C'est bon ✅", payload: 'FOLLOW_DONE' },
];

export const QR_RESOURCE = [
  { title: 'Obtenir le lien', payload: 'GET_RESOURCE', url: trialButtonUrl() },
  { title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialButtonUrl() },
];
