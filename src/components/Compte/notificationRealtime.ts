import type { SupabaseClient } from '@supabase/supabase-js';

import type { NotificationRow } from './NotificationBell';

export const USER_NOTIFICATIONS_REALTIME_CHANNEL = 'user-notifications';

export function userNotificationsRealtimeFilter(userId: string) {
  return `user_id=eq.${userId}`;
}

function isNotificationRow(value: unknown): value is NotificationRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Partial<NotificationRow>;
  return (
    typeof row.id === 'string' &&
    typeof row.kind === 'string' &&
    typeof row.title === 'string' &&
    typeof row.created_at === 'string'
  );
}

export function subscribeToUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  onInsert: (row: NotificationRow) => void,
) {
  const channel = supabase
    .channel(USER_NOTIFICATIONS_REALTIME_CHANNEL)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: userNotificationsRealtimeFilter(userId),
      },
      (payload) => {
        if (isNotificationRow(payload.new)) {
          onInsert(payload.new);
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
