import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { PreferencesClient } from '@/components/Compte/Preferences/PreferencesClient';
import type { PreferencesLang } from '@/components/Compte/Preferences/i18n';
import { ProfileBillingCard } from '@/components/Compte/ProfileBillingCard';
import { ProfileLanguageTimezoneCard } from '@/components/Compte/ProfileLanguageTimezoneCard';
import { ProfileMonProfilCard } from '@/components/Compte/ProfileMonProfilCard';
import { getClientLang } from '@/lib/compte/i18n';
import { mergePrefs } from '@/lib/notifications/defaults';
import type { NotificationPreferencesRow } from '@/lib/notifications/types';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const blogLang = await getClientLang(supabase, user.id);
  const prefLang: PreferencesLang = blogLang === 'es' ? 'es' : 'fr';

  const t =
    blogLang === 'en'
      ? {
          title: 'Account settings',
          dashboard: 'Dashboard',
          profileSection: 'My profile',
          birthLabel: 'Birth date',
          emailLabel: 'Email',
          billingSection: 'Billing',
          openStripeSub: 'Subscription',
          openStripeInvoices: 'Invoices',
          openShopArea: 'Shop orders',
        }
      : blogLang === 'es'
        ? {
            title: 'Configuración de cuenta',
            dashboard: 'Dashboard',
            profileSection: 'Mi perfil',
            birthLabel: 'Fecha de nacimiento',
            emailLabel: 'Correo',
            billingSection: 'Facturación',
            openStripeSub: 'Suscripción',
            openStripeInvoices: 'Facturas',
            openShopArea: 'Pedidos tienda',
          }
        : {
            title: 'Paramètres du compte',
            dashboard: 'Dashboard',
            profileSection: 'Mon profil',
            birthLabel: 'Date de naissance',
            emailLabel: 'E-mail',
            billingSection: 'Facturation',
            openStripeSub: 'Abonnement',
            openStripeInvoices: 'Factures',
            openShopArea: 'Commandes boutique',
          };

  const [{ data: profile }, { data: prefRow }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'avatar_url, birth_date, stripe_customer_id, preferred_locale, display_timezone, display_timezone_manual_locked, marketing_email_opt_in, marketing_email_opt_in_at',
      )
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  const merged = mergePrefs(prefRow);
  const rawInitial = { ...merged } as Record<string, unknown>;
  delete rawInitial.user_id;
  const initialPrefs = rawInitial as Omit<NotificationPreferencesRow, 'user_id'>;

  const preferred_locale: 'fr' | 'es' = profile?.preferred_locale === 'es' ? 'es' : 'fr';
  const customerId = profile?.stripe_customer_id?.trim() ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-5 pb-16 pt-2 md:px-8">
      <CompteDashboardBackLink label={t.dashboard} className="mb-2" />
      <div>
        <h1 className="hero-signature-title text-3xl md:text-4xl">{t.title}</h1>
      </div>

      <ProfileMonProfilCard
        avatarUrl={profile?.avatar_url}
        birthDate={profile?.birth_date ?? null}
        email={user.email}
        title={t.profileSection}
        birthLabel={t.birthLabel}
        emailLabel={t.emailLabel}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProfileLanguageTimezoneCard
          initialLocale={preferred_locale}
          initialTimezone={profile?.display_timezone ?? 'Europe/Paris'}
          timezoneManualLocked={profile?.display_timezone_manual_locked ?? false}
          lang={prefLang}
        />
        <ProfileBillingCard
          customerId={customerId}
          title={t.billingSection}
          openStripeSub={t.openStripeSub}
          openStripeInvoices={t.openStripeInvoices}
          openShopArea={t.openShopArea}
        />
      </div>

      <PreferencesClient
        embedded
        userId={user.id}
        initialPrefs={initialPrefs}
        initialProfile={{
          preferred_locale,
          display_timezone: profile?.display_timezone ?? 'Europe/Paris',
          display_timezone_manual_locked: profile?.display_timezone_manual_locked ?? false,
          marketing_email_opt_in: profile?.marketing_email_opt_in ?? true,
          marketing_email_opt_in_at: profile?.marketing_email_opt_in_at ?? null,
        }}
        lang={prefLang}
      />
    </div>
  );
}
