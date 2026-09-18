import { runConcierge } from '@/lib/acquisition/ai/concierge';
import { canEscalateToHuman } from '@/lib/acquisition/engine/lifecycle';
import { detectAcquisitionMarket } from '@/lib/acquisition/market';
import { getMessagingProvider } from '@/lib/acquisition/providers';
import { checkInstagramFollowsBusiness } from '@/lib/acquisition/providers/meta-live';
import {
  bilingualSend,
  followGateAskEs,
  followGateAskFr,
  followGateRetryEs,
  followGateRetryFr,
  followGateThanksEs,
  followGateThanksFr,
  lines,
  QR_ACCUEIL,
  QR_FOLLOW_DONE,
  QR_FOLLOW_GATE,
  QR_PRICE_CHOICE,
  QR_RESOURCE,
  trialFollowupSequence,
} from '@/lib/acquisition/copy-bilingual';
import { getTrialDmMessage } from '@/lib/acquisition/trial-url';
import type {
  AcqContact,
  AcqConversation,
  WorkflowActionSpec,
  WorkflowActionType,
} from '@/lib/acquisition/types';

import { readPendingIntent, type PendingIntent } from './follow-gate';
import {
  cancelScheduledFollowups,
  createBookingIntent,
  escalateConversation,
  getLatestConversationForContact,
  insertOutboundMessage,
  listOptInContacts,
  patchContactExternalIds,
  scheduleFollowup,
  setContactOptIn,
  tagContact,
  updateContactLifecycle,
} from './repository';
import type { LifecycleStage } from '@/lib/acquisition/types';

export type ActionContext = {
  contact: AcqContact | null;
  conversation: AcqConversation;
  inboundText?: string;
  market?: 'fr' | 'mx';
  /** Si présent (commentaire IG) → private reply prioritaire */
  commentId?: string | null;
};

export type ActionResult = {
  type: WorkflowActionType;
  ok: boolean;
  detail: string;
  data?: unknown;
};

/** Instagram/Meta exige l'ID numérique (IGSID), pas @username. */
function resolveRecipientId(ctx: ActionContext): string | null {
  const fromThread = ctx.conversation.externalThreadId?.trim();
  if (fromThread && /^\d+$/.test(fromThread)) return fromThread;

  const external = ctx.contact?.externalIds;
  const fromMeta =
    external?.meta_sender_id?.trim() ||
    external?.igsid?.trim() ||
    external?.psid?.trim();
  if (fromMeta && /^\d+$/.test(fromMeta)) return fromMeta;

  const handle = ctx.contact?.handle ?? ctx.conversation.contactHandle;
  if (handle && /^\d+$/.test(handle.trim())) return handle.trim();

  return null;
}

async function actionSendMessage(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const market = ctx.market ?? detectAcquisitionMarket(ctx.inboundText);
  const localeBody =
    market === 'mx' && typeof config?.bodyEs === 'string' && config.bodyEs.trim()
      ? config.bodyEs
      : typeof config?.bodyFr === 'string' && config.bodyFr.trim()
        ? config.bodyFr
        : null;

  let body =
    localeBody ||
    (typeof config?.body === 'string' && config.body) ||
    (typeof config?.template === 'string' && config.template) ||
    'Bonjour 💛 C’est Alejandra. Tu cherches un vrai suivi en visio — pas une vidéo seule ? Essai 7 jours gratuits ✨';

  const hasTrialUrlButton =
    Array.isArray(config?.buttons) &&
    (config.buttons as Array<{ url?: string }>).some((b) =>
      typeof b?.url === 'string' ? /fitmangas\.com/i.test(b.url) : false,
    );
  if (config?.appendTrialLink === true && !hasTrialUrlButton) {
    const url = getPublicTrialSignupUrl({
      utmSource: ctx.conversation.channel,
      utmCampaign: 'acquisition_dm',
    });
    if (!body.includes(url)) {
      body = `${body.trim()}\n${url}`;
    }
  }

  const provider = getMessagingProvider(ctx.conversation.channel);
  if (!provider) {
    return { type: 'send_message', ok: false, detail: `Canal ${ctx.conversation.channel} sans provider messaging.` };
  }
  const recipientId = resolveRecipientId(ctx);
  if (ctx.commentId?.trim() && provider.sendPrivateReply) {
    const priv = await provider.sendPrivateReply({
      commentId: ctx.commentId.trim(),
      body,
    });
    if (priv.ok) {
      await insertOutboundMessage({
        conversationId: ctx.conversation.id,
        body,
        provider: provider.id,
        sandbox: priv.sandbox,
      });
      return {
        type: 'send_message',
        ok: true,
        detail: priv.logLine ?? 'Private reply commentaire envoyé.',
        data: priv,
      };
    }
    if (!recipientId) {
      return {
        type: 'send_message',
        ok: false,
        detail: `Private reply échoué (${priv.error ?? 'erreur Meta'}) et pas d’ID destinataire DM.`,
      };
    }
  }

  if (!recipientId) {
    return {
      type: 'send_message',
      ok: false,
      detail: 'ID destinataire Meta manquant (meta_sender_id / thread). Impossible d’envoyer en LIVE.',
    };
  }
  const buttonsRaw = Array.isArray(config?.buttons)
    ? config.buttons
    : Array.isArray(config?.quickReplies)
      ? config.quickReplies
      : null;
  const buttons = buttonsRaw
    ? (buttonsRaw as Array<{ title?: string; payload?: string; url?: string }>)
        .filter((q) => typeof q?.title === 'string' && q.title.trim())
        .map((q) => ({
          title: String(q.title).slice(0, 20),
          payload: String(q.payload ?? q.title).slice(0, 1000),
          ...(typeof q.url === 'string' && q.url.trim() ? { url: q.url.trim() } : {}),
        }))
    : undefined;

  const send = await provider.sendMessage({
    conversationExternalId: ctx.conversation.id,
    recipientId,
    body,
    buttons,
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
    detail: send.ok
      ? (send.logLine ?? (ctx.commentId ? 'DM fallback après commentaire envoyé.' : 'Message envoyé.'))
      : (send.error ?? 'Échec envoi'),
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
  if (!r.ok) {
    return { type: 'tag_contact', ok: false, detail: r.error ?? 'Erreur tag' };
  }

  if (tag === 'optout') {
    await setContactOptIn(ctx.contact.id, false);
    const cancelled = await cancelScheduledFollowups(ctx.contact.id);
    return {
      type: 'tag_contact',
      ok: true,
      detail: `Tag « optout » + silence${cancelled.ok ? ` · ${cancelled.count ?? 0} relance(s) annulée(s)` : ''}.`,
    };
  }

  if (tag.startsWith('objection_')) {
    const { bumpContactLeadScore } = await import('./repository');
    const { LEAD_SCORE_DELTA } = await import('./lead-score');
    await bumpContactLeadScore(ctx.contact.id, LEAD_SCORE_DELTA.objection_handled);
  } else if (
    tag.startsWith('commentaire_') ||
    tag.startsWith('messenger_') ||
    tag.startsWith('wa_') ||
    tag === 'story_reply' ||
    tag === 'dm_entrant'
  ) {
    const { bumpContactLeadScore } = await import('./repository');
    const { LEAD_SCORE_DELTA } = await import('./lead-score');
    await bumpContactLeadScore(ctx.contact.id, LEAD_SCORE_DELTA.comment_engagement);
  }

  return { type: 'tag_contact', ok: true, detail: `Tag « ${tag} » ajouté.` };
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

async function actionSendTrialLink(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const locale = ctx.market === 'mx' ? 'es' : 'fr';
  const styleRaw = typeof config?.style === 'string' ? config.style : 'full';
  const style =
    styleRaw === 'compact' ||
    styleRaw === 'reminder_j1' ||
    styleRaw === 'social_proof' ||
    styleRaw === 'last_chance'
      ? styleRaw
      : 'full';
  const body = getTrialDmMessage({
    locale,
    utmSource: ctx.conversation.channel,
    utmCampaign: 'acquisition_dm',
    style,
  });
  const send = await actionSendMessage(ctx, { body });
  if (send.ok && ctx.contact) {
    const { bumpContactLeadScore } = await import('./repository');
    const { LEAD_SCORE_DELTA } = await import('./lead-score');
    await bumpContactLeadScore(ctx.contact.id, LEAD_SCORE_DELTA.trial_link_sent);
  }
  return send;
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
        ? 'Perfecto 💛 Anoto tu interés por un curso presencial en Nantes. Te escribo yo con los horarios.'
        : 'Parfait 💛 Je note ton intérêt pour un cours présentiel à Nantes. Je te recontacte moi-même avec les créneaux.'
      : locale === 'es'
        ? 'Perfecto 💛 Anoto tu interés por el visio colectivo. Te envío yo los horarios disponibles.'
        : 'Parfait 💛 Je note ton intérêt pour le visio collectif. Je t’envoie moi-même les créneaux.';

  await actionSendMessage(ctx, {
    body: confirmBody.includes('fitmangas.com')
      ? confirmBody
      : `${confirmBody}\n\nOu démarre tout de suite — Essai 7 jours gratuits ✨`,
    bodyEs: locale === 'es'
      ? `${confirmBody}\n\nO empieza ya — Prueba 7 días gratis ✨`
      : undefined,
    appendTrialLink: !confirmBody.includes('fitmangas.com'),
  });
  await tagContact(ctx.contact.id, courseType === 'nantes_presentiel' ? 'booking_nantes' : 'booking_visio');
  const { bumpContactLeadScore } = await import('./repository');
  const { LEAD_SCORE_DELTA } = await import('./lead-score');
  await bumpContactLeadScore(ctx.contact.id, LEAD_SCORE_DELTA.booking_intent);

  const { sendAcquisitionBookingEmail } = await import('@/lib/acquisition/notify-escalation');
  const mail = await sendAcquisitionBookingEmail({
    conversationId: ctx.conversation.id,
    channel: ctx.conversation.channel,
    handle: ctx.contact.handle ?? ctx.conversation.contactHandle ?? null,
    courseType,
    preview: ctx.inboundText ?? ctx.conversation.lastMessagePreview,
  });

  return {
    type: 'book_session_intent',
    ok: true,
    detail: `Réservation notée (${courseType}) + confirmation envoyée${mail.ok ? ' + alerte Alejandra' : ` (alerte e-mail : ${mail.error ?? 'échec'})`}.`,
    data: r,
  };
}

async function actionCaptureEmail(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const prompt =
    typeof config?.prompt === 'string'
      ? config.prompt
      : 'Pour t’envoyer le lien et les horaires, quel est ton e-mail ? (infos cours uniquement, rien d’autre)';
  return actionSendMessage(ctx, { body: prompt });
}

async function actionScheduleFollowup(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  if (!ctx.contact) return { type: 'schedule_followup', ok: false, detail: 'Contact absent.' };
  if (ctx.contact.tags.includes('optout')) {
    return { type: 'schedule_followup', ok: true, detail: 'Relance ignorée — contact en opt-out.' };
  }
  const hours = typeof config?.delayHours === 'number' ? config.delayHours : 24;
  const runAt = new Date(Date.now() + hours * 3600000).toISOString();
  const actionType = typeof config?.actionType === 'string' ? config.actionType : 'send_trial_link';
  const payload: Record<string, unknown> = {};
  if (typeof config?.style === 'string') payload.style = config.style;
  if (typeof config?.body === 'string') payload.body = config.body;
  if (typeof config?.bodyFr === 'string') payload.bodyFr = config.bodyFr;
  if (typeof config?.bodyEs === 'string') payload.bodyEs = config.bodyEs;
  const r = await scheduleFollowup({
    contactId: ctx.contact.id,
    conversationId: ctx.conversation.id,
    runAt,
    actionType,
    payload,
  });
  return {
    type: 'schedule_followup',
    ok: r.ok,
    detail: r.ok ? `Relance programmée dans ${hours}h (${actionType}).` : (r.error ?? 'Erreur relance'),
  };
}

async function actionBroadcastOptin(ctx: ActionContext, config?: Record<string, unknown>): Promise<ActionResult> {
  const body =
    typeof config?.body === 'string' && config.body.trim()
      ? config.body.trim()
      : 'C’est Alejandra 💛 Nouvelle actu + Essai 7 jours gratuits ✨ en visio avec moi — correction en direct :';

  const contacts = await listOptInContacts(500);
  if (!contacts.length) {
    return { type: 'broadcast_optin', ok: false, detail: 'Aucun contact opt-in dans le CRM.' };
  }

  let sent = 0;
  let failed = 0;
  const lines: string[] = [];

  for (const contact of contacts) {
    const conv = await getLatestConversationForContact(contact.id);
    if (!conv) {
      failed += 1;
      continue;
    }
    const provider = getMessagingProvider(contact.channel);
    if (!provider) {
      failed += 1;
      continue;
    }
    const recipientId =
      (conv.externalThreadId && /^\d+$/.test(conv.externalThreadId) ? conv.externalThreadId : null) ||
      (contact.externalIds?.meta_sender_id && /^\d+$/.test(contact.externalIds.meta_sender_id)
        ? contact.externalIds.meta_sender_id
        : null);
    if (!recipientId) {
      failed += 1;
      continue;
    }
    const send = await provider.sendMessage({
      conversationExternalId: conv.id,
      recipientId,
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

  const { sendAcquisitionEscalationEmail } = await import('@/lib/acquisition/notify-escalation');
  const mail = await sendAcquisitionEscalationEmail({
    conversationId: ctx.conversation.id,
    channel: ctx.conversation.channel,
    handle: ctx.contact?.handle ?? ctx.conversation.contactHandle ?? null,
    preview: ctx.conversation.lastMessagePreview,
  });

  return {
    type: 'escalate_human',
    ok: true,
    detail: mail.ok
      ? 'Fil assigné à Alejandra + email d’alerte envoyé.'
      : `Fil assigné à Alejandra (email alerte : ${mail.error ?? 'échec'}).`,
    data: { assignedTo, emailOk: mail.ok },
  };
}

/** Demande d’abonnement IG (voix Alejandra, pas de Bonjour). */
export async function actionAskFollowGate(ctx: ActionContext): Promise<ActionResult> {
  const send = await actionSendMessage(ctx, bilingualSend(followGateAskFr(), followGateAskEs(), false, QR_FOLLOW_GATE));
  if (ctx.contact) {
    await tagContact(ctx.contact.id, 'follow_gate_pending');
  }
  return {
    type: 'send_message',
    ok: send.ok,
    detail: send.ok ? 'Gate abonnement IG envoyé.' : send.detail,
    data: send.data,
  };
}

function resumeConfigForIntent(
  intent: PendingIntent,
): { send: Record<string, unknown>; extra?: WorkflowActionSpec[] } {
  switch (intent) {
    case 'price':
      return {
        send: bilingualSend(
          lines(
            'Tu as raison de demander 💛',
            '',
            'Tu ne paies pas « du Pilates YouTube ».',
            'Tu paies un créneau avec moi + ma correction en direct.',
            '',
            'Quelle formule tu veux voir ?',
          ),
          lines(
            'Tienes razón en preguntar 💛',
            '',
            'No pagas « Pilates de YouTube ».',
            'Pagas una cita conmigo + mi corrección en directo.',
            '',
            '¿Qué fórmula quieres ver?',
          ),
          false,
          QR_PRICE_CHOICE,
        ),
      };
    case 'trial':
      return {
        send: bilingualSend(
          lines(
            'Voici ton accès 💛',
            '',
            'Moi, je ne te laisse pas seule devant une vidéo.',
            'Rendez-vous fixe, je te corrige en direct, je te vois.',
            '',
            'Essai 7 jours gratuits ✨',
            '',
            'Clique ici →',
          ),
          lines(
            'Aquí tienes tu acceso 💛',
            '',
            'Yo no te dejo sola frente a un vídeo.',
            'Cita fija, te corrijo en directo, te veo.',
            '',
            'Prueba 7 días gratis ✨',
            '',
            'Haz clic aquí →',
          ),
          true,
          QR_RESOURCE,
        ),
        extra: trialFollowupSequence(),
      };
    case 'schedule':
      return {
        send: bilingualSend(
          lines(
            'Les créneaux, on les pose ensemble 💛',
            '',
            'Dis-moi ce qui t’arrange — ou démarre l’essai et tu choisis ton premier cours.',
            '',
            'Essai 7 jours gratuits ✨',
          ),
          lines(
            'Los horarios los fijamos juntas 💛',
            '',
            'Dime qué te va — o empieza la prueba y eliges tu primera clase.',
            '',
            'Prueba 7 días gratis ✨',
          ),
          true,
          QR_RESOURCE,
        ),
        extra: [{ type: 'book_session_intent', config: { courseType: 'visio_collectif' } }],
      };
    case 'greeting':
    case 'general':
    default:
      return {
        send: bilingualSend(
          lines(
            'On reprend 💛',
            '',
            'Tu cherches un vrai suivi — pas une vidéo seule ?',
            '',
            'Essai 7 jours gratuits ✨',
            '',
            'Dis-moi ce dont tu as besoin ↓',
          ),
          lines(
            'Retomamos 💛',
            '',
            '¿Buscas un verdadero seguimiento — no un vídeo sola?',
            '',
            'Prueba 7 días gratis ✨',
            '',
            'Dime qué necesitas ↓',
          ),
          false,
          QR_ACCUEIL,
        ),
        extra: trialFollowupSequence(),
      };
  }
}

async function actionVerifyFollowAndResume(
  ctx: ActionContext,
  config?: Record<string, unknown>,
): Promise<ActionResult> {
  if (!ctx.contact) {
    return { type: 'verify_follow_and_resume', ok: false, detail: 'Contact absent.' };
  }
  const mode = config?.mode === 'claim' ? 'claim' : 'confirm';
  const igsid = resolveRecipientId(ctx);
  const status = igsid ? await checkInstagramFollowsBusiness(igsid) : 'unknown';

  const pass = status === 'yes' || (mode === 'confirm' && status === 'unknown');

  if (!pass) {
    const retry = await actionSendMessage(
      ctx,
      bilingualSend(followGateRetryFr(), followGateRetryEs(), false, QR_FOLLOW_DONE),
    );
    await tagContact(ctx.contact.id, mode === 'claim' ? 'follow_claimed' : 'follow_gate_pending');
    return {
      type: 'verify_follow_and_resume',
      ok: retry.ok,
      detail:
        status === 'no'
          ? 'Abonnement non détecté — message de relance envoyé.'
          : `Vérif API = ${status} — demande confirmation (C’est bon).`,
      data: { status, mode },
    };
  }

  await tagContact(ctx.contact.id, 'follow_verified');
  await tagContact(ctx.contact.id, 'follow_gate_passed');
  const intent = readPendingIntent(ctx.contact);
  await patchContactExternalIds(ctx.contact.id, { pending_intent: null });

  const thanks = await actionSendMessage(
    ctx,
    bilingualSend(followGateThanksFr(), followGateThanksEs(), false),
  );
  const resume = resumeConfigForIntent(intent);
  const resumed = await actionSendMessage(ctx, resume.send);

  const extraSteps: string[] = [];
  if (resume.extra) {
    for (const spec of resume.extra) {
      const r = await runWorkflowAction(spec, ctx);
      extraSteps.push(`${r.ok ? '✓' : '✗'} ${r.type}`);
    }
  }

  return {
    type: 'verify_follow_and_resume',
    ok: thanks.ok && resumed.ok,
    detail: `Abo OK (${status}) · merci + reprise « ${intent} »${extraSteps.length ? ` · ${extraSteps.join(' · ')}` : ''}.`,
    data: { status, intent },
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
      return actionSendTrialLink(ctx, spec.config);
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
    case 'verify_follow_and_resume':
      return actionVerifyFollowAndResume(ctx, spec.config);
    default:
      return { type: spec.type, ok: false, detail: `Action inconnue : ${spec.type}` };
  }
}
