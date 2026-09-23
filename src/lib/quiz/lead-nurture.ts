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

/** Exporté pour tests (texte + wa.me sur welcome / J+2 / J+5). */
export function buildQuizNurtureEmail(params: {
  step: 'welcome' | 'j2' | 'j5';
  locale: QuizLocale;
  firstName: string;
  resultId: string;
  quizSlug: string;
}): { subject: string; innerHtml: string } {
  const { step, locale, firstName, resultId, quizSlug } = params;
  const name = firstName.trim() || (locale === 'es' ? 'hola' : 'toi');
  const style = profileLabel(resultId, locale);
  const hook = profileHook(resultId, locale);
  const trialUrl = getPublicTrialSignupUrl({
    courseId: 'v-coll',
    locale,
    utmSource: 'email',
    utmMedium: 'email',
    utmCampaign: `quiz_nurture_${step}`,
  });
  const reportUrl = `https://fitmangas.com/${locale === 'es' ? 'es/' : ''}quiz/${quizSlug}`;
  const waPhone = getWhatsAppDisplayPhoneE164();
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    locale === 'es'
      ? `Hola Alejandra, acabo de hacer el quiz (${style}). Quiero probar 7 días.`
      : `Salut Alejandra, je viens de faire le quiz (${style}). Je veux tester 7 jours.`,
  )}`;

  const waLine =
    locale === 'es'
      ? `<p style="margin:0 0 24px;font-size:14px;color:#2D2D2D;line-height:1.5;">¿Prefieres WhatsApp? <a href="${escapeHtml(waLink)}" style="color:#C45D3E;font-weight:600;">Escríbeme aquí</a> — te respondo enseguida.</p>`
      : `<p style="margin:0 0 24px;font-size:14px;color:#2D2D2D;line-height:1.5;">Tu préfères WhatsApp ? <a href="${escapeHtml(waLink)}" style="color:#C45D3E;font-weight:600;">Écris-moi ici</a> — je te réponds tout de suite.</p>`;
  const ctaStyle =
    'display:inline-block;background:#C45D3E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;';

  if (locale === 'es') {
    if (step === 'welcome') {
      return {
        subject: `${name}, tu perfil: ${style}`,
        innerHtml: `
          <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Hola ${escapeHtml(name)} 💛</h1>
          <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">Tu perfil FitMangas: <strong>${escapeHtml(style)}</strong>.</p>
          <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">${escapeHtml(hook)}</p>
          <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">Conmigo: clases grupales en visio con horarios fijos — te corrijo en directo, te veo de verdad.</p>
          <p style="margin:0 0 20px;color:#2D2D2D;line-height:1.5;"><strong>Prueba 7 días gratis ✨</strong></p>
          <p style="margin:0 0 16px;"><a href="${escapeHtml(trialUrl)}" style="${ctaStyle}">Empezar mi prueba →</a></p>
          ${waLine}
          <p style="margin:0;font-size:13px;color:#6B6560;"><a href="${escapeHtml(reportUrl)}" style="color:#C45D3E;">Reabrir mi informe</a></p>
        `,
      };
    }
    if (step === 'j2') {
      return {
        subject: `${name}, un pequeño recordatorio — prueba 7 días`,
        innerHtml: `
          <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Solo un recordatorio</h1>
          <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">Como <strong>${escapeHtml(style)}</strong>, lo que más cambia suele ser ser vista y corregida en directo.</p>
          <p style="margin:0 0 20px;color:#2D2D2D;line-height:1.5;">Si quieres probar una clase grupal conmigo, la prueba de 7 días está ahí. Si no, sin presión.</p>
          <p style="margin:0 0 16px;"><a href="${escapeHtml(trialUrl)}" style="${ctaStyle}">Probar 7 días →</a></p>
          ${waLine}
        `,
      };
    }
    return {
      subject: `${name}, último empujón — prueba 7 días`,
      innerHtml: `
        <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Último mensaje de mi parte</h1>
        <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">La prueba es sin compromiso de quedarte. Vienes a clase, te corrijo, decides.</p>
        <p style="margin:0 0 16px;"><a href="${escapeHtml(trialUrl)}" style="${ctaStyle}">Abrir el enlace →</a></p>
        ${waLine}
      `,
    };
  }

  if (step === 'welcome') {
    return {
      subject: `${name}, ton profil : ${style}`,
      innerHtml: `
        <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Salut ${escapeHtml(name)} 💛</h1>
        <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">Ton profil FitMangas : <strong>${escapeHtml(style)}</strong>.</p>
        <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">${escapeHtml(hook)}</p>
        <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">Avec moi : des cours collectifs en visio à horaires fixes — je te corrige en direct, je te vois vraiment.</p>
        <p style="margin:0 0 20px;color:#2D2D2D;line-height:1.5;"><strong>Essai 7 jours gratuits ✨</strong></p>
        <p style="margin:0 0 16px;"><a href="${escapeHtml(trialUrl)}" style="${ctaStyle}">Démarrer mon essai →</a></p>
        ${waLine}
        <p style="margin:0;font-size:13px;color:#6B6560;"><a href="${escapeHtml(reportUrl)}" style="color:#C45D3E;">Rouvrir mon rapport</a></p>
      `,
    };
  }
  if (step === 'j2') {
    return {
      subject: `${name}, un petit rappel — essai 7 jours`,
      innerHtml: `
        <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Juste un rappel</h1>
        <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">En profil <strong>${escapeHtml(style)}</strong>, ce qui change souvent, c’est d’être vue et corrigée en direct.</p>
        <p style="margin:0 0 20px;color:#2D2D2D;line-height:1.5;">Si tu veux tester un cours en groupe avec moi, l’essai 7 jours est là. Sinon, aucune pression.</p>
        <p style="margin:0 0 16px;"><a href="${escapeHtml(trialUrl)}" style="${ctaStyle}">Tester 7 jours →</a></p>
        ${waLine}
      `,
    };
  }
  return {
    subject: `${name}, si tu veux encore tester — essai 7 jours`,
    innerHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:#C45D3E;font-family:system-ui,sans-serif;">Dernier message de mon côté</h1>
      <p style="margin:0 0 12px;color:#2D2D2D;line-height:1.5;">L’essai, c’est sans engagement de rester. Tu viens en cours, je te corrige, tu décides.</p>
      <p style="margin:0 0 16px;"><a href="${escapeHtml(trialUrl)}" style="${ctaStyle}">Ouvrir le lien →</a></p>
      ${waLine}
    `,
  };
}

async function sendRawEmail(to: string, subject: string, innerHtml: string, locale: QuizLocale) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.warn('[quiz-nurture] RESEND_API_KEY ou NEWSLETTER_FROM_EMAIL manquant.');
    return { ok: false as const, error: 'email_config_missing' };
  }
  const html = wrapResendEmail({
    innerHtml,
    locale,
    showPreferencesLink: false,
  });
  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to, subject, html });
  return { ok: true as const };
}

/** Normalise téléphone pour WhatsApp Cloud API (chiffres seuls). */
export function phoneDigitsForWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, '');
  if (!d) return null;
  // FR national 0XXXXXXXXX → 33…
  if (d.length === 10 && d.startsWith('0')) d = `33${d.slice(1)}`;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

async function trySendQuizWhatsApp(params: {
  leadId: string;
  phone: string;
  locale: QuizLocale;
  firstName: string;
  resultId: string;
}): Promise<'sent' | 'awaiting_optin' | 'failed' | 'skipped'> {
  const to = phoneDigitsForWhatsApp(params.phone);
  if (!to) return 'skipped';

  try {
    const { whatsappProvider } = await import('@/lib/acquisition/providers/whatsapp');
    const { getMetaLiveReadiness } = await import('@/lib/acquisition/providers/meta-live');
    const ready = await getMetaLiveReadiness();
    if (!ready.whatsapp.robotReady) {
      console.warn('[quiz-nurture] WhatsApp robot pas prêt — awaiting_optin via wa.me dans l’email.');
      return 'awaiting_optin';
    }

    const body = buildQuizWhatsAppBody({
      locale: params.locale,
      firstName: params.firstName,
      resultId: params.resultId,
    });
    const trialUrl = getPublicTrialSignupUrl({
      courseId: 'v-coll',
      locale: params.locale,
      utmSource: 'whatsapp',
      utmMedium: 'wa',
      utmCampaign: 'quiz_nurture_welcome',
    });
    const result = await whatsappProvider.sendMessage({
      conversationExternalId: `quiz_wa_${to}`,
      recipientId: to,
      body,
      buttons: [{ title: 'Essai 7 jours ✨', payload: 'TRIAL_NOW', url: trialUrl }],
    });

    if (result.ok) return 'sent';

    // Hors fenêtre 24h sans template Meta → on attend qu’elle écrive (lien wa.me dans l’email)
    const err = (result.error ?? '').toLowerCase();
    if (
      err.includes('24') ||
      err.includes('template') ||
      err.includes('re-engagement') ||
      err.includes('outside') ||
      err.includes('131047') ||
      err.includes('131026')
    ) {
      return 'awaiting_optin';
    }
    console.error('[quiz-nurture] WhatsApp send failed', result.error);
    return 'failed';
  } catch (e) {
    console.error('[quiz-nurture] WhatsApp exception', e);
    return 'failed';
  }
}

/** Stoppe nurture email/WA si la lead a démarré un essai / payé / opt-out. */
export async function cancelQuizNurtureForEmail(
  email: string,
  reason: 'trial' | 'paid' | 'optout' | 'manual' | 'soft_decline' = 'trial',
): Promise<number> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return 0;
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('quiz_leads')
    .update({
      nurture_j2_due_at: null,
      nurture_j5_due_at: null,
      nurture_cancelled_at: now,
      nurture_cancel_reason: reason,
    })
    .ilike('email', normalized)
    .is('nurture_cancelled_at', null)
    .select('id');
  if (error) {
    console.error('[quiz-nurture] cancel', error);
    return 0;
  }
  return data?.length ?? 0;
}

/** Immédiat après lead : email + tentative WhatsApp + planifie J+2 / J+5. */
export async function scheduleAndSendQuizWelcome(params: {
  leadId: string;
  locale: QuizLocale;
  firstName: string;
  email: string;
  phone?: string;
  resultId: string;
  quizSlug: string;
}): Promise<{ ok: boolean; error?: string; whatsapp?: string }> {
  const admin = createAdminClient();
  const now = Date.now();
  // Une seule relance (J+5) — plus de J+2 pour éviter l’empilement (stratégie Croissance)
  const j5 = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString();

  const { subject, innerHtml } = buildQuizNurtureEmail({
    step: 'welcome',
    locale: params.locale,
    firstName: params.firstName,
    resultId: params.resultId,
    quizSlug: params.quizSlug,
  });

  const sent = await sendRawEmail(params.email, subject, innerHtml, params.locale);
  const patch: Record<string, string | null> = {
    nurture_j2_due_at: null,
    nurture_j5_due_at: j5,
  };
  if (sent.ok) {
    patch.nurture_welcome_sent_at = new Date().toISOString();
  }

  let waStatus: string = 'skipped';
  if (params.phone) {
    waStatus = await trySendQuizWhatsApp({
      leadId: params.leadId,
      phone: params.phone,
      locale: params.locale,
      firstName: params.firstName,
      resultId: params.resultId,
    });
    patch.nurture_whatsapp_status = waStatus;
    if (waStatus === 'sent') {
      patch.nurture_whatsapp_sent_at = new Date().toISOString();
    }
  }

  await admin.from('quiz_leads').update(patch).eq('id', params.leadId);

  if (!sent.ok) {
    console.error('[quiz-nurture] welcome failed', sent.error);
    return { ok: false, error: sent.error, whatsapp: waStatus };
  }
  return { ok: true, whatsapp: waStatus };
}

/**
 * Si une lead quiz a écrit sur WhatsApp (opt-in session), envoie le welcome WA
 * quand le statut était awaiting_optin.
 */
export async function tryFulfillPendingQuizWhatsApp(phoneRaw: string): Promise<boolean> {
  const digits = phoneDigitsForWhatsApp(phoneRaw);
  if (!digits) return false;
  const admin = createAdminClient();
  const { data: leads } = await admin
    .from('quiz_leads')
    .select('id, locale, first_name, phone, result_id, nurture_whatsapp_status, nurture_cancelled_at')
    .eq('nurture_whatsapp_status', 'awaiting_optin')
    .is('nurture_cancelled_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const match = (leads ?? []).find((l) => phoneDigitsForWhatsApp(String(l.phone ?? '')) === digits);
  if (!match) return false;

  const status = await trySendQuizWhatsApp({
    leadId: String(match.id),
    phone: String(match.phone),
    locale: match.locale === 'es' ? 'es' : 'fr',
    firstName: String(match.first_name),
    resultId: String(match.result_id),
  });
  if (status === 'sent') {
    await admin
      .from('quiz_leads')
      .update({
        nurture_whatsapp_status: 'sent',
        nurture_whatsapp_sent_at: new Date().toISOString(),
      })
      .eq('id', match.id);
    return true;
  }
  return false;
}

async function isEmailConverted(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('acq_contacts')
    .select('lifecycle_stage')
    .ilike('email', email.trim().toLowerCase())
    .limit(1)
    .maybeSingle();
  const stage = data?.lifecycle_stage;
  return stage === 'trial' || stage === 'paid' || stage === 'member';
}

/** Cron : envoie J+2 / J+5 dus (ignore si déjà convertie / annulée). */
export async function processDueQuizNurture(limit = 40): Promise<{
  j2Sent: number;
  j5Sent: number;
  skippedConverted: number;
  errors: number;
}> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  let j2Sent = 0;
  let j5Sent = 0;
  let skippedConverted = 0;
  let errors = 0;

  const selectCols =
    'id, locale, first_name, email, phone, result_id, quiz_slug, nurture_welcome_sent_at, nurture_j2_due_at, nurture_j2_sent_at, nurture_j5_due_at, nurture_j5_sent_at, nurture_cancelled_at';

  const { data: dueJ2 } = await admin
    .from('quiz_leads')
    .select(selectCols)
    .is('nurture_j2_sent_at', null)
    .is('nurture_cancelled_at', null)
    .not('nurture_j2_due_at', 'is', null)
    .lte('nurture_j2_due_at', nowIso)
    .limit(limit);

  for (const row of (dueJ2 ?? []) as LeadRow[]) {
    if (await isEmailConverted(row.email)) {
      await cancelQuizNurtureForEmail(row.email, 'trial');
      skippedConverted += 1;
      continue;
    }
    const locale = row.locale === 'es' ? 'es' : 'fr';
    const { subject, innerHtml } = buildQuizNurtureEmail({
      step: 'j2',
      locale,
      firstName: row.first_name,
      resultId: row.result_id,
      quizSlug: row.quiz_slug,
    });
    const sent = await sendRawEmail(row.email, subject, innerHtml, locale);
    if (sent.ok) {
      await admin
        .from('quiz_leads')
        .update({ nurture_j2_sent_at: new Date().toISOString() })
        .eq('id', row.id);
      j2Sent += 1;
    } else {
      errors += 1;
    }
  }

  const { data: dueJ5 } = await admin
    .from('quiz_leads')
    .select(selectCols)
    .is('nurture_j5_sent_at', null)
    .is('nurture_cancelled_at', null)
    .not('nurture_j5_due_at', 'is', null)
    .lte('nurture_j5_due_at', nowIso)
    .limit(limit);

  for (const row of (dueJ5 ?? []) as LeadRow[]) {
    if (await isEmailConverted(row.email)) {
      await cancelQuizNurtureForEmail(row.email, 'trial');
      skippedConverted += 1;
      continue;
    }
    const locale = row.locale === 'es' ? 'es' : 'fr';
    const { subject, innerHtml } = buildQuizNurtureEmail({
      step: 'j5',
      locale,
      firstName: row.first_name,
      resultId: row.result_id,
      quizSlug: row.quiz_slug,
    });
    const sent = await sendRawEmail(row.email, subject, innerHtml, locale);
    if (sent.ok) {
      await admin
        .from('quiz_leads')
        .update({ nurture_j5_sent_at: new Date().toISOString() })
        .eq('id', row.id);
      j5Sent += 1;
    } else {
      errors += 1;
    }
  }

  return { j2Sent, j5Sent, skippedConverted, errors };
}
