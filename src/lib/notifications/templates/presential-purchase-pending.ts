import { formatEmailFirstName } from '@/lib/email/format-first-name';

import { renderEmailLayout, text } from './types';

export const subject_fr = 'Ton achat FitMangas est confirmé';
export const subject_es = 'Tu compra FitMangas está confirmada';

export function html_fr(data: Record<string, string | number | boolean | null | undefined>) {
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'toi';
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  return renderEmailLayout({
    locale: 'fr',
    title: 'Bienvenue chez FitMangas',
    body: [
      `Salut ${name}, ton paiement est bien enregistré.`,
      'Ta séance à Nantes sera planifiée très bientôt : nous te préviendrons par email dès qu’une date sera disponible dans ton espace membre.',
      'En attendant, tu peux déjà explorer ton compte et tes préférences de notification.',
    ],
    ctaLabel: 'Accéder à mon espace',
    ctaUrl: `${base}/compte`,
  });
}

export function html_es(data: Record<string, string | number | boolean | null | undefined>) {
  const name = formatEmailFirstName(text(data, 'firstName', '')) || 'amiga';
  const base = text(data, 'appUrl', 'https://fitmangas.com').replace(/\/$/, '');
  return renderEmailLayout({
    locale: 'es',
    title: 'Bienvenida a FitMangas',
    body: [
      `Hola ${name}, tu pago está confirmado.`,
      'Tu sesión en Nantes se programará muy pronto: te avisaremos por email en cuanto haya una fecha en tu espacio de miembro.',
      'Mientras tanto, ya puedes explorar tu cuenta y tus preferencias de notificación.',
    ],
    ctaLabel: 'Entrar a mi espacio',
    ctaUrl: `${base}/compte`,
  });
}
