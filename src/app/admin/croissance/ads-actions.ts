'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { getSocialCommsBoard, saveSocialCommsBoard } from '@/lib/admin/social-comms';
import {
  buildCmDraftFromPlanItem,
  indexPlanCmLinks,
  planItemIdFromSourceRef,
} from '@/lib/acquisition/ads/plan-to-cm';
import { advancePlanCreativeStatus } from '@/lib/acquisition/ads/pipeline-sync';
import {
  activateMetaCampaign,
  createMetaCampaignDraft,
  fetchMetaAdsInsights,
} from '@/lib/acquisition/ads/meta-ads-client';
import { getAdsConnectionState, isMetaAdsEnabled } from '@/lib/acquisition/ads/config';
import { loadAdsIntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import {
  ensureAdCreativeSeed,
  getCampaignById,
  insertDraftCampaign,
  isAdsSchemaReady,
  listAdCampaigns,
  markCampaignActive,
  upsertDailyMetricsFromInsights,
} from '@/lib/acquisition/ads/repository';
import { runAdsIntelligenceSync } from '@/lib/acquisition/ads/sync-intelligence';
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
        objectiveApi: bp.id === 'hot_trial' ? 'OUTCOME_SALES' : bp.id === 'cold_quiz' ? 'OUTCOME_TRAFFIC' : 'OUTCOME_LEADS',
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
 * Pousse UNIQUEMENT la campagne froide/quiz en PAUSED (8 €/j) — zéro activation.
 * Idempotent si un brouillon cold_quiz avec meta_campaign_id existe déjà.
 */
export async function adsCreateColdQuizPausedDraft(): Promise<ActionResult> {
  await requireAdmin();
  if (!(await isAdsSchemaReady())) {
    return { ok: false, error: 'Tables Ads absentes — appliquer la migration.' };
  }
  if (!isMetaAdsEnabled() || !getAdsConnectionState().configured) {
    return {
      ok: false,
      error: 'META_ADS_ENABLED + token + Ad Account requis pour pousser un brouillon Meta.',
    };
  }

  const bp = STRATEGY_CAMPAIGN_BLUEPRINTS.find((b) => b.id === 'cold_quiz');
  if (!bp) return { ok: false, error: 'Blueprint cold_quiz introuvable.' };

  const existing = await listAdCampaigns();
  if (existing.ok) {
    const cold = existing.items.find((c) => c.objective === 'cold_quiz' && c.metaCampaignId);
    if (cold) {
      return {
        ok: true,
        detail: `Campagne froide déjà liée à Meta (${cold.metaCampaignId}) — statut CRM ${cold.status}.`,
        data: { campaignId: cold.id, metaCampaignId: cold.metaCampaignId },
      };
    }
  }

  const budgetCents = bp.suggestedDailyBudgetEur * 100;
  const remote = await createMetaCampaignDraft({
    name: `FitMangas · ${bp.labelFr}`,
    dailyBudgetCents: budgetCents,
    objectiveApi: 'OUTCOME_TRAFFIC',
  });
  if (!remote.ok) return { ok: false, error: remote.error };

  const local = await insertDraftCampaign({
    channel: 'meta',
    name: `FitMangas · ${bp.labelFr}`,
    objective: 'cold_quiz',
    dailyBudgetCents: budgetCents,
    metaCampaignId: remote.campaignId,
    notes: `Meta PAUSED · ${bp.suggestedDailyBudgetEur} €/j · trafic quiz · audience froide FR — NE PAS ACTIVER sans double confirm Kevin.`,
  });
  if (!local.ok) return { ok: false, error: local.error };

  return {
    ok: true,
    detail: `Brouillon froid PAUSED créé sur Meta (${remote.campaignId}) · ${bp.suggestedDailyBudgetEur} €/j · zéro diffusion.`,
    data: { campaignId: local.campaign.id, metaCampaignId: remote.campaignId, dailyBudgetCents: budgetCents },
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

/** Sync complète Ads + organique → snapshots (cron manuel de secours). */
export async function adsRunIntelligenceSync(): Promise<ActionResult> {
  await requireAdmin();
  const result = await runAdsIntelligenceSync('manual');
  if (!result.ok) {
    return {
      ok: false,
      error: `Sync partielle · ${result.detail.errors.slice(0, 3).join(' · ') || 'voir logs'}`,
    };
  }
  return {
    ok: true,
    detail: `Sync OK · ${result.detail.insightsRows} insights · ${result.detail.breakdownRows} breakdowns · ${result.detail.organicMedia} médias IG · ${result.detail.organicDays ?? 0} jours compte · ${result.detail.demographicsRows ?? 0} lignes démographie.`,
    data: result,
  };
}

export async function adsSetCreativeStatus(params: { itemId: string; status: string | null }): Promise<ActionResult> {
  await requireAdmin();
  const { CREATIVE_STATUSES } = await import('@/lib/acquisition/ads/stats-compute');
  const { saveCreativeStatus } = await import('@/lib/acquisition/ads/pipeline-persist');
  if (params.status != null && !(CREATIVE_STATUSES as readonly string[]).includes(params.status)) {
    return { ok: false, error: 'Statut inconnu.' };
  }
  try {
    const statuses = await saveCreativeStatus(
      params.itemId.slice(0, 120),
      params.status as (typeof CREATIVE_STATUSES)[number] | null,
    );
    return { ok: true, detail: 'Statut créative enregistré.', data: { statuses } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Enregistrement impossible.' };
  }
}

export async function adsRegenerateSituationBrief(): Promise<ActionResult> {
  await requireAdmin();
  const bundle = await loadAdsIntelligenceBundle();
  const { loadStoredActionPlan } = await import('@/lib/acquisition/ads/coach-persist');
  const { regenerateAndPersistSituationBrief } = await import('@/lib/acquisition/ads/situation-brief');
  const plan = (await loadStoredActionPlan())?.items ?? [];
  const brief = await regenerateAndPersistSituationBrief(bundle, plan);
  return {
    ok: true,
    detail: brief.source === 'ai' ? `Lecture régénérée (${brief.provider}).` : (brief.note ?? 'Lecture automatique.'),
    data: { brief },
  };
}

export async function adsLoadCoachAdvice(): Promise<ActionResult> {
  await requireAdmin();
  const bundle = await loadAdsIntelligenceBundle();
  const { regenerateAndPersistCoach } = await import('@/lib/acquisition/ads/coach-persist');
  const { advice, aiNote, plan, planNote } = await regenerateAndPersistCoach(bundle, { force: true });
  return {
    ok: true,
    detail: aiNote ?? planNote ?? 'Conseils + plan régénérés (dédup off en manuel).',
    data: { advice, aiNote, plan, planNote },
  };
}

export async function adsLoadActionPlan(): Promise<ActionResult> {
  await requireAdmin();
  const { loadStoredActionPlan, regenerateAndPersistCoach } = await import('@/lib/acquisition/ads/coach-persist');
  const stored = await loadStoredActionPlan();
  if (stored?.items?.length) {
    return { ok: true, detail: stored.aiNote ?? 'Plan stocké.', data: { plan: stored.items, planNote: stored.aiNote } };
  }
  const bundle = await loadAdsIntelligenceBundle();
  const { plan, planNote } = await regenerateAndPersistCoach(bundle, { force: true });
  return { ok: true, detail: planNote ?? 'Plan généré.', data: { plan, planNote } };
}

/**
 * Transformer un média IG gagnant en brouillon campagne Meta PAUSED (0 € diffusion).
 */
/** Crée un brouillon CM pré-rempli depuis une inspiration du Plan d’action Ads. */
export async function adsCreateCmDraftFromPlan(params: { planItemId: string }): Promise<ActionResult> {
  await requireAdmin();
  const planItemId = params.planItemId.trim();
  if (!planItemId) return { ok: false, error: 'Id Plan manquant.' };

  const { loadStoredActionPlan, regenerateAndPersistCoach } = await import('@/lib/acquisition/ads/coach-persist');
  let items = (await loadStoredActionPlan())?.items ?? [];
  let item = items.find((i) => i.id === planItemId);
  if (!item) {
    const bundle = await loadAdsIntelligenceBundle();
    const regen = await regenerateAndPersistCoach(bundle, { force: false });
    items = regen.plan;
    item = items.find((i) => i.id === planItemId);
  }
  if (!item) {
    return { ok: false, error: 'Inspiration Plan introuvable — régénère le plan puis réessaie.' };
  }
  if (item.creativeType === 'autre') {
    return { ok: false, error: 'Cette ligne n’est pas une créative à tourner dans le CM.' };
  }

  const board = await getSocialCommsBoard();
  const links = indexPlanCmLinks(board.posts);
  const existing = links[planItemId];
  if (existing) {
    await advancePlanCreativeStatus(planItemId, 'brouillon');
    revalidatePath('/admin/croissance');
    revalidatePath('/admin/community');
    return {
      ok: true,
      detail: `Brouillon CM déjà présent : « ${existing.title ?? item.title} » — onglet Programmation & Publication.`,
      data: { postId: existing.postId, planItemId, alreadyExists: true },
    };
  }

  const now = new Date().toISOString();
  const post = buildCmDraftFromPlanItem(item, now);
  await saveSocialCommsBoard({
    ...board,
    posts: [post, ...board.posts].slice(0, 80),
  });
  await advancePlanCreativeStatus(planItemId, 'brouillon');
  revalidatePath('/admin/croissance');
  revalidatePath('/admin/community');

  return {
    ok: true,
    detail: `Brouillon créé dans Programmation & Publication — thème, angle, overlay et brief tournage pré-remplis.`,
    data: { postId: post.id, planItemId },
  };
}

export async function adsBoostOrganicToPausedDraft(params: {
  igMediaId: string;
  captionHint?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!(await isAdsSchemaReady())) {
    return { ok: false, error: 'Tables Ads absentes — migration requise.' };
  }
  if (!isMetaAdsEnabled() || !getAdsConnectionState().configured) {
    return { ok: false, error: 'META_ADS_ENABLED + token Ads requis.' };
  }

  const hint = (params.captionHint ?? params.igMediaId).slice(0, 40).replace(/\s+/g, ' ');
  const name = `FitMangas · Boost organique · ${hint}`.slice(0, 100);
  const budgetCents = 800;

  const remote = await createMetaCampaignDraft({
    name,
    dailyBudgetCents: budgetCents,
    objectiveApi: 'OUTCOME_TRAFFIC',
  });
  if (!remote.ok) return { ok: false, error: remote.error };

  const local = await insertDraftCampaign({
    channel: 'meta',
    name,
    objective: 'cold_quiz',
    dailyBudgetCents: budgetCents,
    metaCampaignId: remote.campaignId,
    notes: `Depuis IG media ${params.igMediaId} · Meta PAUSED · 8 €/j prévu · NE PAS ACTIVER sans double confirm. Créative à brancher manuellement sur le média source.`,
  });
  if (!local.ok) return { ok: false, error: local.error };

  try {
    const board = await getSocialCommsBoard();
    for (const post of board.posts) {
      if (post.metaExternalId !== params.igMediaId) continue;
      const planId = planItemIdFromSourceRef(post.sourceRef);
      if (planId) {
        const { markPlanCreativeBoosted } = await import('@/lib/acquisition/ads/pipeline-sync');
        await markPlanCreativeBoosted(planId);
      }
    }
  } catch (e) {
    console.error('[adsBoostOrganic] pipeline sync', e);
  }

  revalidatePath('/admin/croissance');

  return {
    ok: true,
    detail: `Brouillon PAUSED créé (${remote.campaignId}) depuis le contenu organique — 0 € tant que non activé.`,
    data: {
      campaignId: local.campaign.id,
      metaCampaignId: remote.campaignId,
      igMediaId: params.igMediaId,
    },
  };
}

export async function adsCreateRefreshCreativeDraft(params: {
  entityName?: string | null;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!(await isAdsSchemaReady())) {
    return { ok: false, error: 'Tables Ads absentes.' };
  }
  const label = (params.entityName ?? 'créative').slice(0, 40);
  const name = `FitMangas · Refresh · ${label}`.slice(0, 100);
  const budgetCents = 800;
  let metaId: string | null = null;

  if (isMetaAdsEnabled() && getAdsConnectionState().configured) {
    const remote = await createMetaCampaignDraft({
      name,
      dailyBudgetCents: budgetCents,
      objectiveApi: 'OUTCOME_TRAFFIC',
    });
    if (!remote.ok) return { ok: false, error: remote.error };
    metaId = remote.campaignId;
  }

  const local = await insertDraftCampaign({
    channel: 'meta',
    name,
    objective: 'cold_quiz',
    dailyBudgetCents: budgetCents,
    metaCampaignId: metaId,
    notes: 'Refresh créative (fatigue/kill) · PAUSED · double confirm obligatoire pour activer.',
  });
  if (!local.ok) return { ok: false, error: local.error };

  return {
    ok: true,
    detail: metaId
      ? `Brouillon refresh PAUSED sur Meta (${metaId}).`
      : `Brouillon refresh local créé (Meta non connecté).`,
    data: { campaignId: local.campaign.id, metaCampaignId: metaId },
  };
}
