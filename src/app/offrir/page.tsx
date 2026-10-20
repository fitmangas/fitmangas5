import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { OffrirClient, type PurchasedGift } from '@/components/Gifts/OffrirClient';
import { stripeClient } from '@/lib/gifts/cards';
import { normalizeGiftTimezone } from '@/lib/gifts/send-at';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { giftPageLang, loadGiftPageFacts } from '@/lib/gifts/page-facts';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { isHeartbeatLate } from '@/lib/notifications/v2/heartbeats';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Offrir FitMangas — carte cadeau Pilates & Barre en visio' },
  description:
    'Offre de 1 à 12 mois de Pilates & Barre en visio avec Alejandra : lives où elle la corrige en direct, replays et programmes. Envoyée par email le jour choisi, ou en PDF à imprimer.',
  alternates: { canonical: '/offrir' },
};

/** Après paiement : relit la session Stripe (l'identifiant sert de jeton) pour remercier avec les vrais prénoms. */
async function loadPurchasedGift(sessionId: string | undefined): Promise<PurchasedGift | null> {
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const stripe = stripeClient();
  if (!stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = session.metadata ?? {};
    if (meta.kind !== 'gift' || session.status !== 'complete') return null;
    const delivery = meta.delivery === 'print' ? 'print' : 'email';
    const tz = normalizeGiftTimezone(meta.buyer_timezone);
    const sendAt = meta.send_at ? new Date(meta.send_at) : null;
    let sendLabel: PurchasedGift['sendLabel'] = null;
    if (delivery === 'email' && sendAt && !Number.isNaN(sendAt.getTime()) && sendAt.getTime() > Date.now() + 10 * 60_000) {
      const part = (locale: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...opts, timeZone: tz }).format(sendAt);
      const paris = tz === 'Europe/Paris';
      sendLabel = {
        fr: `${part('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${part('fr-FR', { hour: '2-digit', minute: '2-digit' })} (heure de ${paris ? 'Paris' : 'Mexico'})`,
        es: `${part('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${part('es-ES', { hour: '2-digit', minute: '2-digit' })} (hora de ${paris ? 'París' : 'Ciudad de México'})`,
      };
    }
    return {
      months: [1, 3, 6, 12].includes(Number(meta.months)) ? Number(meta.months) : 3,
      from: (meta.from || '').slice(0, 60),
      to: (meta.to || '').slice(0, 60),
      delivery,
      sendLabel,
    };
  } catch {
    return null;
  }
}

export default async function OffrirPage({ searchParams }: { searchParams: Promise<{ ok?: string; lang?: string; session_id?: string }> }) {
  if (!isGiftsEnabled() && !isDevPreviewEnabled()) notFound();
  const sp = await searchParams;
  const { lang } = giftPageLang(sp.lang, (await headers()).get('accept-language'));
  const facts = await loadGiftPageFacts();
  let emailDeliveryOn = false;
  try {
    // L'envoi « le jour J » dépend de la tâche des 10 minutes : proposé seulement si elle tourne.
    const admin = createAdminClient();
    const { data } = await admin.from('cron_heartbeats').select('last_run_at').eq('job', 'course-reminders').maybeSingle();
    emailDeliveryOn = !isHeartbeatLate((data as { last_run_at?: string } | null)?.last_run_at ?? null, 10 * 60 * 1000);
  } catch {
    emailDeliveryOn = false;
  }
  return (
    <OffrirClient
      prices={facts.prices}
      emailDeliveryOn={emailDeliveryOn}
      initialLang={lang}
      monthlyPriceLabel={facts.monthlyPriceLabel}
      facts={{ programmes: facts.programmes, libraryHours: facts.libraryHours }}
      ok={sp.ok === '1'}
      purchased={sp.ok === '1' ? await loadPurchasedGift(sp.session_id) : null}
    />
  );
}
