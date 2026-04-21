import { createClient } from '@/lib/supabase/server';

export type StandaloneVimeoLibraryItem = {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  embedUrl: string | null;
  vimeoVideoId: string;
  folderName: string | null;
};

/** Vidéos Vimeo « hors cours » publiées — RLS : abonnés Collectif/Individuel online uniquement. */
export async function getStandaloneVimeoLibraryForUser(): Promise<StandaloneVimeoLibraryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('standalone_vimeo_videos')
    .select('id, title, thumbnail_url, duration_seconds, embed_url, vimeo_video_id, vimeo_folder_name')
    .eq('validation_status', 'published')
    .order('published_at', { ascending: false });

  if (error || !data?.length) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    embedUrl: row.embed_url,
    vimeoVideoId: row.vimeo_video_id,
    folderName: row.vimeo_folder_name,
  }));
}
