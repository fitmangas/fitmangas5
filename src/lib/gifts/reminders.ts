import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { sendEmail } from '@/lib/email/send';
import { wrapResendEmailV2, outlookButton, getEmailPublicBaseUrl } from '@/lib/email/base-template';
import { isGiftsEnabled } from './flag';
import { formatPriceShort, longDateLabel, stripeClient, type GiftLang } from './cards';

/**
 * Rappels avant la fin des mois offerts (J-14 et J-3), SPEC §5 :
 * - envoyés au compte qui a activé la carte (pas à l'adresse saisie par l'acheteuse), dans sa langue ;
 * - seulement pour les modes qui ont une date de fin (essai offert ou prolongé) ;
 * - la date de fin et le moyen de paiement sont relus dans Stripe (les cartes successives s'additionnent) ;
 * - « ajoute un moyen de paiement » seulement si elle n'en a pas ; sinon on annonce la suite (prix, sans engagement).
 * L'anti-doublon est écrit après un envoi réussi.
 */

type ReminderRow = {
  id: string;
  months: number;
  buyer_name: string;
  activated_by: string | null;
  access_ends_at: string | null;
  activation_mode: 'new_trial' | 'existing_no_access' | 'balance_credit' | 'trial_extension' | null;
  stripe_subscription_id: string | null;
  reminder_14_sent_at: string | null;
  reminder_3_sent_at: string | null;
  converted_at: string | null;
};

export type GiftReminderStage = '14' | '3';
export type GiftContinuation = 'auto' | 'add_payment' | 'renew';

const DAY = 86_400_000;

/** Rappel à envoyer pour un groupe de cartes (même abonnement) selon les jours restants. */
export function giftReminderStage(daysLeft: number, rows: Pick<ReminderRow, 'reminder_14_sent_at' | 'reminder_3_sent_at'>[]): GiftReminderStage | null {
  if (daysLeft <= 0) return null;
  if (daysLeft <= 3) return rows.some((r) => !r.reminder_3_sent_at) ? '3' : null;
  if (daysLeft <= 14) return rows.some((r) => !r.reminder_14_sent_at) ? '14' : null;
  return null;
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderGiftReminderEmail(input: {
  lang: GiftLang;
  stage: GiftReminderStage;
  firstName: string | null;
  buyerName: string | null;
  months: number | null;
  extension: boolean;
  endsLabel: string;
  priceLabel: string;
  /** auto : un moyen de paiement est enregistré, l'abonnement continue ; add_payment : rien n'est enregistré ;
   *  renew : l'abonnement est programmé pour s'arrêter (ancienne abonnée avec une carte enregistrée). */
  continuation: GiftContinuation;
}): { subject: string; html: string } {
  const es = input.lang === 'es';
  const base = getEmailPublicBaseUrl();
  const hello = input.firstName ? (es ? `Hola ${esc(input.firstName)},` : `Bonjour ${esc(input.firstName)},`) : es ? 'Hola,' : 'Bonjour,';
  const date = `<b>${esc(input.endsLabel)}</b>`;
  const who = input.buyerName ? esc(input.buyerName) : null;
  const monthsWord = (m: number) => (es ? (m > 1 ? 'meses' : 'mes') : 'mois');

  let lead: string;
  if (input.extension) {
    lead = es
      ? `Tu prueba, ampliada${who ? ` gracias a la tarjeta de ${who}` : ''}, termina el ${date}.`
      : `Ton essai, prolongé${who ? ` grâce à la carte de ${who}` : ''}, se termine le ${date}.`;
  } else if (input.months && who) {
    lead = es
      ? `Los ${input.months} ${monthsWord(input.months)} que te regaló ${who} terminan el ${date}.`
      : `Les ${input.months} mois offerts par ${who} se terminent le ${date}.`;
  } else {
    lead = es ? `Tus meses de regalo terminan el ${date}.` : `Tes mois offerts se terminent le ${date}.`;
  }

  const price = esc(input.priceLabel);
  const next =
    input.continuation === 'auto'
      ? es
        ? `Después, tu suscripción continúa a ${price}/mes con el medio de pago registrado, sin compromiso: puedes detenerla cuando quieras desde tu espacio.`
        : `Ensuite, ton abonnement continue à ${price}/mois avec le moyen de paiement enregistré, sans engagement : tu peux l’arrêter quand tu veux depuis ton espace.`
      : input.continuation === 'renew'
        ? es
          ? `Para seguir con los lives de Alejandra, reactiva tu suscripción desde tu espacio: ${price}/mes, sin compromiso. Si no, tu acceso simplemente se detiene en esa fecha, sin ningún cobro.`
          : `Pour continuer les lives avec Alejandra, réactive ton abonnement depuis ton espace : ${price}/mois, sans engagement. Sinon, ton accès s’arrête simplement à cette date, sans aucun prélèvement.`
        : es
          ? `Para seguir con los lives de Alejandra, añade un medio de pago: ${price}/mes, sin compromiso. Si no, tu acceso simplemente se detiene en esa fecha, sin ningún cobro.`
          : `Pour continuer les lives avec Alejandra, ajoute un moyen de paiement : ${price}/mois, sans engagement. Sinon, ton accès s’arrête simplement à cette date, sans aucun prélèvement.`;

  const button = input.continuation === 'auto' ? (es ? 'Mi suscripción' : 'Mon abonnement') : es ? 'Seguir con FitMangas' : 'Continuer avec FitMangas';
  const headline =
    input.stage === '3' ? (es ? 'Quedan 3 días' : 'Plus que 3 jours') : es ? 'Quedan 14 días' : 'Encore 14 jours';
  const subject = input.extension
    ? es
      ? `Tu prueba termina el ${input.endsLabel}`
      : `Ton essai se termine le ${input.endsLabel}`
    : es
      ? `Tus meses de regalo terminan el ${input.endsLabel}`
      : `Tes mois offerts se terminent le ${input.endsLabel}`;

  const html = wrapResendEmailV2({
    locale: input.lang,
    kicker: es ? 'Tarjeta regalo' : 'Carte cadeau',
    headline,
    preheader: lead.replace(/<[^>]+>/g, ''),
    innerHtml: `<p style="margin:0 0 14px;">${hello}</p><p style="margin:0 0 14px;">${lead}</p><p style="margin:0 0 24px;">${next}</p>${outlookButton(button, `${base}/compte/profil`)}`,
    showPreferencesLink: false,
  });
  return { subject, html };
}

async function hasPaymentMethod(stripe: Stripe, sub: Stripe.Subscription): Promise<boolean> {
  if (sub.default_payment_method || sub.default_source) return true;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) return false;
  const c = customer as Stripe.Customer;
  return Boolean(c.invoice_settings?.default_payment_method || c.default_source);
}

export async function sendGiftExpiryReminders(admin: SupabaseClient, now = new Date(), deps: { stripe?: Stripe | null } = {}) {
  if (!isGiftsEnabled()) return { skipped: 'flag' as const, sent: 0 };
  const from = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!from) return { skipped: 'from' as const, sent: 0 };
  const stripe = deps.stripe ?? stripeClient();
  if (!stripe) return { skipped: 'stripe' as const, sent: 0 };
  try {
    const horizon = new Date(now.getTime() + 15 * DAY).toISOString();
    const since = new Date(now.getTime() - 2 * DAY).toISOString();
    const { data, error } = await admin
      .from('gift_cards')
      .select('id, months, buyer_name, activated_by, access_ends_at, activation_mode, stripe_subscription_id, reminder_14_sent_at, reminder_3_sent_at, converted_at')
      .eq('status', 'activated')
      .in('activation_mode', ['new_trial', 'existing_no_access', 'trial_extension'])
      .is('converted_at', null)
      // J-3 déjà envoyé (ou plus nécessaire) : la carte sort de la liste.
      .is('reminder_3_sent_at', null)
      .not('stripe_subscription_id', 'is', null)
      .not('access_ends_at', 'is', null)
      // Les cartes ajoutées après coup repoussent la fin : on relit Stripe pour la vraie date.
      .lte('access_ends_at', horizon)
      .gte('access_ends_at', since)
      .order('access_ends_at', { ascending: true })
      .limit(200);
    if (error) {
      console.error('[gifts] expiry select', error.message);
      return { skipped: 'tables' as const, sent: 0 };
    }

    const groups = new Map<string, ReminderRow[]>();
    for (const row of (data ?? []) as ReminderRow[]) {
      const key = String(row.stripe_subscription_id);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    let sent = 0;
    for (const [subscriptionId, rows] of groups) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (sub.status !== 'trialing' || !sub.trial_end) {
          // Essai terminé, annulé ou déjà payant : plus aucun rappel à envoyer pour ces cartes.
          await admin
            .from('gift_cards')
            .update({ reminder_14_sent_at: now.toISOString(), reminder_3_sent_at: now.toISOString() })
            .in(
              'id',
              rows.map((r) => r.id),
            )
            .is('reminder_3_sent_at', null);
          continue;
        }
        const ends = new Date(sub.trial_end * 1000);
        const stage = giftReminderStage((ends.getTime() - now.getTime()) / DAY, rows);
        if (!stage) continue;

        const userId = rows.find((r) => r.activated_by)?.activated_by;
        if (!userId) continue;
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        const to = authUser?.user?.email?.trim();
        if (!to) continue;
        const { data: profile } = await admin.from('profiles').select('first_name, preferred_locale, display_timezone').eq('id', userId).maybeSingle();
        const lang: GiftLang = (profile as { preferred_locale?: string } | null)?.preferred_locale === 'es' ? 'es' : 'fr';
        const tz = (profile as { display_timezone?: string | null } | null)?.display_timezone || 'Europe/Paris';
        const price = sub.items.data[0]?.price;
        const latest = [...rows].sort((a, b) => (b.access_ends_at ?? '').localeCompare(a.access_ends_at ?? ''))[0];
        const single = rows.length === 1;

        const { subject, html } = renderGiftReminderEmail({
          lang,
          stage,
          firstName: ((profile as { first_name?: string | null } | null)?.first_name ?? '').trim() || null,
          buyerName: single ? latest.buyer_name : null,
          months: single ? latest.months : null,
          extension: rows.some((r) => r.activation_mode === 'trial_extension'),
          endsLabel: longDateLabel(ends.toISOString(), lang, tz),
          priceLabel: formatPriceShort(price?.unit_amount ?? 3900, price?.currency ?? 'eur', lang),
          continuation: sub.cancel_at_period_end ? 'renew' : (await hasPaymentMethod(stripe, sub)) ? 'auto' : 'add_payment',
        });
        const res = await sendEmail({ from, to, subject, html });
        if (!res.ok) continue;
        const column = stage === '3' ? 'reminder_3_sent_at' : 'reminder_14_sent_at';
        // J-3 envoyé : le J-14 n'a plus de sens (cartes activées tard, tâche en retard).
        const patch = stage === '3' ? { reminder_3_sent_at: now.toISOString(), reminder_14_sent_at: now.toISOString() } : { [column]: now.toISOString() };
        await admin
          .from('gift_cards')
          .update(patch)
          .in(
            'id',
            rows.map((r) => r.id),
          );
        sent += 1;
      } catch (e) {
        console.error('[gifts] expiry reminder', subscriptionId, e instanceof Error ? e.message : e);
      }
    }
    return { sent };
  } catch (e) {
    console.error('[gifts] expiry', e);
    return { skipped: 'tables' as const, sent: 0 };
  }
}
