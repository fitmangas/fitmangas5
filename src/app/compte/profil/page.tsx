import Link from 'next/link';
import Stripe from 'stripe';

import { BillingPortalButton } from '@/components/Compte/BillingPortalButton';
import { ProfileAvatarForm } from '@/components/Compte/ProfileAvatarForm';
import { ProfileBirthDateForm } from '@/components/Compte/ProfileBirthDateForm';
import { ProfileLanguageForm } from '@/components/Compte/ProfileLanguageForm';
import { GlassCard } from '@/components/ui/GlassCard';
import { getClientLang, localeFromClientLang } from '@/lib/compte/i18n';
import { computeGamificationGrade, gradeLabel } from '@/lib/gamification';
import { getPrintfulOrders } from '@/lib/printful';
import { createClient } from '@/lib/supabase/server';

function formatTier(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ');
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  const lang = await getClientLang(supabase, user.id);
  const locale = localeFromClientLang(lang);
  const t =
    lang === 'en'
      ? {
          overline: 'My profile',
          title: 'Account settings',
          back: 'Client area',
          email: 'Email',
          offer: 'Displayed offer',
          grade: 'Grade',
          journey: 'Journey & progress',
          onsite: 'Studio presences (check-in)',
          replayTime: 'Total replay time',
          liveDays: 'Live participations (distinct days)',
          subscriptionBilling: 'Subscription & billing',
          billingText: 'Change your payment method, review renewals and cancel from the secure Stripe portal.',
          savedSubs: 'Saved subscriptions',
          noneRows: 'No row in database for now.',
          end: 'end',
          stripeInvoices: 'Stripe invoices',
          stripeAssoc: 'Available after Stripe customer association.',
          noRecentInvoice: 'No recent invoice.',
          date: 'Date',
          number: 'N°',
          status: 'Status',
          amount: 'Amount',
          pdf: 'PDF',
          open: 'Open',
          shopInvoices: 'Shop orders & invoices',
          noShopOrders: 'No shop order linked to your email.',
          order: 'Order',
          invoice: 'Invoice',
        }
      : lang === 'es'
        ? {
            overline: 'Mi perfil',
            title: 'Configuración de cuenta',
            back: 'Área cliente',
            email: 'Email',
            offer: 'Oferta mostrada',
            grade: 'Grado',
            journey: 'Recorrido y progreso',
            onsite: 'Presencias en estudio (registro)',
            replayTime: 'Tiempo total de replay',
            liveDays: 'Participaciones live (días distintos)',
            subscriptionBilling: 'Suscripción y facturación',
            billingText: 'Modifica tu método de pago, revisa renovaciones y cancela desde el portal seguro de Stripe.',
            savedSubs: 'Suscripciones registradas',
            noneRows: 'No hay filas en base por ahora.',
            end: 'fin',
            stripeInvoices: 'Facturas Stripe',
            stripeAssoc: 'Disponibles tras asociar un cliente Stripe.',
            noRecentInvoice: 'No hay facturas recientes.',
            date: 'Fecha',
            number: 'N°',
            status: 'Estado',
            amount: 'Importe',
            pdf: 'PDF',
            open: 'Abrir',
            shopInvoices: 'Pedidos y facturas tienda',
            noShopOrders: 'No hay pedidos de tienda vinculados a tu correo.',
            order: 'Pedido',
            invoice: 'Factura',
          }
        : {
            overline: 'Mon profil',
            title: 'Paramètres du compte',
            back: 'Espace client',
            email: 'E-mail',
            offer: 'Offre affichée',
            grade: 'Grade',
            journey: 'Parcours & progression',
            onsite: 'Présences studio (pointage)',
            replayTime: 'Temps replay cumulé',
            liveDays: 'Participations live (jours distincts)',
            subscriptionBilling: 'Abonnement & facturation',
            billingText: 'Modifie ton moyen de paiement, consulte les renouvellements et résilie depuis le portail sécurisé Stripe.',
            savedSubs: 'Abonnements enregistrés',
            noneRows: 'Aucune ligne en base pour l’instant.',
            end: 'fin',
            stripeInvoices: 'Factures Stripe',
            stripeAssoc: 'Disponibles après association à un client Stripe.',
            noRecentInvoice: 'Aucune facture récente.',
            date: 'Date',
            number: 'N°',
            status: 'Statut',
            amount: 'Montant',
            pdf: 'PDF',
            open: 'Ouvrir',
            shopInvoices: 'Commandes & factures boutique',
            noShopOrders: 'Aucune commande boutique liée à ton e-mail.',
            order: 'Commande',
            invoice: 'Facture',
          };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, tier, status, ends_at, price_cents, interval')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const customerId = profile?.stripe_customer_id?.trim() ?? null;

  type InvoiceRow = {
    id: string;
    number: string | null;
    status: string | null;
    created: number;
    hosted_invoice_url: string | null;
    amount_paid: number;
    currency: string;
  };

  let invoices: InvoiceRow[] = [];
  let printfulOrders: Awaited<ReturnType<typeof getPrintfulOrders>> = [];

  if (stripeKey && customerId) {
    try {
      const stripe = new Stripe(stripeKey);
      const list = await stripe.invoices.list({ customer: customerId, limit: 24 });
      invoices = list.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        created: inv.created,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
      }));
    } catch {
      invoices = [];
    }
  }

  if (user.email) {
    try {
      const orders = await getPrintfulOrders(80);
      const email = user.email.toLowerCase();
      printfulOrders = orders.filter((o) => {
        const recipientEmail = o.recipient?.email?.toLowerCase() ?? o.packing_slip?.email?.toLowerCase() ?? '';
        return recipientEmail === email;
      });
    } catch {
      printfulOrders = [];
    }
  }

  const p = profile as {
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    customer_tier?: string | null;
    birth_date?: string | null;
    gamification_grade?: string | null;
    gamification_points?: number | null;
    onsite_presence_count?: number | null;
    total_replay_watch_seconds?: number | null;
    live_visit_count?: number | null;
    preferred_blog_language?: 'fr' | 'en' | 'es' | null;
  } | null;
  const computedGrade = computeGamificationGrade({
    points: p?.gamification_points ?? 0,
    liveVisits: p?.live_visit_count ?? 0,
    replaySeconds: p?.total_replay_watch_seconds ?? 0,
    onsitePresences: p?.onsite_presence_count ?? 0,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 pb-16 md:space-y-10 md:px-8">
      <div className="flex items-center justify-between gap-4 pt-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{t.overline}</p>
          <h1 className="hero-signature-title mt-2 text-4xl md:text-5xl">{t.title}</h1>
        </div>
        <Link href="/compte" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          ← {t.back}
        </Link>
      </div>

      <GlassCard className="p-8 md:p-10">
        <p className="mt-4 text-sm text-luxury-muted">
          {t.email} : <span className="font-medium text-luxury-ink">{user.email}</span>
        </p>
        <p className="mt-2 text-sm text-luxury-muted">
          {t.offer} : <span className="font-medium text-luxury-ink">{formatTier(p?.customer_tier ?? null)}</span>
        </p>
        <p className="mt-3 text-sm text-luxury-muted">
          {t.grade} : <span className="font-medium text-luxury-ink">{gradeLabel(p?.gamification_grade ?? computedGrade)}</span>
          {p?.gamification_points != null ? (
            <span className="text-luxury-soft"> · {p.gamification_points} pts</span>
          ) : null}
        </p>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileAvatarForm avatarUrl={p?.avatar_url} />
        <ProfileBirthDateForm defaultIsoDate={p?.birth_date ?? null} />
      </div>

      <ProfileLanguageForm defaultLang={p?.preferred_blog_language === 'en' || p?.preferred_blog_language === 'es' ? p.preferred_blog_language : 'fr'} />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-8">
          <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.journey}</h2>
          <ul className="mt-4 space-y-2 text-sm text-luxury-muted">
            <li>
              {t.onsite} :{' '}
              <strong className="text-luxury-ink">{p?.onsite_presence_count ?? 0}</strong>
            </li>
            <li>
              {t.replayTime} :{' '}
              <strong className="text-luxury-ink">{Math.round((p?.total_replay_watch_seconds ?? 0) / 60)} min</strong>
            </li>
            <li>
              {t.liveDays} :{' '}
              <strong className="text-luxury-ink">{p?.live_visit_count ?? 0}</strong>
            </li>
          </ul>
        </GlassCard>

        <GlassCard className="p-8">
          <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.subscriptionBilling}</h2>
          <p className="mt-3 text-sm leading-relaxed text-luxury-muted">
            {t.billingText}
          </p>
          <div className="mt-6">
            <BillingPortalButton disabled={!customerId} />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.savedSubs}</h2>
        {!subs?.length ? (
          <p className="mt-4 text-sm text-luxury-soft">{t.noneRows}</p>
        ) : (
          <ul className="mt-6 space-y-3 text-sm">
            {subs.map((s) => (
              <li key={s.id} className="rounded-xl border border-white/35 bg-white/25 px-4 py-3 backdrop-blur-sm">
                <span className="font-medium text-luxury-ink">{formatTier(s.tier)}</span> · {s.status} ·{' '}
                {(s.price_cents ?? 0) / 100} € / {s.interval ?? 'month'}
                {s.ends_at ? ` · ${t.end} ${new Date(s.ends_at).toLocaleDateString(locale)}` : ''}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.stripeInvoices}</h2>
        {!customerId ? (
          <p className="mt-4 text-sm text-luxury-soft">{t.stripeAssoc}</p>
        ) : invoices.length === 0 ? (
          <p className="mt-4 text-sm text-luxury-soft">{t.noRecentInvoice}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                  <th className="py-3 pr-4">{t.date}</th>
                  <th className="py-3 pr-4">{t.number}</th>
                  <th className="py-3 pr-4">{t.status}</th>
                  <th className="py-3 pr-4">{t.amount}</th>
                  <th className="py-3">{t.pdf}</th>
                </tr>
              </thead>
              <tbody className="text-luxury-muted">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/20">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {new Date(inv.created * 1000).toLocaleDateString(locale)}
                    </td>
                    <td className="py-3 pr-4">{inv.number ?? '—'}</td>
                    <td className="py-3 pr-4">{inv.status ?? '—'}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {(inv.amount_paid / 100).toLocaleString('fr-FR', { style: 'currency', currency: inv.currency || 'eur' })}
                    </td>
                    <td className="py-3">
                      {inv.hosted_invoice_url ? (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-luxury-orange underline-offset-4 hover:underline"
                        >
                          {t.open}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard id="boutique-commandes" className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.shopInvoices}</h2>
        {!printfulOrders.length ? (
          <p className="mt-4 text-sm text-luxury-soft">{t.noShopOrders}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                  <th className="py-3 pr-4">{t.order}</th>
                  <th className="py-3 pr-4">{t.status}</th>
                  <th className="py-3 pr-4">{t.date}</th>
                  <th className="py-3">{t.invoice}</th>
                </tr>
              </thead>
              <tbody className="text-luxury-muted">
                {printfulOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/20">
                    <td className="py-3 pr-4 font-medium text-luxury-ink">#{order.id}</td>
                    <td className="py-3 pr-4">{order.status}</td>
                    <td className="py-3 pr-4">{new Date(order.created).toLocaleDateString(locale)}</td>
                    <td className="py-3">
                      {order.invoice_url ? (
                        <a
                          href={order.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-luxury-orange underline-offset-4 hover:underline"
                        >
                          {t.open}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
