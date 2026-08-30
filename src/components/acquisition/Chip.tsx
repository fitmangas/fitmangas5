'use client';

import { acq } from './tokens';

type ChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  tone?: 'neutral' | 'terracotta' | 'dark' | 'sandbox' | 'onDark';
  className?: string;
};

export function Chip({ label, active = false, onClick, tone = 'neutral', className = '' }: ChipProps) {
  const isButton = Boolean(onClick);
  const base =
    'inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition';

  let style: React.CSSProperties = {};
  if (tone === 'dark' || (active && tone === 'neutral')) {
    style = { backgroundColor: acq.active, color: '#FFFFFF' };
  } else if (tone === 'terracotta' || active) {
    style = { backgroundColor: acq.terracotta, color: '#FFFFFF' };
  } else if (tone === 'sandbox') {
    style = { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' };
  } else if (tone === 'onDark') {
    style = {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,0.28)',
    };
  } else {
    style = { backgroundColor: '#FFFFFF', color: acq.ink, border: `1px solid ${acq.warmBeigeDeep}` };
  }

  if (isButton) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${className}`} style={style}>
        {label}
      </button>
    );
  }

  return (
    <span className={`${base} ${className}`} style={style}>
      {label}
    </span>
  );
}

type ChipRowProps = {
  children: React.ReactNode;
  className?: string;
};

export function ChipRow({ children, className = '' }: ChipRowProps) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
}
