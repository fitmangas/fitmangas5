import { renderEmailLayout, text } from './types';

export const subject_fr = 'Votre abonnement a été annulé';
export const subject_es = 'Tu suscripción ha sido cancelada';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [`Votre abonnement ${text(data, 'tier')} est annulé. Fin d’accès prévue : ${text(data, 'accessEndsAt', 'à confirmer')}.`],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [`Tu suscripción ${text(data, 'tier')} está cancelada. Fin de acceso prevista: ${text(data, 'accessEndsAt', 'por confirmar')}.`],
  });
}
