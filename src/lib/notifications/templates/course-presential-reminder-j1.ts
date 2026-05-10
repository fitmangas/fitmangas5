import { renderEmailLayout, text } from './types';

export const subject_fr = 'Rappel : votre séance demain à Nantes';
export const subject_es = 'Recordatorio: tu sesión mañana en Nantes';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `${text(data, 'courseTitle', 'Votre séance')} est prévue demain à ${text(data, 'courseTime', 'l’heure prévue')}.`,
      'Adresse : 17 Passage Leroy, 44300 Nantes.',
      "Instructions d'accès : [instructions d'accès à compléter].",
      'Parking : [infos parking à compléter].',
      "À apporter : tapis de yoga, serviette, bouteille d'eau.",
    ],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `${text(data, 'courseTitle', 'Tu sesión')} está prevista mañana a las ${text(data, 'courseTime', 'hora prevista')}.`,
      'Dirección: 17 Passage Leroy, 44300 Nantes.',
      'Acceso: [instrucciones de acceso por completar].',
      'Parking: [información de parking por completar].',
      'Traer: esterilla de yoga, toalla y botella de agua.',
    ],
  });
}
