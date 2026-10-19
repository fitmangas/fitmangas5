import { afterEach, describe, expect, it } from 'vitest';

import { workflowMatchesInbound } from './orchestrator';
import { overlayWorkflows, croissanceV2FollowupInsertPlan } from './croissance-v2-overlay';
import { clampFollowupToSendWindow } from './send-window';
import { WORKFLOW_CATALOG, WORKFLOW_CATALOG_COUNT, textMatchesKeyword } from './workflow-catalog';
import { isCroissanceV2Enabled } from '@/lib/acquisition/croissance-v2-flag';
import { captionWordSimilarity, findDuplicateCaption, stripDuplicateTrialCta } from '@/lib/admin/caption-duplicate';
import { isPaidSubscriptionStatus } from '@/lib/acquisition/paid-definition';

describe('CROISSANCE_V2', () => {
  afterEach(() => {
    delete process.env.CROISSANCE_V2;
  });

  it('conserve 43 règles avant et après overlay', () => {
    expect(WORKFLOW_CATALOG_COUNT).toBe(43);
    expect(WORKFLOW_CATALOG).toHaveLength(43);
    process.env.CROISSANCE_V2 = '1';
    expect(overlayWorkflows(WORKFLOW_CATALOG)).toHaveLength(43);
    expect(overlayWorkflows(WORKFLOW_CATALOG).map((w) => w.id).sort()).toEqual(
      [...WORKFLOW_CATALOG.map((w) => w.id)].sort(),
    );
  });

  it('une relance à la fois : la nouvelle remplace les programmées', () => {
    process.env.CROISSANCE_V2 = '1';
    expect(isCroissanceV2Enabled()).toBe(true);
    const plan = croissanceV2FollowupInsertPlan(
      '2026-10-25T19:30:00.000Z',
      'Europe/Paris',
      clampFollowupToSendWindow,
    );
    expect(plan.cancelScheduledFirst).toBe(true);
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' }).format(
        new Date(plan.runAt),
      ),
    );
    expect(hour).toBeGreaterThanOrEqual(9);
    expect(hour).toBeLessThan(20);
  });

  it('« quand tu es dispo » ne déclenche plus la prise de rendez-vous', () => {
    process.env.CROISSANCE_V2 = '1';
    const overlaid = overlayWorkflows(WORKFLOW_CATALOG);
    const hits = overlaid.filter((w) =>
      workflowMatchesInbound(w, {
        triggerType: w.triggerType,
        inboundText: 'quand tu es dispo',
      }),
    );
    expect(hits.some((w) => w.actions.some((a) => a.type === 'book_session_intent'))).toBe(false);
  });

  it('« prix » = une règle par canal', () => {
    process.env.CROISSANCE_V2 = '1';
    const overlaid = overlayWorkflows(WORKFLOW_CATALOG);
    const channels = ['ig_comment_keyword', 'ig_dm_inbound', 'messenger_inbound', 'whatsapp_inbound'] as const;
    for (const channel of channels) {
      const hits = overlaid.filter((w) => {
        const keyword = String(w.triggerConfig.keyword ?? '').trim();
        return (
          w.triggerType === channel &&
          w.enabled &&
          Boolean(keyword) &&
          textMatchesKeyword('prix', keyword) &&
          !keyword.includes('price_group') &&
          !keyword.includes('price_solo')
        );
      });
      expect(hits, channel).toHaveLength(1);
    }
  });

  it('drapeau off : comportement inchangé (pas d’overlay)', () => {
    expect(isCroissanceV2Enabled()).toBe(false);
    expect(overlayWorkflows(WORKFLOW_CATALOG)[0]?.triggerConfig.keyword).toBe(
      WORKFLOW_CATALOG[0]?.triggerConfig.keyword,
    );
  });
});

describe('caption duplicate + CTA', () => {
  it('détecte une similarité > 80 %', () => {
    const a = 'Un tapis suffit. Essai gratuit 7 jours sur fitmangas.com pour un cours en visio.';
    const b = 'Un tapis suffit. Essai gratuit 7 jours sur fitmangas.com pour un cours en visio avec moi.';
    expect(captionWordSimilarity(a, b)).toBeGreaterThan(0.8);
    expect(
      findDuplicateCaption(a, [{ id: '1', caption: b, plannedAt: new Date().toISOString() }]),
    ).not.toBeNull();
  });

  it('n’ajoute pas deux fois Essai gratuit 7 jours', () => {
    const once = stripDuplicateTrialCta('Hello\nEssai gratuit 7 jours\nEssai gratuit 7 jours → fitmangas.com');
    expect(once.match(/essai gratuit 7 jours/gi)?.length).toBe(1);
  });
});

describe('payante', () => {
  it('exclut l’essai', () => {
    expect(isPaidSubscriptionStatus('active')).toBe(true);
    expect(isPaidSubscriptionStatus('trialing')).toBe(false);
  });
});
