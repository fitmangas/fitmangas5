'use client';

import { TrendLineChart } from '@/components/Charts/TrendLineChart';
import { AnimatedCounter } from '@/components/SelfKnowledge/compte/HubMotion';
import {
  ConsistencyChain,
  HubEmptyState,
  HubMilestones,
  HubSectionHero,
  MetricPastille,
} from '@/components/SelfKnowledge/compte/HubVisuals';
import type { ClientLang } from '@/lib/compte/i18n';
import type { MemberProgressMonth } from '@/lib/self-knowledge/progress-monthly';

import '@/components/SelfKnowledge/compte/hub-member.css';

type Props = {
  lang: ClientLang;
  history: MemberProgressMonth[];
  streak: number;
  followedCount: number;
  goal: number;
};

export function ProgressionMemberView({ lang, history, streak, followedCount, goal }: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const t =
    locale === 'es'
      ? {
          eyebrow: 'Mi progreso',
          title: 'Tu constancia en el tiempo',
          lead: 'Lives y replays — tú frente a ti misma, mes tras mes.',
          month: 'Este mes',
          sessions: 'sesiones',
          goal: 'objetivo',
          streak: 'Cadena de constancia',
          weeks: 'semanas seguidas con al menos una práctica',
          curve: 'Tu evolución mes a mes',
          lives: 'Lives',
          ratio: '% objetivo',
          milestones: 'Hitos significativos',
          m1: '4 sesiones en un mes',
          m2: '70% del objetivo un mes',
          m3: '3 meses seguidos con práctica',
          emptyTitle: 'Tu primera sesión lanzará tu cadena',
          emptyLead: 'Reserva o sigue un curso — tu curva de constancia empezará aquí.',
          emptyCta: 'Ver el planning',
        }
      : {
          eyebrow: 'Ma progression',
          title: 'Ta constance dans le temps',
          lead: 'Lives et replays — toi face à toi-même, mois après mois.',
          month: 'Ce mois',
          sessions: 'séances',
          goal: 'objectif',
          streak: 'Chaîne de constance',
          weeks: 'semaines d’affilée avec au moins une pratique',
          curve: 'Ton évolution mois après mois',
          lives: 'Lives',
          ratio: '% objectif',
          milestones: 'Jalons significatifs',
          m1: '4 séances dans un mois',
          m2: '70 % de l’objectif un mois',
          m3: '3 mois de suite avec une pratique',
          emptyTitle: 'Ta première séance lancera ta chaîne',
          emptyLead: 'Réserve ou suis un cours — ta courbe de constance démarrera ici.',
          emptyCta: 'Voir le planning',
        };

  const chartData = history.map((h) => ({
    label: h.year_month.slice(5),
    sessions: h.sessions,
    lives: h.lives,
    ratio: Math.round(Number(h.goal_ratio) * 100),
  }));

  const hit4 = history.some((h) => h.sessions >= 4);
  const hit70 = history.some((h) => Number(h.goal_ratio) >= 0.7);
  const hit3months = history.filter((h) => h.sessions > 0).length >= 3;
  const hasActivity = followedCount > 0 || streak > 0 || history.some((h) => h.sessions > 0);
  const pct = goal > 0 ? Math.round((followedCount / goal) * 100) : 0;

  return (
    <div className="mt-2 space-y-8">
      <HubSectionHero eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      {!hasActivity ? (
        <HubEmptyState
          title={t.emptyTitle}
          lead={t.emptyLead}
          ctaLabel={t.emptyCta}
          ctaHref="/compte/planning"
          testId="progression-empty"
          preview="curve"
        />
      ) : (
        <>
          <div className="hub-reveal flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/45">{t.month}</p>
              <p className="mt-1 font-serif text-5xl italic text-[#c45d3e] sm:text-6xl">
                <AnimatedCounter value={followedCount} />
                <span className="text-3xl text-brand-ink/35">/{goal}</span>
              </p>
              <p className="text-sm text-brand-ink/55">{t.sessions}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <MetricPastille value={`${pct}%`} label={t.goal} progress={pct / 100} icon="↗" />
              <MetricPastille
                value={streak}
                label={t.streak}
                progress={Math.min(1, streak / 8)}
                icon="◎"
              />
            </div>
          </div>

          <ConsistencyChain streak={streak} label={t.streak} sub={t.weeks} />

          <div className="hub-reveal hub-elevate rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.curve}</h2>
            {chartData.length < 2 ? (
              <p className="mt-4 font-serif text-lg italic text-brand-ink/65">
                {locale === 'es'
                  ? 'Vuelve el mes que viene — tu curva crecerá sola.'
                  : 'Reviens le mois prochain — ta courbe grandira toute seule.'}
              </p>
            ) : (
              <div className="mt-4">
                <TrendLineChart
                  data={chartData}
                  series={[
                    { key: 'sessions', label: t.sessions, color: '#C45D3E' },
                    { key: 'lives', label: t.lives, color: '#8B5E4B' },
                    { key: 'ratio', label: t.ratio, color: '#A67C52' },
                  ]}
                  height={240}
                />
              </div>
            )}
          </div>

          <HubMilestones
            title={t.milestones}
            items={[
              { ok: hit4, label: t.m1 },
              { ok: hit70, label: t.m2 },
              { ok: hit3months, label: t.m3 },
            ]}
          />
        </>
      )}
    </div>
  );
}
