import { formatEmailFirstName } from '@/lib/email/format-first-name';

import { renderEmailLayout, text } from './types';

export const subject_fr = 'Tu n’as pas finalisé ton inscription';
export const subject_es = 'No has completado tu inscripción';

const OFFER_LABELS_FR: Record<string, string> = {
  'v-coll': 'Visio collectif (39 € / mois)',
  'v-ind': 'Visio individuel (269 € / mois)',
  'n-coll': 'Cours collectif à Nantes (10 €)',
  'n-ind': 'Cours individuel à Nantes (50 €)',
};

const OFFER_LABELS_ES: Record<string, string> = {
  'v-coll': 'Visio grupal (39 € / mes)',
  'v-ind': 'Visio individual (269 € / mes)',
  'n-coll': 'Clase grupal en Nantes (10 €)',
  'n-ind': 'Clase individual en Nantes (50 €)',
};

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'toi';
  const courseId = text(data, 'courseId', 'v-coll');
  const offer = OFFER_LABELS_FR[courseId] ?? 'ton offre FitMangas';
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `Salut ${name},`,
      `Tu as commencé ton inscription pour ${offer}, mais le paiement n’a pas été finalisé.`,
      'Reprends quand tu veux : ton espace membre t’attend.',
    ],
    ctaLabel: 'Reprendre mon inscription',
    ctaUrl: `${base}/?offer=${encodeURIComponent(courseId)}`,
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'amiga';
  const courseId = text(data, 'courseId', 'v-coll');
  const offer = OFFER_LABELS_ES[courseId] ?? 'tu oferta FitMangas';
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `Hola ${name},`,
      `Empezaste tu inscripción para ${offer}, pero el pago no se completó.`,
      'Retómalo cuando quieras: tu espacio de miembro te espera.',
    ],
    ctaLabel: 'Retomar mi inscripción',
    ctaUrl: `${base}/?offer=${encodeURIComponent(courseId)}`,
  });
}
