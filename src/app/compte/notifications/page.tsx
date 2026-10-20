import { redirect } from 'next/navigation';

import { NotificationsInbox } from '@/components/Compte/NotificationsInbox';
import type { NotificationRow } from '@/components/Compte/NotificationBell';
import { NotificationsCenterV2 } from '@/components/Notifications/v2/NotificationsCenterV2';
import { getNextAppointment } from '@/lib/compte/dashboard';
import { getClientLang, localeFromClientLang } from '@/lib/compte/i18n';
import { clientHiddenNotificationKindsFilter } from '@/lib/notifications/client-notification-filter';
import { markAllUnreadNotificationsAsRead } from '@/lib/notifications/mark-all-read';
import { nextLiveSummary, receiveLines, toCenterItem, type NotificationRowV2 } from '@/lib/notifications/v2/center-data';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { createClient } from '@/lib/supabase/server';

import { markAllNotificationsReadAction } from './actions';

const DAY_SHORT: Record<'fr' | 'es' | 'en', string[]> = {
  fr: ['', 'L', 'M', 'M', 'J', 'V', 'S', 'D'],
  es: ['', 'L', 'M', 'X', 'J', 'V', 'S', 'D'],
  en: ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

export default async function CompteNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const lang = await getClientLang(supabase, user.id);
  const v2 = isNotifV2Enabled();
  const params = (await searchParams) ?? {};
  const showAll = params.tout === '1';

  if (!v2) {
    try {
      await markAllUnreadNotificationsAsRead(supabase, user.id);
    } catch (markErr) {
      console.error('[compte/notifications] échec marquage lu au chargement', markErr);
    }
  }

  const limit = v2 && showAll ? 200 : 50;
  const baseColumns = 'id, kind, title, body, read_at, created_at';
  const query = (columns: string) =>
    supabase
      .from('user_notifications')
      .select(columns)
      .eq('user_id', user.id)
      .not('kind', 'in', clientHiddenNotificationKindsFilter())
      .order('created_at', { ascending: false })
      .limit(limit);

  // Colonnes du centre v2 (category, action_url, action_label, meta) : présentes seulement après la migration du lot 2.
  let { data: notifications, error: listError } = v2
    ? await query(`${baseColumns}, category, action_url, action_label, meta`)
    : await query(baseColumns);
  if (v2 && listError && (listError.code === '42703' || /column/i.test(listError.message))) {
    ({ data: notifications, error: listError } = await query(baseColumns));
  }

  if (listError) {
    console.error('[compte/notifications] chargement liste', {
      code: listError.code,
      message: listError.message,
      details: listError.details,
      hint: listError.hint,
    });
  }

  const labels =
    lang === 'es'
      ? {
          title: 'Notificaciones',
          empty: 'No hay notificaciones.',
          markAll: 'Marcar todo como leído',
          prefs: 'Preferencias',
        }
      : lang === 'en'
        ? {
            title: 'Notifications',
            empty: 'No notifications.',
            markAll: 'Mark all as read',
            prefs: 'Preferences',
          }
        : {
            title: 'Notifications',
            empty: 'Aucune notification.',
            markAll: 'Tout marquer comme lu',
            prefs: 'Préférences',
          };

  if (v2) {
    const [{ data: profile }, { data: prefs }, nextAppointment] = await Promise.all([
      supabase.from('profiles').select('display_timezone').eq('id', user.id).maybeSingle(),
      supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      getNextAppointment(user.id).catch(() => null),
    ]);
    const timeZone = (profile as { display_timezone?: string | null } | null)?.display_timezone?.trim() || (lang === 'es' ? 'America/Mexico_City' : 'Europe/Paris');
    const now = new Date();
    const items = ((notifications ?? []) as unknown as NotificationRowV2[]).map((row) => toCenterItem(row, timeZone, lang, now));

    let programme: { days: string; time: string } | null = null;
    if (isProgrammesEnabled()) {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('program_enrollments')
        .select('chosen_days, reminder_time')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (!enrollmentError && enrollment) {
        const days = ((enrollment as { chosen_days?: number[] | null }).chosen_days ?? [])
          .map((d) => DAY_SHORT[lang][d] ?? '')
          .filter(Boolean)
          .join(' · ');
        const time = String((enrollment as { reminder_time?: string | null }).reminder_time ?? '18:00').slice(0, 5);
        programme = { days, time };
      }
    }

    return (
      <NotificationsCenterV2
        items={items}
        unreadCount={items.filter((i) => !i.read_at).length}
        nextLive={nextLiveSummary(nextAppointment, timeZone, lang, now)}
        receive={receiveLines(prefs as Record<string, unknown> | null, lang, programme)}
        lang={lang}
        showProgrammeFilter={isProgrammesEnabled()}
        olderHref={!showAll && items.length >= limit ? '/compte/notifications?tout=1' : null}
        markAllAction={markAllNotificationsReadAction}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <NotificationsInbox
        userId={user.id}
        items={(notifications ?? []) as unknown as NotificationRow[]}
        dateLocale={localeFromClientLang(lang)}
        labels={labels}
      />
    </div>
  );
}
