import { notFound } from 'next/navigation';

import { SessionPlayer } from '@/components/Programmes/SessionPlayer';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { programBySlug } from '@/lib/programmes/catalogue';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';

export default async function ProgramSessionPage({ params }: { params: Promise<{ slug: string; step: string }> }) {
  if (!isProgrammesEnabled()) notFound();
  const { slug, step } = await params;
  const program = programBySlug(slug);
  if (!program) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasVisioClientAccess(user.id))) notFound();

  const [weekStr, posStr] = step.split('-');
  const week = Number(weekStr) || 1;
  const pos = Number(posStr) || 1;
  const detail = program.weeks_detail?.find((w) => w.week === week);
  const videos = (detail?.steps ?? []).filter((s) => s.kind === 'video');
  const item = videos[pos - 1];
  if (!item) notFound();
  const startS = item.segment?.start_s ?? 0;
  const endS = item.segment?.end_s ?? (item.minutes ?? 30) * 60;
  const cues = (detail?.cues ?? []).map((c) => c.fr);
  const prevHref = pos > 1 ? `/compte/programmes/${slug}/seance/${week}-${pos - 1}` : null;
  const nextHref = pos < videos.length ? `/compte/programmes/${slug}/seance/${week}-${pos + 1}` : null;
  const softerHref = program.level > 1 ? `/compte/programmes` : '/compte/programmes/souplesse-recuperation';

  return (
    <SessionPlayer
      programTitle={program.title.fr}
      slug={slug}
      sessionTitle={item.objective?.fr || item.video_title || `Séance ${pos}`}
      weekLabel={`Semaine ${week} · ${detail?.focus.fr ?? ''} · séance ${pos}`}
      objective={item.objective?.fr || ''}
      cues={cues.slice(0, 3)}
      startS={startS}
      endS={endS}
      durationS={endS}
      prevHref={prevHref}
      nextHref={nextHref}
      softerHref={softerHref}
    />
  );
}
