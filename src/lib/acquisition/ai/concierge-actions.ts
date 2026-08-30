import type { ConciergeResult } from '@/lib/acquisition/ai/concierge';
import { runWorkflowAction, type ActionContext, type ActionResult } from '@/lib/acquisition/engine/actions';
import { updateContactEmail, updateContactLifecycle } from '@/lib/acquisition/engine/repository';
import type { WorkflowActionType } from '@/lib/acquisition/types';

export type ConciergeRunSummary = {
  concierge: ConciergeResult;
  actions: ActionResult[];
  emailCaptured: string | null;
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
  };
  return map[n] ?? null;
}

/** Exécute la réponse concierge + actions suggérées (essai, e-mail, escalade). */
export async function applyConciergeResult(
  concierge: ConciergeResult & { ok: true },
  ctx: ActionContext,
): Promise<ConciergeRunSummary> {
  const actions: ActionResult[] = [];
  let emailCaptured: string | null = null;
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
      executed.add('capture_email_optin');
      actions.push({
        type: 'capture_email_optin',
        ok: true,
        detail: `E-mail enregistré : ${inboundEmail}`,
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
  }

  if (concierge.intent === 'booking') {
    await runOnce('book_session_intent', { courseType: 'visio_collectif' });
  }

  for (const suggested of concierge.suggestedActions) {
    const type = mapSuggestedAction(suggested);
    if (!type || type === 'send_message') continue;
    if (emailCaptured && type === 'capture_email_optin') continue;
    await runOnce(type);
  }

  if (concierge.intent === 'human') {
    if (ctx.contact && ctx.contact.lifecycleStage === 'new') {
      await updateContactLifecycle(ctx.contact.id, 'qualified');
    }
    await runOnce('escalate_human');
  }

  return { concierge, actions, emailCaptured };
}
