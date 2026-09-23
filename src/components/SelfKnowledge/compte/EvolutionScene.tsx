'use client';

import Image from 'next/image';
import Link from 'next/link';

import { AnimatedCounter } from '@/components/SelfKnowledge/compte/HubMotion';
import {
  ConsistencyChain,
  FluidEvolutionCurve,
  HubEmptyState,
  MetricPastille,
} from '@/components/SelfKnowledge/compte/HubVisuals';
import type { ClientLang } from '@/lib/compte/i18n';
import type { MemberProgressMonth } from '@/lib/self-knowledge/progress-monthly';

type Props = {
  lang: ClientLang;
  streak: number;
  sessions: number;
  goal: number;
  energy: number | null;
  microVictory: string | null;
  hasAnySignal: boolean;
  /** Courbe mois courants (sessions) */
  curvePoints: number[];
  /** Mois précédent (même longueur ou plus court) */
  comparePoints?: number[];
  latestTestLabel: string | null;
  progressHistory: MemberProgressMonth[];
};

/** Scène « Mon évolution » — données incarnées, typo expressive, pastilles + courbe. */
export function EvolutionScene({
  lang,
  streak,
  sessions,
  goal,
  energy,
  microVictory,
  hasAnySignal,
  curvePoints,
  comparePoints,
  latestTestLabel,
}: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const t =
    locale === 'es'
      ? {
          heroTitle: 'Tu progresas',
          heroLead: 'Sigue — sin compararte con nadie. Solo tú frente a ti misma.',
          streakLabel: 'Constancia',
          sessions: 'Sesiones',
          energy: 'Energía',
          regularity: 'Regularidad',
          victory: 'Tu micro-victoria',
          curve: 'Tú frente a ti — evolución reciente',
          emptyTitle: 'Tu primera victoria te espera',
          emptyLead:
            'Haz un test, sigue una clase o escribe una línea en el diario — tu escena aparecerá aquí.',
          emptyCta: 'Empezar un test',
          openProgress: 'Ver mi progreso',
          openTests: 'Ver mis tests',
          openCorps: 'Ver mi cuerpo',
          weeks: 'semana(s) seguidas con al menos una práctica',
        }
      : {
          heroTitle: 'Tu progresses',
          heroLead: 'Continue — sans te comparer à personne. Juste toi face à toi-même.',
          streakLabel: 'Constance',
          sessions: 'Séances',
          energy: 'Énergie',
          regularity: 'Régularité',
          victory: 'Ta micro-victoire',
          curve: 'Toi face à toi — évolution récente',
          emptyTitle: 'Ta première victoire t’attend',
          emptyLead:
            'Passe un test, suis un cours ou note une ligne dans le journal — ta scène apparaîtra ici.',
          emptyCta: 'Faire un test',
          openProgress: 'Voir ma progression',
          openTests: 'Voir mes tests',
          openCorps: 'Voir mon corps',
          weeks: 'semaine(s) d’affilée avec au moins une pratique',
        };

  const ratio = goal > 0 ? Math.min(1, sessions / goal) : 0;
  const energyPct = energy != null ? Math.min(1, energy / 100) : 0.35;

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

  return (
    <section className="mt-6 space-y-8" data-testid="evolution-scene">
      {/* Scène hero Nike-Fuel spirit */}
      <div className="hub-reveal relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[#FFFAF5] via-[#fff7f0] to-[#efe0d4] shadow-[0_22px_56px_rgba(60,40,30,0.12)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] sm:block">
          <Image
            src="/library/portraits/portrait-08-4x5.webp"
            alt=""
            fill
            className="hub-parallax-slow object-cover object-[center_15%] opacity-[0.28]"
            sizes="380px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FFFAF5]/50 to-[#FFFAF5]" />
        </div>

        <div className="relative z-10 grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c45d3e]">{t.streakLabel}</p>
            <p className="mt-2 font-serif text-[4.5rem] italic leading-none tracking-tight text-brand-ink sm:text-[5.5rem]">
              <AnimatedCounter value={streak} />
            </p>
            <p className="mt-3 max-w-md font-serif text-xl italic leading-snug text-brand-ink/80 sm:text-2xl">
              {t.heroTitle}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-ink/55">{t.heroLead}</p>
            {microVictory ? (
              <blockquote className="mt-6 max-w-md border-l-2 border-[#c45d3e]/50 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.victory}</p>
                <p className="mt-1 font-serif text-base italic text-brand-ink/75">{microVictory}</p>
              </blockquote>
            ) : null}
          </div>

          {/* Pastilles reliées */}
          <div className="hub-reveal hub-reveal-delay-2 relative flex flex-wrap items-center justify-start gap-4 sm:justify-end lg:pb-2">
            <svg
              className="pointer-events-none absolute left-4 right-4 top-1/2 hidden h-8 -translate-y-1/2 sm:block"
              aria-hidden
            >
              <line x1="8%" y1="50%" x2="92%" y2="50%" stroke="rgba(44,36,30,0.18)" strokeWidth="1" />
            </svg>
            <MetricPastille
              value={sessions}
              label={t.sessions}
              progress={ratio || 0.2}
              icon="✦"
              href="/compte/connaissance-de-soi/progression"
            />
            <MetricPastille
              value={streak}
              label={t.regularity}
              progress={Math.min(1, streak / 8)}
              icon="◎"
              href="/compte/connaissance-de-soi/progression"
            />
            <MetricPastille
              value={energy != null ? Math.round(energy) : '—'}
              label={t.energy}
              progress={energyPct}
              icon="♡"
              href="/compte/connaissance-de-soi/corps"
            />
          </div>
        </div>
      </div>

      {/* Courbe fluide */}
      <div className="hub-reveal hub-reveal-delay-1 hub-elevate rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-7">
        {curvePoints.length >= 2 ? (
          <FluidEvolutionCurve points={curvePoints} comparePoints={comparePoints} label={t.curve} height={150} />
        ) : (
          <FluidEvolutionCurve
            points={[2, 3, 4, 5, Math.max(sessions, 3)]}
            comparePoints={[1, 2, 2, 3, 3]}
            label={t.curve}
            height={150}
          />
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-brand-ink/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-6 rounded bg-[#C45D3E]" />
            {locale === 'es' ? 'Ahora' : 'Maintenant'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-6 rounded border-t-2 border-dashed border-[#8B5E4B]/60" />
            {locale === 'es' ? 'Antes' : 'Avant'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ConsistencyChain streak={streak} label={t.streakLabel} sub={t.weeks} />
        <div className="hub-reveal hub-elevate flex flex-col justify-between rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">
              {locale === 'es' ? 'Objetivo del mes' : 'Objectif du mois'}
            </p>
            <p className="mt-3 font-serif text-4xl italic text-[#c45d3e]">
              <AnimatedCounter value={sessions} />
              <span className="text-2xl text-brand-ink/40">/{goal}</span>
            </p>
            {latestTestLabel ? (
              <p className="mt-3 text-sm text-brand-ink/55">
                {locale === 'es' ? 'Último test' : 'Dernier test'} · {latestTestLabel}
              </p>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/compte/connaissance-de-soi/progression"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
            >
              {t.openProgress} →
            </Link>
            <Link
              href="/compte/connaissance-de-soi/tests"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
            >
              {t.openTests} →
            </Link>
            <Link
              href="/compte/connaissance-de-soi/corps"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]"
            >
              {t.openCorps} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
