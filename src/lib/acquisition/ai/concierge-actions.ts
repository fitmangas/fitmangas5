import type { ConciergeResult } from '@/lib/acquisition/ai/concierge';
import { canEscalateToHuman } from '@/lib/acquisition/engine/lifecycle';
import { runWorkflowAction, type ActionContext, type ActionResult } from '@/lib/acquisition/engine/actions';
import { updateContactEmail, updateContactLifecycle } from '@/lib/acquisition/engine/repository';
import type { WorkflowActionType } from '@/lib/acquisition/types';

export type ConciergeRunSummary = {
  concierge: ConciergeResult;
  actions: ActionResult[];
  emailCaptured: string | null;
  newsletterDetail: string | null;
};

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function extractEmailFromText(text: string): string | null {
  const match = text.match(EMAIL_RE);
  return match?.[0]?.toLowerCase() ?? null;
}

function mapSuggestedAction(name: string): WorkflowActionType | null {
  const n = name.trim().toLowerCase();
  const map: Record<string, WorkflowActionType> = {
    send_message: 'send_message',
    send_trial_link: 'send_trial_link',
    capture_email_optin: 'capture_email_optin',
    book_session_intent: 'book_session_intent',
    escalate_human: 'escalate_human',
    tag_contact: 'tag_contact',
    set_lifecycle_stage: 'set_lifecycle_stage',
    schedule_followup: 'schedule_followup',
    mini_poll: 'mini_poll',
  };
  return map[n] ?? null;
}

function inferCourseTypeFromText(text: string): 'visio_collectif' | 'nantes_presentiel' {
  const lower = text.toLowerCase();
  if (/nantes|presentiel|présentiel|sur place/.test(lower)) return 'nantes_presentiel';
  return 'visio_collectif';
}

/** Exécute la réponse concierge + actions suggérées (essai, e-mail, escalade). */
export async function applyConciergeResult(
  concierge: ConciergeResult & { ok: true },
  ctx: ActionContext,
): Promise<ConciergeRunSummary> {
  const actions: ActionResult[] = [];
  let emailCaptured: string | null = null;
  let newsletterDetail: string | null = null;
  const executed = new Set<WorkflowActionType>();

  async function runOnce(type: WorkflowActionType, config?: Record<string, unknown>) {
    if (executed.has(type)) return;
    executed.add(type);
    actions.push(await runWorkflowAction({ type, config }, ctx));
  }

  const inboundEmail = ctx.inboundText ? extractEmailFromText(ctx.inboundText) : null;
  if (inboundEmail && ctx.contact) {
    const saved = await updateContactEmail(ctx.contact.id, inboundEmail, true);
    if (saved.ok) {
      emailCaptured = inboundEmail;
      newsletterDetail = saved.newsletterDetail ?? null;
      executed.add('capture_email_optin');
      actions.push({
        type: 'capture_email_optin',
        ok: true,
        detail: `E-mail enregistré : ${inboundEmail}${newsletterDetail ? ` · ${newsletterDetail}` : ''}`,
      });
    }
  }

  if (concierge.reply) {
    actions.push(
      await runWorkflowAction({ type: 'send_message', config: { body: concierge.reply } }, ctx),
    );
  }

  if (concierge.intent === 'trial' && ctx.contact) {
    await updateContactLifecycle(ctx.contact.id, 'trial');
    await runOnce('send_trial_link');
    if (!emailCaptured) await runOnce('capture_email_optin');
  }

  if (concierge.intent === 'booking') {
    const courseType = inferCourseTypeFromText(ctx.inboundText ?? '');
    await runOnce('book_session_intent', { courseType });
  }

  for (const suggested of concierge.suggestedActions) {
    const type = mapSuggestedAction(suggested);
    if (!type || type === 'send_message') continue;
    if (emailCaptured && type === 'capture_email_optin') continue;
    if (type === 'escalate_human') continue;
    await runOnce(type);
  }

  if (concierge.intent === 'human') {
    const stage = ctx.contact?.lifecycleStage ?? ctx.conversation.lifecycleStage;
    if (canEscalateToHuman(stage)) {
      await runOnce('escalate_human');
    } else {
      actions.push({
        type: 'escalate_human',
        ok: false,
        detail: `Escalade reportée — lead « ${stage} » : propose d’abord l’essai 7 jours.`,
      });
      await runOnce('send_trial_link');
    }
  } else if (concierge.suggestedActions.some((s) => s.toLowerCase().includes('escalate'))) {
    const stage = ctx.contact?.lifecycleStage ?? ctx.conversation.lifecycleStage;
    if (canEscalateToHuman(stage)) {
      await runOnce('escalate_human');
    }
  }

  return { concierge, actions, emailCaptured, newsletterDetail };
}
