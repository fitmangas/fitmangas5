import { describe, expect, it } from 'vitest';

import type { AdCampaign } from './config';
import { purchaseValueCents, type OrganicDailyRow, type OrganicMediaRow } from './intelligence-repository';
import { lastDays } from './organic-rich-sync';
import {
  buildCreativePipeline,
  computeNextAction,
  demoShare,
  filterSortMedia,
  matchCampaignInsight,
  mediaEngagementRate,
  summarizeOrganicPeriod,
  topDemo,
} from './stats-compute';

function day(date: string, views: number, follows = 1, unfollows = 0): OrganicDailyRow {
  return {
    date,
    views,
    reach: views / 2,
    accountsEngaged: 3,
    totalInteractions: 10,
    likes: 8,
    comments: 1,
    shares: 1,
    saves: 0,
    profileViews: 5,
    websiteClicks: 0,
    profileLinksTaps: 1,
    follows,
    unfollows,
    followerGain: null,
  };
}

function media(p: Partial<OrganicMediaRow>): OrganicMediaRow {
  return {
    igMediaId: 'm',
    mediaType: 'VIDEO',
    mediaProductType: 'REELS',
    caption: null,
    permalink: null,
    thumbnailUrl: null,
    publishedAt: '2026-09-01T10:00:00Z',
    likeCount: 0,
    commentsCount: 0,
    reach: null,
    views: null,
    saved: null,
    shares: null,
    score: 0,
    boostBadge: false,
    insightsAvailable: true,
    totalInteractions: null,
    profileVisits: null,
    follows: null,
    avgWatchTimeMs: null,
    totalWatchTimeMs: null,
    ...p,
  };
}

function campaign(p: Partial<AdCampaign>): AdCampaign {
  return {
    id: 'c1',
    channel: 'meta',
    name: 'FitMangas · Froid — Découverte quiz',
    objective: 'cold_quiz',
    status: 'paused',
    dailyBudgetCents: 800,
    currency: 'EUR',
    metaCampaignId: '120248916689610330',
    metaAdsetId: null,
    metaAdId: null,
    notes: null,
    activatedAt: null,
    createdAt: '2026-09-20T00:00:00Z',
    ...p,
  };
}

describe('summarizeOrganicPeriod', () => {
  const rows = Array.from({ length: 14 }, (_, i) =>
    day(`2026-09-${String(i + 1).padStart(2, '0')}`, i < 7 ? 100 : 150, 2, 1),
  );

  it('somme la période et compare à la période précédente', () => {
    const s = summarizeOrganicPeriod(rows, 7);
    expect(s.coveredDays).toBe(7);
    expect(s.totals.views).toBe(1050);
    expect(s.previous?.views).toBe(700);
    expect(s.deltaPct.views).toBeCloseTo(50);
    expect(s.netFollowers).toBe(7);
  });

  it('pas de delta inventé si historique insuffisant', () => {
    const s = summarizeOrganicPeriod(rows, 28);
    expect(s.previous).toBeNull();
    expect(s.deltaPct.views).toBeNull();
  });

  it('null reste null (non mesuré ≠ 0)', () => {
    const s = summarizeOrganicPeriod([{ ...day('2026-09-01', 10), followerGain: null }], 7);
    expect(s.totals.followerGain).toBeNull();
  });
});

describe('lastDays', () => {
  it('exclut le jour courant (incomplet)', () => {
    const d = lastDays(3, new Date('2026-09-26T10:00:00Z'));
    expect(d).toEqual(['2026-09-25', '2026-09-24', '2026-09-23']);
  });
});

describe('contenu', () => {
  it('taux d’engagement = interactions ÷ portée', () => {
    expect(mediaEngagementRate(media({ reach: 200, totalInteractions: 20 }))).toBeCloseTo(10);
    expect(mediaEngagementRate(media({ reach: null }))).toBeNull();
  });

  it('filtre Reels / posts et trie', () => {
    const rows = [
      media({ igMediaId: 'a', reach: 10 }),
      media({ igMediaId: 'b', reach: 50, mediaProductType: 'FEED' }),
      media({ igMediaId: 'c', reach: 30 }),
    ];
    expect(filterSortMedia(rows, 'reels', 'reach').map((m) => m.igMediaId)).toEqual(['c', 'a']);
    expect(filterSortMedia(rows, 'feed', 'reach').map((m) => m.igMediaId)).toEqual(['b']);
  });

  it('parts démographiques', () => {
    const s = demoShare([
      { key: 'F', value: 75 },
      { key: 'M', value: 25 },
    ]);
    expect(s[0]!.pct).toBe(75);
  });

  it('topDemo ignore l’ordre (âge 13-17 en premier ≠ le plus nombreux)', () => {
    const top = topDemo([
      { key: '13-17', value: 7 },
      { key: '25-34', value: 984 },
      { key: '35-44', value: 649 },
    ]);
    expect(top?.key).toBe('25-34');
  });
});

describe('exécution', () => {
  const insight = {
    entityId: '120248916689610330',
    entityName: 'x',
    level: 'campaign',
    spendCents: 6000,
    frequency: 2,
    leads: 0,
    clicks: 3,
    ctr: 0.2,
    cplCents: null,
    impressions: 2000,
  };

  it('relie la campagne CRM aux insights Meta par ID', () => {
    expect(matchCampaignInsight(campaign({}), [insight])?.spendCents).toBe(6000);
  });

  it('statut « à couper » quand une alerte kill vise la campagne', () => {
    const p = buildCreativePipeline({
      plan: [],
      campaigns: [campaign({ status: 'active' })],
      insights: [insight],
      alerts: [{ id: 'k', severity: 'critical', kind: 'kill', title: 'Kill', detail: '', entityId: insight.entityId, entityName: 'x' }],
      manualStatuses: {},
    });
    expect(p[0]!.status).toBe('a_couper');
  });

  it('statut manuel prioritaire pour une créative du plan', () => {
    const p = buildCreativePipeline({
      plan: [
        {
          id: 'p1',
          priority: 1,
          title: 'Talking-head dos 15h',
          hypothesis: '',
          creativeType: 'talking_head',
          framework: 'PAS',
          market: 'FR',
          budgetHint: '',
          honesty: '',
          action: null,
          source: 'rules',
        },
      ],
      campaigns: [],
      insights: [],
      alerts: [],
      manualStatuses: { p1: 'brouillon' },
    });
    expect(p[0]).toMatchObject({ status: 'brouillon', statusSource: 'manuel' });
  });

  it('valeur d’achat Meta : pas de double comptage entre action_type', () => {
    expect(
      purchaseValueCents({
        action_values: [
          { action_type: 'omni_purchase', value: '39' },
          { action_type: 'offsite_conversion.fb_pixel_purchase', value: '39' },
        ],
      }),
    ).toBe(3900);
    expect(purchaseValueCents({})).toBe(0);
  });

  it('pas de doublon : brouillon local ignoré si la même campagne est déjà sur Meta', () => {
    const p = buildCreativePipeline({
      plan: [],
      campaigns: [campaign({}), campaign({ id: 'c2', metaCampaignId: null, status: 'draft' })],
      insights: [],
      alerts: [],
      manualStatuses: {},
    });
    expect(p).toHaveLength(1);
    expect(p[0]!.detail).toMatch(/en pause/);
  });

  it('une seule prochaine action : kill avant tout', () => {
    const n = computeNextAction({
      lastSyncAt: new Date().toISOString(),
      alerts: [{ id: 'k', severity: 'critical', kind: 'kill', title: 'Kill', detail: 'd', entityId: '1', entityName: 'Froid' }],
      campaigns: [campaign({})],
      pipeline: [],
      totalSpendCents: 6000,
    });
    expect(n.cta).toBe('refresh');
  });

  it('0 € + créative à produire → produire avant d’activer', () => {
    const n = computeNextAction({
      lastSyncAt: new Date().toISOString(),
      alerts: [],
      campaigns: [campaign({})],
      pipeline: [
        {
          id: 'p1',
          kind: 'plan',
          title: 'T',
          detail: 'd',
          status: 'a_creer',
          statusSource: 'auto',
          spendCents: null,
          leads: null,
          cplCents: null,
          frequency: null,
        },
      ],
      totalSpendCents: 0,
    });
    expect(n.cta).toBe('produce');
  });

  it('synchro périmée → synchroniser', () => {
    const n = computeNextAction({
      lastSyncAt: '2026-09-01T00:00:00Z',
      alerts: [],
      campaigns: [],
      pipeline: [],
      totalSpendCents: 0,
      now: new Date('2026-09-26T00:00:00Z'),
    });
    expect(n.cta).toBe('sync');
  });
});
