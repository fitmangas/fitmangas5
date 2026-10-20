import { notFound } from 'next/navigation';

import { SessionPlayer } from '@/components/Programmes/SessionPlayer';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { CATALOG_PROGRAMS } from '@/lib/programmes/catalogue';
import { computeProgramState, dayKeyInTimeZone } from '@/lib/programmes/engine';
import { findWeeklyLive, loadEnrollment, loadProgramDefinition } from '@/lib/programmes/load';
import { buildSessionProps, softerProgramFor } from '@/lib/programmes/view-models';
import { loadPlanningContext } from '@/lib/compte/planning-context';
import { getClientLang } from '@/lib/compte/i18n';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';
import { checkIsAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function ProgramSessionPage({ params }: { params: Promise<{ slug: string; step: string }> }) {
  if (!isProgrammesEnabled()) notFound();
  const { slug, step: rawStep } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasVisioClientAccess(user.id))) notFound();

  const def = await loadProgramDefinition(slug, { includeDrafts: true });
  if (!def) notFound();
  const stepId = decodeURIComponent(rawStep);
  const step = def.steps.find((s) => s.id === stepId && s.kind === 'video');
  if (!step) notFound();
  const data = await loadEnrollment(user.id, def.programId);
  // Programme non publié : admin ou cliente déjà inscrite seulement.
  if (def.programId && def.program.status !== 'published' && !data && !(await checkIsAdmin(supabase, user)).isAdmin) notFound();

  const lang = (await getClientLang(supabase, user.id)) === 'es' ? 'es' : 'fr';
  const { timeZone } = await loadPlanningContext(supabase, user.id);
  const todayKey = dayKeyInTimeZone(new Date(), timeZone);
  const enrolled = data && (data.enrollment.status === 'active' || data.enrollment.status === 'paused');
  const state = enrolled ? computeProgramState({ steps: def.steps, progress: data.progress, enrollment: data.enrollment, todayKey, timeZone }) : null;
  const live = state?.liveStepForWeek && state.liveStepForWeek.week === step.week
    ? await findWeeklyLive(state.liveStepForWeek.liveStyle ?? def.program.live_style ?? null, lang)
    : null;

  const props = buildSessionProps({
    def,
    data: enrolled ? data : null,
    state,
    step,
    lang,
    todayKey,
    timeZone,
    live,
    softerProgram: state?.suggestSofter ? softerProgramFor(def.program, CATALOG_PROGRAMS, lang) : null,
  });
  return <SessionPlayer {...props} />;
}
