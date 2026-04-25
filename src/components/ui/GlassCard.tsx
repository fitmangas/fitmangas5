import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

/** Carte glass — charte premium commune Admin / Client */
export function GlassCard({ children, className = '', variant = 'light', ...rest }: Props) {
  const base = variant === 'dark' ? 'glass-card glass-card--dark' : 'glass-card';
  return (
    <div className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
