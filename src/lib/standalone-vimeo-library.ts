import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let data: Record<string, unknown>[] | null = null;
  let error: { message: string } | null = null;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role === 'admin') {
      const admin = createAdminClient();
      const res = await admin
        .from('standalone_vimeo_videos')
        .select('*')
        .eq('validation_status', 'published')
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
      .order('published_at', { ascending: false });
    data = res.data as unknown as Record<string, unknown>[] | null;
    error = res.error ? { message: res.error.message } : null;
  }

  if (error || !data?.length) return [];

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      title: (r.title as string | null) ?? null,
      thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
      durationSeconds: (r.duration_seconds as number | null) ?? null,
      embedUrl: (r.embed_url as string | null) ?? null,
      vimeoVideoId: String(r.vimeo_video_id),
      folderName: typeof r.vimeo_folder_name === 'string' ? r.vimeo_folder_name : null,
    };
  });
}
