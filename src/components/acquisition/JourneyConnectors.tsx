'use client';

import { acq } from './tokens';

type ColumnConnectorProps = {
  variant?: 'conversion' | 'muted';
  /** Décalage vertical de la courbe (effet Stratus). */
  curve?: 'flat' | 'dip' | 'rise';
  className?: string;
};

let markerSeq = 0;

function nextMarkerId(prefix: string): string {
  markerSeq += 1;
  return `acq-conn-${prefix}-${markerSeq}`;
}

/**
 * Connecteur courbe Bézier entre deux colonnes — visible entre les cartes.
 * Terracotta = parcours principal ; gris chaud = lien secondaire.
 */
export function ColumnConnector({ variant = 'conversion', curve = 'flat', className = '' }: ColumnConnectorProps) {
  const stroke = variant === 'conversion' ? acq.terracotta : acq.warmBeigeDeep;
  const opacity = variant === 'conversion' ? 0.88 : 0.65;
  const markerId = nextMarkerId(variant);

  const yStart = curve === 'dip' ? 42 : curve === 'rise' ? 58 : 50;
  const yEnd = curve === 'dip' ? 68 : curve === 'rise' ? 42 : 50;
  const c1y = curve === 'dip' ? yStart - 8 : curve === 'rise' ? yStart + 10 : yStart;
  const c2y = curve === 'dip' ? yEnd + 8 : curve === 'rise' ? yEnd - 10 : yEnd;

  const path = `M 6 ${yStart} C 32 ${c1y}, 32 ${c2y}, 58 ${yEnd}`;

  return (
    <svg
      width="64"
      height="96"
      viewBox="0 0 64 96"
      fill="none"
      className={`hidden shrink-0 self-center md:block ${className}`}
      aria-hidden
    >
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={stroke} fillOpacity={opacity} />
        </marker>
      </defs>
      <circle cx="6" cy={yStart} r="2.5" fill={stroke} fillOpacity={opacity} />
      <path
        d={path}
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        markerEnd={`url(#${markerId})`}
      />
      <circle cx="58" cy={yEnd} r="2" fill={stroke} fillOpacity={opacity * 0.7} />
    </svg>
  );
}

type JourneyConnectorsOverlayProps = {
  columnCount: number;
  className?: string;
};

/** Overlay léger (branche secondaire) — complète les ColumnConnector inline. */
export function JourneyConnectorsOverlay({ columnCount, className = '' }: JourneyConnectorsOverlayProps) {
  if (columnCount < 4) return null;

  const branchMarker = nextMarkerId('branch');
  const w = 100;
  const h = 100;
  const colW = w / columnCount;

  const branchPath = `M ${colW * 1 + colW * 0.85} 62 C ${colW * 2.1} 82, ${colW * 2.9} 28, ${colW * 3 + colW * 0.12} 48`;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 z-[1] hidden md:block ${className}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker id={branchMarker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={acq.warmBeigeDeep} fillOpacity={0.85} />
        </marker>
      </defs>
      <path
        d={branchPath}
        stroke={acq.warmBeigeDeep}
        strokeOpacity={0.7}
        strokeWidth="0.65"
        fill="none"
        markerEnd={`url(#${branchMarker})`}
      />
    </svg>
  );
}
