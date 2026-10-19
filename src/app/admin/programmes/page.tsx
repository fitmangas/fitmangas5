import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { AdminProgrammesManager } from '@/components/Programmes/admin/AdminProgrammesManager';
import { DEMO_ADMIN_PROGRAMS, DEMO_ADMIN_VIDEOS, type AdminProgramListItem, type AdminVideoOption } from '@/components/Programmes/admin/demo-data';

const LEVEL: Record<number, string> = { 0: 'Tous niveaux', 1: 'Débutante', 2: 'Intermédiaire', 3: 'Avancée' };

export default async function AdminProgrammesPage() {
  if (!isProgrammesEnabled()) notFound();
  await requireAdmin();
  const admin = createAdminClient();
  let programs: AdminProgramListItem[] = [];
  let videos: AdminVideoOption[] = [];
  let tablesMissing = false;

  try {
    const { data, error } = await admin.from('programs').select('id, slug, status, level, weeks, sessions_per_week, title, cover_url').order('sort_order');
    if (error) {
      tablesMissing = true;
    } else {
      programs = (data ?? []).map((p) => {
        const title = p.title as { fr?: string } | null;
        return {
          id: String(p.id),
          slug: String(p.slug),
          titleFr: title?.fr ?? String(p.slug),
          status: (p.status as AdminProgramListItem['status']) ?? 'draft',
          levelLabel: LEVEL[Number(p.level)] ?? '—',
          weeks: Number(p.weeks ?? 0),
          sessions: Number(p.sessions_per_week ?? 0) * Number(p.weeks ?? 0),
          coverUrl: (p.cover_url as string) || '/programmes/alejandra-tapis.jpg',
        };
      });
    }
    const { data: vids } = await admin
      .from('standalone_vimeo_videos')
      .select('id, title, duration_seconds, thumbnail_url, embed_url')
      .eq('validation_status', 'published');
    videos = (vids ?? []).map((v) => ({
      id: String(v.id),
      title: String(v.title ?? 'Sans titre'),
      durationLabel: formatDur(Number(v.duration_seconds ?? 0)),
      category: 'BIBLIOTHÈQUE',
      thumb: String(v.thumbnail_url || '/programmes/alejandra-tapis.jpg'),
      usedIn: 0,
      embedUrl: (v.embed_url as string | null) ?? null,
    }));
  } catch {
    tablesMissing = true;
  }

  if (!programs.length) {
    programs = DEMO_ADMIN_PROGRAMS;
    tablesMissing = true;
  }
  if (!videos.length) videos = DEMO_ADMIN_VIDEOS;

  return <AdminProgrammesManager programs={programs} videos={videos} tablesMissing={tablesMissing} />;
}

function formatDur(s: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
