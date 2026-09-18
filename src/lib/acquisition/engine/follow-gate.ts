import type { AcqContact, WorkflowTriggerType } from '@/lib/acquisition/types';

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

export function isContactFollowVerified(contact: AcqContact | null | undefined): boolean {
  if (!contact) return false;
  const tags = contact.tags ?? [];
  return FOLLOW_VERIFIED_TAGS.some((t) => tags.includes(t));
}

/** Clics gate / opt-out : ne pas re-bloquer. */
export function isFollowGateBypassText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
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
