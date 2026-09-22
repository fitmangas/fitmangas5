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

  const t =
    locale === 'es'
      ? {
          title: 'Mi progreso',
          dashboard: 'Panel',
          lead: 'Tu constancia en el tiempo — lives y replays, tú frente a ti misma.',
        }
      : {
          title: 'Ma progression',
          dashboard: 'Dashboard',
          lead: 'Ta constance dans le temps — lives et replays, toi face à toi-même.',
        };

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="La progression détaillée est réservée aux membres active ou en essai."
      featureDescription_es="El progreso detallado es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <header>
          <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-luxury-muted">{t.lead}</p>
        </header>
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
