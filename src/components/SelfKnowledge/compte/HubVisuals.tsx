'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AnimatedCounter } from '@/components/SelfKnowledge/compte/HubMotion';

import '@/components/SelfKnowledge/compte/hub-member.css';

type EmptyProps = {
  title: string;
  lead: string;
  ctaLabel: string;
  ctaHref: string;
  testId?: string;
  /** Silhouette preview variant */
  preview?: 'curve' | 'pastilles' | 'radar' | 'journal' | 'books';
};

/** Empty désirable — aperçu silhouette + invitation, jamais photo coach. */
export function HubEmptyState({
  title,
  lead,
  ctaLabel,
  ctaHref,
  testId,
  preview = 'curve',
}: EmptyProps) {
  return (
    <div
      data-testid={testId ?? 'hub-empty-state'}
      className="hub-reveal overflow-hidden rounded-[28px] border border-[#e8ddd4]/80 bg-gradient-to-b from-white/90 to-[#FFFAF5] shadow-[0_18px_48px_rgba(60,40,30,0.1)]"
    >
      <div className="relative px-5 pb-2 pt-8 sm:px-10 sm:pt-10">
        <EmptyPreview kind={preview} />
      </div>
      <div className="px-5 pb-8 text-center sm:px-10">
        <h3 className="font-serif text-2xl italic leading-snug text-brand-ink sm:text-[1.75rem]">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-ink/55">{lead}</p>
        <Link
          href={ctaHref}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#c45d3e] px-7 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
        >
          {ctaLabel} →
        </Link>
      </div>
    </div>
  );
}

function EmptyPreview({ kind }: { kind: NonNullable<EmptyProps['preview']> }) {
  if (kind === 'pastilles') {
    return (
      <div className="mx-auto flex max-w-sm items-center justify-center gap-6 opacity-50" aria-hidden>
        {[0.55, 0.72, 0.4].map((p, i) => (
          <MetricPastille key={i} value="—" label="" progress={p} muted icon={['♡', '✦', '◎'][i]!} />
        ))}
      </div>
    );
  }
  if (kind === 'radar') {
    return (
      <svg viewBox="0 0 200 160" className="mx-auto h-28 w-full max-w-xs opacity-40" aria-hidden>
        <polygon
          points="100,20 160,55 140,130 60,130 40,55"
          fill="rgba(196,93,62,0.08)"
          stroke="#C45D3E"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <circle cx="100" cy="80" r="4" fill="#C45D3E" opacity="0.5" />
      </svg>
    );
  }
  if (kind === 'journal') {
    return (
      <div className="mx-auto flex max-w-md gap-3 opacity-45" aria-hidden>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 flex-1 rounded-2xl border border-dashed border-[#c45d3e]/35 bg-white/60" />
        ))}
      </div>
    );
  }
  if (kind === 'books') {
    return (
      <div className="mx-auto flex justify-center gap-3 opacity-50" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="hub-cover-placeholder h-28 w-[4.5rem] rounded-md shadow-md"
            style={{ transform: `rotate(${(i - 1) * 6}deg)` }}
          />
        ))}
      </div>
    );
  }
  /* curve default */
  return (
    <svg viewBox="0 0 320 100" className="mx-auto h-24 w-full max-w-md opacity-45" aria-hidden>
      <path
        d="M10 70 C 60 70, 80 30, 130 40 S 200 85, 250 45 S 300 25, 310 35"
        fill="none"
        stroke="#C45D3E"
        strokeWidth="3"
        strokeLinecap="round"
        className="hub-draw-path"
        pathLength={1}
      />
      <path
        d="M10 80 C 70 75, 90 55, 140 60 S 210 90, 260 65 S 300 50, 310 55"
        fill="none"
        stroke="rgba(139,94,75,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 5"
      />
    </svg>
  );
}

type HeroProps = {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
  /** Optional single ambiance image — max one, subtle */
  ambianceSrc?: string;
  ambianceAlt?: string;
};

/** Hero typographique — données incarnées, pas photo full-bleed. */
export function HubSectionHero({
  eyebrow,
  title,
  lead,
  children,
  ambianceSrc,
  ambianceAlt = '',
}: HeroProps) {
  return (
    <header className="hub-reveal relative mt-4 overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[#FFFAF5] via-[#fff8f2] to-[#f3e6dc] shadow-[0_20px_50px_rgba(60,40,30,0.1)]">
      {ambianceSrc ? (
        <div className="hub-parallax-slow pointer-events-none absolute -right-6 top-0 hidden h-full w-[38%] opacity-[0.22] sm:block">
          <Image
            src={ambianceSrc}
            alt={ambianceAlt}
            fill
            className="object-cover object-[center_18%]"
            sizes="280px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FFFAF5]/40 to-[#FFFAF5]" />
        </div>
      ) : null}
      <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-9">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{eyebrow}</p>
        <h1 className="mt-2 max-w-xl font-serif text-[2rem] italic leading-[1.1] text-brand-ink sm:text-[2.55rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-brand-ink/60 sm:text-[15px]">{lead}</p>
        {children}
      </div>
    </header>
  );
}

type PastilleProps = {
  value: string | number;
  label: string;
  progress?: number; // 0–1 arc
  icon?: string;
  muted?: boolean;
  href?: string;
};

/** Pastille ronde à donut partiel — esprit tennis data viz. */
export function MetricPastille({ value, label, progress = 0.65, icon = '●', muted, href }: PastilleProps) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));
  const inner = (
    <div
      className={`relative flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full border border-[#e5d0c4]/80 bg-white/85 shadow-[0_10px_28px_rgba(60,40,30,0.08)] ${
        muted ? '' : 'hub-elevate'
      }`}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(196,93,62,0.12)" strokeWidth="5" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#C45D3E"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={muted ? '' : 'hub-ring-draw'}
          style={{ ['--hub-ring-offset' as string]: String(offset) }}
        />
      </svg>
      <span className="relative text-lg leading-none text-[#c45d3e]/80" aria-hidden>
        {icon}
      </span>
      <span className="relative mt-0.5 font-serif text-xl italic text-brand-ink">{value}</span>
      {label ? (
        <span className="relative mt-0.5 max-w-[4.5rem] text-center text-[8px] font-bold uppercase tracking-[0.1em] text-brand-ink/45">
          {label}
        </span>
      ) : null}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="inline-block">
        {inner}
      </Link>
    );
  }
  return inner;
}

type ChainProps = {
  streak: number;
  label: string;
  sub: string;
};

/** Chaîne de constance — maillons qui s’allument. */
export function ConsistencyChain({ streak, label, sub }: ChainProps) {
  const links = Math.min(Math.max(streak, 0), 12);
  const show = Math.max(links, 3);

  return (
    <div
      data-testid="consistency-chain"
      className="hub-reveal hub-elevate rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {Array.from({ length: show }).map((_, i) => {
          const active = i < links;
          return (
            <span
              key={i}
              className={`hub-chain-link inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold sm:h-9 sm:w-9 ${
                active
                  ? 'is-on border-[#c45d3e] bg-[#c45d3e] text-white shadow-[0_6px_14px_rgba(196,93,62,0.35)]'
                  : 'border-[#e5d0c4] bg-white/80 text-[#c4b0a4]'
              }`}
              style={active ? { animationDelay: `${i * 70}ms` } : undefined}
              aria-hidden
            >
              {active ? '●' : '○'}
            </span>
          );
        })}
        {streak > 12 ? (
          <span className="ml-1 text-sm font-semibold text-[#c45d3e]">+{streak - 12}</span>
        ) : null}
      </div>
      <p className="mt-3 font-serif text-4xl italic text-brand-ink">
        <AnimatedCounter value={streak} />
      </p>
      <p className="mt-1 text-sm text-brand-ink/55">{sub}</p>
    </div>
  );
}

type MilestoneProps = {
  items: Array<{ ok: boolean; label: string }>;
  title: string;
};

export function HubMilestones({ items, title }: MilestoneProps) {
  return (
    <div className="hub-reveal rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((m, i) => (
          <li
            key={m.label}
            className={`hub-elevate flex items-center gap-3 rounded-[18px] border px-4 py-3.5 ${
              m.ok
                ? 'border-[#c45d3e]/40 bg-gradient-to-r from-[#c45d3e]/12 to-[#FFFAF5] shadow-[0_8px_20px_rgba(196,93,62,0.12)]'
                : 'border-[#e8ddd4] bg-white/60'
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                m.ok ? 'bg-[#c45d3e] text-white shadow-md' : 'bg-[#f0e8e1] text-[#b5a59a]'
              }`}
            >
              {m.ok ? '✓' : '◇'}
            </span>
            <span className={`text-sm ${m.ok ? 'font-semibold text-brand-ink' : 'text-brand-ink/50'}`}>
              {m.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type FluidCurveProps = {
  points: number[];
  label?: string;
  comparePoints?: number[];
  height?: number;
};

/** Courbe SVG fluide qui se dessine — toi vs toi-passé. */
export function FluidEvolutionCurve({
  points,
  label,
  comparePoints,
  height = 140,
}: FluidCurveProps) {
  const w = 320;
  const pad = 12;
  const max = Math.max(1, ...points, ...(comparePoints ?? []));
  const toPath = (pts: number[]) => {
    if (pts.length < 2) return '';
    const step = (w - pad * 2) / (pts.length - 1);
    return pts
      .map((v, i) => {
        const x = pad + i * step;
        const y = height - pad - (v / max) * (height - pad * 2);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };
  const main = toPath(points);
  const cmp = comparePoints ? toPath(comparePoints) : '';

  return (
    <div className="hub-reveal w-full" data-testid="fluid-evolution-curve">
      {label ? (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{label}</p>
      ) : null}
      <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label={label ?? 'Courbe'}>
        <defs>
          <linearGradient id="hubCurveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C45D3E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C45D3E" stopOpacity="0" />
          </linearGradient>
        </defs>
        {cmp ? (
          <path d={cmp} fill="none" stroke="rgba(139,94,75,0.35)" strokeWidth="2.5" strokeDasharray="5 6" />
        ) : null}
        {main ? (
          <>
            <path
              d={`${main} L ${w - pad} ${height - pad} L ${pad} ${height - pad} Z`}
              fill="url(#hubCurveFill)"
              opacity="0.9"
            />
            <path
              d={main}
              fill="none"
              stroke="#C45D3E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hub-draw-path"
              pathLength={1}
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

/** Placeholder couverture livre élégant (jamais photo coach). */
export function BookCoverPlaceholder({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || '·';
  return (
    <div
      className="hub-cover-placeholder relative flex h-full w-full flex-col items-center justify-center px-2"
      data-testid="book-cover-placeholder"
    >
      <span className="font-serif text-3xl italic text-[#c45d3e]/70">{initial}</span>
      <span className="mt-2 text-[8px] font-bold uppercase tracking-[0.16em] text-brand-ink/35">Couverture</span>
    </div>
  );
}
