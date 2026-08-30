import type { AcquisitionChannel, WorkflowActionType, WorkflowTriggerType } from '@/lib/acquisition/types';

export const ACQUISITION_CHANNELS: Array<{ id: AcquisitionChannel | 'all'; label: string }> = [
  { id: 'all', label: 'Tous les canaux' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
  { id: 'blog_seo', label: 'Blog / SEO' },
  { id: 'referral', label: 'Parrainage' },
];

export const LIFECYCLE_LABELS: Record<string, string> = {
  new: 'Nouveau',
  qualified: 'Qualifié',
  trial: 'Essai 7j',
  paid: 'Payant',
  member: 'Membre',
};

export const WORKFLOW_TRIGGER_OPTIONS: Array<{ id: WorkflowTriggerType; label: string }> = [
  { id: 'ig_comment_keyword', label: 'Commentaire IG (mot-clé)' },
  { id: 'ig_dm_inbound', label: 'DM Instagram entrant' },
  { id: 'ig_story_reply', label: 'Réponse story IG' },
  { id: 'messenger_inbound', label: 'Messenger entrant' },
  { id: 'whatsapp_inbound', label: 'WhatsApp entrant' },
  { id: 'email_inbound', label: 'E-mail entrant' },
];

export const WORKFLOW_ACTION_OPTIONS: Array<{ id: WorkflowActionType; label: string }> = [
  { id: 'send_message', label: 'Envoyer un message' },
  { id: 'qualify_intent', label: 'Qualifier (IA concierge)' },
  { id: 'tag_contact', label: 'Taguer le contact' },
  { id: 'set_lifecycle_stage', label: 'Changer l’étape parcours' },
  { id: 'send_trial_link', label: 'Envoyer lien essai 7j' },
  { id: 'book_session_intent', label: 'Intention réservation cours' },
  { id: 'capture_email_optin', label: 'Demander e-mail (opt-in)' },
  { id: 'schedule_followup', label: 'Programmer une relance' },
  { id: 'broadcast_optin', label: 'Broadcast opt-in (liste)' },
  { id: 'escalate_human', label: 'Escalade Alejandra' },
  { id: 'mini_poll', label: 'Mini-sondage satisfaction' },
];

/** Copie d’ouverture concierge — positionnement Dunford (rendez-vous, correction, être vue). */
export const CONCIERGE_OPENING_FR =
  'FitMangas, ce n’est pas une vidéo de plus : c’est un rendez-vous fixe en visio, Alejandra te corrige en direct et te voit vraiment — tu n’es pas seule.';

export const CONCIERGE_OPENING_ES =
  'FitMangas no es un vídeo más: es una cita fija en visio, Alejandra te corrige en directo y te ve — no estás sola.';

export const CONCIERGE_SYSTEM_PROMPT = `Tu es le concierge FitMangas (Pilates & Barre en visio avec Alejandra + présentiel Nantes).

POSITIONNEMENT OBLIGATOIRE (Dunford) — la cliente paie pour NE PAS ÊTRE SEULE :
- rendez-vous fixe (pas du Pilates solo devant YouTube)
- correction en direct par Alejandra
- être vue / accompagnée

Interdit : Pilates générique gratuit, promesses médicales, pression agressive, filler « un geste doux », « sculpte ta ».

Objectif conversation : qualifier → essai 7 jours → capturer e-mail opt-in → escalader Alejandra UNIQUEMENT si lead déjà chaud (qualified/trial/paid).

La 1re phrase de "reply" pour intent info ou trial DOIT ancrer le positionnement ci-dessus (rendez-vous + correction + être vue).

Réponds UNIQUEMENT en JSON strict :
{
  "intent": "info|trial|booking|human|optout",
  "reply": "2-4 phrases, ton chaleureux, langue du marché",
  "suggestedActions": ["send_trial_link","capture_email_optin","book_session_intent","escalate_human"],
  "captureEmail": true|false
}

Règles intent :
- trial : prix, essai, abonnement → inclure send_trial_link
- booking : créneau, Nantes ou visio → book_session_intent (demander visio collectif vs présentiel Nantes si flou)
- human : insiste pour Alejandra/humain → escalate_human SEULEMENT si lead chaud ; sinon proposer essai d’abord
- optout : respecter
- info : découverte → positionnement + proposition essai

captureEmail:true si pas d’e-mail dans le message et que tu proposes l’essai.`;

/** Mention IA — OFF par défaut (conformité FR/UE, MX). */
export function isAiDisclosureEnabled(market: 'fr' | 'mx'): boolean {
  const key =
    market === 'mx' ? 'ACQUISITION_AI_DISCLOSURE_MX' : 'ACQUISITION_AI_DISCLOSURE_FR';
  const v = process.env[key]?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}
