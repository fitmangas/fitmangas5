'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  ConsistencyChain,
  HubEmptyState,
  HubSectionHero,
} from '@/components/SelfKnowledge/compte/HubVisuals';
import { CorpsSanteView } from '@/components/SelfKnowledge/compte/CorpsSanteView';
import { DeveloppementPersoView } from '@/components/SelfKnowledge/compte/DeveloppementPersoView';
import { ProgressionMemberView } from '@/components/SelfKnowledge/compte/ProgressionMemberView';
import { SelfKnowledgeHubNav } from '@/components/SelfKnowledge/compte/SelfKnowledgeHubNav';
import { SelfKnowledgeTestsPanel } from '@/components/SelfKnowledge/compte/SelfKnowledgeTestsPanel';
import type { HealthEntryRow, JournalEntryRow, ReadingResourceRow, SelfTestResultRow } from '@/lib/self-knowledge/store';

type Section = 'evolution' | 'progression' | 'tests' | 'corps' | 'developpement';

type Props = {
  section: string;
  filled: boolean;
};

const DEMO_TEST: SelfTestResultRow = {
  id: 'demo-t1',
  test_slug: 'big-five',
  locale: 'fr',
  email: null,
  profile_id: null,
  answers: {},
  scores: {
    O: 32,
    C: 38,
    E: 28,
    A: 41,
    N: 22,
  },
  analysis_teaser: 'Tu avances avec constance — ta curiosité et ta fiabilité se renforcent.',
  analysis_full: null,
  analysis_mode: 'bank',
  consent: true,
  consent_at: '2026-09-01T10:00:00Z',
  first_name: 'Camille',
  source_attribution: null,
  test_version: 'ipip-50-v1',
  created_at: '2026-09-10T10:00:00Z',
};

const DEMO_TEST_PREV: SelfTestResultRow = {
  ...DEMO_TEST,
  id: 'demo-t0',
  scores: { O: 28, C: 34, E: 26, A: 39, N: 26 },
  created_at: '2026-07-01T10:00:00Z',
};

const DEMO_HEALTH: HealthEntryRow[] = [
  {
    id: 'h1',
    profile_id: 'demo',
    scores: { regularite: 55, recuperation: 62, energie: 48 },
    source: 'manual',
    created_at: '2026-09-01T08:00:00Z',
    sleep_hours: 7,
    resting_hr: 62,
    hrv_ms: null,
    active_minutes: 40,
    regularity_sessions: 3,
    note: null,
  },
  {
    id: 'h2',
    profile_id: 'demo',
    scores: { regularite: 68, recuperation: 70, energie: 61 },
    source: 'manual',
    created_at: '2026-09-15T08:00:00Z',
    sleep_hours: 7.5,
    resting_hr: 60,
    hrv_ms: null,
    active_minutes: 55,
    regularity_sessions: 4,
    note: null,
  },
];

const DEMO_JOURNAL: JournalEntryRow[] = [
  {
    id: 'j1',
    victory: 'J’ai tenu mon cours du mardi même fatiguée.',
    friction: 'J’ai voulu tout rattraper d’un coup.',
    next_step: 'Une séance, pas trois.',
    created_at: '2026-09-20T18:00:00Z',
  },
];

const DEMO_RESOURCES: ReadingResourceRow[] = [
  {
    id: 'r1',
    title: 'Le corps n’oublie rien',
    author: 'Bessel van der Kolk',
    theme: 'corps',
    why_text: 'Pour comprendre le lien émotions / sensations, sans jargon.',
    locale: 'fr',
    sort_order: 1,
    affiliate_url: 'https://www.amazon.fr/dp/example-affiliate',
    disclosure: true,
    resource_type: 'book',
  },
];

const DEMO_PROMPTS = [
  {
    id: 'p1',
    slug: 'souffle',
    title_fr: 'Où as-tu respiré aujourd’hui ?',
    title_es: '¿Dónde respiraste hoy?',
    body_fr: 'Une phrase suffit.',
    body_es: 'Una frase basta.',
  },
];

const DEMO_CHALLENGES = [
  {
    id: 'c1',
    slug: 'presence',
    title_fr: 'Arriver 3 minutes avant le live',
    title_es: 'Llegar 3 minutos antes del live',
    body_fr: 'Juste pour t’installer.',
    body_es: 'Solo para instalarte.',
    completed: true,
  },
  {
    id: 'c2',
    slug: 'replay',
    title_fr: 'Un replay cette semaine',
    title_es: 'Un replay esta semana',
    body_fr: 'Quand le live te manque.',
    body_es: 'Cuando te falte el live.',
    completed: false,
  },
];

function EvolutionCapture({ filled }: { filled: boolean }) {
  return (
    <div className="mt-2 space-y-6" data-testid="hub-capture-evolution">
      <HubSectionHero
        imageSrc="/library/portraits/portrait-05-4x5.webp"
        imageAlt=""
        eyebrow="Connaissance de soi"
        title="Mon évolution"
        lead="Toi face à toi-même — le chemin parcouru, sans te comparer à personne."
      />
      {!filled ? (
        <HubEmptyState
          imageSrc="/library/portraits/portrait-01-4x5.webp"
          imageAlt=""
          title="Ta première victoire t’attend"
          lead="Passe un test, suis un cours ou note une ligne dans le journal — tu apparaîtras ici."
          ctaLabel="Faire un test"
          ctaHref="/compte/connaissance-de-soi/tests"
          testId="evolution-empty"
        />
      ) : (
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#FFFAF5] shadow-[0_18px_48px_rgba(60,40,30,0.12)]">
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[180px] md:min-h-full">
              <Image
                src="/library/portraits/portrait-08-4x5.webp"
                alt=""
                fill
                className="object-cover object-[center_15%]"
                sizes="(max-width:768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFAF5] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#FFFAF5]" />
            </div>
            <div className="relative z-10 flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">Ta micro-victoire</p>
              <p className="mt-3 font-serif text-xl italic leading-snug text-brand-ink sm:text-2xl">
                J’ai tenu mon cours du mardi même fatiguée.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <ConsistencyChain
          streak={filled ? 4 : 0}
          label="Chaîne de constance"
          sub="semaine(s) d’affilée avec au moins une pratique"
        />
        <div className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">Constance récente</p>
          <p className="mt-3 font-serif text-3xl italic text-[#c45d3e]">{filled ? '5/8' : '—'}</p>
          <Link
            href="/compte/connaissance-de-soi/progression"
            className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
          >
            Ouvrir →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HubCaptureClient({ section, filled }: Props) {
  const active = (['evolution', 'progression', 'tests', 'corps', 'developpement'].includes(section)
    ? section
    : 'evolution') as Section;

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl bg-[#FFFAF5] px-5 pb-16 pt-6 md:px-8"
      data-testid="hub-ux-capture"
      data-section={active}
      data-filled={filled ? '1' : '0'}
    >
      <SelfKnowledgeHubNav lang="fr" active={active} />
      {active === 'evolution' ? <EvolutionCapture filled={filled} /> : null}
      {active === 'progression' ? (
        <ProgressionMemberView
          lang="fr"
          history={
            filled
              ? [
                  {
                    year_month: '2026-07',
                    sessions: 3,
                    lives: 2,
                    replay_hours: 1,
                    goal: 8,
                    goal_ratio: 0.375,
                    active_weeks: 2,
                  },
                  {
                    year_month: '2026-08',
                    sessions: 5,
                    lives: 3,
                    replay_hours: 2,
                    goal: 8,
                    goal_ratio: 0.625,
                    active_weeks: 3,
                  },
                  {
                    year_month: '2026-09',
                    sessions: 6,
                    lives: 4,
                    replay_hours: 2,
                    goal: 8,
                    goal_ratio: 0.75,
                    active_weeks: 4,
                  },
                ]
              : []
          }
          streak={filled ? 4 : 0}
          followedCount={filled ? 6 : 0}
          goal={8}
        />
      ) : null}
      {active === 'tests' ? (
        <SelfKnowledgeTestsPanel lang="fr" history={filled ? [DEMO_TEST, DEMO_TEST_PREV] : []} />
      ) : null}
      {active === 'corps' ? (
        <CorpsSanteView
          lang="fr"
          initialConsentId={filled ? 'consent-demo' : null}
          entries={filled ? DEMO_HEALTH : []}
          stravaConnected={false}
          fitbitConnected={false}
        />
      ) : null}
      {active === 'developpement' ? (
        <DeveloppementPersoView
          lang="fr"
          journal={filled ? DEMO_JOURNAL : []}
          prompts={DEMO_PROMPTS}
          challenges={filled ? DEMO_CHALLENGES : []}
          resources={filled ? DEMO_RESOURCES : []}
        />
      ) : null}
    </main>
  );
}
