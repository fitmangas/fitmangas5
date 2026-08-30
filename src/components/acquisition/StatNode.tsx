'use client';

import type { ReactNode } from 'react';

import { acq } from './tokens';

type StatNodeProps = {
  label: string;
  value: string | number;
  hint?: string | null;
  active?: boolean;
  footer?: ReactNode;
  className?: string;
};

export function StatNode({ label, value, hint, active = false, footer, className = '' }: StatNodeProps) {
  return (
    <div
      className={`relative z-10 min-w-[120px] flex-1 rounded-[20px] px-4 py-5 transition-transform ${active ? 'scale-[1.02]' : ''} ${className}`}
      style={{
        backgroundColor: active ? acq.active : '#FFFFFF',
        color: active ? '#FFFFFF' : acq.ink,
        boxShadow: active ? '0 20px 48px rgba(26, 26, 26, 0.25)' : acq.shadowCard,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: active ? 'rgba(255,255,255,0.72)' : acq.muted }}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs" style={{ color: active ? 'rgba(255,255,255,0.65)' : acq.mutedLight }}>
          {hint}
        </p>
      ) : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
