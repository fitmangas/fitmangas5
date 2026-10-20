export function ProgressRing({
  percent,
  size = 96,
  label,
  dark,
}: {
  percent: number;
  size?: number;
  label?: string;
  dark?: boolean;
}) {
  const r = size / 2 - 4.5;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const id = `g${size}`;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8967a" />
            <stop offset="100%" stopColor="#b35338" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.14)' : 'rgba(45,45,45,0.08)'} strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-[22px] font-semibold leading-none tracking-tight tabular-nums ${dark ? 'text-white' : 'text-luxury-ink'}`}>
          {label ?? `${Math.round(percent)}%`}
        </span>
      </div>
    </div>
  );
}
