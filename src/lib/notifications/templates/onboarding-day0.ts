import { formatEmailFirstName } from '@/lib/email/format-first-name';

import { renderEmailLayout, text } from './types';

function greetingFirstNameFr(data: Record<string, string | number | boolean | null | undefined>): string {
  const fromPayload = formatEmailFirstName(text(data, 'firstName', ''));
  return fromPayload || 'toi';
}

function greetingFirstNameEs(data: Record<string, string | number | boolean | null | undefined>): string {
  const fromPayload = formatEmailFirstName(text(data, 'firstName', ''));
  return fromPayload || 'amiga';
}

export const subject_fr = 'Bienvenue dans ta nouvelle routine Pilates ! 🧘‍♀️';
export const subject_es = '¡Bienvenida a tu nueva rutina de Pilates! 🧘‍♀️';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: [
      `Salut ${greetingFirstNameFr(data)}, ton abonnement est actif.`,
      'Ton espace membre est prêt : planning, replays et ressources t’attendent.',
    ],
    ctaLabel: 'Accéder à mon espace',
    ctaUrl: `${base}/compte`,
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  const name = greetingFirstNameEs(data);
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: [
      `Hola ${name}, tu suscripción ya está activa.`,
      'Tu espacio de miembro está listo: calendario, repeticiones y recursos te esperan.',
    ],
    ctaLabel: 'Entrar a mi espacio',
    ctaUrl: `${base}/compte`,
  });
}
