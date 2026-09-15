/** Helpers messages DM bilingues (Alejandra + Essai 7 jours gratuits ✨). */

export function lines(...rows: string[]): string {
  return rows.join('\n');
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
