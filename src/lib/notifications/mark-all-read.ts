import type { SupabaseClient } from '@supabase/supabase-js';

import { clientHiddenNotificationKindsFilter } from '@/lib/notifications/client-notification-filter';
import { createAdminClient } from '@/lib/supabase/admin';

function isRlsOrPermissionError(message: string, code?: string): boolean {
  if (code === '42501') return true;
  const m = message.toLowerCase();
  return (
    m.includes('row-level security') ||
    m.includes('row level security') ||
    m.includes('policy') ||
    m.includes('permission denied')
  );
}

/** Marque toutes les notifications non lues d’un utilisateur (session, repli service role si RLS). */
export async function markAllUnreadNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: now })
    .eq('user_id', userId)
    .is('read_at', null)
    .not('kind', 'in', clientHiddenNotificationKindsFilter());

  if (!error) return;

  console.error('[compte/notifications] marquage lu (session)', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  if (!isRlsOrPermissionError(error.message, error.code)) return;

  try {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from('user_notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null)
      .not('kind', 'in', clientHiddenNotificationKindsFilter());

    if (adminError) {
      console.error('[compte/notifications] marquage lu (admin fallback)', {
        code: adminError.code,
        message: adminError.message,
        details: adminError.details,
        hint: adminError.hint,
      });
    }
  } catch (adminErr) {
    console.error('[compte/notifications] admin client indisponible', adminErr);
  }
}
