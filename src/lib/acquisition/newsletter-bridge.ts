import {
  createNewsletterConfirmationToken,
  sendNewsletterConfirmationEmail,
} from '@/lib/blog/newsletter-double-optin';
import { createAdminClient } from '@/lib/supabase/admin';

/** Inscrit un e-mail capturé en Acquisition à la newsletter existante (double opt-in Resend). */
export async function subscribeAcquisitionEmailToNewsletter(
  email: string,
  source = 'acquisition_dm',
): Promise<{ ok: boolean; detail: string; confirmationSent?: boolean }> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, detail: 'E-mail invalide.' };
  }

  try {
    const admin = createAdminClient();
    const { data: coach } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
    if (!coach?.id) {
      return { ok: false, detail: 'Newsletter : coach introuvable (profiles admin).' };
    }

    const { data: row, error } = await admin
      .from('newsletter_subscriptions')
      .upsert(
        {
          email: normalized,
          coach_id: coach.id,
          subscribed_from_article_id: null,
          confirmed: false,
          confirmed_at: null,
          unsubscribed: false,
        },
        { onConflict: 'email,coach_id' },
      )
      .select('id, confirmed')
      .maybeSingle();

    if (error) {
      return { ok: false, detail: `Newsletter Supabase : ${error.message}` };
    }
    if (!row?.id) {
      return { ok: false, detail: 'Newsletter : impossible de créer l’inscription.' };
    }

    if (row.confirmed) {
      return { ok: true, detail: 'Newsletter : déjà confirmée.', confirmationSent: false };
    }

    const token = await createNewsletterConfirmationToken(String(row.id));
    const emailResult = await sendNewsletterConfirmationEmail(normalized, token);

    if (!process.env.RESEND_API_KEY?.trim()) {
      return {
        ok: true,
        detail: `Newsletter : inscrite (Resend absent — lien confirm : ${emailResult.confirmUrl})`,
        confirmationSent: false,
      };
    }

    return {
      ok: true,
      detail: emailResult.sent
        ? `Newsletter : e-mail de confirmation Resend envoyé (${source}).`
        : `Newsletter : inscrite, envoi Resend échoué — ${emailResult.confirmUrl}`,
      confirmationSent: emailResult.sent,
    };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : 'Erreur inscription newsletter',
    };
  }
}
