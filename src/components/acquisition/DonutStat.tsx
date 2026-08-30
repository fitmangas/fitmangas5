'use client';

type DonutStatProps = {
  label: string;
  value: string;
  sublabel?: string;
  fillPercent?: number;
  accent?: boolean;
};

/** Widget donut Stratus — anneau resserré. */
export function DonutStat({ label, value, sublabel, fillPercent = 62, accent = false }: DonutStatProps) {
  const stroke = accent ? '#C45D3E' : '#23201D';
  const track = '#E8DFD4';
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(fillPercent, 6), 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center px-3 py-1 text-center">
      <div className="relative h-[92px] w-[92px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke={track} strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tabular-nums leading-none" style={{ color: '#23201D' }}>
            {value}
          </span>
        </div>
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-tight" style={{ color: '#23201D' }}>
        {label}
      </p>
      {sublabel ? (
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: '#78716C' }}>
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
