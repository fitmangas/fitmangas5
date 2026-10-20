'use server';

import { revalidatePath } from 'next/cache';

import { markAllUnreadNotificationsAsRead } from '@/lib/notifications/mark-all-read';
import { createClient } from '@/lib/supabase/server';

/** « Tout marquer comme lu » du centre de notifications (A08). */
export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifiée');
  await markAllUnreadNotificationsAsRead(supabase, user.id);
  revalidatePath('/compte/notifications');
  revalidatePath('/compte');
}
