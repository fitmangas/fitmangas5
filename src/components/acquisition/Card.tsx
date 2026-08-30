'use client';

import type { ReactNode } from 'react';

import { acq } from './tokens';

type CardProps = {
  children: ReactNode;
  className?: string;
  overlap?: boolean;
  padding?: 'md' | 'lg';
};

export function Card({ children, className = '', overlap = false, padding = 'lg' }: CardProps) {
  const pad = padding === 'lg' ? 'p-6 sm:p-7' : 'p-4 sm:p-5';
  return (
    <div
      className={`rounded-[22px] bg-white ${pad} ${overlap ? '-mt-3 sm:-mt-4' : ''} ${className}`}
      style={{ boxShadow: acq.shadowCard }}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
};

export function CardHeader({ title, subtitle, action, eyebrow }: CardHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: acq.muted }}>
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: acq.muted }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
