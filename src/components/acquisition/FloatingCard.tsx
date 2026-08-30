'use client';

import type { ReactNode } from 'react';

import { CardHeader } from './Card';
import { acq } from './tokens';

type FloatingCardProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  overlap?: boolean;
};

/** Carte coque blanche — alertes / erreurs sources. */
export function FloatingCard({
  title,
  subtitle,
  eyebrow,
  action,
  children,
  className = '',
  overlap = false,
}: FloatingCardProps) {
  return (
    <section
      className={`rounded-[28px] px-6 py-7 sm:px-7 ${overlap ? '-mt-4' : ''} ${className}`}
      style={{ backgroundColor: acq.zoneShell, boxShadow: acq.shadowShell }}
    >
      {(title || action) && <CardHeader title={title} subtitle={subtitle} eyebrow={eyebrow} action={action} />}
      {children}
    </section>
  );
}
