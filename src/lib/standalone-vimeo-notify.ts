import type { StandaloneVimeoRow } from '@/types/standalone-vimeo';
import { createAdminClient } from '@/lib/supabase/admin';
import { dispatch } from '@/lib/notifications/dispatcher';

/**
 * Nouveau replay standalone → file digest (via dispatcher).
 * Respecte prefs / silence / caps ; plus d’insert direct dans user_notifications.
 */
export async function notifyStandaloneVideoPublished(row: StandaloneVimeoRow): Promise<void> {
  const admin = createAdminClient();
  const title = row.title?.trim() || 'Nouveau replay';
  const body = row.title?.trim()
    ? `Replay : ${row.title}`
    : 'Un nouveau replay est disponible dans ton espace.';
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

    for (const member of list) {
      try {
        await dispatch(admin, {
          event_type: 'replay.standalone_published',
          user_id: member.id,
          payload: {
            title: 'Nouveau replay disponible',
            body,
            kind: 'replay_video',
            video_id: row.id,
            video_title: title,
            replayUrl: '/compte/replays',
          },
          channel_hints: ['digest'],
          idempotency_key: `replay.standalone_published:${row.id}:${member.id}`,
        });
      } catch (err) {
        console.error(
          '[standalone notify] dispatch',
          member.id,
          err instanceof Error ? err.message : err,
        );
      }
    }

    if (list.length < pageSize) break;
    from += pageSize;
  }
}
