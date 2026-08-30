import { runConcierge } from '@/lib/acquisition/ai/concierge';
import { canEscalateToHuman } from '@/lib/acquisition/engine/lifecycle';
import { getMessagingProvider } from '@/lib/acquisition/providers';
import { getTrialDmMessage } from '@/lib/acquisition/trial-url';
import type {
  AcqContact,
  AcqConversation,
  WorkflowActionSpec,
  WorkflowActionType,
} from '@/lib/acquisition/types';

import {
  createBookingIntent,
  escalateConversation,
  getLatestConversationForContact,
  insertOutboundMessage,
  listOptInContacts,
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
  const locale = ctx.market === 'mx' ? 'es' : 'fr';
  const body = getTrialDmMessage({
    locale,
    utmSource: ctx.conversation.channel,
    utmCampaign: 'acquisition_dm',
  });
  return actionSendMessage(ctx, { body });
}

function resolveCourseType(ctx: ActionContext, config?: Record<string, unknown>): 'visio_collectif' | 'nantes_presentiel' {
  if (config?.courseType === 'nantes_presentiel') return 'nantes_presentiel';
  if (config?.courseType === 'visio_collectif') return 'visio_collectif';
  const text = (ctx.inboundText ?? '').toLowerCase();
  if (/nantes|presentiel|présentiel|sur place/.test(text)) return 'nantes_presentiel';
  return 'visio_collectif';
}

async function actionBookSession(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  if (!ctx.contact) return { type: 'book_session_intent', ok: false, detail: 'Contact absent.' };
  const courseType = resolveCourseType(ctx, config);
  const r = await createBookingIntent({
    contactId: ctx.contact.id,
    courseType,
    note: typeof config?.note === 'string' ? config.note : undefined,
  });
  if (!r.ok) {
    return { type: 'book_session_intent', ok: false, detail: r.error ?? 'Erreur booking' };
  }

  const locale = ctx.market === 'mx' ? 'es' : 'fr';
  const confirmBody =
    courseType === 'nantes_presentiel'
      ? locale === 'es'
        ? 'Perfecto — anoto tu interés por un curso presencial en Nantes. Alejandra te contactará con los horarios.'
        : 'Parfait — je note ton intérêt pour un cours présentiel à Nantes. Alejandra te recontacte avec les créneaux.'
      : locale === 'es'
        ? 'Perfecto — anoto tu interés por el visio colectivo. Alejandra te enviará los horarios disponibles.'
        : 'Parfait — je note ton intérêt pour le visio collectif. Alejandra te envoie les créneaux disponibles.';

  await actionSendMessage(ctx, { body: confirmBody });
  await tagContact(ctx.contact.id, courseType === 'nantes_presentiel' ? 'booking_nantes' : 'booking_visio');

  return {
    type: 'book_session_intent',
    ok: true,
    detail: `Réservation notée (${courseType}) + confirmation envoyée.`,
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

async function actionBroadcastOptin(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const body =
    typeof config?.body === 'string' && config.body.trim()
      ? config.body.trim()
      : 'Actu FitMangas — essai 7 jours en visio avec correction en direct : fitmangas.com';

  const contacts = await listOptInContacts(500);
  if (!contacts.length) {
    return { type: 'broadcast_optin', ok: false, detail: 'Aucun contact opt-in dans le CRM.' };
  }

  let sent = 0;
  let failed = 0;
  const lines: string[] = [];

  for (const contact of contacts) {
    const conv = await getLatestConversationForContact(contact.id);
    if (!conv || !contact.handle) {
      failed += 1;
      continue;
    }
    const provider = getMessagingProvider(contact.channel);
    if (!provider) {
      failed += 1;
      continue;
    }
    const send = await provider.sendMessage({
      conversationExternalId: conv.id,
      recipientId: contact.handle,
      body,
    });
    if (send.ok) {
      await insertOutboundMessage({
        conversationId: conv.id,
        body: `[BROADCAST] ${body}`,
        provider: provider.id,
        sandbox: send.sandbox,
      });
      sent += 1;
      if (send.logLine) lines.push(send.logLine);
    } else {
      failed += 1;
    }
  }

  return {
    type: 'broadcast_optin',
    ok: sent > 0,
    detail: `Broadcast : ${sent} envoyé(s), ${failed} échec(s) sur ${contacts.length} opt-in.${lines[0] ? ` ${lines[0]}` : ''}`,
    data: { sent, failed, total: contacts.length },
  };
}

async function actionMiniPoll(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  if (!ctx.contact) return { type: 'mini_poll', ok: false, detail: 'Contact absent.' };

  const locale = ctx.market === 'mx' ? 'es' : 'fr';
  const question =
    typeof config?.question === 'string' && config.question.trim()
      ? config.question.trim()
      : locale === 'es'
        ? 'Del 1 al 5, ¿cuánto te sientes acompañada en tu práctica esta semana?'
        : 'Sur une échelle de 1 à 5, à quel point te sens-tu accompagnée dans ta pratique cette semaine ?';

  const body = `${question}\n1 — Pas du tout\n2 — Un peu\n3 — Moyennement\n4 — Bien\n5 — Vraiment accompagnée\n\n(Réponds avec un chiffre.)`;

  await tagContact(ctx.contact.id, 'poll_sent');
  const send = await actionSendMessage(ctx, { body });
  return {
    type: 'mini_poll',
    ok: send.ok,
    detail: send.ok ? 'Mini-sondage envoyé — en attente de réponse 1-5.' : send.detail,
  };
}

async function actionEscalateHuman(ctx: ActionContext): Promise<ActionResult> {
  const stage = ctx.contact?.lifecycleStage ?? ctx.conversation.lifecycleStage;
  if (!canEscalateToHuman(stage)) {
    return {
      type: 'escalate_human',
      ok: false,
      detail: `Escalade refusée — étape « ${stage} » trop froide (qualified/trial/paid requis).`,
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
      return actionBroadcastOptin(ctx, spec.config);
    case 'escalate_human':
      return actionEscalateHuman(ctx);
    case 'mini_poll':
      return actionMiniPoll(ctx, spec.config);
    default:
      return { type: spec.type, ok: false, detail: `Action inconnue : ${spec.type}` };
  }
}
