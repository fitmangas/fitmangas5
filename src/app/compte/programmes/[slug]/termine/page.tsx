import { notFound, redirect } from 'next/navigation';

import { ProgramDone } from '@/components/Programmes/ProgramDone';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { CATALOG_PROGRAMS, type Localized } from '@/lib/programmes/catalogue';
import { loadCompletion } from '@/lib/programmes/completion';
import { loadProgramDefinition } from '@/lib/programmes/load';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasVisioClientAccess } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

const loc = (v: unknown, lang: 'fr' | 'es'): string => {
  if (v && typeof v === 'object') {
    const o = v as Partial<Localized>;
    return (lang === 'es' ? o.es || o.fr : o.fr) || '';
  }
  return typeof v === 'string' ? v : '';
};

/** B07 — bilan du dernier passage terminé de ce programme. */
export default async function ProgramDonePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isProgrammesEnabled()) notFound();
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasVisioClientAccess(user.id))) notFound();
  const def = await loadProgramDefinition(slug, { includeDrafts: true });
  if (!def?.programId) notFound();

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('program_id', def.programId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1);
  const enrollmentId = rows?.[0]?.id ? String(rows[0].id) : null;
  if (!enrollmentId) redirect(`/compte/programmes/${slug}`);
  const data = await loadCompletion(enrollmentId);
  if (!data || data.userId !== user.id) notFound();
  const lang = data.lang;

  let next: { slug: string; title: string; promise: string; level: number; coverUrl: string } | null = null;
  if (data.nextSlug) {
    const n = await loadProgramDefinition(data.nextSlug);
    if (n?.programId && n.program.status === 'published') next = { slug: n.program.slug, title: n.program.title[lang] || n.program.title.fr, promise: n.program.promise?.[lang] || n.program.promise?.fr || '', level: n.program.level, coverUrl: n.coverUrl };
  }

  // Autre piste du même niveau que la suite proposée (ex. « Ou : Barre en douceur »), parmi les programmes publiés.
  let alternative: { slug: string; title: string } | null = null;
  const { data: published } = await admin.from('programs').select('slug, title, level, track').eq('status', 'published').order('sort_order');
  const targetLevel = data.level;
  const pool = (published ?? []).map((p) => ({
    slug: String(p.slug),
    title: loc(p.title, lang) || CATALOG_PROGRAMS.find((c) => c.slug === p.slug)?.title[lang] || String(p.slug),
    level: Number(p.level),
    track: String(p.track ?? ''),
  }));
  const own = pool.find((p) => p.slug === slug);
  alternative = pool.find((p) => p.level === targetLevel && p.slug !== slug && p.slug !== next?.slug && p.track !== own?.track) ?? null;

  return (
    <ProgramDone
      data={data}
      next={next}
      alternative={alternative}
      certificateUrl={`/api/programmes/certificat/${enrollmentId}`}
      storyUrl={`/api/programmes/story/${enrollmentId}`}
    />
  );
}
