'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { fetchGaDashboardBundle, fetchGaRealtimeUsers } from '@/app/admin/marketing/actions-analytics';

const COLORS = ['#ea580c', '#0d9488', '#6366f1', '#64748b', '#94a3b8'];

type Props = {
  docFileLabel: string;
  connected: boolean;
};

export function MarketingAnalyticsLive({ docFileLabel, connected }: Props) {
  const [realtime, setRealtime] = useState<number | null>(null);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof fetchGaDashboardBundle>> | null>(null);
  const [retry, setRetry] = useState(0);

  const loadRealtime = useCallback(async () => {
    if (!connected) return;
    const r = await fetchGaRealtimeUsers();
    if (r.ok) setRealtime(r.value);
    else setRealtime(null);
  }, [connected]);

  const loadBundle = useCallback(async () => {
    if (!connected) return;
    const r = await fetchGaDashboardBundle();
    setBundle(r);
  }, [connected]);

  useEffect(() => {
    void loadBundle();
  }, [loadBundle, retry]);

  useEffect(() => {
    void loadRealtime();
    if (!connected) return;
    const id = window.setInterval(() => {
      void loadRealtime();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [connected, loadRealtime]);

  if (!connected) {
    return (
      <div className="rounded-[2rem] border border-amber-200/80 bg-amber-50/50 p-5 text-sm text-amber-950">
        Google Analytics API non connecté. Suivez les instructions dans le fichier <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">{docFileLabel}</code> du dépôt
        (voir aussi la documentation interne du projet).
      </div>
    );
  }

  if (bundle && !bundle.ok) {
    return (
      <div className="rounded-[2rem] border border-red-200/80 bg-red-50/50 p-5 text-sm text-red-900">
        Erreur Google Analytics : {bundle.error}
        <button type="button" className="ml-3 text-xs font-semibold underline" onClick={() => setRetry((n) => n + 1)}>
          Réessayer
        </button>
      </div>
    );
  }

  const pageViews = bundle && bundle.ok ? bundle.pageViews : [];
  const topPages = bundle && bundle.ok ? bundle.topPages : [];
  const traffic = bundle && bundle.ok ? bundle.trafficSources : [];
  const countries = bundle && bundle.ok ? bundle.countries : [];
  const conv = bundle && bundle.ok ? bundle.conversion : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[1.6rem] border border-white/65 bg-white/70 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Visiteurs en temps réel</p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-luxury-ink">{realtime ?? '—'}</p>
          <p className="mt-2 text-xs text-luxury-muted">Actualisation automatique toutes les 30 s</p>
        </div>
        <div className="rounded-[1.6rem] border border-white/65 bg-white/70 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:col-span-2 lg:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Taux de conversion (key events / sessions)</p>
          <p className="mt-3 text-2xl font-semibold text-luxury-ink">
            {conv?.ratePercent != null ? `${conv.ratePercent} %` : '— (non configuré ou sans données)'}
          </p>
          <p className="mt-1 text-xs text-luxury-muted">
            Sessions : {conv?.sessions ?? 0} · Key events : {conv?.keyEvents ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/65 bg-white/60 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
        <h3 className="text-lg font-semibold text-luxury-ink">Pages vues — 30 jours</h3>
        <div className="mt-4 h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pageViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="views" name="Vues" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/65 bg-white/60 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
          <h3 className="text-lg font-semibold text-luxury-ink">Sources de trafic</h3>
          <div className="mt-4 h-64 w-full min-w-0">
            {traffic.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-luxury-muted">Pas de données sur la période.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={traffic} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {traffic.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/65 bg-white/60 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
          <h3 className="text-lg font-semibold text-luxury-ink">Visiteurs par pays</h3>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} width={36} />
                <Tooltip />
                <Bar dataKey="users" name="Utilisateurs" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/65 bg-white/60 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
        <h3 className="text-lg font-semibold text-luxury-ink">Top 10 pages</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
              <tr>
                <th className="px-2 py-2">Page</th>
                <th className="px-2 py-2">Vues</th>
                <th className="px-2 py-2">Temps moyen (s)</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((row) => (
                <tr key={row.page} className="border-t border-white/50">
                  <td className="max-w-md truncate px-2 py-2 font-medium text-luxury-ink" title={row.page}>
                    {row.page}
                  </td>
                  <td className="px-2 py-2">{row.views}</td>
                  <td className="px-2 py-2">{row.avgTimeSeconds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
