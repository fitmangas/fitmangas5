import { notFound } from 'next/navigation';

import { ProgramDiscovery, ProgramFinished, ProgramInProgress } from '@/components/Programmes/ProgramDetailViews';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { CATALOG_PROGRAMS } from '@/lib/programmes/catalogue';
import { computeProgramState, dayKeyInTimeZone } from '@/lib/programmes/engine';
import { findWeeklyLive, loadEnrollment, loadOtherActive, loadProgramDefinition } from '@/lib/programmes/load';
import { buildDiscoveryProps, buildInProgressProps, softerProgramFor } from '@/lib/programmes/view-models';
import { loadPlanningContext } from '@/lib/compte/planning-context';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';
import { checkIsAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ decaler?: string; tests?: string; demarrer?: string }>;
}) {
  if (!isProgrammesEnabled()) notFound();
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasVisioClientAccess(user.id))) notFound();

  const def = await loadProgramDefinition(slug, { includeDrafts: true });
  if (!def) notFound();
  const data = await loadEnrollment(user.id, def.programId);
  // Programme non publié : visible par un admin (« Voir comme une cliente ») et par les clientes déjà inscrites.
  if (def.programId && def.program.status !== 'published' && !data && !(await checkIsAdmin(supabase, user)).isAdmin) notFound();
  const q = await searchParams;
  const lang = (await getClientLang(supabase, user.id)) === 'es' ? 'es' : 'fr';
  const { timeZone } = await loadPlanningContext(supabase, user.id);
  const todayKey = dayKeyInTimeZone(new Date(), timeZone);

  if (data && data.enrollment.status === 'completed') {
    return (
      <ProgramFinished
        lang={lang}
        slug={def.program.slug}
        title={def.program.title[lang] || def.program.title.fr}
        coverUrl={def.coverUrl}
        level={def.program.level}
        certificateNumber={data.certificateNumber}
        enrollmentId={data.enrollment.id}
      />
    );
  }

  if (data && (data.enrollment.status === 'active' || data.enrollment.status === 'paused')) {
    const state = computeProgramState({ steps: def.steps, progress: data.progress, enrollment: data.enrollment, todayKey, timeZone });
    const live = state.liveStepForWeek
      ? await findWeeklyLive(state.liveStepForWeek.liveStyle ?? def.program.live_style ?? null, lang)
      : null;
    const props = buildInProgressProps({
      def,
      data,
      state,
      live,
      lang,
      todayKey,
      timeZone,
      postponePrompt: q.decaler === '1',
      softerProgram: state.suggestSofter ? softerProgramFor(def.program, CATALOG_PROGRAMS, lang) : null,
    });
    return <ProgramInProgress {...props} openTests={q.tests === 'depart' && !data.testPhases.includes('start')} />;
  }

  const otherActive = await loadOtherActive(user.id, def.programId, lang);
  return <ProgramDiscovery {...buildDiscoveryProps({ def, lang, otherActive, todayKey })} startOpen={q.demarrer === '1' && Boolean(def.programId)} />;
}
