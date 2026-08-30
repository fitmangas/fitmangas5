'use client';

import type { ReactNode } from 'react';

import { acq } from './tokens';

type ZoneContainerProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ZoneContainer({ title, subtitle, action, children, className = '' }: ZoneContainerProps) {
  return (
    <section
      className={`relative overflow-visible rounded-[28px] px-4 py-6 sm:px-6 sm:py-8 ${className}`}
      style={{ backgroundColor: acq.warmBeige }}
    >
      {(title || action) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            {title ? (
              <h2 className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: acq.ink }}>
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm" style={{ color: acq.muted }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      <div className="relative">{children}</div>
    </section>
  );
}
