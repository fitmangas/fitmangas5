import { detectAcquisitionMarket, workflowKeywordPriority } from '@/lib/acquisition/market';
import type { AcqWorkflow } from '@/lib/acquisition/types';

import {
  actionAskFollowGate,
  runWorkflowAction,
  type ActionContext,
} from './actions';
import {
  inferPendingIntent,
  isExistingPayingMember,
  shouldAskFollowGate,
} from './follow-gate';
import {
  isRealInfoOrTrialRequest,
  memberWarmReplyEs,
  memberWarmReplyFr,
  softDeclineReplyEs,
  softDeclineReplyFr,
  SOFT_DECLINE_TAG,
  isSoftDeclineText,
} from './soft-decline';
import {
  cancelScheduledFollowups,
  getContact,
  listWorkflows,
  patchContactExternalIds,
  recordWorkflowRun,
  tagContact,
  wasWorkflowRunRecently,
} from './repository';
import { textMatchesKeyword } from './workflow-catalog';

export type OrchestratorResult = {
  workflowId: string;
  ok: boolean;
  steps: Array<{ type: string; ok: boolean; detail: string }>;
};

export const FOLLOW_GATE_INTERCEPT_ID = '00000000-0000-4000-8000-00000000f601';
export const SOFT_DECLINE_INTERCEPT_ID = '00000000-0000-4000-8000-00000000f602';
export const MEMBER_WARM_INTERCEPT_ID = '00000000-0000-4000-8000-00000000f603';

export function workflowMatchesInbound(
  workflow: AcqWorkflow,
  params: {
    triggerType: AcqWorkflow['triggerType'];
    inboundText?: string;
    contact?: import('@/lib/acquisition/types').AcqContact | null;
  },
): boolean {
  if (!workflow.enabled || workflow.triggerType !== params.triggerType) return false;

  if (
    workflow.triggerType === 'ig_comment_keyword' ||
    workflow.triggerType === 'ig_dm_inbound' ||
    workflow.triggerType === 'ig_story_reply' ||
    workflow.triggerType === 'messenger_inbound' ||
    workflow.triggerType === 'whatsapp_inbound'
  ) {
    const kw = workflow.triggerConfig.keyword;
    if (typeof kw === 'string' && kw.trim()) {
      if (!textMatchesKeyword(params.inboundText, kw)) return false;
    }
  }

  const lifecycleIn = workflow.conditions.lifecycle_in;
  if (Array.isArray(lifecycleIn) && lifecycleIn.length > 0) {
    const stage = params.contact?.lifecycleStage ?? 'new';
    if (!lifecycleIn.map(String).includes(stage)) return false;
  }

  return true;
}

export async function runWorkflow(
  workflow: AcqWorkflow,
  ctx: Omit<ActionContext, 'contact'> & { contactId?: string },
): Promise<OrchestratorResult> {
  if (!workflow.enabled) {
    return {
      workflowId: workflow.id,
      ok: false,
      steps: [{ type: 'workflow', ok: false, detail: 'Workflow désactivé.' }],
    };
  }

  const contact = ctx.contactId
    ? await getContact(ctx.contactId)
    : ctx.conversation.contactId
      ? await getContact(ctx.conversation.contactId)
      : null;
  const fullCtx: ActionContext = { ...ctx, contact };

  // Jamais de pitch essai / relance sur soft_decline ou membre payante
  if (contact && ((contact.tags ?? []).includes(SOFT_DECLINE_TAG) || (contact.tags ?? []).includes('optout'))) {
    return {
      workflowId: workflow.id,
      ok: true,
      steps: [{ type: 'workflow', ok: true, detail: 'Ignoré — soft_decline / optout.' }],
    };
  }

  const steps: OrchestratorResult['steps'] = [];
  let allOk = true;

  for (const action of workflow.actions) {
    if (
      contact &&
      isExistingPayingMember(contact) &&
      (action.type === 'send_trial_link' ||
        action.type === 'schedule_followup' ||
        action.type === 'capture_email_optin')
    ) {
      steps.push({
        type: action.type,
        ok: true,
        detail: 'Ignoré — contact déjà en essai / membre.',
      });
      continue;
    }
    const result = await runWorkflowAction(action, fullCtx);
    steps.push({ type: result.type, ok: result.ok, detail: result.detail });
    if (!result.ok) allOk = false;
  }

  await recordWorkflowRun({
    workflowId: workflow.id,
    contactId: contact?.id,
    conversationId: ctx.conversation.id,
    status: allOk ? 'ok' : steps.some((s) => s.ok) ? 'partial' : 'error',
    log: steps,
  });

  return { workflowId: workflow.id, ok: allOk, steps };
}

export async function runInboundTrigger(params: {
  triggerType: AcqWorkflow['triggerType'];
  conversation: ActionContext['conversation'];
  contactId?: string;
  inboundText?: string;
  market?: 'fr' | 'mx';
  commentId?: string | null;
  workflows?: AcqWorkflow[];
}): Promise<OrchestratorResult[]> {
  let contact = params.contactId ? await getContact(params.contactId) : null;
  let workflows = params.workflows;
  if (!workflows) {
    const wfRes = await listWorkflows();
    workflows = wfRes.ok ? wfRes.items : [];
  }

  const market = params.market ?? detectAcquisitionMarket(params.inboundText);
  const isOptOutKw = (w: AcqWorkflow) =>
    typeof w.triggerConfig.keyword === 'string' &&
    /stop|désinscri|desinscri|unsubscribe|no más|no mas|basta|arrête|arrete|optout|opt-out/i.test(
      w.triggerConfig.keyword,
    );

  const optedOut = (contact?.tags ?? []).includes('optout');
  const softDeclined = (contact?.tags ?? []).includes(SOFT_DECLINE_TAG);

  // 1) Soft-no — avant follow-gate et avant tout pitch
  //    Si elle revient avec une vraie demande, on laisse le flux normal (ré-engagement).
  if (contact && !optedOut && isSoftDeclineText(params.inboundText)) {
    await tagContact(contact.id, SOFT_DECLINE_TAG);
    await cancelScheduledFollowups(contact.id);
    if (contact.email) {
      try {
        const { cancelQuizNurtureForEmail } = await import('@/lib/quiz/lead-nurture');
        await cancelQuizNurtureForEmail(contact.email, 'soft_decline');
      } catch {
        // non bloquant
      }
    }
    const body = market === 'mx' ? softDeclineReplyEs() : softDeclineReplyFr();
    const send = await runWorkflowAction(
      { type: 'send_message', config: { body, appendTrialLink: false } },
      { contact, conversation: params.conversation, inboundText: params.inboundText, market },
    );
    const steps = [
      { type: 'soft_decline', ok: true, detail: 'Soft-no — clôture polie, relances annulées.' },
      { type: send.type, ok: send.ok, detail: send.detail },
    ];
    await recordWorkflowRun({
      workflowId: SOFT_DECLINE_INTERCEPT_ID,
      contactId: contact.id,
      conversationId: params.conversation.id,
      status: send.ok ? 'ok' : 'error',
      log: steps,
    });
    return [{ workflowId: SOFT_DECLINE_INTERCEPT_ID, ok: send.ok, steps }];
  }

  if (
    contact &&
    softDeclined &&
    !optedOut &&
    !isRealInfoOrTrialRequest(params.inboundText)
  ) {
    const steps = [
      { type: 'soft_decline', ok: true, detail: 'Déjà soft_decline — silence (pas de relance).' },
    ];
    await recordWorkflowRun({
      workflowId: SOFT_DECLINE_INTERCEPT_ID,
      contactId: contact.id,
      conversationId: params.conversation.id,
      status: 'ok',
      log: steps,
    });
    return [{ workflowId: SOFT_DECLINE_INTERCEPT_ID, ok: true, steps }];
  }

  // 2) Déjà cliente (essai / payante / membre) — jamais pitch essai
  if (contact && isExistingPayingMember(contact) && !optedOut) {
    const body = market === 'mx' ? memberWarmReplyEs() : memberWarmReplyFr();
    const send = await runWorkflowAction(
      { type: 'send_message', config: { body, appendTrialLink: false } },
      { contact, conversation: params.conversation, inboundText: params.inboundText, market },
    );
    const steps = [
      { type: 'member_warm', ok: true, detail: `Lifecycle ${contact.lifecycleStage} — pas de pitch essai.` },
      { type: send.type, ok: send.ok, detail: send.detail },
    ];
    await recordWorkflowRun({
      workflowId: MEMBER_WARM_INTERCEPT_ID,
      contactId: contact.id,
      conversationId: params.conversation.id,
      status: send.ok ? 'ok' : 'error',
      log: steps,
    });
    return [{ workflowId: MEMBER_WARM_INTERCEPT_ID, ok: send.ok, steps }];
  }

  // 3) Follow-gate — UNIQUEMENT vraie demande info/essai
  if (shouldAskFollowGate({ triggerType: params.triggerType, inboundText: params.inboundText, contact })) {
    const intent = inferPendingIntent(params.inboundText);
    await patchContactExternalIds(contact!.id, { pending_intent: intent });
    contact = (await getContact(contact!.id)) ?? contact;
    const ask = await actionAskFollowGate({
      contact,
      conversation: params.conversation,
      inboundText: params.inboundText,
      market,
      commentId: params.commentId ?? null,
    });
    const steps = [{ type: ask.type, ok: ask.ok, detail: `${ask.detail} · intent=${intent}` }];
    await recordWorkflowRun({
      workflowId: FOLLOW_GATE_INTERCEPT_ID,
      contactId: contact!.id,
      conversationId: params.conversation.id,
      status: ask.ok ? 'ok' : 'error',
      log: steps,
    });
    return [{ workflowId: FOLLOW_GATE_INTERCEPT_ID, ok: ask.ok, steps }];
  }

  const matched = workflows
    .filter((w) =>
      workflowMatchesInbound(w, {
        triggerType: params.triggerType,
        inboundText: params.inboundText,
        contact,
      }),
    )
    .filter((w) => !optedOut || isOptOutKw(w))
    .sort((a, b) => {
      const pDiff = workflowKeywordPriority(b.triggerConfig) - workflowKeywordPriority(a.triggerConfig);
      if (pDiff !== 0) return pDiff;
      const aKw = typeof a.triggerConfig.keyword === 'string' && a.triggerConfig.keyword.trim() ? 1 : 0;
      const bKw = typeof b.triggerConfig.keyword === 'string' && b.triggerConfig.keyword.trim() ? 1 : 0;
      return bKw - aKw;
    });

  const results: OrchestratorResult[] = [];
  let ranSpecific = false;
  const isComment = params.triggerType === 'ig_comment_keyword';
  const oneShot =
    isComment ||
    params.triggerType === 'ig_dm_inbound' ||
    params.triggerType === 'ig_story_reply' ||
    params.triggerType === 'messenger_inbound' ||
    params.triggerType === 'whatsapp_inbound';

  for (const wf of matched) {
    const hasKw = typeof wf.triggerConfig.keyword === 'string' && Boolean(wf.triggerConfig.keyword.trim());
    if (
      !hasKw &&
      ranSpecific &&
      (params.triggerType === 'ig_dm_inbound' ||
        params.triggerType === 'messenger_inbound' ||
        params.triggerType === 'whatsapp_inbound')
    )
      continue;
    if (oneShot && ranSpecific && hasKw) continue;
    if (isComment && ranSpecific) continue;

    const contactId = params.contactId ?? contact?.id;
    if (contactId && (await wasWorkflowRunRecently(wf.id, contactId, 6))) {
      const cooldownSteps = [
        { type: 'cooldown', ok: true, detail: 'Déjà exécuté avec succès < 6h — ignoré (anti-spam).' },
      ];
      results.push({ workflowId: wf.id, ok: true, steps: cooldownSteps });
      await recordWorkflowRun({
        workflowId: wf.id,
        contactId,
        conversationId: params.conversation.id,
        status: 'ok',
        log: cooldownSteps,
      });
      if (hasKw || isComment) ranSpecific = true;
      continue;
    }

    const result = await runWorkflow(wf, {
      conversation: params.conversation,
      contactId,
      inboundText: params.inboundText,
      market,
      commentId: params.commentId ?? null,
    });
    results.push(result);
    if (hasKw) ranSpecific = true;
    if (!hasKw && params.triggerType === 'ig_dm_inbound') break;
    if (!hasKw && params.triggerType === 'messenger_inbound') break;
    if (!hasKw && params.triggerType === 'whatsapp_inbound') break;
    if (params.triggerType === 'ig_story_reply') break;
    if (isComment) break;
    if (params.triggerType === 'messenger_inbound' && hasKw) break;
    if (params.triggerType === 'whatsapp_inbound' && hasKw) break;
  }
  return results;
}
