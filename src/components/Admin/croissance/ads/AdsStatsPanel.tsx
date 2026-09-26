'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';

type Props = {
  intelligence: IntelligenceBundle;
  performance: AdsPerformanceSummary;
};

function eur(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

function num(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
}

export function AdsStatsPanel({ intelligence, performance }: Props) {
  const missing = intelligence.capabilities.filter((c) => !c.accessible);
  const account = intelligence.organicAccount;
  const hist = intelligence.organicAccountHistory;

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-stats">
      {/* Invisibles */}
      <section
        className="rounded-[1.5rem] border p-5 sm:p-6"
        style={{ borderColor: acq.warmBeigeDeep, background: 'linear-gradient(165deg,#fff,#FFFAF5)', boxShadow: acq.shadowCard }}
        data-testid="ads-stats-invisibles"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
          Chiffres invisibles
        </p>
        <h3 className="mt-1 font-serif text-xl font-semibold" style={{ color: acq.ink }}>
          Conversion & argent
        </h3>
        <p className="mt-1 text-sm" style={{ color: acq.muted }}>
          Leads, CPL, CAC, spend — jamais inventés. Zéros honnêtes tant que pas de dépense.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Dépense', value: eur(performance.spendCents) },
            { label: 'Leads', value: num(performance.leads) },
            { label: 'CPL', value: eur(performance.cplCents) },
            { label: 'Coût / essai', value: eur(performance.costPerTrialCents) },
            { label: 'CAC', value: eur(performance.cacCents) },
            { label: 'Impressions ads', value: num(performance.impressions) },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border bg-white p-3" style={{ borderColor: acq.warmBeigeDeep }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: acq.muted }}>
                {k.label}
              </p>
              <p className="mt-1 font-serif text-xl font-semibold" style={{ color: acq.ink }}>
                {performance.connected ? k.value : '—'}
              </p>
            </div>
          ))}
        </div>
        {intelligence.trends.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs" data-testid="ads-stats-trends">
              <thead>
                <tr style={{ color: acq.muted }}>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Spend</th>
                  <th className="py-2 pr-3">Leads</th>
                  <th className="py-2 pr-3">CTR</th>
                  <th className="py-2 pr-3">Fréq.</th>
                </tr>
              </thead>
              <tbody>
                {intelligence.trends.slice(-14).map((t) => (
                  <tr key={t.metricDate} className="border-t" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                    <td className="py-1.5 pr-3">{t.metricDate}</td>
                    <td className="py-1.5 pr-3">{eur(t.spendCents)}</td>
                    <td className="py-1.5 pr-3">{t.leads}</td>
                    <td className="py-1.5 pr-3">{t.ctr != null ? `${(t.ctr * 100).toFixed(2)} %` : '—'}</td>
                    <td className="py-1.5 pr-3">{t.frequency?.toFixed(2) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm" style={{ color: acq.muted }}>
            Pas de tendance ads quotidienne (0 spend).
          </p>
        )}
      </section>

      {/* Visuels */}
      <section
        className="rounded-[1.5rem] border p-5 sm:p-6"
        style={{ borderColor: acq.warmBeigeDeep, boxShadow: acq.shadowCard }}
        data-testid="ads-stats-visuels"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
          Données visuelles de communication
        </p>
        <h3 className="mt-1 font-serif text-xl font-semibold" style={{ color: acq.ink }}>
          Organique — contenu & portée
        </h3>
        {account ? (
          <div className="mt-3 flex flex-wrap gap-3 text-sm" style={{ color: acq.ink }}>
            <span className="rounded-full border px-3 py-1" style={{ borderColor: acq.warmBeigeDeep }}>
              Abonnés {num(account.followersCount)}
            </span>
            <span className="rounded-full border px-3 py-1" style={{ borderColor: acq.warmBeigeDeep }}>
              Portée {num(account.reach)}
            </span>
            <span className="rounded-full border px-3 py-1" style={{ borderColor: acq.warmBeigeDeep }}>
              Vues profil {num(account.profileViews)}
            </span>
            <span className="rounded-full border px-3 py-1" style={{ borderColor: acq.warmBeigeDeep }}>
              Clics bio {num(account.websiteClicks)}
            </span>
            {hist.length >= 2 && hist[0]?.followersCount != null && hist[1]?.followersCount != null ? (
              <span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: acq.terracotta }}>
                Δ abonnés {hist[0].followersCount - hist[1].followersCount >= 0 ? '+' : ''}
                {hist[0].followersCount - hist[1].followersCount}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs" data-testid="ads-stats-organic-table">
            <thead>
              <tr style={{ color: acq.muted }}>
                <th className="py-2 pr-2">Post</th>
                <th className="py-2 pr-2">Reach</th>
                <th className="py-2 pr-2">Vues</th>
                <th className="py-2 pr-2">Saves</th>
                <th className="py-2 pr-2">Shares</th>
                <th className="py-2 pr-2">Likes</th>
                <th className="py-2 pr-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.organicMedia.slice(0, 20).map((m) => (
                <tr key={m.igMediaId} className="border-t" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                  <td className="max-w-[180px] truncate py-1.5 pr-2" title={m.caption ?? ''}>
                    {(m.caption ?? m.mediaType ?? m.igMediaId).slice(0, 40)}
                    {m.boostBadge ? ' ★' : ''}
                  </td>
                  <td className="py-1.5 pr-2">{num(m.reach)}</td>
                  <td className="py-1.5 pr-2">{num(m.views)}</td>
                  <td className="py-1.5 pr-2">{num(m.saved)}</td>
                  <td className="py-1.5 pr-2">{num(m.shares)}</td>
                  <td className="py-1.5 pr-2">{num(m.likeCount)}</td>
                  <td className="py-1.5 pr-2">{m.score.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {intelligence.organicMedia.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: acq.muted }}>
              Aucun snapshot organique — lance Sync intelligence.
            </p>
          ) : null}
        </div>
      </section>

      {/* Breakdowns */}
      <section className="rounded-[1.5rem] border p-5 sm:p-6" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-breakdowns">
        <h3 className="font-serif text-lg font-semibold" style={{ color: acq.ink }}>
          Breakdowns ads
        </h3>
        <p className="mt-1 text-sm" style={{ color: acq.muted }}>
          Âge / genre / plateforme / pays — vides si 0 spend.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {(
            [
              ['Âge', intelligence.breakdowns.age],
              ['Genre', intelligence.breakdowns.gender],
              ['Plateforme', intelligence.breakdowns.publisher_platform],
              ['Pays', intelligence.breakdowns.country],
            ] as const
          ).map(([label, rows]) => (
            <div key={label} className="rounded-xl border p-3" style={{ borderColor: acq.warmBeigeDeep }}>
              <p className="font-semibold" style={{ color: acq.terracotta }}>
                {label}
              </p>
              {rows.length === 0 ? (
                <p className="mt-1" style={{ color: acq.muted }}>
                  —
                </p>
              ) : (
                <ul className="mt-1 space-y-0.5" style={{ color: acq.ink }}>
                  {rows.slice(0, 6).map((r) => (
                    <li key={r.key}>
                      {r.key} · {r.impressions} imp.
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Missing */}
      <section className="rounded-[1.5rem] border p-5" style={{ borderColor: missing.length ? 'rgba(185,28,28,0.35)' : acq.warmBeigeDeep }} data-testid="ads-stats-missing">
        <h3 className="flex items-center gap-2 font-serif text-lg font-semibold" style={{ color: acq.ink }}>
          {missing.length ? <AlertTriangle size={18} className="text-red-700" /> : <CheckCircle2 size={18} style={{ color: '#15803d' }} />}
          Permissions / données manquantes
        </h3>
        {missing.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: acq.muted }}>
            Toutes les sondes sync sont accessibles (ads + organique insights). Complétion vidéo fine / benchmarking concurrentiel Meta non exposés en API standard — Ad Library manuelle.
          </p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {missing.map((c) => (
              <li key={c.id} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                NON · {c.label}
                {c.missingPermission ? ` → ajouter ${c.missingPermission}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
