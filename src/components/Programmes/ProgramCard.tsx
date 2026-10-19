import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, Play, Repeat } from 'lucide-react';

import { LevelPill } from './LevelPill';
import { coverUrl, GOAL_TAG, LEVEL_LABEL, type CatalogProgram } from '@/lib/programmes/catalogue';

export function ProgramCard({
  program,
  state = 'discover',
  progress,
}: {
  program: CatalogProgram;
  state?: 'discover' | 'active' | 'done';
  progress?: { week: number; weeks: number; percent: number };
}) {
  const href = `/compte/programmes/${program.slug}`;
  const label = LEVEL_LABEL[program.level]?.fr ?? '';
  return (
    <article className="glass-card glass-card--kpi flex h-full flex-col overflow-hidden">
      <div className="fm-media fm-media--veil aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl(program)} alt="" />
        <div className="absolute left-3 top-3 z-[1]">
          <LevelPill level={program.level} label={label} />
        </div>
        {state === 'active' ? (
          <span className="absolute right-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-luxury-orange px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-md">
            <Play size={11} strokeWidth={2.6} /> En cours
          </span>
        ) : null}
        <div className="absolute inset-x-4 bottom-3 z-[1]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} /> {program.weeks} sem.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Repeat size={14} /> {program.sessions_per_week}×/sem.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> {program.minutes_range}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px] font-semibold leading-snug tracking-tight text-luxury-ink">{program.title.fr}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-luxury-muted">{program.promise.fr}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {program.goals.map((g) => (
            <span key={g} className="fm-tag">
              {GOAL_TAG[g] ?? g}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-5">
          {state === 'active' && progress ? (
            <>
              <div className="flex items-center justify-between text-[12px] font-semibold text-luxury-ink">
                <span>
                  Semaine {progress.week} sur {progress.weeks}
                </span>
                <span className="tabular-nums text-luxury-orange">{progress.percent} %</span>
              </div>
              <div className="fm-progress mt-2">
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <Link href={href} className="btn-luxury-primary mt-4 w-full">
                <Play size={14} strokeWidth={2.4} /> Reprendre
              </Link>
            </>
          ) : (
            <div className="flex items-center justify-between border-t border-black/[0.06] pt-4">
              <span className="text-[12px] font-medium text-luxury-muted">
                {program.weeks * program.sessions_per_week} séances
              </span>
              <Link href={href} className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-orange">
                {state === 'done' ? 'Revoir' : 'Découvrir'}
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
