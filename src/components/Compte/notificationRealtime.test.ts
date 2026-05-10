import { describe, expect, it, vi } from 'vitest';

import {
  subscribeToUserNotifications,
  USER_NOTIFICATIONS_REALTIME_CHANNEL,
  userNotificationsRealtimeFilter,
} from './notificationRealtime';

describe('notification realtime helpers', () => {
  it('s’abonne au canal Realtime INSERT filtré sur user_id', () => {
    const subscribe = vi.fn(() => 'channel-ref');
    const on = vi.fn(() => ({ subscribe }));
    const channel = vi.fn(() => ({ on }));
    const removeChannel = vi.fn();
    const supabase = { channel, removeChannel };
    const onInsert = vi.fn();

    subscribeToUserNotifications(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
      'user-1',
      onInsert,
    );

    expect(channel).toHaveBeenCalledWith(USER_NOTIFICATIONS_REALTIME_CHANNEL);
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: userNotificationsRealtimeFilter('user-1'),
      },
      expect.any(Function),
    );
    expect(subscribe).toHaveBeenCalled();
  });

  it('nettoie le canal Realtime au unmount', () => {
    const channelRef = { topic: USER_NOTIFICATIONS_REALTIME_CHANNEL };
    const subscribe = vi.fn(() => channelRef);
    const on = vi.fn(() => ({ subscribe }));
    const channel = vi.fn(() => ({ on }));
    const removeChannel = vi.fn();
    const supabase = { channel, removeChannel };

    const cleanup = subscribeToUserNotifications(
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient,
      'user-1',
      vi.fn(),
    );

    cleanup();

    expect(removeChannel).toHaveBeenCalledWith(channelRef);
  });
});
