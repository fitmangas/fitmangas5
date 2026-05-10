import { renderEmailLayout } from './types';

export const subject_fr = 'Alejandra aimerait avoir de vos nouvelles';
export const subject_es = 'Alejandra quisiera saber de ti';

export function html_fr() {
  return renderEmailLayout({
    locale: 'fr',
    title: subject_fr,
    body: ['Un dernier petit mot : revenez quand vous voulez, même pour une séance douce de reprise.'],
  });
}

export function html_es() {
  return renderEmailLayout({
    locale: 'es',
    title: subject_es,
    body: ['Un último mensaje: vuelve cuando quieras, incluso para una sesión suave de regreso.'],
  });
}
