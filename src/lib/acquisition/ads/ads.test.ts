import { describe, expect, it } from 'vitest';

import {
  getAdsConnectionState,
  isMetaAdsEnabled,
} from '@/lib/acquisition/ads/config';
import { activateMetaCampaign } from '@/lib/acquisition/ads/meta-ads-client';
import {
  ADS_CHANNEL_CARDS,
  ADS_FUNNEL_STEPS,
  STRATEGY_CAMPAIGN_BLUEPRINTS,
} from '@/lib/acquisition/ads/strategy-content';
import { computeAdsAlerts } from '@/lib/acquisition/ads/alerts';
import { resolveCroissanceTab } from '@/components/Admin/croissance/croissance-tabs';

describe('ads config (flag OFF par défaut)', () => {
  it('META_ADS_ENABLED lit l’env (absent = false)', () => {
    const prev = process.env.META_ADS_ENABLED;
    delete process.env.META_ADS_ENABLED;
    expect(isMetaAdsEnabled()).toBe(false);
    if (prev !== undefined) process.env.META_ADS_ENABLED = prev;
  });

  it('état connexion honnête sans faux chiffres', () => {
    const prev = process.env.META_ADS_ENABLED;
    process.env.META_ADS_ENABLED = '0';
    const state = getAdsConnectionState();
    expect(state.enabledFlag).toBe(false);
    expect(state.connected).toBe(false);
    expect(state.message.toLowerCase()).toMatch(/ads|token|flag|attente|system user|app|go/);
    expect(state.blockers.length).toBeGreaterThan(0);
    if (prev !== undefined) process.env.META_ADS_ENABLED = prev;
    else delete process.env.META_ADS_ENABLED;
  });
});

describe('garde-fou activation budget', () => {
  it('refuse sans double confirmation', async () => {
    const r = await activateMetaCampaign({
      metaCampaignId: '123',
      confirmBudgetCents: 800,
      expectedDailyBudgetCents: 800,
      humanConfirmedTwice: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/confirmation/i);
  });

  it('refuse si budget ne matche pas', async () => {
    const r = await activateMetaCampaign({
      metaCampaignId: '123',
      confirmBudgetCents: 500,
      expectedDailyBudgetCents: 800,
      humanConfirmedTwice: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/budget/i);
  });

  it('refuse si flag OFF même avec confirmations', async () => {
    const prev = process.env.META_ADS_ENABLED;
    process.env.META_ADS_ENABLED = '0';
    const r = await activateMetaCampaign({
      metaCampaignId: '123',
      confirmBudgetCents: 800,
      expectedDailyBudgetCents: 800,
      humanConfirmedTwice: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/META_ADS_ENABLED|OFF/i);
    if (prev !== undefined) process.env.META_ADS_ENABLED = prev;
    else delete process.env.META_ADS_ENABLED;
  });
});

describe('stratégie 3 campagnes + multi-canal', () => {
  it('3 blueprints froid / warm / hot', () => {
    expect(STRATEGY_CAMPAIGN_BLUEPRINTS).toHaveLength(3);
    expect(STRATEGY_CAMPAIGN_BLUEPRINTS.map((b) => b.id)).toEqual([
      'cold_quiz',
      'warm_retarget',
      'hot_trial',
    ]);
  });

  it('campagne froide = 8 €/j (fourchette 5–10)', () => {
    const cold = STRATEGY_CAMPAIGN_BLUEPRINTS.find((b) => b.id === 'cold_quiz');
    expect(cold?.suggestedDailyBudgetEur).toBe(8);
  });

  it('funnel Ad → quiz → essai → 39€', () => {
    expect(ADS_FUNNEL_STEPS.length).toBe(5);
    expect(ADS_FUNNEL_STEPS[1]?.title.toLowerCase()).toMatch(/quiz/);
  });

  it('Meta phase 1, autres phase 2', () => {
    const meta = ADS_CHANNEL_CARDS.find((c) => c.id === 'meta');
    expect(meta?.phase).toBe(1);
    expect(meta?.status).toBe('ready');
    const phase2 = ADS_CHANNEL_CARDS.filter((c) => c.phase === 2);
    expect(phase2.length).toBe(3);
    expect(phase2.every((c) => c.note?.includes('Meta'))).toBe(true);
  });
});

describe('onglet ADS dans Croissance', () => {
  it('resolveCroissanceTab accepte ads', () => {
    expect(resolveCroissanceTab('ads', true)).toBe('ads');
    expect(resolveCroissanceTab('publications', true)).toBe('publications');
  });
});

describe('alertes fatigue / kill (zéros honnêtes)', () => {
  it('sans données → trop tôt', () => {
    const a = computeAdsAlerts([]);
    expect(a.some((x) => /trop tôt/i.test(x.title))).toBe(true);
  });

  it('fréquence froide > 3.5 → fatigue', () => {
    const a = computeAdsAlerts([
      {
        entityId: '1',
        entityName: 'FitMangas · Froid quiz',
        level: 'campaign',
        spendCents: 2000,
        frequency: 4.2,
        leads: 1,
        clicks: 10,
        ctr: 1,
        cplCents: 2000,
        impressions: 500,
      },
    ]);
    expect(a.some((x) => x.kind === 'fatigue')).toBe(true);
  });

  it('50 € + 0 lead + CTR bas → kill', () => {
    const a = computeAdsAlerts([
      {
        entityId: '2',
        entityName: 'Cold test',
        level: 'ad',
        spendCents: 6000,
        frequency: 1,
        leads: 0,
        clicks: 2,
        ctr: 0.2,
        cplCents: null,
        impressions: 1000,
      },
    ]);
    expect(a.some((x) => x.kind === 'kill')).toBe(true);
  });
});

describe('ads marche + plan docs', () => {
  it('MARCHE content a FR et MX', async () => {
    const { MARCHE_MARKETS, MARCHE_WANTS, MARCHE_PUB_CONCLUSION } = await import(
      '@/lib/acquisition/ads/marche-content'
    );
    expect(MARCHE_MARKETS.map((m) => m.id)).toEqual(['fr', 'mx']);
    expect(MARCHE_WANTS.length).toBeGreaterThanOrEqual(5);
    expect(MARCHE_PUB_CONCLUSION.length).toBeGreaterThanOrEqual(4);
  });

  it('plan d’action déterministe = hypothèses + brouillon PAUSED', async () => {
    const { buildDeterministicActionPlan } = await import('@/lib/acquisition/ads/action-plan');
    const empty = {
      lastSyncAt: '2026-09-26T00:00:00Z',
      lastSyncOk: true,
      capabilities: [],
      campaigns: [],
      trends: [],
      breakdowns: { age: [], gender: [], publisher_platform: [], country: [], hour: [] },
      organicMedia: [],
      organicAccount: null,
      organicAccountHistory: [],
      alerts: [],
      temperatureCompare: [],
    };
    const items = buildDeterministicActionPlan(empty as never);
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0]?.honesty.toLowerCase()).toMatch(/hypoth|test/);
    expect(items.some((i) => i.action?.type === 'create_cold_draft')).toBe(true);
    expect(items.some((i) => i.framework === 'PAS' || i.framework === 'Hook-Problème-Solution-Preuve')).toBe(
      true,
    );
  });
});
