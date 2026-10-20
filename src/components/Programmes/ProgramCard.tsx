import Link from 'next/link';
import { ArrowRight, Award, CalendarDays, CircleCheck, Clock, Pause, Play, Repeat } from 'lucide-react';

import { GOAL_LABELS, ProgramLevelPill } from './program-ui';
import type { CatalogCard } from '@/lib/programmes/catalog-view';

type Lang = 'fr' | 'es';

const C = {
  fr: {
    weeks: 'sem.',
    perWeek: '×/sem.',
    active: 'En cours',
    paused: 'En pause',
    done: 'Terminé',
    resume: 'Reprendre',
    sessions: (n: number) => `${n} séance${n > 1 ? 's' : ''}`,
    discover: 'Découvrir',
    certificate: 'Certificat',
    redo: 'Revoir',
  },
  es: {
    weeks: 'sem.',
    perWeek: '×/sem.',
    active: 'En curso',
    paused: 'En pausa',
    done: 'Terminado',
    resume: 'Retomar',
    sessions: (n: number) => `${n} sesión${n > 1 ? 'es' : ''}`,
    discover: 'Descubrir',
    certificate: 'Certificado',
    redo: 'Volver a ver',
  },
} as const;

export function ProgramMetaLine({ card, lang, light = false, compact = true }: { card: CatalogCard; lang: Lang; light?: boolean; compact?: boolean }) {
  const t = C[lang];
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium ${
        light ? 'text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]' : 'text-luxury-muted'
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays size={14} aria-hidden />
        {compact ? `${card.weeks} ${t.weeks}` : lang === 'es' ? `${card.weeks} semanas` : `${card.weeks} semaines`}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Repeat size={14} aria-hidden />
        {compact ? `${card.perWeek}${t.perWeek}` : lang === 'es' ? `${card.perWeek} sesiones / sem.` : `${card.perWeek} séances / sem.`}
      </span>
      {card.minutesRange ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} aria-hidden />
          {card.minutesRange}
        </span>
      ) : null}
    </div>
  );
}

export function ProgramCard({ card, lang = 'fr' }: { card: CatalogCard; lang?: Lang }) {
  const t = C[lang];
  return (
    <article className="glass-card glass-card--kpi relative flex h-full flex-col overflow-hidden">
      <div className="fm-media fm-media--veil aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.coverUrl} alt="" loading="lazy" />
        <div className="absolute left-3 top-3 z-[1]">
          <ProgramLevelPill level={card.level} lang={lang} />
        </div>
        {card.state === 'active' ? (
          <span className="absolute right-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-luxury-orange px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-md">
            <Play size={11} strokeWidth={2.6} aria-hidden /> {t.active}
          </span>
        ) : card.state === 'paused' ? (
          <span className="absolute right-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-ink shadow-md">
            <Pause size={11} strokeWidth={2.6} aria-hidden /> {t.paused}
          </span>
        ) : card.state === 'done' ? (
          <span className="absolute right-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-success shadow-md">
            <CircleCheck size={12} strokeWidth={2.4} aria-hidden /> {t.done}
          </span>
        ) : null}
        <div className="absolute inset-x-4 bottom-3 z-[1]">
          <ProgramMetaLine card={card} lang={lang} light />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px] font-semibold leading-snug tracking-tight text-luxury-ink">
          {card.state === 'discover' ? (
            <Link href={card.href} className="after:absolute after:inset-0 after:content-['']">
              {card.title}
            </Link>
          ) : (
            card.title
          )}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-luxury-muted">{card.promise}</p>
        {card.goals.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {card.goals.map((g) => (
              <span key={g} className="fm-tag">
                {GOAL_LABELS[g]?.[lang] ?? g}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-5">
          {card.state === 'active' || card.state === 'paused' ? (
            <>
              <div className="flex items-center justify-between text-[12px] font-semibold text-luxury-ink">
                <span>{card.weekLabel}</span>
                <span className="tabular-nums text-luxury-orange">{card.percent} %</span>
              </div>
              <div className="fm-progress mt-2">
                <span style={{ width: `${card.percent}%` }} />
              </div>
              <Link href={card.href} className={`${card.state === 'active' ? 'btn-luxury-primary' : 'btn-luxury-ghost'} mt-4 w-full`}>
                <Play size={14} strokeWidth={2.4} aria-hidden /> {t.resume}
              </Link>
            </>
          ) : card.state === 'done' ? (
            <div className="flex items-center justify-between gap-3">
              <Link href={card.href} className="text-[12px] font-medium text-luxury-muted underline-offset-4 hover:underline">
                {card.doneLabel ?? t.redo}
              </Link>
              {card.certificateHref ? (
                <a
                  href={card.certificateHref}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-orange"
                >
                  <Award size={14} aria-hidden />
                  {t.certificate}
                </a>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-black/[0.06] pt-4">
              <span className="text-[12px] font-medium text-luxury-muted">
                {t.sessions(card.sessions)}
                {card.sessions ? ` · ${card.totalLabel}` : ''}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-orange">
                {t.discover}
                <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
