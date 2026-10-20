import { redirect } from 'next/navigation';
import { PlanningV3 } from '@/components/Compte/PlanningV3';
import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { getClientLang } from '@/lib/compte/i18n';
import { loadPlanningContext } from '@/lib/compte/planning-context';
import { loadPlanningProgramSessions } from '@/lib/programmes/planning-sessions';
import { createClient } from '@/lib/supabase/server';

export default async function ComptePlanningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');
  const lang = await getClientLang(supabase, user.id);
  const t = { dashboard: 'Dashboard' };
  const ctx = await loadPlanningContext(supabase, user.id);
  const programSessions = await loadPlanningProgramSessions(user.id, ctx.timeZone, lang);

  await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .in('kind', ['live_course', 'planning_live'])
    .is('read_at', null);

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4 md:hidden" />
      <PlanningV3
        lang={lang}
        variant="page"
        timeZone={ctx.timeZone}
        languages={ctx.languages}
        onsiteEnabled={ctx.onsiteEnabled}
        programSessions={programSessions}
      />
    </main>
  );
}
