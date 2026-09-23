'use client';

import Image from 'next/image';
import Link from 'next/link';

import { AnimatedCounter } from '@/components/SelfKnowledge/compte/HubMotion';
import {
  HealthMiniBars,
  MiniOceanRadar,
} from '@/components/SelfKnowledge/compte/HubMiniViz';
import {
  ConsistencyChain,
  FluidEvolutionCurve,
  HubEmptyState,
  MetricPastille,
} from '@/components/SelfKnowledge/compte/HubVisuals';
import type { ClientLang } from '@/lib/compte/i18n';
import type { MemberProgressMonth } from '@/lib/self-knowledge/progress-monthly';
import type { HealthEntryRow, SelfTestResultRow } from '@/lib/self-knowledge/store';

import '@/components/SelfKnowledge/compte/hub-member.css';

type Props = {
  lang: ClientLang;
  streak: number;
  sessions: number;
  goal: number;
  energy: number | null;
  regularity: number | null;
  microVictory: string | null;
  hasAnySignal: boolean;
  curvePoints: number[];
  comparePoints?: number[];
  latestTest: SelfTestResultRow | null;
  latestTestLabel: string | null;
  latestHealth: HealthEntryRow | null;
  progressHistory: MemberProgressMonth[];
};

/** Scène « Mon évolution » remplie — esprit Nike/tennis data-viz, DA FitMangas. */
export function EvolutionScene({
  lang,
  streak,
  sessions,
  goal,
  energy,
  regularity,
  microVictory,
  hasAnySignal,
  curvePoints,
  comparePoints,
  latestTest,
  latestTestLabel,
  latestHealth,
}: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const t =
    locale === 'es'
      ? {
          monthLabel: 'Este mes',
          heroLead: 'Progresas esta semana — sigue, sin compararte con nadie.',
          streakLabel: 'Racha',
          sessions: 'Sesiones',
          energy: 'Energía',
          regularity: 'Regularidad',
          victory: 'Tu micro-victoria',
          curve: 'Tú frente a ti — evolución',
          deltaMonth: 'este mes',
          emptyTitle: 'Tu primera victoria te espera',
          emptyLead:
            'Haz un test, sigue una clase o escribe una línea en el diario — tu escena aparecerá aquí.',
          emptyCta: 'Empezar un test',
          advances: 'Últimos avances',
          lastTest: 'Último test',
          healthTrend: 'Bienestar',
          open: 'Abrir',
          weeks: 'semana(s) seguidas con práctica',
          seeReport: 'Ver informe',
        }
      : {
          monthLabel: 'Ce mois',
          heroLead: 'Tu progresses cette semaine — continue, sans te comparer à personne.',
          streakLabel: 'Streak',
          sessions: 'Séances',
          energy: 'Énergie',
          regularity: 'Régularité',
          victory: 'Ta micro-victoire',
          curve: 'Toi face à toi — évolution',
          deltaMonth: 'ce mois',
          emptyTitle: 'Ta première victoire t’attend',
          emptyLead:
            'Passe un test, suis un cours ou note une ligne dans le journal — ta scène apparaîtra ici.',
          emptyCta: 'Faire un test',
          advances: 'Dernières avancées',
          lastTest: 'Dernier test',
          healthTrend: 'Bien-être',
          open: 'Ouvrir',
          weeks: 'semaine(s) d’affilée avec pratique',
          seeReport: 'Voir le rapport',
        };

  const ratio = goal > 0 ? Math.min(1, sessions / goal) : 0;
  const energyVal = energy ?? 0;
  const regVal = regularity ?? Math.round(ratio * 100);
  const energyPct = Math.min(1, energyVal / 100);
  const regPct = Math.min(1, regVal / 100);

  const deltaPct = (() => {
    if (!curvePoints.length || !comparePoints?.length) return null;
    const a = curvePoints[curvePoints.length - 1] ?? 0;
    const b = comparePoints[comparePoints.length - 1] ?? curvePoints[curvePoints.length - 2] ?? 0;
    if (b <= 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  })();

  if (!hasAnySignal) {
    return (
      <div className="mt-6 space-y-6">
        <HubEmptyState
          title={t.emptyTitle}
          lead={t.emptyLead}
          ctaLabel={t.emptyCta}
          ctaHref="/compte/connaissance-de-soi/tests"
          testId="evolution-empty"
          preview="pastilles"
        />
      </div>
    );
  }

  const healthScores = latestHealth?.scores as
    | { regularite?: number; recuperation?: number; energie?: number }
    | undefined;

  return (
    <section className="mt-4 space-y-7 sm:mt-6 sm:space-y-9" data-testid="evolution-scene">
      {/* Hero Nike-Fuel */}
      <div className="hub-reveal relative overflow-hidden rounded-[24px] border border-white/70 bg-gradient-to-br from-[#FFFAF5] via-[#fff7f0] to-[#efe0d4] shadow-[0_22px_56px_rgba(60,40,30,0.12)] sm:rounded-[28px]">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] md:block">
          <Image
            src="/library/ambiance-studio/ambiance-studio-02-4x5.webp"
            alt=""
            fill
            className="hub-parallax-slow object-cover object-[center_20%] opacity-[0.2]"
            sizes="320px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FFFAF5]/55 to-[#FFFAF5]" />
        </div>

        <div className="relative z-10 px-4 py-7 sm:px-8 sm:py-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c45d3e]">{t.monthLabel}</p>
          <p
            className="mt-1 font-serif text-[4.25rem] italic leading-none tracking-tight text-brand-ink sm:text-[6rem] md:text-[7rem]"
            data-testid="evolution-hero-number"
          >
            <AnimatedCounter value={sessions} />
          </p>
          <p className="mt-3 max-w-lg font-serif text-lg italic leading-snug text-brand-ink/85 sm:text-2xl">
            {t.heroLead}
          </p>
          {microVictory ? (
            <p className="mt-4 max-w-md border-l-2 border-[#c45d3e]/45 pl-3 text-sm italic text-brand-ink/60">
              {microVictory}
            </p>
          ) : null}

          {/* Pastilles + lignes fines */}
          <div
            className="mt-8 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-10 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
            data-testid="evolution-pastilles"
          >
            <div className="relative flex shrink-0 items-center gap-3 sm:gap-5">
              <svg
                className="pointer-events-none absolute left-6 right-6 top-1/2 hidden h-px -translate-y-1/2 sm:block"
                aria-hidden
              >
                <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(44,36,30,0.2)" strokeWidth="1" />
              </svg>
              <MetricPastille
                value={sessions}
                label={t.sessions}
                progress={ratio || 0.25}
                icon="✦"
                href="/compte/connaissance-de-soi/progression"
              />
              <MetricPastille
                value={`${regVal}`}
                label={t.regularity}
                progress={regPct || 0.3}
                icon="◎"
                href="/compte/connaissance-de-soi/progression"
              />
              <MetricPastille
                value={Math.round(energyVal)}
                label={t.energy}
                progress={energyPct || 0.35}
                icon="♡"
                href="/compte/connaissance-de-soi/corps"
              />
              <MetricPastille
                value={streak}
                label={t.streakLabel}
                progress={Math.min(1, streak / 8)}
                icon="◆"
                href="/compte/connaissance-de-soi/progression"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Courbe + delta */}
      <div className="hub-reveal hub-reveal-delay-1 hub-elevate rounded-[24px] border border-white/70 bg-[#FFFAF5] p-4 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:rounded-[26px] sm:p-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.curve}</p>
          {deltaPct != null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                deltaPct >= 0
                  ? 'bg-[#c45d3e]/12 text-[#c45d3e]'
                  : 'bg-brand-ink/8 text-brand-ink/55'
              }`}
              data-testid="evolution-delta"
            >
              {deltaPct >= 0 ? '↑' : '↓'} {deltaPct >= 0 ? '+' : ''}
              {deltaPct}% {t.deltaMonth}
            </span>
          ) : null}
        </div>
        <FluidEvolutionCurve
          points={curvePoints.length >= 2 ? curvePoints : [2, 3, 4, 5, Math.max(sessions, 3)]}
          comparePoints={
            comparePoints ??
            (curvePoints.length >= 2
              ? curvePoints.map((v) => Math.max(0, v - 1))
              : [1, 2, 2, 3, 3])
          }
          height={140}
        />
      </div>

      {/* Dernières avancées — visuels */}
      <div data-testid="evolution-advances">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.advances}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href={
              latestTest
                ? `/compte/connaissance-de-soi/tests/resultat/${latestTest.id}`
                : '/compte/connaissance-de-soi/tests'
            }
            className="hub-elevate flex items-center gap-4 rounded-[22px] border border-white/70 bg-[#FFFAF5] p-4 shadow-[0_12px_32px_rgba(60,40,30,0.08)]"
            data-testid="advance-test-preview"
          >
            {latestTest?.test_slug === 'big-five' ? (
              <MiniOceanRadar scores={latestTest.scores as Record<string, number>} size={72} />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#e5d0c4] bg-white/80 font-serif text-2xl italic text-[#c45d3e]">
                ◈
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">{t.lastTest}</p>
              <p className="mt-1 truncate font-serif text-base italic text-brand-ink">
                {latestTestLabel ?? (locale === 'es' ? 'Sin test aún' : 'Pas encore de test')}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink/40">
                {t.seeReport} →
              </p>
            </div>
          </Link>

          <Link
            href="/compte/connaissance-de-soi/corps"
            className="hub-elevate flex items-center gap-4 rounded-[22px] border border-white/70 bg-[#FFFAF5] p-4 shadow-[0_12px_32px_rgba(60,40,30,0.08)]"
            data-testid="advance-health-preview"
          >
            {healthScores ? (
              <HealthMiniBars
                regularite={healthScores.regularite ?? 40}
                recuperation={healthScores.recuperation ?? 40}
                energie={healthScores.energie ?? 40}
              />
            ) : (
              <div className="h-14 w-12 rounded-lg bg-[#f0e8e1]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">{t.healthTrend}</p>
              <p className="mt-1 font-serif text-base italic text-brand-ink">
                {energy != null
                  ? locale === 'es'
                    ? `Energía ${Math.round(energy)}`
                    : `Énergie ${Math.round(energy)}`
                  : locale === 'es'
                    ? 'Anota tu primer sentir'
                    : 'Note ton premier ressenti'}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-ink/40">
                {t.open} →
              </p>
            </div>
          </Link>
        </div>
      </div>

      <ConsistencyChain streak={streak} label={t.streakLabel} sub={t.weeks} />
    </section>
  );
}
