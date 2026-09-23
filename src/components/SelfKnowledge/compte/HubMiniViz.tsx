'use client';

import { OCEAN_TRAIT_COLOR } from '@/lib/self-knowledge/ocean-palette';
import { buildOceanSlices, type OceanRadarSlice } from '@/components/SelfKnowledge/OceanRadar';

type MiniRadarProps = {
  scores: Record<string, number>;
  size?: number;
};

/** Mini radar OCEAN sans labels — pour cartes historique. */
export function MiniOceanRadar({ scores, size = 88 }: MiniRadarProps) {
  const slices = buildOceanSlices(Object.keys(scores), scores, (k) => k);
  if (slices.length < 3) return null;
  return <MiniRadarSvg slices={slices} size={size} />;
}

export function MiniRadarSvg({ slices, size = 88 }: { slices: OceanRadarSlice[]; size?: number }) {
  const pad = 8;
  const vb = size + pad * 2;
  const cx = vb / 2;
  const cy = vb / 2;
  const maxR = size * 0.38;
  const n = slices.length;
  const step = 360 / Math.max(n, 1);

  function pt(index: number, normalized: number) {
    const deg = -90 + index * step;
    const rad = (deg * Math.PI) / 180;
    const r = maxR * Math.max(Math.min(normalized, 1), 0.1);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const points = slices.map((s, i) => {
    const p = pt(i, s.value);
    return `${p.x},${p.y}`;
  }).join(' ');

  const stroke = slices.reduce((b, s) => (s.value > b.value ? s : b), slices[0]!).color;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      className="shrink-0"
      aria-hidden
      data-testid="mini-ocean-radar"
    >
      {[0.35, 0.65, 1].map((f) => (
        <polygon
          key={f}
          points={slices
            .map((_, i) => {
              const p = pt(i, f);
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="rgba(44,36,30,0.1)"
          strokeWidth="1"
        />
      ))}
      <polygon points={points} fill={`${stroke}33`} stroke={stroke} strokeWidth="1.8" />
    </svg>
  );
}

type SparkProps = {
  values: number[];
  width?: number;
  height?: number;
  rising?: boolean | null;
};

/** Sparkline d’évolution d’un trait. */
export function TraitSparkline({ values, width = 72, height = 28, rising }: SparkProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const step = (width - 4) / (values.length - 1);
  const d = values
    .map((v, i) => {
      const x = 2 + i * step;
      const y = height - 3 - ((v - min) / span) * (height - 8);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const color = rising === false ? '#8B5E4B' : '#C45D3E';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden data-testid="trait-sparkline">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HealthMiniBars({
  regularite,
  recuperation,
  energie,
}: {
  regularite: number;
  recuperation: number;
  energie: number;
}) {
  const bars = [
    { v: regularite, c: OCEAN_TRAIT_COLOR.C },
    { v: recuperation, c: OCEAN_TRAIT_COLOR.ES },
    { v: energie, c: '#C45D3E' },
  ];
  return (
    <div className="flex h-14 items-end gap-1.5" data-testid="health-mini-bars" aria-hidden>
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-2.5 rounded-t-sm"
          style={{ height: `${Math.max(8, (b.v / 100) * 56)}px`, background: b.c, opacity: 0.85 }}
        />
      ))}
    </div>
  );
}
