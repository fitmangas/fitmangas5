import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
  /** Coins plus arrondis (KPI dashboard admin) */
  kpi?: boolean;
  /** Ombre et matière renforcées (panneaux admin) */
  elevated?: boolean;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

/** Carte glass — charte premium commune Admin / Client */
export function GlassCard({
  children,
  className = '',
  variant = 'light',
  kpi = false,
  elevated = false,
  ...rest
}: Props) {
  const isInteractive =
    typeof rest.onClick === 'function' ||
    typeof rest.onKeyDown === 'function' ||
    rest.role === 'button' ||
    rest.tabIndex === 0;
  const base = variant === 'dark' ? 'glass-card glass-card--dark' : 'glass-card';
  const mods = [
    base,
    kpi ? 'glass-card--kpi' : '',
    elevated ? 'glass-card--elevated' : '',
    isInteractive ? 'glass-card--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="glass-card-zoom h-full">
      <div className={`${mods} h-full ${className}`.trim()} {...rest}>
        {children}
      </div>
    </div>
  );
}
