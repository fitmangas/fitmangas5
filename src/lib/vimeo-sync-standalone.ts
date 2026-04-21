import { resolveVimeoFolderDisplayName } from '@/lib/vimeo-folder';
import { listAllMeVideos } from '@/lib/vimeo';
import { createAdminClient } from '@/lib/supabase/admin';

export type VimeoSyncAllResult = {
  scanned: number;
  written: number;
  skippedRejected: number;
  errors: string[];
};

/**
 * Importe / met à jour toutes les vidéos du compte Vimeo dans `standalone_vimeo_videos`.
 * - Nouvelles vidéos : **published** + `published_at` (bibliothèque existante).
 * - Déjà **pending** (webhook) : métadonnées + dossier, statut inchangé.
 * - Déjà **published** : mise à jour.
 * - **rejected** : ignorées (pas d’écrasement).
 */
export async function syncAllStandaloneVimeoFromAccount(): Promise<VimeoSyncAllResult> {
  const admin = createAdminClient();

  const { data: recs } = await admin.from('video_recordings').select('vimeo_video_id');
  const jitsiIds = new Set(
    (recs ?? [])
      .map((r) => r.vimeo_video_id as string | null)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );

  const videos = await listAllMeVideos();
  let written = 0;
  let skippedRejected = 0;
  const errors: string[] = [];

  for (const meta of videos) {
    try {
      const displayFolder = resolveVimeoFolderDisplayName(meta.folderName, meta.vimeoId, jitsiIds);

      const { data: existing } = await admin
        .from('standalone_vimeo_videos')
        .select('id, validation_status')
        .eq('vimeo_video_id', meta.vimeoId)
        .maybeSingle();

      if (existing?.validation_status === 'rejected') {
        skippedRejected += 1;
        continue;
      }

      const baseUpdate = {
        vimeo_uri: meta.vimeoUri,
        title: meta.title ?? `Vidéo ${meta.vimeoId}`,
        description: meta.description ?? null,
        thumbnail_url: meta.thumbnailUrl ?? null,
        duration_seconds: meta.durationSeconds ?? null,
        embed_url: meta.embedUrl ?? meta.link ?? null,
        vimeo_folder_name: displayFolder,
      };

      const nowIso = new Date().toISOString();

      if (existing?.validation_status === 'pending') {
        const { error } = await admin.from('standalone_vimeo_videos').update(baseUpdate).eq('id', existing.id);
        if (error) errors.push(`${meta.vimeoId}: ${error.message}`);
        else written += 1;
        continue;
      }

      if (existing?.validation_status === 'published') {
        const { error } = await admin.from('standalone_vimeo_videos').update(baseUpdate).eq('id', existing.id);
        if (error) errors.push(`${meta.vimeoId}: ${error.message}`);
        else written += 1;
        continue;
      }

      const { error } = await admin.from('standalone_vimeo_videos').insert({
        ...baseUpdate,
        vimeo_video_id: meta.vimeoId,
        validation_status: 'published',
        published_at: nowIso,
        webhook_payload: { source: 'sync-all', synced_at: nowIso },
      });

      if (error) errors.push(`${meta.vimeoId}: ${error.message}`);
      else written += 1;
    } catch (e) {
      errors.push(`${meta.vimeoId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    scanned: videos.length,
    written,
    skippedRejected,
    errors,
  };
}
