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
  /** Superposition optionnelle (passation antérieure) — trait pointillé terracotta soft */
  compareSlices?: OceanRadarSlice[];
  compareLabel?: string;
  size?: number;
};

/** Radar 5 axes — labels clairement hors des points (pas de chevauchement). */
export function OceanRadar({ slices, compareSlices, compareLabel, size = 260 }: Props) {
  const pad = 84;
  const vb = size + pad * 2;
  const cx = vb / 2;
  const cy = vb / 2;
  const maxR = size * 0.26;
  const n = slices.length;
  const step = 360 / Math.max(n, 1);

  function pt(index: number, normalized: number) {
    const deg = -90 + index * step;
    const rad = (deg * Math.PI) / 180;
    const r = maxR * Math.max(Math.min(normalized, 1), 0.08);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  /** Labels loin des ronds (anneau + score) — boost généreux + offset bas/haut */
  function labelPt(index: number) {
    const deg = -90 + index * step;
    const rad = (deg * Math.PI) / 180;
    const boost = index === 0 ? 2.35 : index === 2 || index === 3 ? 2.28 : 2.15;
    const r = maxR * boost;
    let x = cx + r * Math.cos(rad);
    let y = cy + r * Math.sin(rad);
    if (index === 0) y -= 8;
    if (index === 2 || index === 3) y += 12;
    if (index === 1) x += 6;
    if (index === 4) x -= 6;
    return { x, y };
  }

  const points = slices
    .map((slice, i) => {
      const p = pt(i, slice.value);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const comparePoints =
    compareSlices && compareSlices.length >= 3
      ? compareSlices
          .map((slice, i) => {
            const p = pt(i, slice.value);
            return `${p.x},${p.y}`;
          })
          .join(' ')
      : null;

  const dominant = slices.reduce((best, s) => (s.value > best.value ? s : best), slices[0]!);
  const stroke = dominant?.color ?? '#C45D3E';
  const gradientId = `ocean-radar-${size}`;
  const compareStroke = '#958780';

  return (
    <svg
      width={size + pad}
      height={size + pad}
      viewBox={`0 0 ${vb} ${vb}`}
      className="mx-auto block max-w-full"
      role="img"
    >
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
        const label = labelPt(i);
        return (
          <g key={slice.key}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(44,36,30,0.1)" />
            <circle cx={outer.x} cy={outer.y} r={2.5} fill={slice.color} opacity={0.55} />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2C241E"
              fontSize={10}
              fontWeight={700}
              letterSpacing="0.02em"
            >
              {slice.label}
            </text>
          </g>
        );
      })}
      {comparePoints ? (
        <polygon
          points={comparePoints}
          fill="rgba(149,135,128,0.12)"
          stroke={compareStroke}
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      ) : null}
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
      {compareLabel && comparePoints ? (
        <text x={cx} y={vb - 10} textAnchor="middle" fill="#958780" fontSize={9} fontWeight={600}>
          {compareLabel}
        </text>
      ) : null}
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
