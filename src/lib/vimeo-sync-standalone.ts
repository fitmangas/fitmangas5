import { isMissingVimeoFolderColumnError, resolveVimeoFolderDisplayName } from '@/lib/vimeo-folder';
import { listAllMeVideos, type VimeoVideoMetadata } from '@/lib/vimeo';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Écriture `standalone_vimeo_videos` — colonnes alignées sur :
 * - supabase/migrations/010_standalone_vimeo_library.sql
 * - supabase/migrations/011_standalone_vimeo_folder.sql
 *
 * Important : la colonne de statut est **validation_status** (pending | scheduled | published | rejected),
 * pas `status`. Toute clé inconnue ou colonne absente peut faire échouer **toute** la ligne côté PostgREST.
 */

export type VimeoSyncAllResult = {
  scanned: number;
  written: number;
  skippedRejected: number;
  errors: string[];
  folderColumnSkipped: boolean;
};

function clampDurationSeconds(seconds: number | null | undefined): number | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const n = Math.round(Number(seconds));
  if (n < 0) return null;
  return n;
}

function buildWebhookPayload(
  existingPayload: unknown,
  nowIso: string,
): Record<string, unknown> {
  if (existingPayload && typeof existingPayload === 'object' && !Array.isArray(existingPayload)) {
    return {
      ...(existingPayload as Record<string, unknown>),
      synced_at: nowIso,
      published_via: 'sync-all',
    };
  }
  return { source: 'sync-all', synced_at: nowIso };
}

/** Payload upsert : uniquement des clés présentes dans le schéma SQL (010 + 011 + coach_id). */
function buildUpsertRow(
  meta: VimeoVideoMetadata,
  displayFolder: string,
  nowIso: string,
  webhookPayload: Record<string, unknown>,
  coachId: string,
): Record<string, unknown> {
  return {
    vimeo_video_id: String(meta.vimeoId),
    vimeo_uri: meta.vimeoUri ?? null,
    title: meta.title ?? `Vidéo ${meta.vimeoId}`,
    description: meta.description ?? null,
    thumbnail_url: meta.thumbnailUrl ?? null,
    duration_seconds: clampDurationSeconds(meta.durationSeconds),
    embed_url: meta.embedUrl ?? meta.link ?? null,
    validation_status: 'published',
    published_at: nowIso,
    webhook_payload: webhookPayload,
    vimeo_folder_name: displayFolder,
    coach_id: coachId,
  };
}

function omitFolderName(row: Record<string, unknown>): Record<string, unknown> {
  const { vimeo_folder_name: _, ...rest } = row;
  return rest;
}

/**
 * Importe / met à jour toutes les vidéos du compte Vimeo dans `standalone_vimeo_videos`.
 * `coachId` : identifiant profil / admin déclenchant la sync (souvent `auth.uid()` côté API).
 * Chaque passage force **published** (+ published_at) pour que la bibliothèque admin / client voient les entrées.
 * Les lignes **rejected** ne sont pas réécrites (respect du rejet admin).
 *
 * Si la migration **011** (`vimeo_folder_name`) n’est pas appliquée, un second upsert sans cette colonne est tenté.
 */
export async function syncAllStandaloneVimeoFromAccount(coachId: string): Promise<VimeoSyncAllResult> {
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
  let folderColumnSkipped = false;

  for (const meta of videos) {
    try {
      const displayFolder = resolveVimeoFolderDisplayName(meta.folderName, meta.vimeoId, jitsiIds);
      const nowIso = new Date().toISOString();

      const { data: existing } = await admin
        .from('standalone_vimeo_videos')
        .select('validation_status, webhook_payload')
        .eq('vimeo_video_id', String(meta.vimeoId))
        .maybeSingle();

      const st = existing?.validation_status as string | undefined;
      if (st === 'rejected') {
        skippedRejected += 1;
        continue;
      }
      /** Ne pas écraser une file d’attente (webhook / programmation). */
      if (st === 'pending' || st === 'scheduled') {
        continue;
      }

      const webhookPayload = buildWebhookPayload(existing?.webhook_payload, nowIso);
      const row = buildUpsertRow(meta, displayFolder, nowIso, webhookPayload, coachId);

      let { error } = await admin.from('standalone_vimeo_videos').upsert(row, {
        onConflict: 'vimeo_video_id',
      });

      if (error && isMissingVimeoFolderColumnError(error.message)) {
        folderColumnSkipped = true;
        ({ error } = await admin.from('standalone_vimeo_videos').upsert(omitFolderName(row), {
          onConflict: 'vimeo_video_id',
        }));
      }

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
    folderColumnSkipped,
  };
}
