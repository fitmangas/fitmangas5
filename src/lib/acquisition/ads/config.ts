/**
 * Module Ads Croissance — types + config.
 * AUCUNE dépense sans confirmation humaine explicite (double confirm UI).
 */

export type AdChannel = 'meta' | 'tiktok' | 'pinterest' | 'google';
export type AdCampaignObjective = 'cold_quiz' | 'warm_retarget' | 'hot_trial' | 'brand_search' | 'other';
export type AdCampaignStatus = 'draft' | 'paused' | 'active' | 'archived';

export type AdCampaign = {
  id: string;
  channel: AdChannel;
  name: string;
  objective: AdCampaignObjective;
  status: AdCampaignStatus;
  dailyBudgetCents: number | null;
  currency: string;
  metaCampaignId: string | null;
  metaAdsetId: string | null;
  metaAdId: string | null;
  notes: string | null;
  activatedAt: string | null;
  createdAt: string;
};

export type AdMetricsDaily = {
  id: string;
  campaignId: string;
  metricDate: string;
  spendCents: number;
  impressions: number;
  clicks: number;
  leads: number;
  trialStarts: number;
  paidConversions: number;
  ctr: number | null;
  cplCents: number | null;
  cacCents: number | null;
};

export type AdCreative = {
  id: string;
  channel: AdChannel | 'organic_reel';
  title: string;
  angle: string;
  copyFr: string;
  copyEs: string;
  mediaPath: string | null;
  mediaKind: 'image' | 'video' | 'carousel';
  campaignObjective: AdCampaignObjective | null;
  complianceNotes: string | null;
};

export type AdsConnectionState = {
  enabledFlag: boolean;
  configured: boolean;
  connected: boolean;
  blockers: string[];
  adAccountId: string | null;
  message: string;
};

export type AdsPerformanceSummary = {
  connected: boolean;
  spendCents: number | null;
  leads: number | null;
  impressions: number | null;
  clicks: number | null;
  cplCents: number | null;
  cacCents: number | null;
  costPerTrialCents: number | null;
  waitingMessage: string | null;
};

/** Flag runtime — défaut OFF. */
export function isMetaAdsEnabled(): boolean {
  const v = process.env.META_ADS_ENABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function getMetaAdsConfig(): {
  appId: string | null;
  appSecret: string | null;
  accessToken: string | null;
  adAccountId: string | null;
} {
  const adAccountRaw =
    process.env.META_ADS_AD_ACCOUNT_ID?.trim() ||
    process.env.META_AD_ACCOUNT_ID?.trim() ||
    null;
  const adAccountId = adAccountRaw
    ? adAccountRaw.startsWith('act_')
      ? adAccountRaw
      : `act_${adAccountRaw}`
    : null;

  return {
    appId: process.env.META_ADS_APP_ID?.trim() || process.env.META_APP_ID?.trim() || null,
    appSecret: process.env.META_ADS_APP_SECRET?.trim() || process.env.META_APP_SECRET?.trim() || null,
    accessToken:
      process.env.META_ADS_ACCESS_TOKEN?.trim() ||
      process.env.META_ADS_TOKEN?.trim() ||
      null,
    adAccountId,
  };
}

export function getAdsConnectionState(): AdsConnectionState {
  const enabledFlag = isMetaAdsEnabled();
  const cfg = getMetaAdsConfig();
  const blockers: string[] = [];

  if (!enabledFlag) {
    blockers.push('META_ADS_ENABLED est OFF (défaut) — aucune écriture Ads.');
  }
  if (!cfg.accessToken) {
    blockers.push(
      'Token Ads manquant : le token Page messaging a business_management mais PAS ads_read/ads_management. Il faut un System User Ads (voir docs/ADS-SETUP.md).',
    );
  }
  if (!cfg.adAccountId) {
    blockers.push('Ad Account ID manquant (META_ADS_AD_ACCOUNT_ID) — à créer/noter dans Business Manager.');
  }
  if (!cfg.appId) blockers.push('App ID manquant (META_ADS_APP_ID ou META_APP_ID).');

  const configured = Boolean(cfg.accessToken && cfg.adAccountId);
  const connected = enabledFlag && configured;

  let message = 'En attente connexion Meta Ads';
  if (!enabledFlag && cfg.appId && !cfg.accessToken) {
    message =
      'App Meta déjà branchée. Token messaging ≠ token Ads. Reste : System User + Ad Account + App Review ads_* + ton GO pour META_ADS_ENABLED=1.';
  } else if (!enabledFlag) {
    message = 'API Meta Ads préparée — flag OFF. Aucune dépense possible.';
  } else if (!configured) {
    message = 'Flag ON mais accès incomplets — voir docs/ADS-SETUP.md';
  } else {
    message = 'Meta Ads connecté (lecture + brouillons). Activation = confirmation humaine.';
  }

  return {
    enabledFlag,
    configured,
    connected,
    blockers,
    adAccountId: cfg.adAccountId,
    message,
  };
}
