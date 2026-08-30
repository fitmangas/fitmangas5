'use server';

import { revalidatePath } from 'next/cache';

import { applyConciergeResult } from '@/lib/acquisition/ai/concierge-actions';
import { runConcierge } from '@/lib/acquisition/ai/concierge';
import { runWorkflowAction } from '@/lib/acquisition/engine/actions';
import { runWorkflow } from '@/lib/acquisition/engine/orchestrator';
import {
  createSandboxConversation,
  deleteWorkflow,
  getContact,
  getConversationWithMessages,
  insertOutboundMessage,
  listWorkflows,
  saveWorkflow,
  seedSandboxDemoData,
  setContactOptIn,
  setWorkflowEnabled,
  updateContactLifecycle,
} from '@/lib/acquisition/engine/repository';
import { getMessagingProvider, getSandboxLog } from '@/lib/acquisition/providers';
import { isAcquisitionModuleEnabled } from '@/lib/acquisition/feature-flag';
import type { AcqWorkflow, WorkflowActionSpec, WorkflowActionType } from '@/lib/acquisition/types';

function guardModule() {
  if (!isAcquisitionModuleEnabled()) {
    throw new Error('Module Acquisition désactivé (ACQUISITION_MODULE_ENABLED).');
  }
}

function revalidateAcquisition() {
  revalidatePath('/admin/acquisition');
  revalidatePath('/admin/croissance');
}

export async function acquisitionSendReply(conversationId: string, body: string) {
  guardModule();
  const detail = await getConversationWithMessages(conversationId);
  if (!detail.ok) return { ok: false, error: detail.error };

  const provider = getMessagingProvider(detail.conversation.channel);
  if (!provider) {
    return { ok: false, error: `Canal ${detail.conversation.channel} sans provider.` };
  }

  const send = await provider.sendMessage({
    conversationExternalId: conversationId,
    recipientId: detail.conversation.contactHandle ?? 'unknown',
    body,
  });

  if (!send.ok) {
    return { ok: false, error: send.error ?? 'Échec envoi provider' };
  }

  const saved = await insertOutboundMessage({
    conversationId,
    body,
    provider: provider.id,
    sandbox: send.sandbox,
  });
  if (!saved.ok) return { ok: false, error: saved.error };

  revalidateAcquisition();
  return { ok: true, sandbox: send.sandbox, log: send.logLine };
}

export async function acquisitionCreateThread() {
  guardModule();
  const r = await createSandboxConversation();
  revalidateAcquisition();
  return r;
}

export async function acquisitionSeedDemo() {
  guardModule();
  const r = await seedSandboxDemoData();
  revalidateAcquisition();
  return r;
}

export async function acquisitionSaveWorkflow(payload: {
  id?: string;
  name: string;
  enabled: boolean;
  triggerType: AcqWorkflow['triggerType'];
  triggerKeyword?: string;
  lifecycleIn?: string;
  actions: WorkflowActionSpec[];
}) {
  guardModule();
  const triggerConfig =
    payload.triggerType === 'ig_comment_keyword' && payload.triggerKeyword?.trim()
      ? { keyword: payload.triggerKeyword.trim().toLowerCase() }
      : {};
  const conditions = payload.lifecycleIn?.trim()
    ? { lifecycle_in: payload.lifecycleIn.split(',').map((s) => s.trim()).filter(Boolean) }
    : {};

  const r = await saveWorkflow({
    id: payload.id,
    name: payload.name,
    enabled: payload.enabled,
    triggerType: payload.triggerType,
    triggerConfig,
    conditions,
    actions: payload.actions,
  });
  revalidateAcquisition();
  return r;
}

export async function acquisitionDeleteWorkflow(workflowId: string) {
  guardModule();
  const r = await deleteWorkflow(workflowId);
  revalidateAcquisition();
  return r;
}

export async function acquisitionToggleWorkflow(workflowId: string, enabled: boolean) {
  guardModule();
  const r = await setWorkflowEnabled(workflowId, enabled);
  revalidateAcquisition();
  return r;
}

export async function acquisitionTestAction(conversationId: string, actionType: WorkflowActionType) {
  guardModule();
  const detail = await getConversationWithMessages(conversationId);
  if (!detail.ok) return { ok: false, type: actionType, detail: detail.error };

  let contact = await getContact(detail.conversation.contactId);
  if (!contact) return { ok: false, type: actionType, detail: 'Contact introuvable.' };

  if (actionType === 'escalate_human' && contact.lifecycleStage === 'new') {
    await updateContactLifecycle(contact.id, 'qualified');
    contact = (await getContact(contact.id)) ?? contact;
  }
  if (actionType === 'broadcast_optin' && !contact.optIn) {
    await setContactOptIn(contact.id, true);
    contact = (await getContact(contact.id)) ?? contact;
  }

  const inboundText =
    detail.messages.filter((m) => m.direction === 'inbound').pop()?.body ??
    'Bonjour, je veux essayer FitMangas en visio.';

  const defaultConfig: Partial<Record<WorkflowActionType, Record<string, unknown>>> = {
    send_message: { body: 'Test sandbox FitMangas — rendez-vous visio avec correction en direct.' },
    tag_contact: { tag: 'test_sandbox' },
    set_lifecycle_stage: { stage: 'qualified' },
    book_session_intent: { courseType: 'visio_collectif' },
    schedule_followup: { delayHours: 24 },
  };

  const result = await runWorkflowAction(
    { type: actionType, config: defaultConfig[actionType] },
    {
      conversation: detail.conversation,
      contact,
      inboundText,
      market: 'fr',
    },
  );

  revalidateAcquisition();
  return { ok: result.ok, type: result.type, detail: result.detail };
}

export async function acquisitionRunWorkflowDemo(workflowId: string, conversationId: string) {
  guardModule();
  const detail = await getConversationWithMessages(conversationId);
  if (!detail.ok) return { ok: false, detail: detail.error, steps: [] as Array<{ type: string; ok: boolean; detail: string }> };

  const wfs = await listWorkflows();
  const wf = wfs.ok ? wfs.items.find((w) => w.id === workflowId) : null;
  if (!wf) return { ok: false, detail: 'Workflow introuvable.', steps: [] };

  const result = await runWorkflow(wf, {
    conversation: detail.conversation,
    contactId: detail.conversation.contactId,
    inboundText: detail.messages.filter((m) => m.direction === 'inbound').pop()?.body,
  });

  revalidateAcquisition();
  return {
    ok: result.ok,
    detail: result.steps.map((s) => `${s.ok ? '✓' : '✗'} ${s.type}: ${s.detail}`).join(' · '),
    steps: result.steps,
  };
}

export async function acquisitionConciergeReply(conversationId: string, market: 'fr' | 'mx' = 'fr') {
  guardModule();
  const detail = await getConversationWithMessages(conversationId);
  if (!detail.ok) return { ok: false, error: detail.error };

  const contact = await getContact(detail.conversation.contactId);
  if (!contact) return { ok: false, error: 'Contact introuvable.' };

  const inboundText =
    detail.messages.filter((m) => m.direction === 'inbound').pop()?.body ??
    'Bonjour, je veux en savoir plus sur FitMangas.';

  const ai = await runConcierge({ inboundText, market });
  if (!ai.ok) return { ok: false, error: ai.error };

  const summary = await applyConciergeResult(ai, {
    conversation: detail.conversation,
    contact,
    inboundText,
    market,
  });

  revalidateAcquisition();
  return {
    ok: true,
    provider: ai.provider,
    intent: ai.intent,
    reply: ai.reply,
    actions: summary.actions.map((a) => ({ ok: a.ok, type: a.type, detail: a.detail })),
    emailCaptured: summary.emailCaptured,
    messagesSent: summary.actions.some((a) => a.type === 'send_message' && a.ok),
  };
}

export async function acquisitionAskConcierge(inboundText: string, market: 'fr' | 'mx' = 'fr') {
  guardModule();
  return runConcierge({ inboundText, market });
}

export async function acquisitionGetSandboxLog() {
  guardModule();
  return getSandboxLog(30);
}
