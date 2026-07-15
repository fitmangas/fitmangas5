'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchSearchConsoleBundle } from '@/app/admin/marketing/actions-search-console';

type Props = {
  docFileLabel: string;
  connected: boolean;
};

export function MarketingSearchConsoleLive({ docFileLabel, connected }: Props) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchSearchConsoleBundle>> | null>(null);
  const [retry, setRetry] = useState(0);

  const load = useCallback(async () => {
    if (!connected) return;
    const r = await fetchSearchConsoleBundle();
    setData(r);
  }, [connected]);

  useEffect(() => {
    void load();
  }, [load, retry]);

  if (!connected) {
    return (
      <div className="rounded-[2rem] border border-amber-200/80 bg-amber-50/50 p-5 text-sm text-amber-950">
        Google Analytics API non connecté. Suivez les instructions dans le fichier <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">{docFileLabel}</code> du dépôt.
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-luxury-muted">Chargement Search Console…</p>;
  }

  if (!data.ok) {
    return (
      <div className="rounded-[2rem] border border-red-200/80 bg-red-50/50 p-5 text-sm text-red-900">
        Erreur Search Console : {data.error}
        <button type="button" className="ml-3 text-xs font-semibold underline" onClick={() => setRetry((n) => n + 1)}>
          Réessayer
        </button>
      </div>
    );
  }

  const crawlTotal = data.crawlErrors.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.6rem] border border-white/65 bg-white/70 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Indexation vérifiée</p>
          <p className="mt-3 text-3xl font-bold text-luxury-ink">{data.indexing.indexedUrlsLabel}</p>
          <p className="mt-1 text-xs text-luxury-muted">Soumises : {data.indexing.submittedUrls}</p>
          <p className="mt-1 text-xs text-luxury-muted">
            Source :{' '}
            {data.indexing.indexedUrlsSource === 'url_inspection'
              ? 'URL Inspection'
              : data.indexing.indexedUrlsSource === 'search_analytics_estimate'
                ? 'URLs avec impressions Search'
                : 'non disponible'}
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-white/65 bg-white/70 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Erreurs / avertissements sitemap</p>
          <p className="mt-3 text-3xl font-bold text-luxury-ink">{data.indexing.sitemapErrors + data.indexing.sitemapWarnings}</p>
          <p className="mt-1 text-xs text-luxury-muted">Signalements crawl : {crawlTotal}</p>
        </div>
      </div>

      {crawlTotal > 0 ? (
        <ul className="list-inside list-disc rounded-2xl border border-orange-200/60 bg-orange-50/40 p-4 text-sm text-orange-950">
          {data.crawlErrors.map((c, i) => (
            <li key={i}>
              [{c.type}] {c.detail}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-[2rem] border border-white/65 bg-white/60 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
        <h3 className="text-lg font-semibold text-luxury-ink">Top mots-clés (28 j)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
              <tr>
                <th className="px-2 py-2">Mot-clé</th>
                <th className="px-2 py-2">Clics</th>
                <th className="px-2 py-2">Impressions</th>
                <th className="px-2 py-2">CTR %</th>
                <th className="px-2 py-2">Position</th>
              </tr>
            </thead>
            <tbody>
              {data.queries.slice(0, 25).map((row) => (
                <tr key={row.query} className="border-t border-white/50">
                  <td className="px-2 py-2 font-medium text-luxury-ink">{row.query}</td>
                  <td className="px-2 py-2">{row.clicks}</td>
                  <td className="px-2 py-2">{row.impressions}</td>
                  <td className="px-2 py-2">{row.ctr}</td>
                  <td className="px-2 py-2">{row.position}</td>
                </tr>
              ))}
              {data.queries.length === 0 ? (
                <tr className="border-t border-white/50">
                  <td colSpan={5} className="px-2 py-4 text-luxury-muted">
                    Aucune requête non anonymisée disponible sur 28 jours. Les pages ci-dessous confirment quand même des impressions.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/65 bg-white/60 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
        <h3 className="text-lg font-semibold text-luxury-ink">Top pages Search (28 j)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
              <tr>
                <th className="px-2 py-2">URL</th>
                <th className="px-2 py-2">Clics</th>
                <th className="px-2 py-2">Impressions</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((row) => (
                <tr key={row.page} className="border-t border-white/50">
                  <td className="max-w-xl truncate px-2 py-2 text-luxury-ink" title={row.page}>
                    {row.page}
                  </td>
                  <td className="px-2 py-2">{row.clicks}</td>
                  <td className="px-2 py-2">{row.impressions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
