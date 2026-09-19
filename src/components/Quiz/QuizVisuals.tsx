'use client';

import type { ReactNode } from 'react';

import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, DISC_LETTER_ORDER } from '@/lib/quiz/disc-palette';
import type { QuizLocale } from '@/lib/quiz/types';

type Slice = { letter: DiscLetter; percent: number; label: string; winner?: boolean };

export function DiscColorStrip({ locale }: { locale: QuizLocale }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DISC_LETTER_ORDER.map((letter) => {
        const color = DISC_LETTER_COLOR[letter];
        const meta = DISC_LETTER_LABEL[locale][letter];
        return (
          <div
            key={letter}
            className="relative overflow-hidden rounded-[24px] border border-brand-ink/[0.06] bg-white p-4 shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
          >
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-[1.05rem] font-bold text-white"
                style={{ background: color, boxShadow: `0 10px 22px -10px ${color}` }}
              >
                {letter}
              </span>
              <div>
                <p className="font-serif text-[1.15rem] italic text-brand-ink">{meta.short}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-brand-ink/55">{meta.plain}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DiscWheel({
  slices,
  size = 220,
}: {
  slices: Slice[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const angles = [
    { start: -90, end: 0 },
    { start: 0, end: 90 },
    { start: 90, end: 180 },
    { start: 180, end: 270 },
  ];

  function polar(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(start: number, end: number, radius: number) {
    const a = polar(start, radius);
    const b = polar(end, radius);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <defs>
        <filter id="discGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r + 8} fill="#faf8f5" stroke="rgba(44,36,30,0.06)" />
      {DISC_LETTER_ORDER.map((letter, i) => {
        const slice = slices.find((s) => s.letter === letter);
        const { start, end } = angles[i]!;
        const mid = (start + end) / 2;
        const labelPos = polar(mid, r * 0.58);
        const winner = slice?.winner;
        return (
          <g key={letter} filter={winner ? 'url(#discGlow)' : undefined}>
            <path
              d={arcPath(start, end, r)}
              fill={DISC_LETTER_COLOR[letter]}
              opacity={winner ? 0.95 : 0.42}
              stroke="#faf8f5"
              strokeWidth={3}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize={winner ? 18 : 14}
              fontWeight={700}
            >
              {letter}
            </text>
            {slice ? (
              <text
                x={labelPos.x}
                y={labelPos.y + 16}
                textAnchor="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize={11}
                fontWeight={600}
              >
                {slice.percent}%
              </text>
            ) : null}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.28} fill="#faf8f5" stroke="rgba(44,36,30,0.06)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#2C241E" fontSize={11} fontWeight={700}>
        MIX
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(44,36,30,0.45)" fontSize={10}>
        4 profils
      </text>
    </svg>
  );
}

export function DiscRadar({ slices, size = 260 }: { slices: Slice[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const angles = [-90, 0, 90, 180];

  function pt(letterIndex: number, pct: number) {
    const deg = angles[letterIndex]!;
    const rad = (deg * Math.PI) / 180;
    const r = maxR * (Math.max(pct, 8) / 100);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const points = DISC_LETTER_ORDER.map((letter, i) => {
    const slice = slices.find((s) => s.letter === letter);
    const p = pt(i, slice?.percent ?? 0);
    return `${p.x},${p.y}`;
  }).join(' ');

  const winner = slices.find((s) => s.winner);
  const stroke = winner ? DISC_LETTER_COLOR[winner.letter] : '#C45D3E';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={DISC_LETTER_ORDER.map((_, i) => {
            const p = pt(i, scale * 100);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(44,36,30,0.1)"
          strokeWidth={1}
        />
      ))}
      {DISC_LETTER_ORDER.map((letter, i) => {
        const outer = pt(i, 100);
        const label = pt(i, 118);
        return (
          <g key={letter}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(44,36,30,0.1)" />
            <circle cx={outer.x} cy={outer.y} r={4} fill={DISC_LETTER_COLOR[letter]} />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2C241E"
              fontSize={12}
              fontWeight={700}
            >
              {letter}
            </text>
          </g>
        );
      })}
      <polygon points={points} fill="url(#radarFill)" stroke={stroke} strokeWidth={2.5} />
      {DISC_LETTER_ORDER.map((letter, i) => {
        const slice = slices.find((s) => s.letter === letter);
        const p = pt(i, slice?.percent ?? 0);
        return (
          <circle key={`dot-${letter}`} cx={p.x} cy={p.y} r={5} fill={DISC_LETTER_COLOR[letter]} stroke="#faf8f5" strokeWidth={2} />
        );
      })}
    </svg>
  );
}

export function MixBars({ slices }: { slices: Slice[] }) {
  return (
    <div className="space-y-3.5">
      {slices.map((slice) => (
        <div key={slice.letter}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                style={{ background: DISC_LETTER_COLOR[slice.letter] }}
              >
                {slice.letter}
              </span>
              <span className={`text-[14px] ${slice.winner ? 'font-semibold text-brand-ink' : 'text-brand-ink/55'}`}>
                {slice.label.replace(/^Profil\s+/i, '')}
              </span>
            </div>
            <span className="tabular-nums text-[13px] font-semibold text-brand-ink/40">{slice.percent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-brand-ink/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(slice.percent, 4)}%`,
                background: `linear-gradient(90deg, ${DISC_LETTER_COLOR[slice.letter]}, ${DISC_LETTER_COLOR[slice.letter]}cc)`,
                boxShadow: slice.winner ? `0 0 18px ${DISC_LETTER_COLOR[slice.letter]}66` : undefined,
                opacity: slice.winner ? 1 : 0.55,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportCard({
  title,
  accent,
  children,
  icon,
}: {
  title: string;
  accent?: string;
  children: ReactNode;
  icon?: string;
}) {
  const color = accent || '#C45D3E';
  return (
    <section className="break-inside-avoid relative overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <div className="relative flex items-center gap-3">
        {icon ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-[14px] font-bold text-white"
            style={{ background: color }}
          >
            {icon}
          </span>
        ) : null}
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
          {title}
        </h2>
      </div>
      <div className="relative mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function BulletCards({ items, accent }: { items: string[]; accent?: string }) {
  const color = accent || '#C45D3E';
  return (
    <ul className="grid gap-2.5">
      {items.map((item, i) => (
        <li
          key={`${i}-${item.slice(0, 28)}`}
          className="flex gap-3 rounded-2xl border border-brand-ink/[0.06] bg-brand-beige/40 px-3.5 py-3 text-[14px] leading-relaxed text-brand-ink/85"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: color }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Bloc citation / portrait — rompt la série de listes. */
export function QuoteBlock({ text, accent }: { text: string; accent?: string }) {
  const color = accent || '#C45D3E';
  return (
    <blockquote
      className="relative overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white px-6 py-7 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:px-8"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <p className="font-serif text-[1.25rem] italic leading-snug text-brand-ink sm:text-[1.4rem]">{text}</p>
    </blockquote>
  );
}
