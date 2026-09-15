import type { AcqContact, AcqWorkflow } from '@/lib/acquisition/types';

import { runWorkflowAction, type ActionContext } from './actions';
import { getContact, listWorkflows, recordWorkflowRun, wasWorkflowRunRecently } from './repository';
import { textMatchesKeyword } from './workflow-catalog';

export type OrchestratorResult = {
  workflowId: string;
  ok: boolean;
  steps: Array<{ type: string; ok: boolean; detail: string }>;
};

export function workflowMatchesInbound(
  workflow: AcqWorkflow,
  params: {
    triggerType: AcqWorkflow['triggerType'];
    inboundText?: string;
    contact?: AcqContact | null;
  },
): boolean {
  if (!workflow.enabled || workflow.triggerType !== params.triggerType) return false;

  if (
    workflow.triggerType === 'ig_comment_keyword' ||
    workflow.triggerType === 'ig_dm_inbound' ||
    workflow.triggerType === 'ig_story_reply'
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

  const steps: OrchestratorResult['steps'] = [];
  let allOk = true;

  for (const action of workflow.actions) {
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
  const contact = params.contactId ? await getContact(params.contactId) : null;
  let workflows = params.workflows;
  if (!workflows) {
    const wfRes = await listWorkflows();
    workflows = wfRes.ok ? wfRes.items : [];
  }

  const matched = workflows
    .filter((w) =>
      workflowMatchesInbound(w, {
        triggerType: params.triggerType,
        inboundText: params.inboundText,
        contact,
      }),
    )
    .sort((a, b) => {
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
    params.triggerType === 'ig_story_reply';

  for (const wf of matched) {
    const hasKw = typeof wf.triggerConfig.keyword === 'string' && Boolean(wf.triggerConfig.keyword.trim());
    // Catch-all DM : seulement si aucun mot-clé précis n’a déjà tourné
    if (!hasKw && ranSpecific && params.triggerType === 'ig_dm_inbound') continue;
    // Un seul robot par message (évite 3 DM d’affilée)
    if (oneShot && ranSpecific && hasKw) continue;
    if (isComment && ranSpecific) continue;

    const contactId = params.contactId ?? contact?.id;
    if (contactId && (await wasWorkflowRunRecently(wf.id, contactId, 6))) {
      results.push({
        workflowId: wf.id,
        ok: true,
        steps: [{ type: 'cooldown', ok: true, detail: 'Déjà exécuté < 6h — ignoré (anti-spam).' }],
      });
      if (hasKw || isComment) ranSpecific = true;
      continue;
    }

    const result = await runWorkflow(wf, {
      conversation: params.conversation,
      contactId,
      inboundText: params.inboundText,
      market: params.market ?? 'fr',
      commentId: params.commentId ?? null,
    });
    results.push(result);
    if (hasKw) ranSpecific = true;
    // Catch-all DM ou story : une seule exécution
    if (!hasKw && params.triggerType === 'ig_dm_inbound') break;
    if (params.triggerType === 'ig_story_reply') break;
    if (isComment) break;
  }
  return results;
}
