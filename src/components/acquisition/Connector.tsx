'use client';

import { acq } from './tokens';

type ConnectorProps = {
  variant?: 'conversion' | 'muted';
  className?: string;
  height?: number;
};

/** Connecteur courbe Stratus entre deux colonnes. */
export function Connector({ variant = 'conversion', className = '', height = 48 }: ConnectorProps) {
  const stroke = variant === 'conversion' ? acq.terracotta : acq.warmBeigeDeep;
  const opacity = variant === 'conversion' ? 0.85 : 0.55;

  return (
    <div
      className={`hidden shrink-0 items-center self-center md:flex ${className}`}
      style={{ width: 56, height }}
      aria-hidden
    >
      <svg width="56" height={height} viewBox={`0 0 56 ${height}`} fill="none" className="overflow-visible">
        <defs>
          <marker
            id={`acq-arrow-${variant}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill={stroke} fillOpacity={opacity} />
          </marker>
        </defs>
        <path
          d={`M 2 ${height / 2} C 18 ${height / 2 - 14}, 38 ${height / 2 + 14}, 54 ${height / 2}`}
          stroke={stroke}
          strokeOpacity={opacity}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          markerEnd={`url(#acq-arrow-${variant})`}
        />
      </svg>
    </div>
  );
}

type VerticalConnectorProps = {
  variant?: 'conversion' | 'muted';
  className?: string;
};

/** Connecteur vertical entre étapes d’un workflow. */
export function VerticalConnector({ variant = 'muted', className = '' }: VerticalConnectorProps) {
  const stroke = variant === 'conversion' ? acq.terracotta : acq.warmBeigeDeep;
  return (
    <div className={`flex justify-center py-1 ${className}`} aria-hidden>
      <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
        <path
          d="M12 2 C12 10, 12 18, 12 24"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M8 22 L12 26 L16 22" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
