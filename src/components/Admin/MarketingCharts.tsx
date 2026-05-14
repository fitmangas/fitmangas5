'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type BusinessStatsPoint = {
  date: string;
  mrr: number;
  activeSubscribers: number;
  newSubscribers: number;
  unsubscribed: number;
  churn: number;
  liveShowUp: number;
  replayCompletion: number;
};

export type NotificationPoint = {
  date: string;
  email: number;
  push: number;
  inApp: number;
};

const axisStyle = { fontSize: 11, fill: '#7f7468' };
const gridColor = 'rgba(197, 165, 114, 0.22)';

export function BusinessCharts({ data }: { data: BusinessStatsPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="MRR — 30 jours">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C5A572" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#C5A572" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip />
            <Area type="monotone" dataKey="mrr" name="MRR €" stroke="#C5A572" fill="url(#mrrFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Abonnées actives">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip />
            <Line type="monotone" dataKey="activeSubscribers" name="Abonnées" stroke="#111827" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Nouveaux abonnements vs désabonnements">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip />
            <Legend />
            <Bar dataKey="newSubscribers" name="Nouveaux" fill="#34d399" radius={[8, 8, 0, 0]} />
            <Bar dataKey="unsubscribed" name="Désabonnements" fill="#fb7185" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Churn, présence live et complétion replay">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis tick={axisStyle} unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="churn" name="Churn" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="liveShowUp" name="Présence live" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="replayCompletion" name="Complétion replay" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export function NotificationChart({ data }: { data: NotificationPoint[] }) {
  return (
    <ChartCard title="Notifications envoyées — 30 jours">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip />
          <Legend />
          <Bar dataKey="email" name="Email" stackId="a" fill="#C5A572" radius={[6, 6, 0, 0]} />
          <Bar dataKey="push" name="Push" stackId="a" fill="#111827" radius={[6, 6, 0, 0]} />
          <Bar dataKey="inApp" name="In-app" stackId="a" fill="#f97316" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.6rem] border border-white/60 bg-white/65 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <h3 className="mb-3 text-sm font-semibold text-luxury-ink">{title}</h3>
      {children}
    </div>
  );
}
