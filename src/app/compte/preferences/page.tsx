import { redirect } from 'next/navigation';

import { PreferencesClient } from '@/components/Compte/Preferences/PreferencesClient';
import type { PreferencesLang } from '@/components/Compte/Preferences/i18n';
import { getClientLang } from '@/lib/compte/i18n';
import { mergePrefs } from '@/lib/notifications/defaults';
import type { NotificationPreferencesRow } from '@/lib/notifications/types';
import { createClient } from '@/lib/supabase/server';

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const blogLang = await getClientLang(supabase, user.id);
  const lang: PreferencesLang = blogLang === 'es' ? 'es' : 'fr';

  const { data: prefRow } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const merged = mergePrefs(prefRow);
  const rawInitial = { ...merged } as Record<string, unknown>;
  delete rawInitial.user_id;
  const initialPrefs = rawInitial as Omit<NotificationPreferencesRow, 'user_id'>;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'preferred_locale, display_timezone, display_timezone_manual_locked, marketing_email_opt_in, marketing_email_opt_in_at',
    )
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/compte');
  }

  const preferred_locale: 'fr' | 'es' = profile.preferred_locale === 'es' ? 'es' : 'fr';

  return (
    <PreferencesClient
      userId={user.id}
      initialPrefs={initialPrefs}
      initialProfile={{
        preferred_locale,
        display_timezone: profile.display_timezone,
        display_timezone_manual_locked: profile.display_timezone_manual_locked,
        marketing_email_opt_in: profile.marketing_email_opt_in,
        marketing_email_opt_in_at: profile.marketing_email_opt_in_at,
      }}
      lang={lang}
    />
  );
}
