'use client';

import type { ReactNode } from 'react';

import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR, DISC_LETTER_LABEL } from '@/lib/quiz/disc-palette';
import type { QuizLocale } from '@/lib/quiz/types';

type Slice = { letter: DiscLetter; percent: number; label: string; winner?: boolean };

export function DiscColorStrip({ locale }: { locale: QuizLocale }) {
  const letters = (['D', 'I', 'S', 'C'] as const).map((letter) => ({
    letter,
    color: DISC_LETTER_COLOR[letter],
    label: DISC_LETTER_LABEL[locale][letter].short,
  }));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {letters.map((item) => (
        <div
          key={item.letter}
          className="relative overflow-hidden rounded-2xl border border-[#2C241E]/10 bg-white/70 p-4 shadow-[0_18px_40px_-28px_rgba(44,36,30,0.55)] backdrop-blur-sm"
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}
          />
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[1.15rem] font-semibold text-white shadow-lg"
            style={{
              background: item.color,
              boxShadow: `0 12px 28px -12px ${item.color}`,
            }}
          >
            {item.letter}
          </div>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2C241E]/45">
            {item.letter}
          </p>
          <p className="mt-1 text-[15px] font-medium text-[#2C241E]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Roue 4 quadrants type DISC — rendu graphique, pas un sticker texte. */
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
    { start: -90, end: 0 }, // D top-right-ish
    { start: 0, end: 90 },
    { start: 90, end: 180 },
    { start: 180, end: 270 },
  ];
  const order: DiscLetter[] = ['D', 'I', 'S', 'C'];

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
      <circle cx={cx} cy={cy} r={r + 8} fill="#FFFAF5" stroke="rgba(44,36,30,0.08)" />
      {order.map((letter, i) => {
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
              stroke="#FFFAF5"
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
      <circle cx={cx} cy={cy} r={r * 0.28} fill="#FFFAF5" stroke="rgba(44,36,30,0.08)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#2C241E" fontSize={11} fontWeight={700}>
        MIX
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(44,36,30,0.45)" fontSize={10}>
        4 couleurs
      </text>
    </svg>
  );
}

/** Radar 4 axes — graphique de rapport type bilan DISC. */
export function DiscRadar({ slices, size = 260 }: { slices: Slice[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const order: DiscLetter[] = ['D', 'I', 'S', 'C'];
  const angles = [-90, 0, 90, 180];

  function pt(letterIndex: number, pct: number) {
    const deg = angles[letterIndex]!;
    const rad = (deg * Math.PI) / 180;
    const r = maxR * (Math.max(pct, 8) / 100);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const points = order
    .map((letter, i) => {
      const slice = slices.find((s) => s.letter === letter);
      const p = pt(i, slice?.percent ?? 0);
      return `${p.x},${p.y}`;
    })
    .join(' ');

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
          points={order
            .map((_, i) => {
              const p = pt(i, scale * 100);
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="rgba(44,36,30,0.12)"
          strokeWidth={1}
        />
      ))}
      {order.map((letter, i) => {
        const outer = pt(i, 100);
        const label = pt(i, 118);
        return (
          <g key={letter}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(44,36,30,0.12)" />
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
      {order.map((letter, i) => {
        const slice = slices.find((s) => s.letter === letter);
        const p = pt(i, slice?.percent ?? 0);
        return <circle key={`dot-${letter}`} cx={p.x} cy={p.y} r={5} fill={DISC_LETTER_COLOR[letter]} stroke="#FFFAF5" strokeWidth={2} />;
      })}
    </svg>
  );
}

export function MixBars({ slices }: { slices: Slice[] }) {
  return (
    <div className="space-y-3">
      {slices.map((slice) => (
        <div key={slice.letter} className="group">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold text-white"
                style={{ background: DISC_LETTER_COLOR[slice.letter] }}
              >
                {slice.letter}
              </span>
              <span className={`text-[13px] ${slice.winner ? 'font-semibold text-[#2C241E]' : 'text-[#2C241E]/55'}`}>
                {slice.label}
              </span>
            </div>
            <span className="tabular-nums text-[13px] font-semibold text-[#2C241E]/45">{slice.percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#2C241E]/[0.07] ring-1 ring-[#2C241E]/05">
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
    <section className="break-inside-avoid relative overflow-hidden rounded-2xl border border-[#2C241E]/10 bg-white/80 p-5 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.55)] backdrop-blur-sm sm:p-6">
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="relative flex items-center gap-3">
        {icon ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-bold text-white"
            style={{ background: color }}
          >
            {icon}
          </span>
        ) : null}
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>
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
          className="flex gap-3 rounded-xl border border-[#2C241E]/08 bg-[#FFFAF5]/80 px-3.5 py-3 text-[14px] leading-relaxed text-[#2C241E]/85"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
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
