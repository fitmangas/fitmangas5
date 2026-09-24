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
import { resolveCroissanceTab } from '@/components/Admin/croissance/croissance-tabs';

describe('ads config (flag OFF par défaut)', () => {
  it('META_ADS_ENABLED défaut = false', () => {
    expect(isMetaAdsEnabled()).toBe(false);
  });

  it('état connexion honnête sans faux chiffres', () => {
    const state = getAdsConnectionState();
    expect(state.enabledFlag).toBe(false);
    expect(state.connected).toBe(false);
    expect(state.message.toLowerCase()).toMatch(/flag off|attente|préparée/);
    expect(state.blockers.length).toBeGreaterThan(0);
  });
});

describe('garde-fou activation budget', () => {
  it('refuse sans double confirmation', async () => {
    const r = await activateMetaCampaign({
      metaCampaignId: '123',
      confirmBudgetCents: 1500,
      expectedDailyBudgetCents: 1500,
      humanConfirmedTwice: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/confirmation/i);
  });

  it('refuse si budget ne matche pas', async () => {
    const r = await activateMetaCampaign({
      metaCampaignId: '123',
      confirmBudgetCents: 1000,
      expectedDailyBudgetCents: 1500,
      humanConfirmedTwice: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/budget/i);
  });

  it('refuse si flag OFF même avec confirmations', async () => {
    const r = await activateMetaCampaign({
      metaCampaignId: '123',
      confirmBudgetCents: 1500,
      expectedDailyBudgetCents: 1500,
      humanConfirmedTwice: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/META_ADS_ENABLED|OFF/i);
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
