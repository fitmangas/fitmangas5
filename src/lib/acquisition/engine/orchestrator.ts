import type { AcqContact, AcqWorkflow } from '@/lib/acquisition/types';

import { runWorkflowAction, type ActionContext } from './actions';
import { getContact, listWorkflows, recordWorkflowRun } from './repository';

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

  if (workflow.triggerType === 'ig_comment_keyword') {
    const kw =
      typeof workflow.triggerConfig.keyword === 'string'
        ? workflow.triggerConfig.keyword.trim().toLowerCase()
        : '';
    if (kw && !params.inboundText?.toLowerCase().includes(kw)) return false;
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
    return { workflowId: workflow.id, ok: false, steps: [{ type: 'workflow', ok: false, detail: 'Workflow désactivé.' }] };
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
  workflows?: AcqWorkflow[];
}): Promise<OrchestratorResult[]> {
  const contact = params.contactId ? await getContact(params.contactId) : null;
  let workflows = params.workflows;
  if (!workflows) {
    const wfRes = await listWorkflows();
    workflows = wfRes.ok ? wfRes.items : [];
  }

  const matched = workflows.filter((w) =>
    workflowMatchesInbound(w, {
      triggerType: params.triggerType,
      inboundText: params.inboundText,
      contact,
    }),
  );

  const results: OrchestratorResult[] = [];
  for (const wf of matched) {
    results.push(
      await runWorkflow(wf, {
        conversation: params.conversation,
        contactId: params.contactId ?? contact?.id,
        inboundText: params.inboundText,
        market: params.market ?? 'fr',
      }),
    );
  }
  return results;
}
