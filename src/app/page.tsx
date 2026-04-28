import { LandingPage } from '@/components/LandingPage';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function HomePage() {
  let vimeoShowcase: { title: string; thumbnailUrl: string | null }[] = [];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('standalone_vimeo_videos')
      .select('title, thumbnail_url')
      .eq('validation_status', 'published')
      .not('title', 'is', null)
      .not('thumbnail_url', 'is', null)
      .not('thumbnail_url', 'ilike', '%default-live%')
      .order('published_at', { ascending: false })
      .limit(12);

    vimeoShowcase = (data ?? [])
      .map((row) => ({
        title: typeof row.title === 'string' ? row.title : '',
        thumbnailUrl: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
      }))
      .filter((item) => item.title.trim().length > 0);
  } catch {
    vimeoShowcase = [];
  }

  return <LandingPage vimeoShowcase={vimeoShowcase} />;
}
