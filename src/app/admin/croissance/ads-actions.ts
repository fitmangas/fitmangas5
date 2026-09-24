'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  activateMetaCampaign,
  createMetaCampaignDraft,
  fetchMetaAdsInsights,
} from '@/lib/acquisition/ads/meta-ads-client';
import { getAdsConnectionState, isMetaAdsEnabled } from '@/lib/acquisition/ads/config';
import {
  ensureAdCreativeSeed,
  getCampaignById,
  insertDraftCampaign,
  isAdsSchemaReady,
  listAdCampaigns,
  markCampaignActive,
  upsertDailyMetricsFromInsights,
} from '@/lib/acquisition/ads/repository';
import { STRATEGY_CAMPAIGN_BLUEPRINTS } from '@/lib/acquisition/ads/strategy-content';

export type ActionResult = { ok: true; detail: string; data?: unknown } | { ok: false; error: string };

export async function adsEnsureCreativeSeed(): Promise<ActionResult> {
  await requireAdmin();
  const { upserted } = await ensureAdCreativeSeed();
  return { ok: true, detail: upserted ? `${upserted} créative(s) seedées.` : 'Bibliothèque déjà prête.' };
}

export async function adsCreateStrategyDrafts(): Promise<ActionResult> {
  await requireAdmin();
  if (!(await isAdsSchemaReady())) {
    return { ok: false, error: 'Tables Ads absentes — appliquer la migration.' };
  }

  const existing = await listAdCampaigns();
  if (existing.ok) {
    const hasDrafts = existing.items.some((c) => c.status === 'draft' && c.channel === 'meta');
    if (hasDrafts) {
      return { ok: true, detail: 'Brouillons stratégie déjà présents — pas de doublon.' };
    }
  }

  const created: string[] = [];
  const pushToMeta = isMetaAdsEnabled() && getAdsConnectionState().configured;

  for (const bp of STRATEGY_CAMPAIGN_BLUEPRINTS) {
    const budgetCents = bp.suggestedDailyBudgetEur * 100;
    let metaId: string | null = null;

    if (pushToMeta) {
      const remote = await createMetaCampaignDraft({
        name: `FitMangas · ${bp.labelFr}`,
        dailyBudgetCents: budgetCents,
        objectiveApi: bp.id === 'hot_trial' ? 'OUTCOME_SALES' : 'OUTCOME_LEADS',
      });
      if (!remote.ok) {
        return {
          ok: false,
          error: `Échec Meta brouillon « ${bp.labelFr} » : ${remote.error}`,
        };
      }
      metaId = remote.campaignId;
    }

    const local = await insertDraftCampaign({
      channel: 'meta',
      name: `FitMangas · ${bp.labelFr}`,
      objective: bp.id,
      dailyBudgetCents: budgetCents,
      metaCampaignId: metaId,
      notes: pushToMeta
        ? 'Brouillon Meta PAUSED — activation = double confirmation UI.'
        : 'Brouillon local uniquement (Meta Ads non connecté / flag OFF).',
    });
    if (!local.ok) return { ok: false, error: local.error };
    created.push(local.campaign.name);
  }

  return {
    ok: true,
    detail: pushToMeta
      ? `${created.length} campagnes créées en BROUILLON Meta (PAUSED) + CRM.`
      : `${created.length} brouillons locaux créés (Meta non activé — voir ADS-SETUP.md).`,
    data: { names: created, pushedToMeta: pushToMeta },
  };
}

/**
 * Activation avec double confirmation + budget affiché.
 * confirmStep1 + confirmStep2 + budgetCentsExact obligatoires.
 */
export async function adsActivateCampaign(params: {
  campaignId: string;
  confirmStep1: boolean;
  confirmStep2: boolean;
  budgetCentsExact: number;
}): Promise<ActionResult> {
  await requireAdmin();

  if (!params.confirmStep1 || !params.confirmStep2) {
    return { ok: false, error: 'Double confirmation obligatoire (2 cases cochées).' };
  }

  const found = await getCampaignById(params.campaignId);
  if (!found.ok) return { ok: false, error: found.error };
  const campaign = found.campaign;

  if (campaign.status === 'active') {
    return { ok: false, error: 'Campagne déjà active.' };
  }
  if (campaign.dailyBudgetCents == null) {
    return { ok: false, error: 'Budget quotidien manquant sur la campagne.' };
  }
  if (params.budgetCentsExact !== campaign.dailyBudgetCents) {
    return {
      ok: false,
      error: `Le budget saisi (${(params.budgetCentsExact / 100).toFixed(2)} €) ne correspond pas au budget annoncé (${(campaign.dailyBudgetCents / 100).toFixed(2)} €/jour).`,
    };
  }

  if (campaign.metaCampaignId) {
    const remote = await activateMetaCampaign({
      metaCampaignId: campaign.metaCampaignId,
      confirmBudgetCents: params.budgetCentsExact,
      expectedDailyBudgetCents: campaign.dailyBudgetCents,
      humanConfirmedTwice: true,
    });
    if (!remote.ok) return { ok: false, error: remote.error };
  } else if (isMetaAdsEnabled()) {
    return {
      ok: false,
      error: 'Pas d’ID Meta sur ce brouillon — recrée les brouillons avec Meta connecté.',
    };
  } else {
    return {
      ok: false,
      error: 'META_ADS_ENABLED=OFF — impossible d’engager un budget. Voir docs/ADS-SETUP.md.',
    };
  }

  const marked = await markCampaignActive({ id: campaign.id });
  if (!marked.ok) return { ok: false, error: marked.error };

  return {
    ok: true,
    detail: `Campagne « ${campaign.name} » ACTIVÉE — budget ${(campaign.dailyBudgetCents / 100).toFixed(2)} €/jour.`,
  };
}

export async function adsSyncInsights(): Promise<ActionResult> {
  await requireAdmin();
  const result = await fetchMetaAdsInsights({ datePreset: 'last_7d' });
  if (!result.ok) return { ok: false, error: result.error };
  if (!result.connected) {
    return { ok: true, detail: result.message, data: { connected: false } };
  }

  const campaigns = await listAdCampaigns();
  if (!campaigns.ok) return { ok: false, error: campaigns.error };

  const today = new Date().toISOString().slice(0, 10);
  const rows: Array<{
    campaignId: string;
    metricDate: string;
    spendCents: number;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number | null;
    cplCents: number | null;
  }> = [];

  for (const insight of result.insights) {
    const match = campaigns.items.find((c) => c.metaCampaignId === insight.campaignId);
    if (!match) continue;
    rows.push({
      campaignId: match.id,
      metricDate: today,
      spendCents: Math.round(insight.spend * 100),
      impressions: insight.impressions,
      clicks: insight.clicks,
      leads: insight.leads,
      ctr: insight.ctr,
      cplCents: insight.cpl != null ? Math.round(insight.cpl * 100) : null,
    });
  }

  await upsertDailyMetricsFromInsights(rows);
  return {
    ok: true,
    detail:
      rows.length > 0
        ? `${rows.length} campagne(s) syncées (insights 7 j).`
        : `${result.insights.length} insight(s) Meta lus — aucune campagne CRM liée (crée les brouillons d’abord).`,
    data: { insights: result.insights.length, synced: rows.length },
  };
}
