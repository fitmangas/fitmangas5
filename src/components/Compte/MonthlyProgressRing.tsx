'use client';

/** Jauge circulaire type « Steps » — progression mensuelle cours suivis / objectif */
export function MonthlyProgressRing({
  followedCount,
  goal,
}: {
  followedCount: number;
  goal: number;
}) {
  const pct = Math.min(100, Math.round((followedCount / Math.max(goal, 1)) * 100));
  const r = 46;
  const c = 2 * Math.PI * r;
  const dashOffset = c - (pct / 100) * c;

  return (
    <div className="relative mx-auto flex h-[160px] w-[160px] items-center justify-center">
      <svg className="h-[160px] w-[160px] -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <defs>
          <linearGradient id="luxRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="luxGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="rgba(15,23,42,0.08)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#luxRingGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          filter="url(#luxGlow)"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{followedCount}</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-luxury-soft">/ {goal}</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-600">{pct}%</span>
      </div>
    </div>
  );
}
