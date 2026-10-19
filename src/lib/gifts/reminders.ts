import type { SupabaseClient } from '@supabase/supabase-js';

import { sendEmail } from '@/lib/email/send';
import { wrapResendEmailV2, outlookButton, getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { isGiftsEnabled } from './flag';

export async function sendGiftExpiryReminders(admin: SupabaseClient, now = new Date()) {
  if (!isGiftsEnabled()) return { skipped: 'flag' as const, sent: 0 };
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!from) return { skipped: 'from' as const, sent: 0 };
  try {
    const { data, error } = await admin
      .from('gift_cards')
      .select('id, recipient_email, access_ends_at, activation_mode, reminder_14_sent_at, reminder_3_sent_at')
      .eq('status', 'activated')
      .not('access_ends_at', 'is', null);
    if (error) {
      console.error('[gifts] expiry select', error.message);
      return { skipped: 'tables' as const, sent: 0 };
    }
    let sent = 0;
    const base = getEmailPublicBaseUrl();
    for (const row of data ?? []) {
      const ends = row.access_ends_at ? new Date(String(row.access_ends_at)).getTime() : 0;
      const days = (ends - now.getTime()) / (24 * 3600 * 1000);
      const email = String(row.recipient_email ?? '');
      if (!email) continue;
      const needPayment = row.activation_mode === 'new_trial' || row.activation_mode === 'existing_no_access';
      const extra = needPayment ? ' Ajoute un moyen de paiement pour continuer.' : '';
      if (days <= 14 && days > 3 && !row.reminder_14_sent_at) {
        await sendEmail({
          from,
          to: email,
          subject: 'Tes mois offerts se terminent dans 14 jours',
          html: wrapResendEmailV2({
            innerHtml: `<p style="margin:0 0 16px;">Tes mois offerts se terminent bientôt.${extra}</p>${outlookButton('Mon espace', `${base}/compte`)}`,
            locale: 'fr',
            kicker: 'Carte cadeau',
            headline: 'Dans 14 jours',
            showPreferencesLink: false,
          }),
        });
        await admin.from('gift_cards').update({ reminder_14_sent_at: now.toISOString() }).eq('id', row.id);
        sent += 1;
      }
      if (days <= 3 && days > 0 && !row.reminder_3_sent_at) {
        await sendEmail({
          from,
          to: email,
          subject: 'Tes mois offerts se terminent dans 3 jours',
          html: wrapResendEmailV2({
            innerHtml: `<p style="margin:0 0 16px;">Plus que 3 jours.${extra}</p>${outlookButton('Mon espace', `${base}/compte`)}`,
            locale: 'fr',
            kicker: 'Carte cadeau',
            headline: 'Dans 3 jours',
            showPreferencesLink: false,
          }),
        });
        await admin.from('gift_cards').update({ reminder_3_sent_at: now.toISOString() }).eq('id', row.id);
        sent += 1;
      }
    }
    return { sent };
  } catch (e) {
    console.error('[gifts] expiry', e);
    return { skipped: 'tables' as const, sent: 0 };
  }
}
