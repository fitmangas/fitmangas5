import {
  bilingualSend,
  priceGroupBodyEs,
  priceGroupBodyFr,
  priceSoloBodyEs,
  priceSoloBodyFr,
  QR_AFTER_PITCH,
  QR_RESOURCE,
  QR_TRIAL_GROUP,
  QR_TRIAL_SOLO,
} from '@/lib/acquisition/copy-bilingual';
import { isCroissanceV2Enabled } from '@/lib/acquisition/croissance-v2-flag';
import type { AcqWorkflow } from '@/lib/acquisition/types';

import {
  commonA,
  commonB,
  commonC,
  commonD,
  commonE,
  commonF,
  KW_BY_ID,
  POSTPARTUM_WORKFLOW_ID,
  SHARED_BODY_KIND,
  UNIQUE_BODY_BY_ID,
} from './croissance-v2-copy';

function sharedBody(kind: (typeof SHARED_BODY_KIND)[string]): { fr: string; es: string; append: boolean } {
  switch (kind) {
    case 'A':
      return { fr: commonA('fr'), es: commonA('es'), append: true };
    case 'B':
      return { fr: commonB('fr'), es: commonB('es'), append: true };
    case 'C':
      return { fr: commonC('fr'), es: commonC('es'), append: true };
    case 'D':
      return { fr: commonD('fr'), es: commonD('es'), append: true };
    case 'E':
      return { fr: commonE('fr'), es: commonE('es'), append: true };
    case 'F':
      return { fr: commonF('fr'), es: commonF('es'), append: false };
    case 'price':
      return { fr: priceGroupBodyFr(), es: priceGroupBodyEs(), append: true };
    case 'solo':
      return { fr: priceSoloBodyFr(), es: priceSoloBodyEs(), append: true };
  }
}

function v2Buttons(id: string, kind?: string) {
  if (id === POSTPARTUM_WORKFLOW_ID) return undefined;
  if (id === '00000000-0000-4000-8000-00000000002b') return QR_RESOURCE;
  if (kind === 'solo') return QR_TRIAL_SOLO;
  if (kind === 'price' || kind === 'A' || kind === 'B' || kind === 'C' || kind === 'D' || kind === 'E') {
    return QR_TRIAL_GROUP;
  }
  if (UNIQUE_BODY_BY_ID[id]?.appendTrialLink) return QR_AFTER_PITCH;
  return undefined;
}

/** Overlay mémoire seulement — le catalogue DB n’est pas réécrit. */
export function overlayWorkflow(workflow: AcqWorkflow): AcqWorkflow {
  if (!isCroissanceV2Enabled()) return workflow;
  const kw = KW_BY_ID[workflow.id];
  const unique = UNIQUE_BODY_BY_ID[workflow.id];
  const kind = SHARED_BODY_KIND[workflow.id];
  const packed = unique
    ? { fr: unique.fr, es: unique.es, append: unique.appendTrialLink }
    : kind
      ? sharedBody(kind)
      : null;

  let actions = workflow.actions;
  if (packed) {
    const buttons = v2Buttons(workflow.id, kind);
    actions = actions.map((action) => {
      if (action.type !== 'send_message') return action;
      return {
        ...action,
        config: bilingualSend(packed.fr, packed.es, packed.append, buttons),
      };
    });
  }
  if (workflow.id === POSTPARTUM_WORKFLOW_ID) {
    actions = actions.filter((action) => action.type !== 'schedule_followup');
  }

  return {
    ...workflow,
    triggerConfig: kw ? { ...workflow.triggerConfig, keyword: kw } : workflow.triggerConfig,
    actions,
  };
}

export function overlayWorkflows(workflows: AcqWorkflow[]): AcqWorkflow[] {
  if (!isCroissanceV2Enabled()) return workflows;
  return workflows.map(overlayWorkflow);
}

/** Une relance à la fois : la nouvelle remplace toute relance encore programmée. */
export function croissanceV2FollowupInsertPlan(
  runAt: string,
  timeZone: string,
  clamp: (iso: string, tz: string) => string,
): { cancelScheduledFirst: true; runAt: string } {
  return { cancelScheduledFirst: true, runAt: clamp(runAt, timeZone) };
}
