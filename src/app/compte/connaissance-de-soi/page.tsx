import { redirect } from 'next/navigation';

import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import { EvolutionScene } from '@/components/SelfKnowledge/compte/EvolutionScene';
import { HubSectionHero } from '@/components/SelfKnowledge/compte/HubVisuals';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { VisioLock } from '@/components/Premium/VisioLock';
import { hasVisioClientAccess } from '@/lib/access-control';
import { getClientLang } from '@/lib/compte/i18n';
import {
  computeConsistencyStreak,
  listMemberProgressHistory,
} from '@/lib/self-knowledge/progress-monthly';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import { listHealthEntries, listJournalEntries, listResultsForProfile } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

export default async function ConnaissanceDeSoiEvolutionPage() {
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

  const [results, health, progress, streak, journal] = hasVisioAccess
    ? await Promise.all([
        listResultsForProfile(user.id),
        listHealthEntries(user.id, 12),
        listMemberProgressHistory(user.id, 6),
        computeConsistencyStreak(user.id),
        listJournalEntries(user.id, 3),
      ])
    : [[], [], [], 0, []];

  const latestTest = results[0];
  const latestHealth = health.length ? health[health.length - 1] : null;
  const currentMonth = progress.length ? progress[progress.length - 1] : null;

  const t =
    locale === 'es'
      ? {
          title: 'Mi evolución',
          eyebrow: 'Conocimiento de una misma',
          dashboard: 'Panel',
          lead: 'Datos vivos de tu camino — sin ruido, sin comparación.',
        }
      : {
          title: 'Mon évolution',
          eyebrow: 'Connaissance de soi',
          dashboard: 'Dashboard',
          lead: 'Tes données incarnées — le chemin parcouru, sans bruit ni comparaison.',
        };

  let microVictory: string | null = null;
  if (journal[0]?.victory) {
    microVictory = journal[0].victory;
  } else if (latestTest?.analysis_teaser) {
    microVictory = latestTest.analysis_teaser.slice(0, 160);
  } else if (currentMonth && currentMonth.sessions > 0) {
    microVictory =
      locale === 'es'
        ? `${currentMonth.sessions} sesión(es) este mes — sigues apareciendo.`
        : `${currentMonth.sessions} séance(s) ce mois — tu continues d’être là.`;
  }

  const sessions = currentMonth?.sessions ?? 0;
  const goal = currentMonth?.goal ?? 8;
  const energy =
    latestHealth && typeof (latestHealth.scores as { energie?: number })?.energie === 'number'
      ? (latestHealth.scores as { energie: number }).energie
      : null;

  const curvePoints = progress.map((p) => p.sessions);
  const comparePoints =
    curvePoints.length >= 2
      ? curvePoints.map((v, i) => Math.max(0, (curvePoints[i - 1] ?? v) - 1))
      : undefined;

  const hasAnySignal = Boolean(microVictory || latestTest || sessions || streak > 0);

  const latestTestLabel = latestTest
    ? (getSelfTest(latestTest.test_slug)?.title[locale] ?? latestTest.test_slug)
    : null;

  return (
    <VisioLock
      hasAccess={hasVisioAccess}
      locale={locale}
      featureDescription_fr="L’univers connaissance de soi est réservé aux membres active ou en essai."
      featureDescription_es="El universo de conocimiento de una misma es para miembros active o en prueba."
    >
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
        <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
        <SelfKnowledgeHubNav lang={lang} active="evolution" />

        <HubSectionHero
          eyebrow={t.eyebrow}
          title={t.title}
          lead={t.lead}
          ambianceSrc="/library/ambiance-studio/ambiance-studio-02-4x5.webp"
        />

        <EvolutionScene
          lang={lang}
          streak={streak}
          sessions={sessions}
          goal={goal}
          energy={energy}
          microVictory={microVictory}
          hasAnySignal={hasAnySignal}
          curvePoints={curvePoints.length ? curvePoints : [0, 0, sessions]}
          comparePoints={comparePoints}
          latestTestLabel={latestTestLabel}
          progressHistory={progress}
        />
      </main>
    </VisioLock>
  );
}
