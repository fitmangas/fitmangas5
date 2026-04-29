import Link from 'next/link';

import { BillingPortalButton } from '@/components/Compte/BillingPortalButton';
import { ProfileAvatarForm } from '@/components/Compte/ProfileAvatarForm';
import { ProfileBirthDateFormEmbedded } from '@/components/Compte/ProfileBirthDateForm';
import { ProfileLanguageFormEmbedded } from '@/components/Compte/ProfileLanguageForm';
import { GlassCard } from '@/components/ui/GlassCard';
import { getClientLang } from '@/lib/compte/i18n';
import { computeGamificationGrade, gradeLabel } from '@/lib/gamification';
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
          billingHub: 'Billing center',
          billingHubText: 'Find everything in one place: Stripe subscription, Stripe invoices, and shop invoices.',
          openStripeSub: 'Stripe subscription',
          openStripeInvoices: 'Stripe invoices',
          openShopArea: 'Shop invoices',
          stripeSection: 'Billing — Stripe & shop',
          billingText: 'Change your payment method, review renewals and cancel from the secure Stripe portal.',
          savedSubs: 'Saved subscriptions',
          noneRows: 'No row in database for now.',
          end: 'end',
          stripeInvoices: 'Stripe invoices',
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
            billingHub: 'Centro de facturación',
            billingHubText: 'Todo en un solo lugar: suscripción Stripe, facturas Stripe y facturas tienda.',
            openStripeSub: 'Suscripción Stripe',
            openStripeInvoices: 'Facturas Stripe',
            openShopArea: 'Facturas tienda',
            stripeSection: 'Facturación — Stripe y tienda',
            billingText: 'Modifica tu método de pago, revisa renovaciones y cancela desde el portal seguro de Stripe.',
            savedSubs: 'Suscripciones registradas',
            noneRows: 'No hay filas en base por ahora.',
            end: 'fin',
            stripeInvoices: 'Facturas Stripe',
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
            billingHub: 'Centre de facturation',
            billingHubText: 'Tout est réuni ici : abonnement Stripe, factures Stripe et factures boutique.',
            openStripeSub: 'Abonnement Stripe',
            openStripeInvoices: 'Factures Stripe',
            openShopArea: 'Factures boutique',
            stripeSection: 'Facturation — Stripe & boutique',
            billingText: 'Modifie ton moyen de paiement, consulte les renouvellements et résilie depuis le portail sécurisé Stripe.',
            savedSubs: 'Abonnements enregistrés',
            noneRows: 'Aucune ligne en base pour l’instant.',
            end: 'fin',
            stripeInvoices: 'Factures Stripe',
          };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const customerId = profile?.stripe_customer_id?.trim() ?? null;

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

      <GlassCard className="p-6 md:p-7">
        <div className="grid gap-2 text-sm text-luxury-muted sm:grid-cols-3 sm:gap-4">
          <p>
            {t.email} : <span className="font-medium text-luxury-ink">{user.email}</span>
          </p>
          <p>
            {t.offer} : <span className="font-medium text-luxury-ink">{formatTier(p?.customer_tier ?? null)}</span>
          </p>
          <p>
            {t.grade} : <span className="font-medium text-luxury-ink">{gradeLabel(p?.gamification_grade ?? computedGrade)}</span>
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1px_1fr] lg:gap-7">
          <div>
            <ProfileAvatarForm avatarUrl={p?.avatar_url} embedded />
          </div>
          <div className="hidden lg:block w-px self-stretch bg-white/45" />
          <div className="space-y-8">
            <ProfileBirthDateFormEmbedded defaultIsoDate={p?.birth_date ?? null} />
            <div className="h-px bg-white/45" />
            <ProfileLanguageFormEmbedded defaultLang={p?.preferred_blog_language === 'en' || p?.preferred_blog_language === 'es' ? p.preferred_blog_language : 'fr'} />
          </div>
        </div>
      </GlassCard>

      <GlassCard id="stripe-facturation" className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.stripeSection}</h2>
        <p className="mt-3 text-sm leading-relaxed text-luxury-muted">{t.billingHubText}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <form action="/api/billing/portal" method="post">
            <button
              type="submit"
              disabled={!customerId}
              className="btn-luxury-ghost min-h-[42px] min-w-[190px] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t.openStripeSub}
            </button>
          </form>
          <form action="/api/billing/portal" method="post">
            <button
              type="submit"
              disabled={!customerId}
              className="btn-luxury-ghost min-h-[42px] min-w-[190px] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t.openStripeInvoices}
            </button>
          </form>
          <Link href="/compte/boutique/commandes" className="btn-luxury-ghost min-h-[42px] min-w-[190px]">
            {t.openShopArea}
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
