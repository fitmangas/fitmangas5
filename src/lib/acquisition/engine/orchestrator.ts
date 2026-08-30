import type { AcqWorkflow } from '@/lib/acquisition/types';

import { runWorkflowAction, type ActionContext } from './actions';
import { getContact, recordWorkflowRun } from './repository';

export type OrchestratorResult = {
  workflowId: string;
  ok: boolean;
  steps: Array<{ type: string; ok: boolean; detail: string }>;
};

export async function runWorkflow(
  workflow: AcqWorkflow,
  ctx: Omit<ActionContext, 'contact'> & { contactId?: string },
): Promise<OrchestratorResult> {
  if (!workflow.enabled) {
    return { workflowId: workflow.id, ok: false, steps: [{ type: 'workflow', ok: false, detail: 'Workflow désactivé.' }] };
  }

  const contact = ctx.contactId ? await getContact(ctx.contactId) : ctx.conversation.contactId ? await getContact(ctx.conversation.contactId) : null;
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
  workflows: AcqWorkflow[];
}): Promise<OrchestratorResult[]> {
  const matched = params.workflows.filter(
    (w) => w.enabled && w.triggerType === params.triggerType,
  );
  const results: OrchestratorResult[] = [];
  for (const wf of matched) {
    results.push(
      await runWorkflow(wf, {
        conversation: params.conversation,
        contactId: params.contactId,
        inboundText: params.inboundText,
      }),
    );
  }
  return results;
}
