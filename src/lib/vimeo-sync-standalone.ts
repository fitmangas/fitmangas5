import { isJibriRecordingFileNameOrTitle } from '@/lib/jibri-recording-filename';
import { shouldSkipStandaloneImport } from '@/lib/vimeo-standalone-guard';
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
  skippedJibriReplays: number;
  skippedCourseRecordings: number;
  prunedFromDb: number;
  errors: string[];
  folderColumnSkipped: boolean;
  mode: 'all' | 'new';
  since: string | null;
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
      published_via: 'vimeo-sync',
    };
  }
  return { source: 'vimeo-sync', synced_at: nowIso };
}

type ExistingStandaloneRow = {
  validation_status?: string;
  webhook_payload?: unknown;
  published_at?: string | null;
};

/** Payload upsert : uniquement des clés présentes dans le schéma SQL (010 + 011 + coach_id). */
function buildUpsertRow(
  meta: VimeoVideoMetadata,
  displayFolder: string,
  nowIso: string,
  webhookPayload: Record<string, unknown>,
  coachId: string,
  existing: ExistingStandaloneRow | null,
): Record<string, unknown> {
  const existingStatus = existing?.validation_status;
  const validation_status =
    existingStatus === 'published' ||
    existingStatus === 'rejected' ||
    existingStatus === 'scheduled' ||
    existingStatus === 'pending'
      ? existingStatus
      : 'pending';

  const published_at =
    validation_status === 'published' ? (existing?.published_at ?? nowIso) : existing?.published_at ?? null;

  return {
    vimeo_video_id: String(meta.vimeoId),
    vimeo_uri: meta.vimeoUri ?? null,
    title: meta.title ?? `Vidéo ${meta.vimeoId}`,
    description: meta.description ?? null,
    thumbnail_url: meta.thumbnailUrl ?? null,
    duration_seconds: clampDurationSeconds(meta.durationSeconds),
    embed_url: meta.embedUrl ?? meta.link ?? null,
    validation_status,
    published_at,
    webhook_payload: webhookPayload,
    vimeo_folder_name: displayFolder,
    coach_id: coachId,
  };
}

async function readLastSyncAt(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data } = await admin.from('app_sync_state').select('last_success_at').eq('key', 'vimeo_standalone').maybeSingle();
  return typeof data?.last_success_at === 'string' ? data.last_success_at : null;
}

async function writeLastSyncAt(admin: ReturnType<typeof createAdminClient>, syncedAt: string): Promise<void> {
  await admin.from('app_sync_state').upsert(
    {
      key: 'vimeo_standalone',
      last_success_at: syncedAt,
      updated_at: syncedAt,
    },
    { onConflict: 'key' },
  );
}

function omitFolderName(row: Record<string, unknown>): Record<string, unknown> {
  const { vimeo_folder_name: _, ...rest } = row;
  return rest;
}

/** Supprime les entrées standalone créées par erreur (replays Jibri / cours). */
async function pruneErroneousStandaloneRows(
  admin: ReturnType<typeof createAdminClient>,
  vimeoIdsOnAccount: Set<string>,
): Promise<number> {
  const { data: rows, error } = await admin
    .from('standalone_vimeo_videos')
    .select('id, vimeo_video_id, title, validation_status, webhook_payload');
  if (error) throw new Error(`Lecture standalone pour purge: ${error.message}`);

  const toDelete: string[] = [];
  for (const row of rows ?? []) {
    const id = String(row.id);
    const vimeoId = String(row.vimeo_video_id ?? '');
    const title = typeof row.title === 'string' ? row.title : null;
    const payload = row.webhook_payload;
    const syncedViaAdmin =
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      (payload as Record<string, unknown>).published_via === 'vimeo-sync';

    if (isJibriRecordingFileNameOrTitle(title)) {
      toDelete.push(id);
      continue;
    }
    if (syncedViaAdmin && vimeoId && !vimeoIdsOnAccount.has(vimeoId)) {
      toDelete.push(id);
    }
  }

  if (toDelete.length === 0) return 0;

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const { error: delErr, count } = await admin.from('standalone_vimeo_videos').delete({ count: 'exact' }).in('id', chunk);
    if (delErr) throw new Error(`Purge standalone: ${delErr.message}`);
    deleted += count ?? chunk.length;
  }
  return deleted;
}

/**
 * Importe / met à jour les vidéos du compte Vimeo dans `standalone_vimeo_videos`.
 * Les replays Jibri (noms fitmangas-…mp4) et les IDs déjà dans video_recordings sont ignorés.
 * Les nouvelles entrées arrivent en **pending** (validation admin) — jamais publiées automatiquement.
 */
export async function syncAllStandaloneVimeoFromAccount(
  coachId: string,
  options: { onlyNew?: boolean; prune?: boolean } = {},
): Promise<VimeoSyncAllResult> {
  const admin = createAdminClient();
  const since = options.onlyNew ? await readLastSyncAt(admin) : null;

  const { data: recs } = await admin.from('video_recordings').select('vimeo_video_id');
  const jitsiIds = new Set(
    (recs ?? [])
      .map((r) => r.vimeo_video_id as string | null)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );

  const allVideos = await listAllMeVideos();
  const vimeoIdsOnAccount = new Set(allVideos.map((v) => String(v.vimeoId)));
  const videos =
    options.onlyNew && since
      ? allVideos.filter((video) => {
          if (!video.createdTime) return false;
          return new Date(video.createdTime).getTime() > new Date(since).getTime();
        })
      : allVideos;
  let written = 0;
  let skippedRejected = 0;
  let skippedJibriReplays = 0;
  let skippedCourseRecordings = 0;
  const errors: string[] = [];
  let folderColumnSkipped = false;

  for (const meta of videos) {
    const skipReason = shouldSkipStandaloneImport(meta, jitsiIds);
    if (skipReason === 'jibri') {
      skippedJibriReplays += 1;
      continue;
    }
    if (skipReason === 'course_recording') {
      skippedCourseRecordings += 1;
      continue;
    }

    try {
      const displayFolder = resolveVimeoFolderDisplayName(meta.folderName, meta.vimeoId, jitsiIds);
      const nowIso = new Date().toISOString();

      const { data: existing } = await admin
        .from('standalone_vimeo_videos')
        .select('validation_status, webhook_payload, published_at')
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
      const row = buildUpsertRow(meta, displayFolder, nowIso, webhookPayload, coachId, existing);

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

  let prunedFromDb = 0;
  if (options.prune !== false && !options.onlyNew) {
    try {
      prunedFromDb = await pruneErroneousStandaloneRows(admin, vimeoIdsOnAccount);
    } catch (e) {
      errors.push(`purge: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const mode: VimeoSyncAllResult['mode'] = options.onlyNew ? 'new' : 'all';
  const result: VimeoSyncAllResult = {
    scanned: videos.length,
    written,
    skippedRejected,
    skippedJibriReplays,
    skippedCourseRecordings,
    prunedFromDb,
    errors,
    folderColumnSkipped,
    mode,
    since,
  };
  if (errors.length === 0) {
    await writeLastSyncAt(admin, new Date().toISOString());
  }
  return result;
}

export async function syncNewStandaloneVimeoFromAccount(coachId: string): Promise<VimeoSyncAllResult> {
  return syncAllStandaloneVimeoFromAccount(coachId, { onlyNew: true, prune: false });
}
