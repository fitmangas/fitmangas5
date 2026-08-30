'use client';

import type { ReactNode } from 'react';
import { Calendar, Check, LucideIcon } from 'lucide-react';

import { AvatarBadge } from './AvatarBadge';
import { acq } from './tokens';

type TaskCardProps = {
  title: string;
  subtitle?: string;
  personName?: string;
  active?: boolean;
  compact?: boolean;
  icons?: Array<'check' | 'calendar'>;
  className?: string;
};

const iconMap: Record<'check' | 'calendar', LucideIcon> = {
  check: Check,
  calendar: Calendar,
};

/** Petite carte tâche Stratus — avatar + libellé + icônes. */
export function TaskCard({
  title,
  subtitle,
  personName,
  active = false,
  compact = false,
  icons = [],
  className = '',
}: TaskCardProps) {
  return (
    <div
      className={`relative z-10 flex items-start gap-2.5 rounded-[16px] px-3 py-3 ${compact ? 'py-2.5' : ''} ${className}`}
      style={{
        backgroundColor: active ? acq.active : '#FFFFFF',
        color: active ? '#FFFFFF' : acq.ink,
        boxShadow: active ? '0 16px 40px rgba(26,26,26,0.22)' : acq.shadowCard,
      }}
    >
      {personName ? (
        <AvatarBadge name={personName} size="sm" ring={!active} />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={`leading-snug ${compact ? 'text-xs font-semibold' : 'text-sm font-semibold'}`}>{title}</p>
        {subtitle ? (
          <p
            className="mt-0.5 text-[11px] leading-relaxed"
            style={{ color: active ? 'rgba(255,255,255,0.68)' : acq.muted }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {icons.length ? (
        <div className="flex shrink-0 gap-1 pt-0.5">
          {icons.map((key) => {
            const Icon = iconMap[key];
            return (
              <span
                key={key}
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.12)' : acq.cream,
                  color: active ? '#FFFFFF' : acq.muted,
                }}
              >
                <Icon size={12} strokeWidth={2.2} />
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type JourneyColumnProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

/** Colonne teintée Stratus — contient des TaskCards empilées. */
export function JourneyColumn({ title, children, className = '' }: JourneyColumnProps) {
  return (
    <div
      className={`relative flex min-w-[168px] flex-1 flex-col rounded-[22px] px-3 pb-4 pt-4 sm:min-w-[190px] sm:px-4 ${className}`}
      style={{ backgroundColor: acq.zoneInner }}
    >
      <p
        className="mb-4 px-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: acq.muted }}
      >
        {title}
      </p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

type JourneyBoardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  connectors?: ReactNode;
  className?: string;
};

/** Coque blanche Stratus — « Customer Journeys ». */
export function JourneyBoard({
  title,
  subtitle,
  action,
  headerExtra,
  children,
  connectors,
  className = '',
}: JourneyBoardProps) {
  return (
    <section
      className={`relative overflow-visible rounded-[28px] px-4 py-6 sm:px-7 sm:py-8 ${className}`}
      style={{ backgroundColor: acq.zoneShell, boxShadow: acq.shadowShell }}
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm" style={{ color: acq.muted }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      {headerExtra ? <div className="mb-5 px-1">{headerExtra}</div> : null}
      <div className="relative">
        {connectors}
        {children}
      </div>
    </section>
  );
}
