import { AdminVimeoLibraryClient } from '@/components/Admin/AdminVimeoLibraryClient';
import { requireAdmin } from '@/lib/auth/require-admin';
import { normalizeFolderLabelForGroup, sortFolderKeys } from '@/lib/vimeo-folder';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminVimeoVideoCard } from '@/types/vimeo';

type Row = {
  id: string;
  vimeo_video_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  validation_status: string;
  created_at: string;
  vimeo_folder_name?: string | null;
  embed_url?: string | null;
  published_at?: string | null;
  scheduled_publication_at?: string | null;
  rejection_reason?: string | null;
};

function toCard(r: Row): AdminVimeoVideoCard {
  return {
    id: r.id,
    vimeo_video_id: r.vimeo_video_id,
    title: r.title,
    description: r.description,
    thumbnail_url: r.thumbnail_url,
    duration_seconds: r.duration_seconds,
    embed_url: r.embed_url ?? null,
    validation_status: r.validation_status as AdminVimeoVideoCard['validation_status'],
    vimeo_folder_name: r.vimeo_folder_name ?? null,
    published_at: r.published_at ?? null,
    scheduled_publication_at: r.scheduled_publication_at ?? null,
    rejection_reason: r.rejection_reason ?? null,
    created_at: r.created_at,
  };
}

function groupByFolder(items: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const item of items) {
    const key = normalizeFolderLabelForGroup(item.vimeo_folder_name ?? null);
    const arr = m.get(key) ?? [];
    arr.push(item);
    m.set(key, arr);
  }
  return m;
}

export default async function AdminVimeoLibraryPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('standalone_vimeo_videos')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (rows ?? []) as Row[];
  const awaiting = list
    .filter((r) => r.validation_status === 'pending' || r.validation_status === 'scheduled')
    .map(toCard);
  const published = list.filter((r) => r.validation_status === 'published');
  const rejected = list.filter((r) => r.validation_status === 'rejected').map(toCard);

  const publishedByFolder = groupByFolder(published);
  const publishedFolderKeys = sortFolderKeys([...publishedByFolder.keys()]);

  const publishedSerialized: Record<string, AdminVimeoVideoCard[]> = {};
  for (const key of publishedFolderKeys) {
    publishedSerialized[key] = (publishedByFolder.get(key) ?? []).map(toCard);
  }

  return (
    <AdminVimeoLibraryClient
      awaiting={awaiting}
      publishedByFolder={publishedSerialized}
      publishedFolderKeys={publishedFolderKeys}
      rejected={rejected}
      fetchError={error?.message ?? null}
    />
  );
}
