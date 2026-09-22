import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { ProgressionMemberView } from '@/components/SelfKnowledge/compte/ProgressionMemberView';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getMonthlyProgress } from '@/lib/compte/dashboard';
import { getClientLang } from '@/lib/compte/i18n';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';
import {
  computeConsistencyStreak,
  listMemberProgressHistory,
} from '@/lib/self-knowledge/progress-monthly';
import { createClient } from '@/lib/supabase/server';

export default async function ConnaissanceProgressionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  const [lang, hasVisioAccess] = await Promise.all([
    getClientLang(supabase, user.id),
    hasVisioClientAccess(user.id),
  ]);
  const locale = lang === 'es' ? 'es' : 'fr';
  const goal = getMonthlySessionGoal();

  const [monthly, history, streak] = hasVisioAccess
    ? await Promise.all([
        getMonthlyProgress(user.id, goal),
        listMemberProgressHistory(user.id, 12),
        computeConsistencyStreak(user.id),
      ])
    : [{ followedCount: 0, goal }, [], 0];

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="La progression détaillée est réservée aux membres active ou en essai."
      featureDescription_es="El progreso detallado es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink
          label={locale === 'es' ? 'Panel' : 'Dashboard'}
          className="mb-4"
        />
        <SelfKnowledgeHubNav lang={lang} active="progression" />
        <ProgressionMemberView
          lang={lang}
          history={history}
          streak={streak}
          followedCount={monthly.followedCount}
          goal={monthly.goal}
        />
      </main>
    </VisioLock>
  );
}
