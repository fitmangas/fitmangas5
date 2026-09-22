'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type TrendPoint = {
  label: string;
  [key: string]: string | number | null | undefined;
};

type Series = {
  key: string;
  label: string;
  color: string;
};

type Props = {
  data: TrendPoint[];
  series: Series[];
  height?: number;
  yDomain?: [number, number] | ['auto', 'auto'];
};

/** Courbe d’évolution partagée — DA cream / terracotta. */
export function TrendLineChart({ data, series, height = 220, yDomain = ['auto', 'auto'] }: Props) {
  if (!data.length) {
    return (
      <p className="py-8 text-center font-serif text-base italic text-brand-ink/60">
        Encore un peu de pratique — ta courbe apparaîtra ici.
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(44,36,30,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b635c' }} axisLine={false} tickLine={false} />
          <YAxis domain={yDomain} tick={{ fontSize: 11, fill: '#6b635c' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(196,93,62,0.2)',
              background: '#FFFAF5',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: s.color }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
