'use client';

import { CorpsSanteView } from '@/components/SelfKnowledge/compte/CorpsSanteView';
import { DeveloppementPersoView } from '@/components/SelfKnowledge/compte/DeveloppementPersoView';
import { EvolutionScene } from '@/components/SelfKnowledge/compte/EvolutionScene';
import { ProgressionMemberView } from '@/components/SelfKnowledge/compte/ProgressionMemberView';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { SelfKnowledgeTestsPanel } from '@/components/SelfKnowledge/compte/SelfKnowledgeTestsPanel';
import {
  HUB_DEMO_CHALLENGES,
  HUB_DEMO_FOLLOWED,
  HUB_DEMO_GOAL,
  HUB_DEMO_HEALTH,
  HUB_DEMO_JOURNAL,
  HUB_DEMO_PROGRESS,
  HUB_DEMO_PROMPTS,
  HUB_DEMO_RESOURCES,
  HUB_DEMO_STREAK,
  HUB_DEMO_TESTS,
} from '@/lib/self-knowledge/hub-demo-data';

type Section = 'evolution' | 'progression' | 'tests' | 'corps' | 'developpement';

type Props = {
  section: string;
  filled: boolean;
};

function EvolutionCapture({ filled }: { filled: boolean }) {
  const latest = HUB_DEMO_TESTS[0]!;
  const latestHealth = HUB_DEMO_HEALTH[HUB_DEMO_HEALTH.length - 1]!;
  const current = HUB_DEMO_PROGRESS[HUB_DEMO_PROGRESS.length - 1]!;
  const curve = HUB_DEMO_PROGRESS.map((p) => p.sessions);
  const compare = curve.map((_, i) => (i === 0 ? curve[0]! : curve[i - 1]!));

  return (
    <div data-testid="hub-capture-evolution">
      <EvolutionScene
        lang="fr"
        streak={filled ? HUB_DEMO_STREAK : 0}
        sessions={filled ? current.sessions : 0}
        goal={HUB_DEMO_GOAL}
        energy={filled ? (latestHealth.scores as { energie: number }).energie : null}
        regularity={
          filled ? (latestHealth.scores as { regularite: number }).regularite : null
        }
        microVictory={filled ? HUB_DEMO_JOURNAL[0]!.victory : null}
        hasAnySignal={filled}
        curvePoints={filled ? curve : [0, 0, 0]}
        comparePoints={filled ? compare : undefined}
        latestTest={filled ? latest : null}
        latestTestLabel={filled ? 'Big Five' : null}
        latestHealth={filled ? latestHealth : null}
        progressHistory={filled ? HUB_DEMO_PROGRESS : []}
      />
    </div>
  );
}

export function HubCaptureClient({ section, filled }: Props) {
  const active = (['evolution', 'progression', 'tests', 'corps', 'developpement'].includes(section)
    ? section
    : 'evolution') as Section;

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl bg-[#FFFAF5] px-4 pb-16 pt-6 sm:px-5 md:px-8"
      data-testid="hub-ux-capture"
      data-section={active}
      data-filled={filled ? '1' : '0'}
    >
      <SelfKnowledgeHubNav lang="fr" active={active} />
      {active === 'evolution' ? <EvolutionCapture filled={filled} /> : null}
      {active === 'progression' ? (
        <ProgressionMemberView
          lang="fr"
          history={filled ? HUB_DEMO_PROGRESS : []}
          streak={filled ? HUB_DEMO_STREAK : 0}
          followedCount={filled ? HUB_DEMO_FOLLOWED : 0}
          goal={HUB_DEMO_GOAL}
        />
      ) : null}
      {active === 'tests' ? (
        <SelfKnowledgeTestsPanel lang="fr" history={filled ? HUB_DEMO_TESTS : []} />
      ) : null}
      {active === 'corps' ? (
        <CorpsSanteView
          lang="fr"
          initialConsentId={filled ? 'consent-demo' : null}
          entries={filled ? HUB_DEMO_HEALTH : []}
          stravaConnected={false}
          fitbitConnected={false}
        />
      ) : null}
      {active === 'developpement' ? (
        <DeveloppementPersoView
          lang="fr"
          journal={filled ? HUB_DEMO_JOURNAL : []}
          prompts={HUB_DEMO_PROMPTS}
          challenges={filled ? HUB_DEMO_CHALLENGES : []}
          resources={filled ? HUB_DEMO_RESOURCES : []}
        />
      ) : null}
    </main>
  );
}
