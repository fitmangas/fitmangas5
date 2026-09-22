'use client';

import { TrendLineChart } from '@/components/Charts/TrendLineChart';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ClientLang } from '@/lib/compte/i18n';
import type { MemberProgressMonth } from '@/lib/self-knowledge/progress-monthly';

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
          month: 'Este mes',
          sessions: 'sesiones',
          goal: 'objetivo',
          streak: 'Cadena de constancia',
          weeks: 'semanas seguidas',
          curve: 'Tu evolución mes a mes',
          lives: 'Lives',
          replay: 'Horas replay',
          ratio: '% objetivo',
          milestones: 'Hitos significativos',
          m1: '4 sesiones en un mes',
          m2: '70% del objetivo un mes',
          m3: '3 meses seguidos con práctica',
          empty: 'Todavía no hay historial mensual.',
        }
      : {
          month: 'Ce mois',
          sessions: 'séances',
          goal: 'objectif',
          streak: 'Chaîne de constance',
          weeks: 'semaines d’affilée',
          curve: 'Ton évolution mois après mois',
          lives: 'Lives',
          replay: 'Heures replay',
          ratio: '% objectif',
          milestones: 'Jalons significatifs',
          m1: '4 séances dans un mois',
          m2: '70 % de l’objectif un mois',
          m3: '3 mois de suite avec une pratique',
          empty: 'Pas encore d’historique mensuel.',
        };

  const chartData = history.map((h) => ({
    label: h.year_month.slice(5),
    sessions: h.sessions,
    lives: h.lives,
    replay: Number(h.replay_hours),
    ratio: Math.round(Number(h.goal_ratio) * 100),
  }));

  const hit4 = history.some((h) => h.sessions >= 4);
  const hit70 = history.some((h) => Number(h.goal_ratio) >= 0.7);
  const hit3months = history.filter((h) => h.sessions > 0).length >= 3;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.month}</p>
          <p className="mt-2 font-serif text-3xl italic text-[#c45d3e]">
            {followedCount}/{goal}
          </p>
          <p className="text-sm text-luxury-muted">{t.sessions}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.streak}</p>
          <p className="mt-2 font-serif text-3xl italic text-luxury-ink">{streak}</p>
          <p className="text-sm text-luxury-muted">{t.weeks}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.goal}</p>
          <p className="mt-2 font-serif text-3xl italic text-luxury-ink">
            {goal > 0 ? Math.round((followedCount / goal) * 100) : 0}%
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-5 md:p-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c45d3e]">{t.curve}</h2>
        {chartData.length < 2 ? (
          <p className="mt-4 text-sm text-luxury-muted">{t.empty}</p>
        ) : (
          <div className="mt-4">
            <TrendLineChart
              data={chartData}
              series={[
                { key: 'sessions', label: t.sessions, color: '#C45D3E' },
                { key: 'lives', label: t.lives, color: '#8B5E4B' },
                { key: 'ratio', label: t.ratio, color: '#958780' },
              ]}
              height={240}
            />
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.milestones}</h2>
        <ul className="mt-4 space-y-3">
          {[
            { ok: hit4, label: t.m1 },
            { ok: hit70, label: t.m2 },
            { ok: hit3months, label: t.m3 },
          ].map((m) => (
            <li
              key={m.label}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                m.ok
                  ? 'border-[#c45d3e]/35 bg-[#c45d3e]/08 text-luxury-ink'
                  : 'border-luxury-ink/8 bg-white/50 text-luxury-muted'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  m.ok ? 'bg-[#c45d3e] text-white' : 'bg-luxury-ink/10 text-luxury-soft'
                }`}
              >
                {m.ok ? '✓' : '·'}
              </span>
              {m.label}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
