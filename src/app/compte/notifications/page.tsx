import { redirect } from 'next/navigation';

import { NotificationsInbox } from '@/components/Compte/NotificationsInbox';
import type { NotificationRow } from '@/components/Compte/NotificationBell';
import { getClientLang, localeFromClientLang } from '@/lib/compte/i18n';
import { markAllUnreadNotificationsAsRead } from '@/lib/notifications/mark-all-read';
import { createClient } from '@/lib/supabase/server';

export default async function CompteNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const lang = await getClientLang(supabase, user.id);

  try {
    await markAllUnreadNotificationsAsRead(supabase, user.id);
  } catch (markErr) {
    console.error('[compte/notifications] échec marquage lu au chargement', markErr);
  }

  const { data: notifications, error: listError } = await supabase
    .from('user_notifications')
    .select('id, kind, title, body, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <NotificationsInbox
        userId={user.id}
        items={(notifications ?? []) as NotificationRow[]}
        dateLocale={localeFromClientLang(lang)}
        labels={labels}
      />
    </div>
  );
}
