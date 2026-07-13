'use client';

/** Jauge circulaire — progression mensuelle (accent orange #FF7A00) */
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
    <div className="relative mx-auto flex h-[104px] w-[104px] items-center justify-center md:h-[160px] md:w-[160px]">
      <svg className="h-[104px] w-[104px] -rotate-90 md:h-[160px] md:w-[160px]" viewBox="0 0 120 120" aria-hidden>
        <defs>
          <linearGradient id="luxRingOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff9a3d" />
            <stop offset="50%" stopColor="#ff7a00" />
            <stop offset="100%" stopColor="#e86600" />
          </linearGradient>
          <filter id="luxGlowOrange" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(29,29,31,0.1)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#luxRingOrange)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          filter="url(#luxGlowOrange)"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-luxury-ink md:text-3xl">{followedCount}</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-luxury-muted md:text-[10px]">/ {goal}</span>
        </div>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#ff7a00] md:mt-1 md:text-[9px]">{pct}%</span>
      </div>
    </div>
  );
}
