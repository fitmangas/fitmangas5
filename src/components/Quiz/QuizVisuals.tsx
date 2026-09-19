'use client';

import type { ReactNode } from 'react';

import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, DISC_LETTER_ORDER, mixPoint } from '@/lib/quiz/disc-palette';
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

/** Roue proportionnelle aux % — un profil à 33 % n’occupe jamais tout le cercle. */
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
  const ordered = DISC_LETTER_ORDER.map((letter) => {
    const slice = slices.find((s) => s.letter === letter);
    return { letter, percent: Math.max(slice?.percent ?? 0, 0), winner: slice?.winner };
  });
  const total = ordered.reduce((a, s) => a + s.percent, 0) || 1;

  function polar(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(start: number, end: number, radius: number) {
    const a = polar(start, radius);
    const b = polar(end, radius);
    const sweep = ((end - start) % 360 + 360) % 360;
    const large = sweep > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y} Z`;
  }

  let cursor = -90;
  const arcs = ordered.map((s) => {
    const sweep = (s.percent / total) * 360;
    const start = cursor;
    const end = cursor + Math.max(sweep, s.percent > 0 ? 2 : 0);
    cursor = end;
    return { ...s, start, end, mid: (start + end) / 2 };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <circle cx={cx} cy={cy} r={r + 8} fill="#faf8f5" stroke="rgba(44,36,30,0.06)" />
      {arcs.map((arc) => {
        if (arc.percent <= 0) return null;
        const labelPos = polar(arc.mid, r * 0.62);
        const showPct = arc.percent >= 10;
        return (
          <g key={arc.letter}>
            <path
              d={arcPath(arc.start, arc.end, r)}
              fill={DISC_LETTER_COLOR[arc.letter]}
              opacity={arc.winner ? 1 : 0.72}
              stroke="#faf8f5"
              strokeWidth={3}
            />
            {showPct ? (
              <>
                <text
                  x={labelPos.x}
                  y={labelPos.y - (arc.percent >= 14 ? 6 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={arc.winner ? 16 : 13}
                  fontWeight={700}
                >
                  {arc.letter}
                </text>
                <text
                  x={labelPos.x}
                  y={labelPos.y + 12}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.92)"
                  fontSize={11}
                  fontWeight={600}
                >
                  {arc.percent}%
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.28} fill="#faf8f5" stroke="rgba(44,36,30,0.06)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#2C241E" fontSize={11} fontWeight={700}>
        MIX
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(44,36,30,0.45)" fontSize={10}>
        4 couleurs
      </text>
    </svg>
  );
}

/** Schéma 2 axes (inspiration pédagogique) — le point = ton mix, pas une case. */
export function MixAxesMap({
  slices,
  locale,
  size = 280,
}: {
  slices: Slice[];
  locale: QuizLocale;
  size?: number;
}) {
  const pt = mixPoint(slices);
  const pad = 36;
  const inner = size - pad * 2;
  const px = pad + ((pt.x + 1) / 2) * inner;
  const py = pad + ((1 - pt.y) / 2) * inner;
  const labels =
    locale === 'es'
      ? {
          top: 'Marco exigente',
          bottom: 'Marco cómodo',
          left: 'Te adaptas',
          right: 'Tomas las riendas',
        }
      : {
          top: 'Cadre exigeant',
          bottom: 'Cadre confortable',
          left: 'Tu t’adaptes',
          right: 'Tu prends les rênes',
        };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <rect x={pad} y={pad} width={inner / 2} height={inner / 2} fill={DISC_LETTER_COLOR.M} opacity={0.12} />
      <rect x={pad + inner / 2} y={pad} width={inner / 2} height={inner / 2} fill={DISC_LETTER_COLOR.D} opacity={0.12} />
      <rect x={pad} y={pad + inner / 2} width={inner / 2} height={inner / 2} fill={DISC_LETTER_COLOR.A} opacity={0.12} />
      <rect
        x={pad + inner / 2}
        y={pad + inner / 2}
        width={inner / 2}
        height={inner / 2}
        fill={DISC_LETTER_COLOR.E}
        opacity={0.12}
      />
      <line x1={size / 2} y1={pad} x2={size / 2} y2={size - pad} stroke="rgba(44,36,30,0.12)" />
      <line x1={pad} y1={size / 2} x2={size - pad} y2={size / 2} stroke="rgba(44,36,30,0.12)" />
      {(
        [
          [pad + inner * 0.25, pad + inner * 0.25, 'M'],
          [pad + inner * 0.75, pad + inner * 0.25, 'D'],
          [pad + inner * 0.25, pad + inner * 0.75, 'A'],
          [pad + inner * 0.75, pad + inner * 0.75, 'E'],
        ] as const
      ).map(([x, y, letter]) => (
        <text key={letter} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={DISC_LETTER_COLOR[letter]} fontSize={18} fontWeight={700} opacity={0.55}>
          {letter}
        </text>
      ))}
      <text x={size / 2} y={18} textAnchor="middle" fill="rgba(44,36,30,0.45)" fontSize={10} fontWeight={600}>
        {labels.top}
      </text>
      <text x={size / 2} y={size - 8} textAnchor="middle" fill="rgba(44,36,30,0.45)" fontSize={10} fontWeight={600}>
        {labels.bottom}
      </text>
      <text
        x={14}
        y={size / 2}
        textAnchor="middle"
        fill="rgba(44,36,30,0.45)"
        fontSize={10}
        fontWeight={600}
        transform={`rotate(-90 14 ${size / 2})`}
      >
        {labels.left}
      </text>
      <text
        x={size - 14}
        y={size / 2}
        textAnchor="middle"
        fill="rgba(44,36,30,0.45)"
        fontSize={10}
        fontWeight={600}
        transform={`rotate(90 ${size - 14} ${size / 2})`}
      >
        {labels.right}
      </text>
      <circle cx={px} cy={py} r={14} fill="#c45d3e" opacity={0.2} />
      <circle cx={px} cy={py} r={8} fill="#c45d3e" stroke="#fff" strokeWidth={2} />
      <text x={px} y={py + 22} textAnchor="middle" fill="#2C241E" fontSize={10} fontWeight={700}>
        {locale === 'es' ? 'Tu punto' : 'Toi'}
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
