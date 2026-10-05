import { describe, expect, it } from 'vitest';

import type { ActionPlanItem } from './action-plan';
import {
  adsPlanSourceRef,
  buildCmDraftFromPlanItem,
  buildReelBriefFromPlan,
  indexPlanCmLinks,
  overlayFromPlanTitle,
  planItemIdFromSourceRef,
} from './plan-to-cm';

const item: ActionPlanItem = {
  id: 'plan-dos-15h',
  priority: 1,
  title: 'À 15h ton dos te lâche',
  hypothesis: 'Ce n’est presque jamais les abdos — c’est le rendez-vous manqué.',
  creativeType: 'talking_head',
  framework: 'PAS',
  market: 'FR',
  budgetHint: '8 €/j',
  honesty: 'Hypothèse à tester.',
  action: { type: 'create_cold_draft', label: 'Créer le brouillon' },
  source: 'rules',
  evidence: '0 € dépensé · 120 visites profil',
};

describe('plan-to-cm', () => {
  it('sourceRef ads-plan: aller-retour', () => {
    expect(adsPlanSourceRef('abc')).toBe('ads-plan:abc');
    expect(planItemIdFromSourceRef('ads-plan:abc')).toBe('abc');
    expect(planItemIdFromSourceRef('manual')).toBeNull();
    expect(planItemIdFromSourceRef(null)).toBeNull();
  });

  it('brouillon CM = post manuel pré-rempli (thème, angle, overlay, brief)', () => {
    const post = buildCmDraftFromPlanItem(item, '2026-09-28T00:00:00.000Z');
    expect(post.status).toBe('idea');
    expect(post.sourceType).toBe('manual');
    expect(post.format).toBe('reel');
    expect(post.network).toBe('instagram');
    expect(post.title).toMatch(/15h/);
    expect(post.overlayText).toBe(overlayFromPlanTitle(item.title));
    expect(post.hookTitle).toBe(post.overlayText);
    expect(post.reelScript).toMatch(/THÈME \(Plan Ads\)/);
    expect(post.reelScript).toMatch(/ANGLE/);
    expect(post.reelScript).toMatch(/IDÉES:/);
    expect(post.shotList).toMatch(/Face cam/);
    expect(post.sourceRef).toBe('ads-plan:plan-dos-15h');
    expect(post.alsoPublishFacebook).toBe(true);
    expect(post.alsoPublishTikTok).toBe(true);
  });

  it('brief contient le thème et l’angle du Plan', () => {
    const { reelScript } = buildReelBriefFromPlan(item);
    expect(reelScript).toContain(item.title);
    expect(reelScript).toContain('rendez-vous manqué');
  });

  it('indexe les posts CM liés au Plan', () => {
    const map = indexPlanCmLinks([
      { id: 'sp_1', status: 'idea', title: 'A', sourceRef: 'ads-plan:plan-dos-15h' },
      { id: 'sp_2', status: 'published', title: 'B', sourceRef: null },
    ]);
    expect(map['plan-dos-15h']).toEqual({ postId: 'sp_1', status: 'idea', title: 'A' });
  });
});
