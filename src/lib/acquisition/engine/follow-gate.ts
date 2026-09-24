import type { AcqContact, WorkflowTriggerType } from '@/lib/acquisition/types';

import { isRealInfoOrTrialRequest, isSoftDeclineText } from './soft-decline';
import {
  classifyConversationIntent,
  isSupportRequestText,
  isThinkingText,
  isWarmNoIntentText,
} from './conversation-intents';

/** Tags = abonnement IG déjà validé (plus de frein). */
export const FOLLOW_VERIFIED_TAGS = ['follow_verified', 'follow_gate_passed'] as const;

export type PendingIntent = 'price' | 'trial' | 'schedule' | 'greeting' | 'general';

/** Gate ManyChat : Instagram seulement (DM, commentaire, story). */
export function shouldEnforceFollowGate(triggerType: WorkflowTriggerType): boolean {
  return (
    triggerType === 'ig_dm_inbound' ||
    triggerType === 'ig_comment_keyword' ||
    triggerType === 'ig_story_reply'
  );
}

/**
 * Follow-gate UNIQUEMENT si vraie demande d’info/essai (stratégie Croissance).
 * Jamais sur refus poli, salut seul, ou hors-sujet.
 */
export function shouldAskFollowGate(params: {
  triggerType: WorkflowTriggerType;
  inboundText?: string;
  contact?: AcqContact | null;
}): boolean {
  if (!shouldEnforceFollowGate(params.triggerType)) return false;
  if (!params.contact) return false;
  if (isContactFollowVerified(params.contact)) return false;
  if ((params.contact.tags ?? []).includes('optout')) return false;
  if ((params.contact.tags ?? []).includes('soft_decline')) return false;
  if ((params.contact.tags ?? []).includes('thinking_nudge_refused')) return false;
  if ((params.contact.tags ?? []).includes('thinking')) return false;
  if (isSoftDeclineText(params.inboundText)) return false;
  if (isThinkingText(params.inboundText)) return false;
  if (isSupportRequestText(params.inboundText)) return false;
  if (isWarmNoIntentText(params.inboundText)) return false;
  const intent = classifyConversationIntent(params.inboundText);
  if (intent === 'thinking' || intent === 'support' || intent === 'warm_no_intent' || intent === 'offtopic') {
    return false;
  }
  // factual_* / trial_offer : l’orchestrateur répond avant le gate ; ici on garde true
  // pour isRealInfoOrTrialRequest (tests + reprise si intent non intercepté)
  if (isFollowGateBypassText(params.inboundText)) return false;
  if (isExistingPayingMember(params.contact)) return false;
  return isRealInfoOrTrialRequest(params.inboundText);
}

export function isContactFollowVerified(contact: AcqContact | null | undefined): boolean {
  if (!contact) return false;
  const tags = contact.tags ?? [];
  return FOLLOW_VERIFIED_TAGS.some((t) => tags.includes(t));
}

/** Cliente déjà en essai / payante / membre — jamais de pitch essai. */
export function isExistingPayingMember(contact: AcqContact | null | undefined): boolean {
  if (!contact) return false;
  const stage = contact.lifecycleStage;
  return stage === 'trial' || stage === 'paid' || stage === 'member';
}

/** Clics gate / opt-out / soft-no : ne pas re-bloquer. */
export function isFollowGateBypassText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  if (isSoftDeclineText(text)) return true;
  const t = text.toLowerCase();
  return (
    /follow_claim|follow_done|follow_verified/.test(t) ||
    /je te suis|je viens de m['’]?abonner|me abonn|c['’]?est bon|te sigo|ya te sigo|ya me suscrib/.test(
      t,
    ) ||
    /stop|désabonne|desabonne|unsubscribe|no más|no mas|basta|arrête|arrete|no me escribas/.test(t)
  );
}

/** Déduit l’intention à reprendre après abonnement (sans redire Bonjour). */
export function inferPendingIntent(text: string | undefined): PendingIntent {
  if (!text?.trim()) return 'general';
  const t = text.toLowerCase();
  if (/prix|tarif|combien|cuesta|precio|costo|info|price_info|price_group|price_solo|en groupe|juste toi/.test(t)) {
    return 'price';
  }
  if (/essai|prueba|trial|7 jours|7 dias|lien|link|ressource|obtenir/.test(t)) {
    return 'trial';
  }
  if (/horaire|créneau|creneau|quand|schedule|horario|quels jours|qué días|que dias/.test(t)) {
    return 'schedule';
  }
  if (/bonjour|hello|hola|salut|hey|coucou|buenas|bonsoir/.test(t)) {
    return 'greeting';
  }
  return 'general';
}

export function readPendingIntent(contact: AcqContact | null | undefined): PendingIntent {
  const raw = contact?.externalIds?.pending_intent?.trim().toLowerCase();
  if (raw === 'price' || raw === 'trial' || raw === 'schedule' || raw === 'greeting' || raw === 'general') {
    return raw;
  }
  return 'general';
}
