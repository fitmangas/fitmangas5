import { runConcierge } from '@/lib/acquisition/ai/concierge';
import { getMessagingProvider } from '@/lib/acquisition/providers';
import { getPublicTrialSignupUrl, getTrialOfferLabel } from '@/lib/acquisition/trial-url';
import type {
  AcqContact,
  AcqConversation,
  WorkflowActionSpec,
  WorkflowActionType,
} from '@/lib/acquisition/types';

import {
  createBookingIntent,
  escalateConversation,
  insertOutboundMessage,
  scheduleFollowup,
  tagContact,
  updateContactLifecycle,
} from './repository';
import type { LifecycleStage } from '@/lib/acquisition/types';

export type ActionContext = {
  contact: AcqContact | null;
  conversation: AcqConversation;
  inboundText?: string;
  market?: 'fr' | 'mx';
};

export type ActionResult = {
  type: WorkflowActionType;
  ok: boolean;
  detail: string;
  data?: unknown;
};

async function actionSendMessage(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const body =
    (typeof config?.body === 'string' && config.body) ||
    (typeof config?.template === 'string' && config.template) ||
    'Bonjour ! FitMangas, c’est un rendez-vous fixe en visio avec correction en direct — tu n’es pas seule.';
  const provider = getMessagingProvider(ctx.conversation.channel);
  if (!provider) {
    return { type: 'send_message', ok: false, detail: `Canal ${ctx.conversation.channel} sans provider messaging.` };
  }
  const send = await provider.sendMessage({
    conversationExternalId: ctx.conversation.id,
    recipientId: ctx.contact?.handle ?? ctx.conversation.contactHandle ?? 'unknown',
    body,
  });
  if (send.ok) {
    await insertOutboundMessage({
      conversationId: ctx.conversation.id,
      body,
      provider: provider.id,
      sandbox: send.sandbox,
    });
  }
  return {
    type: 'send_message',
    ok: send.ok,
    detail: send.ok ? (send.logLine ?? 'Message envoyé.') : (send.error ?? 'Échec envoi'),
    data: send,
  };
}

async function actionQualifyIntent(ctx: ActionContext): Promise<ActionResult> {
  const text = ctx.inboundText ?? '';
  const ai = await runConcierge({ inboundText: text, market: ctx.market ?? 'fr' });
  if (!ai.ok) {
    return { type: 'qualify_intent', ok: false, detail: ai.error };
  }

  const { applyConciergeResult } = await import('@/lib/acquisition/ai/concierge-actions');
  const summary = await applyConciergeResult(ai, ctx);
  const actionLines = summary.actions.map((a) => `${a.ok ? '✓' : '✗'} ${a.detail}`).join(' · ');

  return {
    type: 'qualify_intent',
    ok: true,
    detail: `Intent ${ai.intent} (${ai.provider})${actionLines ? ` — ${actionLines}` : ''}`,
    data: summary,
  };
}

async function actionTagContact(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const tag = typeof config?.tag === 'string' ? config.tag : 'interet_essai';
  if (!ctx.contact) return { type: 'tag_contact', ok: false, detail: 'Contact absent.' };
  const r = await tagContact(ctx.contact.id, tag);
  return { type: 'tag_contact', ok: r.ok, detail: r.ok ? `Tag « ${tag} » ajouté.` : (r.error ?? 'Erreur tag') };
}

async function actionSetLifecycle(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const stage = (config?.stage as LifecycleStage) ?? 'qualified';
  if (!ctx.contact) return { type: 'set_lifecycle_stage', ok: false, detail: 'Contact absent.' };
  const r = await updateContactLifecycle(ctx.contact.id, stage);
  return {
    type: 'set_lifecycle_stage',
    ok: r.ok,
    detail: r.ok ? `Étape → ${stage}` : (r.error ?? 'Erreur lifecycle'),
  };
}

async function actionSendTrialLink(ctx: ActionContext): Promise<ActionResult> {
  const url = getPublicTrialSignupUrl({
    utmSource: ctx.conversation.channel,
    utmCampaign: 'acquisition_dm',
  });
  const label = getTrialOfferLabel('fr');
  const body = `${label}\n${url}`;
  return actionSendMessage(ctx, { body });
}

async function actionBookSession(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  if (!ctx.contact) return { type: 'book_session_intent', ok: false, detail: 'Contact absent.' };
  const courseType =
    config?.courseType === 'nantes_presentiel' ? 'nantes_presentiel' : 'visio_collectif';
  const r = await createBookingIntent({
    contactId: ctx.contact.id,
    courseType,
    note: typeof config?.note === 'string' ? config.note : undefined,
  });
  return {
    type: 'book_session_intent',
    ok: r.ok,
    detail: r.ok ? `Intention réservation créée (${courseType}).` : (r.error ?? 'Erreur booking'),
    data: r,
  };
}

async function actionCaptureEmail(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const prompt =
    typeof config?.prompt === 'string'
      ? config.prompt
      : 'Pour t’envoyer le lien et les horaires, quel est ton e-mail ? (opt-in infos FitMangas uniquement)';
  return actionSendMessage(ctx, { body: prompt });
}

async function actionScheduleFollowup(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  if (!ctx.contact) return { type: 'schedule_followup', ok: false, detail: 'Contact absent.' };
  const hours = typeof config?.delayHours === 'number' ? config.delayHours : 24;
  const runAt = new Date(Date.now() + hours * 3600000).toISOString();
  const r = await scheduleFollowup({
    contactId: ctx.contact.id,
    conversationId: ctx.conversation.id,
    runAt,
    actionType: typeof config?.actionType === 'string' ? config.actionType : 'send_trial_link',
  });
  return {
    type: 'schedule_followup',
    ok: r.ok,
    detail: r.ok ? `Relance programmée dans ${hours}h.` : (r.error ?? 'Erreur relance'),
  };
}

async function actionBroadcastOptin(ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.contact?.optIn) {
    return {
      type: 'broadcast_optin',
      ok: false,
      detail: 'Contact sans opt-in — broadcast refusé (conformité).',
    };
  }
  await insertOutboundMessage({
    conversationId: ctx.conversation.id,
    body: '[SANDBOX] Broadcast opt-in simulé — aucun envoi groupé réel.',
    provider: 'system',
    sandbox: true,
  });
  return {
    type: 'broadcast_optin',
    ok: true,
    detail: 'Broadcast sandbox enregistré (opt-in OK, aucun envoi Meta).',
  };
}

async function actionEscalateHuman(ctx: ActionContext): Promise<ActionResult> {
  const stage = ctx.contact?.lifecycleStage ?? ctx.conversation.lifecycleStage;
  if (stage !== 'qualified' && stage !== 'trial' && stage !== 'paid') {
    return {
      type: 'escalate_human',
      ok: false,
      detail: `Escalade refusée — étape « ${stage} » trop froide (garde-fou).`,
    };
  }
  const assignedTo = 'alejandra@fitmangas.com';
  const r = await escalateConversation(ctx.conversation.id, assignedTo);
  if (!r.ok) {
    return { type: 'escalate_human', ok: false, detail: r.error ?? 'Escalade impossible.' };
  }
  await insertOutboundMessage({
    conversationId: ctx.conversation.id,
    body: '[SYSTÈME] Fil escaladé à Alejandra pour réponse humaine.',
    provider: 'system',
    sandbox: true,
  });
  return {
    type: 'escalate_human',
    ok: true,
    detail: 'Fil assigné à Alejandra (escalade humaine).',
    data: { assignedTo },
  };
}

export async function runWorkflowAction(
  spec: WorkflowActionSpec,
  ctx: ActionContext,
): Promise<ActionResult> {
  switch (spec.type) {
    case 'send_message':
      return actionSendMessage(ctx, spec.config);
    case 'qualify_intent':
      return actionQualifyIntent(ctx);
    case 'tag_contact':
      return actionTagContact(ctx, spec.config);
    case 'set_lifecycle_stage':
      return actionSetLifecycle(ctx, spec.config);
    case 'send_trial_link':
      return actionSendTrialLink(ctx);
    case 'book_session_intent':
      return actionBookSession(ctx, spec.config);
    case 'capture_email_optin':
      return actionCaptureEmail(ctx, spec.config);
    case 'schedule_followup':
      return actionScheduleFollowup(ctx, spec.config);
    case 'broadcast_optin':
      return actionBroadcastOptin(ctx);
    case 'escalate_human':
      return actionEscalateHuman(ctx);
    default:
      return { type: spec.type, ok: false, detail: `Action inconnue : ${spec.type}` };
  }
}
