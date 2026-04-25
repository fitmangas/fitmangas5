'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function readDismissedCount(storageKey: string): number {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeDismissedCount(storageKey: string, count: number) {
  try {
    window.localStorage.setItem(storageKey, String(Math.max(0, count)));
  } catch {
    // ignore storage failures
  }
}

export function DismissibleDashboardBadge({ storageKey, count }: { storageKey: string; count: number }) {
  const [dismissedCount, setDismissedCount] = useState(0);

  useEffect(() => {
    setDismissedCount(readDismissedCount(storageKey));
  }, [storageKey]);

  const visibleCount = useMemo(() => {
    if (count <= dismissedCount) return 0;
    return count;
  }, [count, dismissedCount]);

  if (visibleCount <= 0) return null;

  return (
    <span className="absolute right-3 top-3 z-20 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(255,59,48,0.45)] ring-2 ring-white">
      {visibleCount > 99 ? '99+' : visibleCount}
    </span>
  );
}

export function DismissOnClickLink({
  href,
  storageKey,
  dismissCount,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  storageKey: string;
  dismissCount: number;
  className: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={className}
      onClick={() => {
        writeDismissedCount(storageKey, dismissCount);
      }}
    >
      {children}
    </Link>
  );
}
