import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { ProgressionMemberView } from '@/components/SelfKnowledge/compte/ProgressionMemberView';
import { getMonthlyProgress } from '@/lib/compte/dashboard';
import { getClientLang } from '@/lib/compte/i18n';
import { getMonthlySessionGoal } from '@/lib/compte/monthly-goal';
import {
  computeConsistencyStreak,
  listMemberProgressHistory,
} from '@/lib/self-knowledge/progress-monthly';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

/** Ancienne route /compte/progression — DA FitMangas, lien vers hub cerveau. */
export default async function CompteProgressionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/?compte=connexion-requise');

  const lang = await getClientLang(supabase, user.id);
  const locale = lang === 'es' ? 'es' : 'fr';
  const goal = getMonthlySessionGoal();
  const [monthly, history, streak] = await Promise.all([
    getMonthlyProgress(user.id, goal),
    listMemberProgressHistory(user.id, 12),
    computeConsistencyStreak(user.id),
  ]);

  const t =
    locale === 'es'
      ? {
          title: 'Mi progreso',
          dashboard: 'Panel',
          lead: 'Tu constancia en el tiempo.',
          hub: 'Ver en Conocimiento de una misma',
        }
      : {
          title: 'Ma progression',
          dashboard: 'Dashboard',
          lead: 'Ta constance dans le temps.',
          hub: 'Voir dans Connaissance de soi',
        };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
        <p className="mt-3 max-w-xl text-sm text-luxury-muted">{t.lead}</p>
        <Link
          href="/compte/connaissance-de-soi/progression"
          className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
        >
          {t.hub} →
        </Link>
      </header>
      <ProgressionMemberView
        lang={lang}
        history={history}
        streak={streak}
        followedCount={monthly.followedCount}
        goal={monthly.goal}
      />
    </main>
  );
}
