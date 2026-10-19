import { redirect } from 'next/navigation';

import { PreferencesNotifV2 } from '@/components/Notifications/v2/PreferencesNotifV2';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { createClient } from '@/lib/supabase/server';

/** Ancienne URL — tout est regroupé sur /compte/profil, sauf si notif v2. */
export default async function PreferencesPage() {
  if (!isNotifV2Enabled()) redirect('/compte/profil#notifications');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');
  const { data: profile } = await supabase
    .from('profiles')
    .select('marketing_email_opt_in')
    .eq('id', user.id)
    .maybeSingle();
  return (
    <PreferencesNotifV2
      userId={user.id}
      marketingOptIn={Boolean(profile?.marketing_email_opt_in)}
      otherLanguage={false}
    />
  );
}
