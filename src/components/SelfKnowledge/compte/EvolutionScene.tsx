'use client';

import Image from 'next/image';
import Link from 'next/link';

import { AnimatedCounter } from '@/components/SelfKnowledge/compte/HubMotion';
import { MiniOceanRadar } from '@/components/SelfKnowledge/compte/HubMiniViz';
import { FluidEvolutionCurve, HubEmptyState } from '@/components/SelfKnowledge/compte/HubVisuals';
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

type HudMetric = {
  value: number;
  label: string;
  icon: 'heart' | 'flame' | 'foot' | 'ring';
  href: string;
  progress: number;
};

/** Icônes line-art (esprit tennis HUD). */
function HudIcon({ kind }: { kind: HudMetric['icon'] }) {
  const common = 'stroke-[#2c241e] stroke-[1.6] fill-none';
  if (kind === 'heart') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          className={common}
          d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 3.3C19 15.7 12 20 12 20z"
        />
      </svg>
    );
  }
  if (kind === 'flame') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path className={common} d="M12 21c3.5 0 6-2.4 6-5.8 0-3.2-2-5.2-3.5-6.7-.4 2.2-1.6 3.2-1.6 3.2S12 8 12 4c-3 2.5-6 5.8-6 10.2C6 18.2 8.5 21 12 21z" />
      </svg>
    );
  }
  if (kind === 'foot') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <ellipse className={common} cx="12" cy="8" rx="3.2" ry="4" />
        <path className={common} d="M8 14c0 3 1.8 6 4 6s4-3 4-6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle className={common} cx="12" cy="12" r="7" />
      <circle className={common} cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Pastille HUD : cercle crème + ligne fine + grand chiffre (layout tennis). */
function HudMetricRow({ m }: { m: HudMetric }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, m.progress)));
  return (
    <Link href={m.href} className="group flex items-center gap-3 sm:gap-4">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3e6d4] shadow-[0_4px_14px_rgba(60,40,30,0.1)] sm:h-14 sm:w-14">
        <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56" aria-hidden>
          <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(44,36,30,0.12)" strokeWidth="3" />
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke="#C45D3E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="hub-ring-draw"
          />
        </svg>
        <span className="relative">
          <HudIcon kind={m.icon} />
        </span>
      </div>
      <span className="hidden h-px w-6 bg-[#2c241e]/25 sm:block sm:w-10" aria-hidden />
      <span className="hidden h-1.5 w-1.5 rounded-full bg-[#2c241e]/45 sm:block" aria-hidden />
      <div className="min-w-0">
        <p className="font-serif text-3xl italic leading-none text-brand-ink sm:text-4xl" data-testid={`hud-metric-${m.label}`}>
          <AnimatedCounter value={m.value} />
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-ink/45">{m.label}</p>
      </div>
    </Link>
  );
}

/** Mini barres éditoriales (clusters A/B/C). */
function MiniBarCluster({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-10 items-end gap-[3px]">
        {values.map((v, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm bg-[#2c241e]/75"
            style={{ height: `${Math.max(15, (v / max) * 100)}%` }}
          />
        ))}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-ink/40">{label}</span>
    </div>
  );
}

/** Anneau segmenté % (bas droite inspiration tennis). */
function DashedRing({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const r = 28;
  const c = 2 * Math.PI * r;
  const filled = c * (clamped / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden>
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="rgba(44,36,30,0.12)"
            strokeWidth="4"
            strokeDasharray="2 3"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="#C45D3E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c - filled}`}
            className="hub-ring-draw"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-serif text-lg italic text-brand-ink">
          {clamped}%
        </span>
      </div>
      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-ink/40">{label}</span>
    </div>
  );
}

/**
 * Scène unique « Mon évolution » — composition HUD tennis (données sur une scène),
 * DA cream / terracotta. Pas de pile de cartes CRM.
 */
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
  progressHistory,
}: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const t =
    locale === 'es'
      ? {
          heroLead: 'Progresas esta semana — sigue, sin compararte con nadie.',
          sessions: 'Sesiones',
          energy: 'Energía',
          regularity: 'Regularidad',
          streak: 'Racha',
          emptyTitle: 'Tu primera victoria te espera',
          emptyLead:
            'Haz un test, sigue una clase o escribe en el diario — tu escena aparecerá aquí.',
          emptyCta: 'Empezar un test',
          deltaMonth: 'este mes',
          goalPct: 'Objetivo',
          energyPct: 'Energía',
          streakPct: 'Racha',
          lastTest: 'Test',
          openReport: 'Informe',
        }
      : {
          heroLead: 'Tu progresses cette semaine — continue, sans te comparer à personne.',
          sessions: 'Séances',
          energy: 'Énergie',
          regularity: 'Régularité',
          streak: 'Streak',
          emptyTitle: 'Ta première victoire t’attend',
          emptyLead:
            'Passe un test, suis un cours ou note une ligne dans le journal — ta scène apparaîtra ici.',
          emptyCta: 'Faire un test',
          deltaMonth: 'ce mois',
          goalPct: 'Objectif',
          energyPct: 'Énergie',
          streakPct: 'Streak',
          lastTest: 'Test',
          openReport: 'Rapport',
        };

  const ratio = goal > 0 ? Math.min(1, sessions / goal) : 0;
  const energyVal = energy ?? 0;
  const regVal = regularity ?? Math.round(ratio * 100);
  const goalPct = Math.round(ratio * 100);
  const energyPct = Math.round(Math.min(100, energyVal));
  const streakPct = Math.round(Math.min(100, (streak / 8) * 100));

  const deltaPct = (() => {
    if (!curvePoints.length || !comparePoints?.length) return null;
    const a = curvePoints[curvePoints.length - 1] ?? 0;
    const b = comparePoints[comparePoints.length - 1] ?? curvePoints[curvePoints.length - 2] ?? 0;
    if (b <= 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  })();

  const metrics: HudMetric[] = [
    {
      value: sessions,
      label: t.sessions,
      icon: 'flame',
      href: '/compte/connaissance-de-soi/progression',
      progress: ratio || 0.25,
    },
    {
      value: regVal,
      label: t.regularity,
      icon: 'foot',
      href: '/compte/connaissance-de-soi/progression',
      progress: Math.min(1, regVal / 100) || 0.3,
    },
    {
      value: Math.round(energyVal),
      label: t.energy,
      icon: 'heart',
      href: '/compte/connaissance-de-soi/corps',
      progress: Math.min(1, energyVal / 100) || 0.35,
    },
    {
      value: streak,
      label: t.streak,
      icon: 'ring',
      href: '/compte/connaissance-de-soi/progression',
      progress: Math.min(1, streak / 8),
    },
  ];

  /* Mini barres depuis l’historique mois (clusters) */
  const barClusters = (progressHistory.length ? progressHistory : [{ sessions: 2 }, { sessions: 4 }, { sessions: 5 }, { sessions: 7 }]).slice(-4).map((p, i) => {
    const s = 'sessions' in p ? p.sessions : 3;
    return {
      label: String.fromCharCode(65 + i),
      values: [s * 0.4, s * 0.7, s * 0.55, s * 0.9, s],
    };
  });

  if (!hasAnySignal) {
    return (
      <div className="mt-6">
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

  const pts = curvePoints.length >= 2 ? curvePoints : [2, 3, 4, 5, Math.max(sessions, 3)];
  const cmp =
    comparePoints ??
    (curvePoints.length >= 2 ? curvePoints.map((_, i) => (i === 0 ? curvePoints[0]! : curvePoints[i - 1]!)) : [1, 2, 2, 3, 3]);

  return (
    <section className="mt-4 sm:mt-5" data-testid="evolution-scene">
      {/* UNE scène — fond image + overlays données (esprit tennis) */}
      <div className="hub-reveal relative overflow-hidden rounded-[28px] border border-white/60 shadow-[0_24px_60px_rgba(60,40,30,0.14)]">
        {/* Plan ambiance full-bleed */}
        <div className="absolute inset-0">
          <Image
            src="/library/pilates-mat/pilates-mat-03-4x5.webp"
            alt=""
            fill
            priority
            className="object-cover object-[center_25%] opacity-90"
            sizes="(max-width:768px) 100vw, 960px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFFAF5]/97 via-[#FFFAF5]/78 to-[#FFFAF5]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFAF5] via-transparent to-[#FFFAF5]/40" />
        </div>

        <div className="relative z-10 grid gap-6 px-4 py-6 sm:gap-0 sm:px-7 sm:py-8 lg:grid-cols-[0.95fr_1.15fr] lg:px-9 lg:py-10">
          {/* GAUCHE — pastilles verticales + message */}
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p
                className="font-serif text-[3.5rem] italic leading-none tracking-tight text-brand-ink sm:text-[4.75rem] lg:text-[5.5rem]"
                data-testid="evolution-hero-number"
              >
                <AnimatedCounter value={sessions} />
              </p>
              <p className="mt-2 max-w-xs font-serif text-base italic leading-snug text-brand-ink/80 sm:text-xl">
                {t.heroLead}
              </p>
              {microVictory ? (
                <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-brand-ink/55">
                  {microVictory}
                </p>
              ) : null}
              {deltaPct != null ? (
                <span
                  className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#2c241e]/90 px-3 py-1 text-[11px] font-bold text-[#FFFAF5]"
                  data-testid="evolution-delta"
                >
                  {deltaPct >= 0 ? '↑' : '↓'} {deltaPct >= 0 ? '+' : ''}
                  {deltaPct}% {t.deltaMonth}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 sm:gap-5" data-testid="evolution-pastilles">
              {metrics.map((m) => (
                <HudMetricRow key={m.label} m={m} />
              ))}
            </div>
          </div>

          {/* DROITE — clusters barres + anneaux + aperçu test */}
          <div className="flex flex-col justify-between gap-5 lg:pl-4">
            <div className="flex flex-wrap items-end justify-end gap-4 sm:gap-6">
              {barClusters.map((b) => (
                <MiniBarCluster key={b.label} values={b.values} label={b.label} />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
              <div className="text-right">
                <p className="font-serif text-2xl italic text-brand-ink sm:text-3xl">
                  <AnimatedCounter value={sessions} />
                  <span className="text-lg text-brand-ink/35">/{goal}</span>
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-ink/40">
                  {locale === 'es' ? 'Mes' : 'Mois'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl italic text-brand-ink sm:text-3xl">
                  <AnimatedCounter value={regVal} />
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">
                  {deltaPct != null && deltaPct >= 0 ? `▲ ${deltaPct}%` : t.regularity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl italic text-brand-ink sm:text-3xl">
                  <AnimatedCounter value={Math.round(energyVal)} />
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-ink/40">{t.energy}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-end gap-3 sm:gap-5">
              <DashedRing pct={goalPct} label={t.goalPct} />
              <DashedRing pct={energyPct} label={t.energyPct} />
              <DashedRing pct={streakPct} label={t.streakPct} />
              {latestTest?.test_slug === 'big-five' ? (
                <Link
                  href={`/compte/connaissance-de-soi/tests/resultat/${latestTest.id}`}
                  className="flex flex-col items-center gap-1"
                  data-testid="advance-test-preview"
                >
                  <MiniOceanRadar scores={latestTest.scores as Record<string, number>} size={64} />
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]">
                    {t.openReport} →
                  </span>
                </Link>
              ) : (
                <Link
                  href="/compte/connaissance-de-soi/tests"
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
                  data-testid="advance-test-preview"
                >
                  {latestTestLabel ?? t.lastTest} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Courbe intégrée en bas de scène */}
        <div className="relative z-10 border-t border-[#2c241e]/08 bg-[#FFFAF5]/75 px-4 pb-5 pt-3 backdrop-blur-[2px] sm:px-8">
          <FluidEvolutionCurve points={pts} comparePoints={cmp} height={110} />
          <Link
            href="/compte/connaissance-de-soi/corps"
            className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-ink/40"
            data-testid="advance-health-preview"
          >
            {locale === 'es' ? 'Bienestar' : 'Bien-être'}
            {latestHealth ? ` · ${Math.round(energyVal)}` : ''} →
          </Link>
        </div>
      </div>
    </section>
  );
}
