import { canBypassClientRestrictionsForAdmin } from '@/lib/access-control';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cleanVimeoDisplayTitle } from '@/lib/vimeo-display-title';
import { persistStandaloneDurations, probeVimeoPlaybackMany } from '@/lib/vimeo-playback';

export type StandaloneVimeoLibraryItem = {
  id: string;
  title: string | null;
  displayTitle: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  embedUrl: string | null;
  vimeoVideoId: string;
  folderName: string | null;
  publishedAt: string | null;
  isPlayable: boolean;
  isFavorite?: boolean;
};

export async function getStandaloneVimeoLibraryForUser(): Promise<StandaloneVimeoLibraryItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let data: Record<string, unknown>[] | null = null;
  let error: { message: string } | null = null;

  if (user) {
    if (await canBypassClientRestrictionsForAdmin(user.id)) {
      const admin = createAdminClient();
      const res = await admin
        .from('standalone_vimeo_videos')
        .select('*')
        .eq('validation_status', 'published')
        .eq('is_hidden', false)
        .order('published_at', { ascending: false });
      data = res.data as unknown as Record<string, unknown>[] | null;
      error = res.error ? { message: res.error.message } : null;
    }
  }

  if (!data) {
    const res = await supabase
      .from('standalone_vimeo_videos')
      .select('*')
      .eq('validation_status', 'published')
      .eq('is_hidden', false)
      .order('published_at', { ascending: false });
    data = res.data as unknown as Record<string, unknown>[] | null;
    error = res.error ? { message: res.error.message } : null;
  }

  if (error || !data?.length) return [];

  const mapped: StandaloneVimeoLibraryItem[] = data.map((row) => {
    const r = row as Record<string, unknown>;
    const folderName = typeof r.vimeo_folder_name === 'string' ? r.vimeo_folder_name : null;
    const title = (r.title as string | null) ?? null;
    const vimeoVideoId = String(r.vimeo_video_id);
    return {
      id: String(r.id),
      title,
      displayTitle: cleanVimeoDisplayTitle(title, { folderName }),
      description: (r.description as string | null) ?? null,
      thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
      durationSeconds: (r.duration_seconds as number | null) ?? null,
      embedUrl: (r.embed_url as string | null) ?? null,
      vimeoVideoId,
      folderName,
      publishedAt: typeof r.published_at === 'string' ? r.published_at : null,
      isPlayable: true,
    };
  });

  const probes = await probeVimeoPlaybackMany(mapped.map((m) => m.vimeoVideoId));
  const durationUpdates: Array<{ videoId: string; durationSeconds: number }> = [];
  const playable: StandaloneVimeoLibraryItem[] = [];

  for (const item of mapped) {
    const probe = probes.get(item.vimeoVideoId);
    if (probe && !probe.isPlayable) continue;
    let durationSeconds = item.durationSeconds;
    if (probe?.durationSeconds && probe.durationSeconds > 0) {
      if (!durationSeconds || durationSeconds <= 0) {
        durationUpdates.push({ videoId: item.id, durationSeconds: probe.durationSeconds });
      }
      durationSeconds = probe.durationSeconds;
    }
    playable.push({
      ...item,
      durationSeconds,
      isPlayable: true,
      displayTitle: cleanVimeoDisplayTitle(probe?.title ?? item.title, { folderName: item.folderName }),
    });
  }

  void persistStandaloneDurations(durationUpdates);

  if (!user) return playable;

  const ids = playable.map((m) => m.id);
  const { data: favRows, error: favError } = await supabase
    .from('standalone_vimeo_favorites')
    .select('video_id')
    .eq('user_id', user.id)
    .in('video_id', ids);

  if (favError) return playable;
  const favSet = new Set((favRows ?? []).map((r) => r.video_id));
  return playable.map((v) => ({ ...v, isFavorite: favSet.has(v.id) }));
}

export function pickFeaturedStandalone(items: StandaloneVimeoLibraryItem[]): StandaloneVimeoLibraryItem | null {
  return items.find((i) => i.isPlayable) ?? null;
}
