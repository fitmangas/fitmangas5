import { redirect } from 'next/navigation';

import { NotificationsInbox } from '@/components/Compte/NotificationsInbox';
import type { NotificationRow } from '@/components/Compte/NotificationBell';
import { NotificationsCenterV2 } from '@/components/Notifications/v2/NotificationsCenterV2';
import type { NotifV2Item } from '@/components/Notifications/v2/demo-data';
import { getClientLang, localeFromClientLang } from '@/lib/compte/i18n';
import { clientHiddenNotificationKindsFilter } from '@/lib/notifications/client-notification-filter';
import { markAllUnreadNotificationsAsRead } from '@/lib/notifications/mark-all-read';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { createClient } from '@/lib/supabase/server';

function categoryFromKind(kind: string): NotifV2Item['category'] {
  if (kind.includes('cancelled') || kind.includes('schedule_changed')) return 'cancel';
  if (kind.startsWith('course.') || kind.startsWith('live.')) return 'live';
  if (kind.startsWith('blog.')) return 'blog';
  if (kind.startsWith('replay.') || kind.startsWith('content.') || kind.startsWith('standalone.')) return 'content';
  if (kind.startsWith('boutique.') || kind.startsWith('subscription.')) return 'account';
  if (kind.startsWith('community.') || kind.startsWith('referral.')) return 'community';
  if (kind.startsWith('program')) return 'programme';
  return 'live';
}

export default async function CompteNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const lang = await getClientLang(supabase, user.id);

  if (!isNotifV2Enabled()) {
    try {
      await markAllUnreadNotificationsAsRead(supabase, user.id);
    } catch (markErr) {
      console.error('[compte/notifications] échec marquage lu au chargement', markErr);
    }
  }

  const { data: notifications, error: listError } = await supabase
    .from('user_notifications')
    .select('id, kind, title, body, read_at, created_at')
    .eq('user_id', user.id)
    .not('kind', 'in', clientHiddenNotificationKindsFilter())
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

  if (isNotifV2Enabled()) {
    const v2Items: NotifV2Item[] = ((notifications ?? []) as NotificationRow[]).map((n) => ({
      id: n.id,
      category: categoryFromKind(n.kind),
      title: n.title,
      body: n.body ?? '',
      created_at: n.created_at,
      read_at: n.read_at,
    }));
    return (
      <NotificationsCenterV2
        items={v2Items}
        unreadCount={v2Items.filter((i) => !i.read_at).length}
      />
    );
  }

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
