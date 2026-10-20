import { redirect } from 'next/navigation';

import { PreferencesNotifV2 } from '@/components/Notifications/v2/PreferencesNotifV2';
import { getClientLang } from '@/lib/compte/i18n';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { PREF_KEYS, readPref, writableMap, type PrefKey } from '@/lib/notifications/v2/preference-keys';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { createClient } from '@/lib/supabase/server';

const DAYS: Record<'fr' | 'es', string[]> = {
  fr: ['', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'],
  es: ['', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'],
};

/** Ancienne URL — tout est regroupé sur /compte/profil, sauf si notif v2 (A09). */
export default async function PreferencesPage() {
  if (!isNotifV2Enabled()) redirect('/compte/profil#notifications');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  const clientLang = await getClientLang(supabase, user.id);
  const lang: 'fr' | 'es' = clientLang === 'es' ? 'es' : 'fr';

  await supabase.rpc('ensure_notification_prefs_row', { p_user_id: user.id });
  const [{ data: prefs }, { data: profile }, { count: pushCount }] = await Promise.all([
    supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const rows = {
    prefs: (prefs as Record<string, unknown> | null) ?? null,
    profile: (profile as Record<string, unknown> | null) ?? null,
  };
  const initial = Object.fromEntries((Object.keys(PREF_KEYS) as PrefKey[]).map((k) => [k, readPref(k, rows)])) as Record<
    PrefKey,
    boolean
  >;

  let programme: { title: string; schedule: string; editHref: string } | null = null;
  if (isProgrammesEnabled()) {
    const { data: enrollment, error } = await supabase
      .from('program_enrollments')
      .select('chosen_days, reminder_time, programs(slug, title)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (!error && enrollment) {
      const e = enrollment as {
        chosen_days?: number[] | null;
        reminder_time?: string | null;
        programs?: { slug?: string; title?: Record<string, string> } | { slug?: string; title?: Record<string, string> }[] | null;
      };
      const program = Array.isArray(e.programs) ? e.programs[0] : e.programs;
      const days = (e.chosen_days ?? []).map((d) => DAYS[lang][d] ?? '').filter(Boolean).join(' · ');
      const time = String(e.reminder_time ?? '18:00').slice(0, 5);
      programme = {
        title: program?.title?.[lang] ?? program?.title?.fr ?? '',
        schedule: `${days} ${lang === 'es' ? 'a las' : 'à'} ${time}`,
        editHref: program?.slug ? `/compte/programmes/${program.slug}?reglages=1` : '/compte/programmes',
      };
    }
  }

  return (
    <PreferencesNotifV2
      userId={user.id}
      lang={lang}
      initial={initial}
      writable={writableMap(rows)}
      pushEnabled={(pushCount ?? 0) > 0}
      programme={programme}
    />
  );
}
