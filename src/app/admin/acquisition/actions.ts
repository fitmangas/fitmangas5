'use server';

import { revalidatePath } from 'next/cache';

import { runConcierge } from '@/lib/acquisition/ai/concierge';
import { runWorkflow } from '@/lib/acquisition/engine/orchestrator';
import {
  getConversationWithMessages,
  insertOutboundMessage,
  listWorkflows,
  seedSandboxDemoData,
} from '@/lib/acquisition/engine/repository';
import { getMessagingProvider, getSandboxLog } from '@/lib/acquisition/providers';
import { isAcquisitionModuleEnabled } from '@/lib/acquisition/feature-flag';

function guardModule() {
  if (!isAcquisitionModuleEnabled()) {
    throw new Error('Module Acquisition désactivé (ACQUISITION_MODULE_ENABLED).');
  }
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

  revalidatePath('/admin/acquisition');
  revalidatePath('/admin/croissance');
  return { ok: true, sandbox: send.sandbox, log: send.logLine };
}

export async function acquisitionSeedDemo() {
  guardModule();
  const r = await seedSandboxDemoData();
  revalidatePath('/admin/acquisition');
  revalidatePath('/admin/croissance');
  return r;
}

export async function acquisitionRunWorkflowDemo(workflowId: string, conversationId: string) {
  guardModule();
  const detail = await getConversationWithMessages(conversationId);
  if (!detail.ok) return { ok: false, detail: detail.error };

  const wfs = await listWorkflows();
  const wf = wfs.ok ? wfs.items.find((w) => w.id === workflowId) : null;
  if (!wf) return { ok: false, detail: 'Workflow introuvable.' };

  const result = await runWorkflow(wf, {
    conversation: detail.conversation,
    contactId: detail.conversation.contactId,
    inboundText: detail.messages.filter((m) => m.direction === 'inbound').pop()?.body,
  });

  revalidatePath('/admin/acquisition');
  revalidatePath('/admin/croissance');
  return {
    ok: result.ok,
    detail: result.steps.map((s) => `${s.type}: ${s.detail}`).join(' · '),
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
