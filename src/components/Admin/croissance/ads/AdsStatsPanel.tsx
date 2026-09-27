'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Film, Image as ImageIcon, Megaphone, Star, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { acq } from '@/components/acquisition/tokens';
import type { AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import type { IntelligenceBundle, OrganicDailyRow, OrganicMediaRow } from '@/lib/acquisition/ads/intelligence-repository';
import {
  demoShare,
  filterSortMedia,
  mediaEngagementRate,
  mediaInteractions,
  summarizeOrganicPeriod,
  type MediaFilter,
  type MediaSortKey,
  type OrganicMetric,
  type PeriodDays,
} from '@/lib/acquisition/ads/stats-compute';
import type { AdsSubTab, AdsUiLang } from '@/lib/acquisition/ads/ads-glossary';
import {
  ADS_CHART_PALETTE,
  AdsCard,
  AdsTermHint,
  Collapsible,
  HBar,
  KpiTile,
  Segmented,
  SourceTag,
  adsTone,
  compact,
  eur,
  num,
  pct,
  shortDate,
} from './ads-ui';

type Props = {
  intelligence: IntelligenceBundle;
  performance: AdsPerformanceSummary;
  lang?: AdsUiLang;
  onGoTo?: (sub: AdsSubTab) => void;
};

type ChartMetric = OrganicMetric | 'linkClicks' | 'net';

const METRIC_DEFS: Array<{ id: ChartMetric; label: string; hint: string }> = [
  { id: 'views', label: 'Vues', hint: 'Nombre de fois où tes contenus ont été vus' },
  { id: 'reach', label: 'Spectateurs', hint: 'Portée quotidienne additionnée (un compte peut compter plusieurs jours)' },
  { id: 'totalInteractions', label: 'Interactions', hint: 'Likes + commentaires + partages + enregistrements + réponses' },
  { id: 'accountsEngaged', label: 'Comptes engagés', hint: 'Comptes ayant interagi, additionnés jour par jour' },
  { id: 'profileViews', label: 'Visites du profil', hint: 'Passages sur @fit.mangas' },
  { id: 'linkClicks', label: 'Clics sur lien', hint: 'Lien en bio + boutons du profil' },
  { id: 'follows', label: 'Abonnées gagnées', hint: 'Nouveaux abonnements' },
  { id: 'unfollows', label: 'Abonnées perdues', hint: 'Désabonnements' },
  { id: 'net', label: 'Croissance nette', hint: 'Gagnés − perdus sur la période' },
];

const COUNTRY_LABELS: Record<string, string> = {
  FR: 'France',
  MX: 'Mexique',
  ES: 'Espagne',
  BR: 'Brésil',
  US: 'États-Unis',
  BE: 'Belgique',
  CH: 'Suisse',
  CO: 'Colombie',
  AR: 'Argentine',
  CA: 'Canada',
  IT: 'Italie',
  DE: 'Allemagne',
  GB: 'Royaume-Uni',
  PT: 'Portugal',
  MA: 'Maroc',
  VE: 'Venezuela',
  CL: 'Chili',
  PE: 'Pérou',
  IN: 'Inde',
  NL: 'Pays-Bas',
  EC: 'Équateur',
  GT: 'Guatemala',
  DO: 'Rép. dominicaine',
};

const GENDER_LABELS: Record<string, string> = { F: 'Femmes', M: 'Hommes', U: 'Non renseigné' };

function dayValue(r: OrganicDailyRow, m: ChartMetric): number | null {
  if (m === 'linkClicks') {
    if (r.profileLinksTaps == null && r.websiteClicks == null) return null;
    return (r.profileLinksTaps ?? 0) + (r.websiteClicks ?? 0);
  }
  if (m === 'net') {
    if (r.follows == null || r.unfollows == null) return null;
    return r.follows - r.unfollows;
  }
  return r[m];
}

function sumOf(rows: OrganicDailyRow[], m: ChartMetric): number | null {
  let any = false;
  let s = 0;
  for (const r of rows) {
    const v = dayValue(r, m);
    if (v == null) continue;
    any = true;
    s += v;
  }
  return any ? s : null;
}

function deltaOf(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

function watchTime(ms: number | null): string {
  if (ms == null) return '—';
  return `${(ms / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`;
}

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(196,93,62,0.2)',
  background: '#FFFAF5',
  fontSize: 12,
  boxShadow: '0 12px 32px rgba(35,32,29,0.08)',
};

export function AdsStatsPanel({ intelligence, performance, lang = 'fr' }: Props) {
  const [period, setPeriod] = useState<PeriodDays>(28);
  const [metric, setMetric] = useState<ChartMetric>('views');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [mediaSort, setMediaSort] = useState<MediaSortKey>('score');
  const [showAllMedia, setShowAllMedia] = useState(false);

  const daily = intelligence.organicDaily;
  const summary = useMemo(() => summarizeOrganicPeriod(daily, period), [daily, period]);
  const prevRows = useMemo(() => daily.slice(-period * 2, -period), [daily, period]);
  const comparable = prevRows.length >= Math.ceil(period * 0.8);

  const chartData = summary.series.map((r) => ({
    label: shortDate(r.date),
    value: dayValue(r, metric),
    follows: r.follows,
    unfollows: r.unfollows != null ? -r.unfollows : null,
  }));

  const account = intelligence.organicAccount;
  const missing = intelligence.capabilities.filter((c) => !c.accessible);
  const demo = intelligence.demographics;
  const gender = demoShare(demo.gender);
  const age = demoShare(demo.age);
  const country = demoShare(demo.country);
  const city = demoShare(demo.city);
  const fr = country.find((c) => c.key === 'FR');
  const mx = country.find((c) => c.key === 'MX');
  const women = gender.find((g) => g.key === 'F');
  const topAge = age.slice().sort((a, b) => b.value - a.value)[0];

  const engaged28 = summarizeOrganicPeriod(daily, 28).totals.accountsEngaged;
  const media = filterSortMedia(intelligence.organicMedia, mediaFilter, mediaSort);
  const mediaShown = showAllMedia ? media : media.slice(0, 10);

  const ads = intelligence.adsTotals;
  const spendZero = ads.spendCents === 0;
  const blendedCac =
    performance.cacCents ??
    (intelligence.newPaidSubs30d && ads.spendCents > 0 ? Math.round(ads.spendCents / intelligence.newPaidSubs30d) : null);

  const metricLabel = METRIC_DEFS.find((d) => d.id === metric)?.label ?? '';
  const lastDay = summary.series[summary.series.length - 1]?.date;

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-stats">
      {/* ── En-tête + période ─────────────────────────────── */}
      <AdsCard tone="warm" testId="ads-stats-header">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
              {account?.followersCount != null
                ? `${num(account.followersCount)} ${lang === 'es' ? 'seguidoras' : 'abonnées'}`
                : lang === 'es'
                  ? 'Resultados de la cuenta'
                  : 'Résultats du compte'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: acq.muted }}>
              {summary.coveredDays > 0
                ? `${summary.coveredDays} ${lang === 'es' ? 'día(s) de datos' : 'jour(s) de données'}${lastDay ? ` · ${shortDate(lastDay)}` : ''}${comparable ? '' : lang === 'es' ? ' (histórico insuficiente)' : ' (historique insuffisant)'}`
                : lang === 'es'
                  ? 'Aún no hay serie diaria — pulsa « Sincronizar ».'
                  : 'Aucune série quotidienne encore — lance « Synchroniser ».'}
            </p>
          </div>
          <Segmented
            testId="ads-stats-period"
            value={String(period) as '7' | '28' | '90'}
            onChange={(v) => setPeriod(Number(v) as PeriodDays)}
            options={[
              { id: '7', label: '7 j' },
              { id: '28', label: '28 j' },
              { id: '90', label: '90 j' },
            ]}
          />
        </div>
      </AdsCard>

      {/* ── 1. Résultats du compte ───────────────────────── */}
      <AdsCard
        eyebrow="1 · Résultats du compte"
        title="Tendances datées"
        subtitle="Clique sur un chiffre pour afficher sa courbe."
        right={<SourceTag kind="visuel" />}
        testId="ads-stats-account"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" data-testid="ads-stats-kpis">
          {METRIC_DEFS.map((d) => {
            const cur = d.id === 'net' ? summary.netFollowers : sumOf(summary.series, d.id);
            const prev = comparable ? sumOf(prevRows, d.id) : null;
            return (
              <KpiTile
                key={d.id}
                testId={`ads-stats-kpi-${d.id}`}
                label={d.label}
                value={d.id === 'net' && cur != null ? `${cur >= 0 ? '+' : ''}${num(cur)}` : compact(cur)}
                delta={comparable && d.id !== 'net' ? deltaOf(cur, prev) : d.id === 'net' ? undefined : null}
                invertDelta={d.id === 'unfollows'}
                hint={d.id === 'net' && prev != null ? `${d.hint} · période précédente : ${prev >= 0 ? '+' : ''}${num(prev)}` : d.hint}
                spark={summary.series.map((r) => dayValue(r, d.id))}
                active={metric === d.id}
                onClick={() => setMetric(d.id)}
              />
            );
          })}
          <KpiTile
            label="Nouveaux abonnés (série 2)"
            value={compact(summary.totals.followerGain)}
            hint={`Autre mesure Meta (follower_count) — ${summary.followerGainDays} j couverts, 30 j max`}
            testId="ads-stats-kpi-followerGain"
          />
        </div>

        <div className="mt-5 rounded-[1.25rem] border bg-white p-3 sm:p-4" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-trend-chart">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="font-serif text-base font-semibold" style={{ color: acq.ink }}>
              {metricLabel} · {period} jours
            </p>
            <p className="text-xs tabular-nums" style={{ color: acq.muted }}>
              Total {metric === 'net' ? (summary.netFollowers != null ? `${summary.netFollowers >= 0 ? '+' : ''}${summary.netFollowers}` : '—') : num(sumOf(summary.series, metric))}
            </p>
          </div>
          {chartData.length ? (
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {metric === 'follows' || metric === 'unfollows' || metric === 'net' ? (
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} stackOffset="sign">
                    <CartesianGrid stroke="rgba(44,36,30,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} minTickGap={18} />
                    <YAxis tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [Math.abs(Number(v ?? 0)), n === 'follows' ? 'Gagnés' : 'Perdus']} />
                    <Bar dataKey="follows" stackId="f" fill={acq.terracotta} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unfollows" stackId="f" fill="#B9A89A" radius={[0, 0, 4, 4]} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ads-trend-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={acq.terracotta} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={acq.terracotta} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(44,36,30,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} minTickGap={18} />
                    <YAxis tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => compact(v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [num(Number(v ?? 0)), metricLabel]} />
                    <Area type="monotone" dataKey="value" stroke={acq.terracotta} strokeWidth={2.4} fill="url(#ads-trend-fill)" connectNulls dot={period === 7 ? { r: 3, fill: acq.terracotta } : false} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm" style={{ color: acq.muted }}>
              Pas encore de série — lance une synchro.
            </p>
          )}
        </div>
      </AdsCard>

      {/* ── 2. Audience ───────────────────────────────────── */}
      <AdsCard
        eyebrow="2 · Audience"
        title="Qui te suit vraiment"
        subtitle={demo.snapshotDate ? `Démographie des followers Meta au ${shortDate(demo.snapshotDate)}.` : 'Démographie non synchronisée.'}
        right={<SourceTag kind="visuel" />}
        icon={<Users size={18} />}
        testId="ads-stats-audience"
      >
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiTile big label="Femmes" value={women ? pct(women.pct, 0) : '—'} hint={women ? `${num(women.value)} followers` : undefined} testId="ads-stats-aud-women" />
          <KpiTile big label="Tranche n°1" value={topAge?.key ?? '—'} hint={topAge ? `${pct(topAge.pct, 0)} des followers` : undefined} />
          <KpiTile big label="France" value={fr ? pct(fr.pct, 0) : '—'} hint={fr ? `${num(fr.value)} followers · marché primaire` : 'Absent du top pays'} testId="ads-stats-aud-fr" />
          <KpiTile big label="Mexique" value={mx ? pct(mx.pct, 0) : '—'} hint={mx ? `${num(mx.value)} followers · marché secondaire` : 'Hors top 45 pays Meta'} testId="ads-stats-aud-mx" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-[1.25rem] border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-gender">
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: acq.muted }}>
              Genre
            </p>
            {gender.length ? (
              <div className="flex items-center gap-4">
                <div className="h-[150px] w-[150px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gender} dataKey="value" nameKey="key" innerRadius={44} outerRadius={70} paddingAngle={2} stroke="none">
                        {gender.map((g, i) => (
                          <Cell key={g.key} fill={g.key === 'F' ? acq.terracotta : ADS_CHART_PALETTE[(i + 3) % ADS_CHART_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [num(Number(v ?? 0)), GENDER_LABELS[String(n)] ?? String(n)]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2 text-sm">
                  {gender.map((g, i) => (
                    <li key={g.key} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2" style={{ color: acq.ink }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.key === 'F' ? acq.terracotta : ADS_CHART_PALETTE[(i + 3) % ADS_CHART_PALETTE.length] }} />
                        {GENDER_LABELS[g.key] ?? g.key}
                      </span>
                      <span className="tabular-nums font-semibold" style={{ color: acq.ink }}>
                        {pct(g.pct, 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-6 text-sm" style={{ color: acq.muted }}>—</p>
            )}
          </div>

          <div className="rounded-[1.25rem] border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-age">
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: acq.muted }}>
              Âge
            </p>
            {age.length ? (
              <div className="mt-2 h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={age} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <XAxis dataKey="key" tick={{ fontSize: 11, fill: acq.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(0)}%`} dataKey="pct" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [pct(Number(v ?? 0), 1), 'des followers']} />
                    <Bar dataKey="pct" radius={[8, 8, 0, 0]}>
                      {age.map((a) => (
                        <Cell key={a.key} fill={a.key === topAge?.key ? acq.terracotta : '#E7AE98'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-6 text-sm" style={{ color: acq.muted }}>—</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.25rem] border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-countries">
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: acq.muted }}>
              Pays · top 8
            </p>
            <div className="mt-3 space-y-2.5">
              {country.slice(0, 8).map((c) => (
                <HBar
                  key={c.key}
                  label={`${COUNTRY_LABELS[c.key] ?? c.key}${c.key === 'FR' ? ' · primaire' : c.key === 'MX' ? ' · secondaire' : ''}`}
                  value={`${pct(c.pct, 0)} · ${num(c.value)}`}
                  pctValue={(c.value / (country[0]?.value || 1)) * 100}
                  color={c.key === 'FR' || c.key === 'MX' ? acq.terracotta : '#D9C3B4'}
                />
              ))}
              {!country.length ? <p className="text-sm" style={{ color: acq.muted }}>—</p> : null}
            </div>
          </div>
          <div className="rounded-[1.25rem] border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-cities">
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: acq.muted }}>
              Villes · top 8
            </p>
            <div className="mt-3 space-y-2.5">
              {city.slice(0, 8).map((c) => (
                <HBar key={c.key} label={c.key} value={num(c.value)} pctValue={(c.value / (city[0]?.value || 1)) * 100} color="#D9826A" />
              ))}
              {!city.length ? <p className="text-sm" style={{ color: acq.muted }}>—</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border p-4" style={{ borderColor: acq.warmBeigeDeep, backgroundColor: acq.cream }}>
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: acq.muted }}>
              Followers actifs (approximation)
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold" style={{ color: acq.ink }}>
              {engaged28 != null && account?.followersCount ? pct(Math.min(100, (engaged28 / account.followersCount) * 100), 0) : '—'}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: acq.muted }}>
              Comptes engagés sur 28 j ÷ abonnés. L’heure en ligne des followers n’est pas renvoyée par Meta.
            </p>
          </div>
          <div className="rounded-[1.25rem] border p-4" style={{ borderColor: 'rgba(185,28,28,0.3)', backgroundColor: adsTone.badSoft }}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-red-800">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] text-white">!</span>
              Spectateurs récurrents
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-red-900">Non accessible</p>
            <p className="mt-0.5 text-[11px] text-red-800">
              Visible dans Business Suite, pas exposé par l’API Graph. Démographie des spectateurs : réponse vide côté Meta.
            </p>
          </div>
        </div>
      </AdsCard>

      {/* ── 3. Contenu ────────────────────────────────────── */}
      <AdsCard
        eyebrow="3 · Contenu"
        title={`${intelligence.organicMedia.length} posts & Reels récents`}
        subtitle="Taux d’engagement = interactions ÷ portée. Score = signal pour choisir quoi adapter en pub."
        right={<SourceTag kind="visuel" />}
        icon={<Film size={18} />}
        testId="ads-stats-visuels"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            testId="ads-stats-media-filter"
            value={mediaFilter}
            onChange={setMediaFilter}
            options={[
              { id: 'all', label: 'Tous' },
              { id: 'reels', label: 'Reels' },
              { id: 'feed', label: 'Posts' },
            ]}
          />
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: acq.muted }}>
            Trier par
            <select
              value={mediaSort}
              onChange={(e) => setMediaSort(e.target.value as MediaSortKey)}
              className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}
              data-testid="ads-stats-media-sort"
            >
              <option value="score">Score</option>
              <option value="reach">Portée</option>
              <option value="views">Vues</option>
              <option value="engagement">Taux d’engagement</option>
              <option value="saved">Enregistrements</option>
              <option value="shares">Partages</option>
              <option value="watch">Temps de visionnage</option>
              <option value="date">Plus récents</option>
            </select>
          </label>
        </div>

        {/* Desktop : tableau */}
        <div className="mt-4 hidden overflow-x-auto rounded-[1.25rem] border bg-white md:block" style={{ borderColor: acq.warmBeigeDeep }}>
          <table className="min-w-full text-left text-xs" data-testid="ads-stats-organic-table">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.1em]" style={{ color: acq.muted, backgroundColor: acq.cream }}>
                <th className="px-3 py-2.5">Contenu</th>
                <th className="px-2 py-2.5 text-right">Portée</th>
                <th className="px-2 py-2.5 text-right">Vues</th>
                <th className="px-2 py-2.5 text-right">Likes</th>
                <th className="px-2 py-2.5 text-right">Comm.</th>
                <th className="px-2 py-2.5 text-right">Partages</th>
                <th className="px-2 py-2.5 text-right">Enreg.</th>
                <th className="px-2 py-2.5 text-right">Engag.</th>
                <th className="px-2 py-2.5 text-right" title="Temps moyen de visionnage (Reels) — le % de complétion n’est pas fourni par Meta">
                  Visionnage
                </th>
                <th className="px-3 py-2.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {mediaShown.map((m) => (
                <MediaRow key={m.igMediaId} m={m} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile : cartes */}
        <div className="mt-4 grid gap-2.5 md:hidden">
          {mediaShown.map((m) => (
            <MediaCard key={m.igMediaId} m={m} />
          ))}
        </div>

        {media.length > 10 ? (
          <button
            type="button"
            onClick={() => setShowAllMedia((s) => !s)}
            className="mt-3 w-full rounded-full border px-4 py-2 text-xs font-semibold"
            style={{ borderColor: acq.warmBeigeDeep, color: acq.ink, backgroundColor: '#fff' }}
            data-testid="ads-stats-media-more"
          >
            {showAllMedia ? 'Réduire' : `Voir les ${media.length} contenus`}
          </button>
        ) : null}
        {intelligence.organicMedia.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: acq.muted }}>
            Aucun snapshot organique — lance Sync intelligence.
          </p>
        ) : null}
      </AdsCard>

      {/* ── 4. Publicité ──────────────────────────────────── */}
      <AdsCard
        eyebrow="4 · Publicité Meta · 30 jours"
        title="Conversion & argent"
        subtitle={
          spendZero
            ? '0 € dépensé : tous ces chiffres sont de vrais zéros, pas des estimations. Ils se rempliront dès qu’une campagne tournera.'
            : 'Chiffres Meta Ads réels, agrégés par campagne.'
        }
        right={<SourceTag kind="invisible" />}
        icon={<Megaphone size={18} />}
        testId="ads-stats-invisibles"
      >
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: acq.muted }}>
          <AdsTermHint term="cpl" lang={lang} />
          <AdsTermHint term="cac" lang={lang} />
          <AdsTermHint term="ctr" lang={lang} />
          <AdsTermHint term="cpm" lang={lang} />
          <AdsTermHint term="roas" lang={lang} />
          <AdsTermHint term="pixel" lang={lang} />
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" data-testid="ads-stats-ads-kpis">
          <KpiTile big label="Dépense" value={eur(ads.spendCents)} hint={`${num(ads.impressions)} affichages`} />
          <KpiTile big label="Leads" value={num(ads.leads)} hint="Formulaires / quiz attribués par Meta" />
          <KpiTile
            big
            label="CPL"
            value={eur(ads.cplCents)}
            hint={ads.cplCents == null ? (lang === 'es' ? 'Sin lead → sin coste por lead' : 'Pas de lead → pas de coût par lead') : lang === 'es' ? 'Referencia frío FR : 8–18 €' : 'Repère froid FR : 8–18 €'}
          />
          <KpiTile
            big
            label="CAC"
            value={eur(blendedCac)}
            hint={
              blendedCac == null
                ? spendZero
                  ? 'Pas de dépense → pas de coût d’acquisition'
                  : 'Aucune abonnée payante attribuable'
                : 'Dépense ÷ nouvelles abonnées payantes (mixte, toutes sources)'
            }
          />
          <KpiTile label="CTR" value={pct(ads.ctr, 2)} hint="Clics ÷ impressions · repère ≥ 1 %" />
          <KpiTile label="CPM" value={eur(ads.cpmCents)} hint="Coût pour 1 000 impressions" />
          <KpiTile
            label="Fréquence"
            value={ads.frequency != null ? ads.frequency.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—'}
            hint={lang === 'es' ? 'Alerta desgaste : frío > 3–4 · reimpacto > 5–7' : 'Alerte usure : froid > 3–4 · reciblage > 5–7'}
          />
          <KpiTile
            label="ROAS"
            value={ads.roas != null ? `× ${ads.roas.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}` : 'Non mesurable'}
            hint={
              ads.roas != null
                ? `${eur(ads.purchaseValueCents)} d’achats attribués (pixel Purchase) ÷ dépense`
                : 'Le pixel envoie Purchase avec valeur ; il faut de la dépense pour calculer un ROAS'
            }
            testId="ads-stats-roas"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <KpiTile label="Coût / essai" value={eur(performance.costPerTrialCents)} hint="CRM : dépense ÷ essais démarrés" />
          <KpiTile label="Clics lien" value={num(ads.linkClicks)} />
          <KpiTile label="Portée pub" value={num(ads.reach)} />
          <KpiTile label={lang === 'es' ? 'Vistas ≥ 15 s' : 'Vues ≥ 15 s'} value={num(ads.thruplays)} hint={lang === 'es' ? 'Vídeos vistos al menos 15 s' : 'Vidéos vues au moins 15 secondes'} />
        </div>

        {intelligence.trends.length > 1 ? (
          <div className="mt-4 h-[200px] rounded-[1.25rem] border bg-white p-3" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-stats-trends">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intelligence.trends.map((t) => ({ label: shortDate(t.metricDate), spend: t.spendCents / 100, leads: t.leads }))} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="rgba(44,36,30,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: acq.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="spend" name="Dépense €" fill={acq.terracotta} radius={[6, 6, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill="#8C4A33" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        <div className="mt-4" data-testid="ads-stats-breakdowns">
          <Collapsible title="Répartition pub : âge · genre · plateforme · pays" meta={spendZero ? 'Vide tant que 0 € dépensé' : 'Impressions par segment'}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ['Âge', intelligence.breakdowns.age],
                  ['Genre', intelligence.breakdowns.gender],
                  ['Plateforme', intelligence.breakdowns.publisher_platform],
                  ['Pays', intelligence.breakdowns.country],
                ] as const
              ).map(([label, rows]) => {
                const max = Math.max(1, ...rows.map((r) => r.impressions));
                return (
                  <div key={label}>
                    <p className="text-xs font-bold" style={{ color: acq.terracotta }}>
                      {label}
                    </p>
                    <div className="mt-2 space-y-2">
                      {rows.length === 0 ? (
                        <p className="text-xs" style={{ color: acq.muted }}>
                          0 impression
                        </p>
                      ) : (
                        rows.slice(0, 6).map((r) => (
                          <HBar key={r.key} label={r.key} value={`${num(r.impressions)} imp. · ${num(r.leads)} leads`} pctValue={(r.impressions / max) * 100} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Collapsible>
        </div>
      </AdsCard>

      {/* ── 5. Données non accessibles ───────────────────── */}
      <AdsCard
        eyebrow="5 · Transparence"
        title={
          <span className="flex items-center gap-2">
            Données non accessibles
            {missing.length ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white" data-testid="ads-stats-missing-badge">
                {missing.length}
              </span>
            ) : null}
          </span>
        }
        subtitle="Ce que Meta ne donne pas (ou pas encore) — et pourquoi. Rien n’est estimé à leur place."
        icon={missing.length ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
        testId="ads-stats-missing"
      >
        {missing.length === 0 ? (
          <p className="text-sm" style={{ color: acq.muted }}>
            Toutes les sondes sont accessibles.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {missing.map((c) => (
              <li key={c.id} className="rounded-2xl border px-3.5 py-3 text-sm" style={{ borderColor: 'rgba(185,28,28,0.25)', backgroundColor: adsTone.badSoft }}>
                <p className="flex items-start gap-2 font-semibold text-red-900">
                  <span className="mt-0.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">NON</span>
                  {c.label}
                </p>
                {c.missingPermission ? <p className="mt-1 text-xs text-red-800">{c.missingPermission}</p> : null}
                <p className="mt-0.5 text-[11px]" style={{ color: acq.muted }}>
                  {c.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdsCard>
    </div>
  );
}

function MediaThumb({ m, size = 44 }: { m: OrganicMediaRow; size?: number }) {
  const isReel = m.mediaProductType === 'REELS';
  return (
    <span className="relative inline-flex shrink-0 overflow-hidden rounded-xl" style={{ width: size, height: size, backgroundColor: acq.warmBeige }}>
      {m.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-full w-full items-center justify-center" style={{ color: acq.muted }}>
          {isReel ? <Film size={16} /> : <ImageIcon size={16} />}
        </span>
      )}
      {isReel ? (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[8px] font-bold text-white">REEL</span>
      ) : null}
    </span>
  );
}

function MediaRow({ m }: { m: OrganicMediaRow }) {
  const er = mediaEngagementRate(m);
  return (
    <tr className="border-t align-middle" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
      <td className="px-3 py-2">
        <div className="flex max-w-[320px] items-center gap-3">
          <MediaThumb m={m} />
          <div className="min-w-0">
            <p className="truncate font-semibold" title={m.caption ?? ''}>
              {m.boostBadge ? <Star size={11} className="mr-1 inline" style={{ color: acq.terracotta, fill: acq.terracotta }} /> : null}
              {(m.caption ?? m.mediaType ?? m.igMediaId).slice(0, 60)}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[10px]" style={{ color: acq.muted }}>
              {m.publishedAt ? shortDate(m.publishedAt) : ''}
              {m.permalink ? (
                <a href={m.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
                  voir <ExternalLink size={9} />
                </a>
              ) : null}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{num(m.reach)}</td>
      <td className="px-2 py-2 text-right tabular-nums">{num(m.views)}</td>
      <td className="px-2 py-2 text-right tabular-nums">{num(m.likeCount)}</td>
      <td className="px-2 py-2 text-right tabular-nums">{num(m.commentsCount)}</td>
      <td className="px-2 py-2 text-right tabular-nums">{num(m.shares)}</td>
      <td className="px-2 py-2 text-right tabular-nums">{num(m.saved)}</td>
      <td className="px-2 py-2 text-right tabular-nums font-semibold" style={{ color: er != null && er >= 5 ? adsTone.good : acq.ink }}>
        {pct(er, 1)}
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{m.mediaProductType === 'REELS' ? watchTime(m.avgWatchTimeMs) : '—'}</td>
      <td className="px-3 py-2 text-right">
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums" style={{ backgroundColor: m.boostBadge ? acq.terracotta : acq.warmBeige, color: m.boostBadge ? '#fff' : acq.ink }}>
          {m.score.toFixed(0)}
        </span>
      </td>
    </tr>
  );
}

function MediaCard({ m }: { m: OrganicMediaRow }) {
  const er = mediaEngagementRate(m);
  return (
    <article className="rounded-[1.25rem] border bg-white p-3" style={{ borderColor: m.boostBadge ? 'rgba(196,93,62,0.4)' : acq.warmBeigeDeep }}>
      <div className="flex items-start gap-3">
        <MediaThumb m={m} size={56} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold" style={{ color: acq.ink }}>
            {m.boostBadge ? '★ ' : ''}
            {(m.caption ?? m.mediaType ?? '').slice(0, 90)}
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: acq.muted }}>
            {m.publishedAt ? shortDate(m.publishedAt) : ''} · score {m.score.toFixed(0)}
          </p>
        </div>
      </div>
      <dl className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
        {[
          ['Portée', num(m.reach)],
          ['Vues', compact(m.views)],
          ['Engag.', pct(er, 1)],
          [m.mediaProductType === 'REELS' ? 'Vision.' : 'Enreg.', m.mediaProductType === 'REELS' ? watchTime(m.avgWatchTimeMs) : num(m.saved)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl px-1 py-1.5" style={{ backgroundColor: acq.cream }}>
            <dt className="text-[9px] font-bold uppercase" style={{ color: acq.muted }}>
              {k}
            </dt>
            <dd className="text-xs font-semibold tabular-nums" style={{ color: acq.ink }}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-1.5 text-[10px]" style={{ color: acq.mutedLight }}>
        {num(m.likeCount)} likes · {num(m.commentsCount)} comm. · {num(m.shares)} partages · {num(mediaInteractions(m))} interactions
      </p>
    </article>
  );
}
