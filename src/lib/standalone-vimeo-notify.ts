import type { StandaloneVimeoRow } from '@/types/standalone-vimeo';
import { createAdminClient } from '@/lib/supabase/admin';

/** Notifie tous les membres quand une vidéo standalone est publiée. */
export async function notifyStandaloneVideoPublished(row: StandaloneVimeoRow): Promise<void> {
  const admin = createAdminClient();
  const pageSize = 500;
  let from = 0;

  for (;;) {
    const { data: members, error } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'member')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[standalone notify] fetch members', error.message);
      return;
    }

    const list = members ?? [];
    if (list.length === 0) break;

    const insertRows = list.map((m) => ({
      user_id: m.id,
      kind: 'replay_video',
      title: 'Nouveau replay disponible',
      body: row.title?.trim() ? `Replay: ${row.title}` : 'Un nouveau replay est disponible.',
    }));

    const { error: insertError } = await admin.from('user_notifications').insert(insertRows);
    if (insertError) {
      console.error('[standalone notify] insert', insertError.message);
    }

    if (list.length < pageSize) break;
    from += pageSize;
  }
}
