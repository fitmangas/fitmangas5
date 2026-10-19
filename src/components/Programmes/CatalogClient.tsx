'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, HeartPulse, Leaf, PersonStanding, Timer } from 'lucide-react';

import { ProgramCard } from './ProgramCard';
import { ProgressRing } from './ProgressRing';
import {
  CATALOG_PROGRAMS,
  GOAL_FILTERS,
  LEVEL_SECTIONS,
  coverUrl,
  matchesGoal,
  type CatalogProgram,
} from '@/lib/programmes/catalogue';

const ICONS: Record<string, typeof Dumbbell> = {
  tonifier: Dumbbell,
  dos: PersonStanding,
  cardio: HeartPulse,
  souplesse: Leaf,
  peu: Timer,
};

export function CatalogClient({
  activeSlug,
}: {
  activeSlug?: string | null;
}) {
  const [goal, setGoal] = useState('all');
  const programs = CATALOG_PROGRAMS;
  const active = programs.find((p) => p.slug === activeSlug) ?? (activeSlug ? programs[0] : null);

  function persist(next: string) {
    setGoal(next);
    try {
      localStorage.setItem('fm_program_goal', next);
    } catch {
      /* ignore */
    }
  }

  const filtered = useMemo(() => programs.filter((p) => matchesGoal(p, goal)), [programs, goal]);

  return (
    <div className="mx-auto max-w-[1280px] min-w-0 space-y-10 pb-16 pt-3 md:space-y-14 md:px-8 md:pt-10">
      <section className="grid items-end gap-6 px-1 md:grid-cols-[1fr_auto]">
        <div>
          <p className="fm-kicker fm-kicker--orange">Programmes · 12 parcours guidés</p>
          <h1 className="hero-signature-title mt-3 text-[2.6rem] text-luxury-ink md:text-[4.2rem]">
            Ton plan,
            <br className="md:hidden" /> semaine après semaine.
          </h1>
          <p className="hero-signature-subtitle mt-3 max-w-2xl text-[15px] leading-relaxed md:text-[17px]">
            Des programmes guidés avec les vidéos d&apos;Alejandra, plus un live par semaine où elle te voit et te corrige.
          </p>
        </div>
      </section>

      {active ? <ActiveHero program={active} /> : null}

      <section className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max items-center gap-2 md:w-auto md:flex-wrap">
            <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-soft md:inline">Ton objectif</span>
            {GOAL_FILTERS.map((f) => {
              const Icon = ICONS[f.id];
              const on = goal === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => persist(f.id)}
                  className={on ? 'fm-chip fm-chip--active' : 'fm-chip fm-chip--soft'}
                >
                  {Icon ? <Icon size={15} /> : null}
                  {f.fr}
                </button>
              );
            })}
          </div>
        </div>
        <Link href="/test-niveau" className="glass-card flex items-center gap-3 rounded-full py-2 pl-2 pr-5">
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold text-luxury-ink">Pas sûre de ton niveau ?</span>
            <span className="block text-[12px] font-semibold text-luxury-orange">3 questions, 2 minutes →</span>
          </span>
        </Link>
      </section>

      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[13px] font-semibold text-luxury-muted" aria-label="Aller au niveau">
        <span className="text-[11px] uppercase tracking-[0.16em] text-luxury-soft">Aller à</span>
        {LEVEL_SECTIONS.map((s) => (
          <a key={s.level} href={`#niveau-${s.level}`} className="inline-flex items-center gap-1.5">
            {s.titleFr}
          </a>
        ))}
      </nav>

      {LEVEL_SECTIONS.map((s) => {
        const list = filtered.filter((p) => p.level === s.level);
        if (!list.length) return null;
        return (
          <section key={s.level} id={`niveau-${s.level}`} className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div className="min-w-0">
                <p className="fm-kicker">
                  {s.kickerFr} · {list.length} programme{list.length > 1 ? 's' : ''}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-luxury-ink md:mt-2 md:text-[1.7rem]">{s.titleFr}</h2>
                <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-luxury-muted">{s.descFr}</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {list.map((p) => (
                <ProgramCard
                  key={p.slug}
                  program={p}
                  state={p.slug === activeSlug ? 'active' : 'discover'}
                  progress={p.slug === activeSlug ? { week: 2, weeks: p.weeks, percent: 44 } : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ActiveHero({ program }: { program: CatalogProgram }) {
  return (
    <section className="glass-card glass-card--dark fm-dark glass-card--kpi relative overflow-hidden">
      <div className="fm-media absolute inset-y-0 right-0 hidden w-[52%] md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl(program)} alt="" className="absolute inset-0" />
        <div className="fm-dark-fade-x absolute inset-0" />
      </div>
      <div className="relative z-[1] p-6 md:p-10">
        <p className="fm-kicker !text-white/55">Ton programme en cours</p>
        <h2 className="fm-display mt-4 text-[2.1rem] leading-[1.02] !text-white md:text-[2.9rem]">{program.title.fr}</h2>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <ProgressRing percent={44} dark />
          <Link href={`/compte/programmes/${program.slug}`} className="btn-luxury-primary">
            Reprendre
          </Link>
        </div>
      </div>
    </section>
  );
}
