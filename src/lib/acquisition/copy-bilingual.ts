/** Helpers messages DM bilingues (Alejandra + Essai 7 jours gratuits ✨). */

import type { WorkflowActionSpec } from '@/lib/acquisition/types';

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
};

export function bilingualSend(fr: string, es: string, appendTrialLink = true): BilingualSendConfig {
  return { body: fr, bodyFr: fr, bodyEs: es, appendTrialLink };
}
