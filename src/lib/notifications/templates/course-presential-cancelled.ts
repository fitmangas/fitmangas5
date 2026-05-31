import { renderEmailLayout, text } from './types';

export const subject_fr = 'Séance annulée';
export const subject_es = 'Sesión cancelada';

export const critical = true;

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `${text(data, 'courseTitle', 'Votre séance')} du ${text(data, 'courseDate', 'jour prévu')} est annulée.`,
      'Le remboursement sera traité manuellement depuis Stripe.',
    ],
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `${text(data, 'courseTitle', 'Tu sesión')} del ${text(data, 'courseDate', 'día previsto')} está cancelada.`,
      'El reembolso se procesará manualmente desde Stripe.',
    ],
  });
}
