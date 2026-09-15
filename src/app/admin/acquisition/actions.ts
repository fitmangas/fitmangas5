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

  const contact = await getContact(detail.conversation.contactId);
  const recipientId =
    (detail.conversation.externalThreadId && /^\d+$/.test(detail.conversation.externalThreadId)
      ? detail.conversation.externalThreadId
      : null) ||
    (contact?.externalIds?.meta_sender_id && /^\d+$/.test(contact.externalIds.meta_sender_id)
      ? contact.externalIds.meta_sender_id
      : null);
  if (!recipientId) {
    return {
      ok: false,
      error: 'ID destinataire Meta manquant sur ce fil — impossible d’envoyer en LIVE.',
    };
  }

  const send = await provider.sendMessage({
    conversationExternalId: conversationId,
    recipientId,
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
    payload.triggerKeyword?.trim() &&
    (payload.triggerType === 'ig_comment_keyword' ||
      payload.triggerType === 'ig_dm_inbound' ||
      payload.triggerType === 'ig_story_reply')
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
    schedule_followup: { delayHours: 0 },
    broadcast_optin: { body: 'Test broadcast sandbox — essai 7 jours FitMangas.' },
    mini_poll: { question: 'Sur 1 à 5, te sens-tu accompagnée cette semaine ?' },
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
    newsletterDetail: summary.newsletterDetail,
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

/** Exécute immédiatement les relances dues (même logique que le cron). */
export async function acquisitionRunFollowupsNow() {
  guardModule();
  const { runDueFollowups } = await import('@/lib/acquisition/engine/repository');
  const result = await runDueFollowups(40);
  revalidateAcquisition();
  return {
    ok: true as const,
    processed: result.processed,
    succeeded: result.ok,
    failed: result.failed,
    details: result.details,
  };
}

/** Prépare acquisition_meta_connection depuis le token CM si besoin. */
export async function acquisitionEnsureMetaConnection() {
  guardModule();
  const { ensureAcquisitionMetaFromCm } = await import('@/lib/acquisition/providers/meta-live');
  const r = await ensureAcquisitionMetaFromCm();
  revalidateAcquisition();
  return r;
}

/**
 * Passe MESSAGING_MODE=live uniquement si checklist verte.
 * Note : la variable Vercel doit aussi être mise à jour pour survivre au redeploy —
 * cette action valide la checklist et retourne l’instruction ; le flag runtime
 * est lu depuis process.env (set via Vercel/.env).
 */
export async function acquisitionCheckLiveReadiness() {
  guardModule();
  const { getMetaLiveReadiness, ensureAcquisitionMetaFromCm } = await import(
    '@/lib/acquisition/providers/meta-live'
  );
  await ensureAcquisitionMetaFromCm();
  const status = await getMetaLiveReadiness();
  revalidateAcquisition();
  return status;
}

/** Sync Insights CM + scores hooks (manuel depuis Acquisition). */
export async function acquisitionSyncInsightsAndHooks() {
  guardModule();
  const { syncSocialPostInsights } = await import('@/lib/admin/social-insights-sync');
  const { applyInsightScoresToHooksBank } = await import('@/lib/admin/social-hooks-bank');
  const sync = await syncSocialPostInsights();
  const scores = await applyInsightScoresToHooksBank();
  revalidateAcquisition();
  return {
    ok: sync.ok,
    synced: sync.synced,
    skipped: sync.skipped,
    error: sync.error,
    hooksUpdated: scores.updated,
    hooksError: scores.error,
  };
}

/** Installe / met à jour le catalogue de workflows opérationnels. */
export async function acquisitionEnsureWorkflowCatalog() {
  guardModule();
  const { ensureWorkflowCatalog } = await import('@/lib/acquisition/engine/repository');
  const r = await ensureWorkflowCatalog();
  revalidateAcquisition();
  return r;
}

export async function acquisitionListRecentWorkflowRuns() {
  guardModule();
  const { listRecentWorkflowRuns } = await import('@/lib/acquisition/engine/repository');
  return listRecentWorkflowRuns(25);
}
