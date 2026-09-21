import { Resend } from 'resend';

import { getPublicTrialSignupUrl } from '@/lib/acquisition/trial-url';
import { getWhatsAppDisplayPhoneE164 } from '@/lib/acquisition/providers/meta-live';
import { wrapResendEmail } from '@/lib/email/base-template';
import { createAdminClient } from '@/lib/supabase/admin';

type QuizLocale = 'fr' | 'es';

type LeadRow = {
  id: string;
  locale: QuizLocale;
  first_name: string;
  email: string;
  phone?: string | null;
  result_id: string;
  quiz_slug: string;
  nurture_welcome_sent_at: string | null;
  nurture_j2_due_at: string | null;
  nurture_j2_sent_at: string | null;
  nurture_j5_due_at: string | null;
  nurture_j5_sent_at: string | null;
  nurture_cancelled_at?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Libellés profils DiSC FitMangas (sans jargon). */
export function profileLabel(resultId: string, locale: QuizLocale): string {
  const map: Record<string, { fr: string; es: string }> = {
    rouge: { fr: 'La Décideuse', es: 'La Decidida' },
    jaune: { fr: 'L’Enthousiaste', es: 'La Entusiasta' },
    vert: { fr: 'La Fidèle', es: 'La Fiel' },
    bleu: { fr: 'La Précise', es: 'La Precisa' },
  };
  const row = map[resultId];
  if (!row) return locale === 'es' ? 'tu perfil' : 'ton profil';
  return locale === 'es' ? row.es : row.fr;
}

export function profileHook(resultId: string, locale: QuizLocale): string {
  if (locale === 'es') {
    switch (resultId) {
      case 'rouge':
        return 'Sabes lo que quieres — y odias perder el tiempo sola frente a un vídeo.';
      case 'jaune':
        return 'Te impulsan el vínculo y la energía — sola, se apaga rápido.';
      case 'vert':
        return 'Necesitas que alguien te espere — sin eso, es fácil soltar.';
      case 'bleu':
        return 'Quieres un marco claro y criterios — no improvisación.';
      default:
        return 'No eres 100 % de un solo color — y eso está bien.';
    }
  }
  switch (resultId) {
    case 'rouge':
      return 'Tu sais ce que tu veux — et tu détestes perdre du temps seule devant une vidéo.';
    case 'jaune':
      return 'Tu es portée par le lien et l’énergie — seule, ça s’éteint vite.';
    case 'vert':
      return 'Tu as besoin qu’on t’attende — sans ça, c’est facile de lâcher.';
    case 'bleu':
      return 'Tu veux un cadre clair et des critères — pas de l’impro.';
    default:
      return 'Tu n’es pas 100 % d’une seule couleur — et c’est très bien.';
  }
}

/** Texte WhatsApp court (session 24h ou reprise après opt-in). */
export function buildQuizWhatsAppBody(params: {
  locale: QuizLocale;
  firstName: string;
  resultId: string;
}): string {
  const { locale, firstName, resultId } = params;
  const name = firstName.trim() || (locale === 'es' ? 'hola' : 'toi');
  const style = profileLabel(resultId, locale);
  const url = getPublicTrialSignupUrl({
    courseId: 'v-coll',
    locale,
    utmSource: 'whatsapp',
    utmMedium: 'wa',
    utmCampaign: 'quiz_nurture_welcome',
  });
  if (locale === 'es') {
    return [
      `Hola ${name} 💛`,
      '',
      `Tu perfil FitMangas: ${style}.`,
      profileHook(resultId, locale),
      '',
      'Conmigo: clases grupales en visio con horarios fijos — te corrijo, te veo.',
      '',
      'Prueba 7 días gratis ✨',
      '',
      `Empieza aquí → ${url}`,
    ].join('\n');
  }
  return [
    `Salut ${name} 💛`,
    '',
    `Ton profil FitMangas : ${style}.`,
    profileHook(resultId, locale),
    '',
    'Avec moi : cours collectifs en visio à horaires fixes — je te corrige, je te vois.',
    '',
    'Essai 7 jours gratuits ✨',
    '',
    `Démarre ici → ${url}`,
  ].join('\n');
}
