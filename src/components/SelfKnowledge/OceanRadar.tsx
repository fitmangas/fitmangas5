'use client';

import { OCEAN_TRAIT_COLOR, type OceanTraitKey } from '@/lib/self-knowledge/ocean-palette';

export type OceanRadarSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: OceanRadarSlice[];
  size?: number;
};

/** Radar 5 axes — même langage visuel que DiscRadar (QuizVisuals). */
export function OceanRadar({ slices, size = 260 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = slices.length;
  const step = 360 / Math.max(n, 1);

  function pt(index: number, normalized: number) {
    const deg = -90 + index * step;
    const rad = (deg * Math.PI) / 180;
    const r = maxR * Math.max(Math.min(normalized, 1), 0.08);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const points = slices
    .map((slice, i) => {
      const p = pt(i, slice.value);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const dominant = slices.reduce((best, s) => (s.value > best.value ? s : best), slices[0]!);
  const stroke = dominant?.color ?? '#C45D3E';
  const gradientId = `ocean-radar-${size}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block" role="img">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={slices
            .map((_, i) => {
              const p = pt(i, scale);
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="rgba(44,36,30,0.1)"
          strokeWidth={1}
        />
      ))}
      {slices.map((slice, i) => {
        const outer = pt(i, 1);
        const label = pt(i, 1.18);
        return (
          <g key={slice.key}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(44,36,30,0.1)" />
            <circle cx={outer.x} cy={outer.y} r={4} fill={slice.color} />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2C241E"
              fontSize={11}
              fontWeight={700}
            >
              {slice.label}
            </text>
          </g>
        );
      })}
      {slices.length >= 3 ? (
        <polygon points={points} fill={`url(#${gradientId})`} stroke={stroke} strokeWidth={2.5} />
      ) : null}
      {slices.map((slice, i) => {
        const p = pt(i, slice.value);
        return (
          <circle
            key={`dot-${slice.key}`}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={slice.color}
            stroke="#faf8f5"
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
}

/** Helper : construit les slices OCEAN normalisées 0–1 depuis scores bruts 10–50. */
export function buildOceanSlices(
  scoreKeys: string[],
  scores: Record<string, number>,
  labelFor: (key: string) => string,
): OceanRadarSlice[] {
  const order: OceanTraitKey[] = ['E', 'A', 'C', 'ES', 'O'];
  const keys = order.filter((k) => scoreKeys.includes(k));
  return keys.map((key) => ({
    key,
    label: labelFor(key),
    value: Math.max(0, Math.min(1, ((scores[key] ?? 30) - 10) / 40)),
    color: OCEAN_TRAIT_COLOR[key],
  }));
}
