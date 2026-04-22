import type { SupabaseClient } from '@supabase/supabase-js';

import { notifyStandaloneVideoPublished } from '@/lib/standalone-vimeo-notify';
import type { StandaloneVimeoRow } from '@/types/standalone-vimeo';

export async function setScheduledPublication(
  admin: SupabaseClient,
  rowId: string,
  scheduledAtIso: string | null,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: row, error: fetchErr } = await admin
    .from('standalone_vimeo_videos')
    .select('id, validation_status')
    .eq('id', rowId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? 'Vidéo introuvable.', status: 404 };
  }

  const status = row.validation_status as string;
  if (status !== 'pending' && status !== 'scheduled') {
    return { ok: false, error: 'Programmation réservée aux vidéos en attente.', status: 409 };
  }

  if (scheduledAtIso === null) {
    const { error } = await admin
      .from('standalone_vimeo_videos')
      .update({
        validation_status: 'pending',
        scheduled_publication_at: null,
      })
      .eq('id', rowId);

    if (error) return { ok: false, error: error.message, status: 500 };
    return { ok: true };
  }

  const when = new Date(scheduledAtIso);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: 'Date invalide.', status: 400 };
  }
  if (when.getTime() <= Date.now()) {
    return { ok: false, error: 'La date doit être dans le futur.', status: 400 };
  }

  const { error: updateErr } = await admin
    .from('standalone_vimeo_videos')
    .update({
      validation_status: 'scheduled',
      scheduled_publication_at: when.toISOString(),
    })
    .eq('id', rowId);

  if (updateErr) {
    return { ok: false, error: updateErr.message, status: 500 };
  }

  return { ok: true };
}

export type PublishDueResult = {
  published: number;
  errors: string[];
};

/**
 * Passe en `published` les vidéos `scheduled` dont l’heure est dépassée.
 */
export async function publishDueScheduledVideos(admin: SupabaseClient): Promise<PublishDueResult> {
  const nowIso = new Date().toISOString();
  const errors: string[] = [];

  const { data: due, error: qErr } = await admin
    .from('standalone_vimeo_videos')
    .select('*')
    .eq('validation_status', 'scheduled')
    .lte('scheduled_publication_at', nowIso);

  if (qErr) {
    return { published: 0, errors: [qErr.message] };
  }

  let published = 0;
  const rows = (due ?? []) as StandaloneVimeoRow[];

  for (const row of rows) {
    const published_at = new Date().toISOString();
    const { error: uErr } = await admin
      .from('standalone_vimeo_videos')
      .update({
        validation_status: 'published',
        published_at,
        scheduled_publication_at: null,
      })
      .eq('id', row.id);

    if (uErr) {
      errors.push(`${row.id}: ${uErr.message}`);
      continue;
    }

    published += 1;
    await notifyStandaloneVideoPublished({
      ...row,
      validation_status: 'published',
      published_at,
      scheduled_publication_at: null,
    });
    console.info(
      '[vimeo cron] publié',
      row.title ?? row.vimeo_video_id,
      'à',
      published_at,
    );
  }

  return { published, errors };
}
