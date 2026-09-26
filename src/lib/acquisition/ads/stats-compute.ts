/**
 * Calculs purs pour les sous-onglets Mes stats + Exécution.
 * Aucune donnée inventée : null = « non mesuré », 0 = zéro réel.
 */

import type { AdsAlert, InsightEntity } from './alerts';
import type { ActionPlanItem } from './action-plan';
import type { AdCampaign } from './config';
import type { DemoRow, OrganicDailyRow, OrganicMediaRow } from './intelligence-repository';

export type PeriodDays = 7 | 28 | 90;

export const ORGANIC_METRICS = [
  'views',
  'reach',
  'totalInteractions',
  'accountsEngaged',
  'profileViews',
  'websiteClicks',
  'profileLinksTaps',
  'follows',
  'unfollows',
  'followerGain',
] as const;

export type OrganicMetric = (typeof ORGANIC_METRICS)[number];

export type PeriodSummary = {
  days: PeriodDays;
  /** Jours réellement présents en base sur la période. */
  coveredDays: number;
  series: OrganicDailyRow[];
  totals: Record<OrganicMetric, number | null>;
  previous: Record<OrganicMetric, number | null> | null;
  /** Variation en % vs période précédente de même durée (null si non comparable). */
  deltaPct: Record<OrganicMetric, number | null>;
  netFollowers: number | null;
  /** Jours couverts par la série follower_count (Meta : 30 j max). */
  followerGainDays: number;
};

function sumMetric(rows: OrganicDailyRow[], key: OrganicMetric): number | null {
  let any = false;
  let s = 0;
  for (const r of rows) {
    const v = r[key];
    if (v == null) continue;
    any = true;
    s += v;
  }
  return any ? s : null;
}

function totalsOf(rows: OrganicDailyRow[]): Record<OrganicMetric, number | null> {
  const out = {} as Record<OrganicMetric, number | null>;
  for (const k of ORGANIC_METRICS) out[k] = sumMetric(rows, k);
  return out;
}

export function pctDelta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** `daily` doit être trié chronologiquement (le plus récent en dernier). */
export function summarizeOrganicPeriod(daily: OrganicDailyRow[], days: PeriodDays): PeriodSummary {
  const series = daily.slice(-days);
  const prevRows = daily.slice(-days * 2, -days);
  const totals = totalsOf(series);
  const comparable = prevRows.length >= Math.ceil(days * 0.8);
  const previous = comparable ? totalsOf(prevRows) : null;
  const deltaPct = {} as Record<OrganicMetric, number | null>;
  for (const k of ORGANIC_METRICS) deltaPct[k] = previous ? pctDelta(totals[k], previous[k]) : null;
  const netFollowers =
    totals.follows != null && totals.unfollows != null ? totals.follows - totals.unfollows : null;
  return {
    days,
    coveredDays: series.length,
    series,
    totals,
    previous,
    deltaPct,
    netFollowers,
    followerGainDays: series.filter((r) => r.followerGain != null).length,
  };
}

export function mediaInteractions(m: OrganicMediaRow): number {
  if (m.totalInteractions != null) return m.totalInteractions;
  return m.likeCount + m.commentsCount + (m.saved ?? 0) + (m.shares ?? 0);
}

/** Taux d’engagement = interactions ÷ portée (%) ; null si portée inconnue. */
export function mediaEngagementRate(m: OrganicMediaRow): number | null {
  if (m.reach == null || m.reach <= 0) return null;
  return (mediaInteractions(m) / m.reach) * 100;
}

export type MediaFilter = 'all' | 'reels' | 'feed';
export type MediaSortKey = 'score' | 'reach' | 'views' | 'engagement' | 'saved' | 'shares' | 'date' | 'watch';

export function filterSortMedia(
  rows: OrganicMediaRow[],
  filter: MediaFilter,
  sort: MediaSortKey,
): OrganicMediaRow[] {
  const f = rows.filter((m) => {
    if (filter === 'reels') return m.mediaProductType === 'REELS';
    if (filter === 'feed') return m.mediaProductType !== 'REELS';
    return true;
  });
  const val = (m: OrganicMediaRow): number => {
    switch (sort) {
      case 'reach':
        return m.reach ?? -1;
      case 'views':
        return m.views ?? -1;
      case 'engagement':
        return mediaEngagementRate(m) ?? -1;
      case 'saved':
        return m.saved ?? -1;
      case 'shares':
        return m.shares ?? -1;
      case 'watch':
        return m.avgWatchTimeMs ?? -1;
      case 'date':
        return m.publishedAt ? Date.parse(m.publishedAt) : 0;
      default:
        return m.score;
    }
  };
  return [...f].sort((a, b) => val(b) - val(a));
}

export function demoShare(rows: DemoRow[]): Array<DemoRow & { pct: number }> {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows.map((r) => ({ ...r, pct: total > 0 ? (r.value / total) * 100 : 0 }));
}

// ─── Exécution ─────────────────────────────────────────────────────────────────────────────

export type CampaignTemperature = 'froid' | 'warm' | 'hot';

export function campaignTemperature(c: Pick<AdCampaign, 'objective' | 'name'>): CampaignTemperature {
  if (c.objective === 'hot_trial') return 'hot';
  if (c.objective === 'warm_retarget') return 'warm';
  const s = c.name.toLowerCase();
  if (/hot|essai|trial/.test(s)) return 'hot';
  if (/warm|retarget/.test(s)) return 'warm';
  return 'froid';
}

/** Rattache les insights Meta (niveau campagne) à la campagne CRM. */
export function matchCampaignInsight(
  c: Pick<AdCampaign, 'metaCampaignId' | 'name'>,
  insights: InsightEntity[],
): InsightEntity | null {
  if (c.metaCampaignId) {
    const byId = insights.find((i) => i.entityId === c.metaCampaignId);
    if (byId) return byId;
  }
  const n = c.name.toLowerCase().trim();
  return insights.find((i) => (i.entityName ?? '').toLowerCase().trim() === n) ?? null;
}

export const CREATIVE_STATUSES = ['a_creer', 'brouillon', 'en_test', 'gagnante', 'a_couper'] as const;
export type CreativeStatus = (typeof CREATIVE_STATUSES)[number];

export const CREATIVE_STATUS_LABELS: Record<CreativeStatus, string> = {
  a_creer: 'À créer',
  brouillon: 'Brouillon · 0 €',
  en_test: 'En test',
  gagnante: 'Gagnante',
  a_couper: 'À couper',
};

/** Benchmarks ADS_EXPERTISE : CPL froid FR ~8–18 € ; kill = 50–100 € sans résultat. */
export const KILL_SPEND_CENTS = 5000;
export const WINNER_MAX_CPL_CENTS = 1200;
export const WINNER_MIN_LEADS = 3;

export function deriveCampaignCreativeStatus(
  c: Pick<AdCampaign, 'status' | 'metaCampaignId'>,
  insight: InsightEntity | null,
  alerts: AdsAlert[],
  entityId: string | null,
): CreativeStatus {
  const killed = alerts.some((a) => a.kind === 'kill' && entityId != null && a.entityId === entityId);
  if (killed) return 'a_couper';
  if (insight && insight.leads >= WINNER_MIN_LEADS && insight.cplCents != null && insight.cplCents <= WINNER_MAX_CPL_CENTS) {
    return 'gagnante';
  }
  if (c.status === 'active' || (insight && insight.spendCents > 0)) return 'en_test';
  return 'brouillon';
}

export type PipelineItem = {
  id: string;
  kind: 'plan' | 'campaign';
  title: string;
  detail: string;
  status: CreativeStatus;
  statusSource: 'auto' | 'manuel';
  spendCents: number | null;
  leads: number | null;
  cplCents: number | null;
  frequency: number | null;
};

export function buildCreativePipeline(params: {
  plan: ActionPlanItem[];
  campaigns: AdCampaign[];
  insights: InsightEntity[];
  alerts: AdsAlert[];
  manualStatuses: Record<string, CreativeStatus>;
}): PipelineItem[] {
  const items: PipelineItem[] = [];
  for (const p of params.plan) {
    if (p.creativeType === 'autre') continue;
    const manual = params.manualStatuses[p.id];
    items.push({
      id: p.id,
      kind: 'plan',
      title: p.title,
      detail: `${p.creativeType.replace(/_/g, ' ')} · ${p.framework} · ${p.market}`,
      status: manual ?? 'a_creer',
      statusSource: manual ? 'manuel' : 'auto',
      spendCents: null,
      leads: null,
      cplCents: null,
      frequency: null,
    });
  }
  const metaObjectives = new Set(params.campaigns.filter((c) => c.metaCampaignId).map((c) => c.objective));
  for (const c of params.campaigns) {
    if (c.status === 'archived') continue;
    // Doublon local d’une campagne déjà poussée sur Meta avec le même objectif.
    if (!c.metaCampaignId && metaObjectives.has(c.objective) && c.status === 'draft') continue;
    const ins = matchCampaignInsight(c, params.insights);
    const manual = params.manualStatuses[`campaign:${c.id}`];
    items.push({
      id: `campaign:${c.id}`,
      kind: 'campaign',
      title: c.name.replace(/^FitMangas\s*·\s*/, ''),
      detail: c.metaCampaignId
        ? `Brouillon Meta PAUSED · ${c.metaCampaignId}`
        : 'Brouillon local uniquement — pas encore poussé sur Meta',
      status: manual ?? deriveCampaignCreativeStatus(c, ins, params.alerts, ins?.entityId ?? c.metaCampaignId),
      statusSource: manual ? 'manuel' : 'auto',
      spendCents: ins?.spendCents ?? 0,
      leads: ins?.leads ?? 0,
      cplCents: ins?.cplCents ?? null,
      frequency: ins?.frequency ?? null,
    });
  }
  return items;
}

export type NextAction = {
  id: string;
  title: string;
  why: string;
  cta: 'sync' | 'create_cold_draft' | 'refresh' | 'activate' | 'produce' | 'wait' | 'plan';
  entityName?: string | null;
  campaignId?: string | null;
};

/**
 * UNE seule prochaine action, par ordre de gravité :
 * kill > fatigue > données périmées > brouillon froid manquant > créative à produire > activation > attendre.
 */
export function computeNextAction(params: {
  lastSyncAt: string | null;
  alerts: AdsAlert[];
  campaigns: AdCampaign[];
  pipeline: PipelineItem[];
  totalSpendCents: number;
  now?: Date;
}): NextAction {
  const now = params.now ?? new Date();
  const kill = params.alerts.find((a) => a.kind === 'kill');
  if (kill) {
    return {
      id: `kill-${kill.entityId ?? 'x'}`,
      title: `Couper « ${kill.entityName ?? 'la campagne'} » et préparer une nouvelle créative`,
      why: kill.detail,
      cta: 'refresh',
      entityName: kill.entityName,
    };
  }
  const fatigue = params.alerts.find((a) => a.kind === 'fatigue');
  if (fatigue) {
    return {
      id: `fatigue-${fatigue.entityId ?? 'x'}`,
      title: `Rafraîchir la créative de « ${fatigue.entityName ?? 'la campagne'} »`,
      why: fatigue.detail,
      cta: 'refresh',
      entityName: fatigue.entityName,
    };
  }
  const stale =
    !params.lastSyncAt || now.getTime() - Date.parse(params.lastSyncAt) > 36 * 3600_000;
  if (stale) {
    return {
      id: 'sync',
      title: 'Lancer une synchronisation Meta',
      why: params.lastSyncAt
        ? 'Dernière synchro il y a plus de 36 h — les décisions se prennent sur des chiffres frais.'
        : 'Aucune synchro encore — impossible de décider sans données.',
      cta: 'sync',
    };
  }
  const cold = params.campaigns.find((c) => c.objective === 'cold_quiz' && c.metaCampaignId);
  if (!cold) {
    return {
      id: 'cold-draft',
      title: 'Créer le brouillon froid PAUSED sur Meta',
      why: 'Sans campagne froide, pas de nouvelles personnes dans le funnel. Brouillon = 0 € tant que tu n’actives pas.',
      cta: 'create_cold_draft',
    };
  }
  const toProduce = params.pipeline.find((p) => p.kind === 'plan' && p.status === 'a_creer');
  const testing = params.pipeline.some((p) => p.status === 'en_test');
  if (params.totalSpendCents === 0 && toProduce) {
    return {
      id: `produce-${toProduce.id}`,
      title: `Tourner la créative : « ${toProduce.title} »`,
      why: `Priorité du plan (${toProduce.detail}). Il faut au moins 2–3 créatives prêtes avant d’activer, pour pouvoir comparer.`,
      cta: 'produce',
    };
  }
  if (params.totalSpendCents === 0 && cold.status !== 'active') {
    return {
      id: `activate-${cold.id}`,
      title: `Décider d’activer la campagne froide (${cold.dailyBudgetCents != null ? `${(cold.dailyBudgetCents / 100).toFixed(0)} €/j` : 'budget à fixer'})`,
      why: 'Créatives prêtes, 0 € dépensé : seule une activation (double confirmation) produira des chiffres réels.',
      cta: 'activate',
      campaignId: cold.id,
    };
  }
  if (testing) {
    return {
      id: 'wait',
      title: 'Laisser tourner — ne rien toucher avant 48–72 h ou 50 € dépensés',
      why: 'Couper trop tôt = décider sur du bruit. Critère de kill : 50–100 € ou 48–72 h sans lead.',
      cta: 'wait',
    };
  }
  return {
    id: 'plan',
    title: 'Mettre à jour le plan d’action avec les derniers chiffres',
    why: 'Rien d’urgent : régénère le plan pour la prochaine série de tests.',
    cta: 'plan',
  };
}
