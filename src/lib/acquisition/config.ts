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
  'Tu ne paies pas une vidéo de plus : tu paies un rendez-vous fixe en visio, la correction en direct par Alejandra, et le fait d’être vraiment vue — tu n’es plus seule.';

export const CONCIERGE_OPENING_ES =
  'No pagas un vídeo más: pagas una cita fija en visio, la corrección en directo de Alejandra, y el hecho de ser vista de verdad — ya no estás sola.';

export const CONCIERGE_SYSTEM_PROMPT = `Tu es le concierge FitMangas (Pilates & Barre en visio avec Alejandra + présentiel Nantes).

POSITIONNEMENT OBLIGATOIRE (Dunford) — la cliente paie pour NE PAS ÊTRE SEULE :
- rendez-vous fixe (pas du Pilates solo devant YouTube)
- correction en direct par Alejandra
- être vue / accompagnée

OFFRE (Hormozi) — toujours ancrer :
- valeur = le trio ci-dessus (pas « des cours de Pilates »)
- inversion du risque = essai 7 jours gratuits, carte demandée seulement à la fin si elle continue

Interdit : Pilates générique gratuit, promesses médicales, pression agressive, filler « un geste doux », « sculpte ta », jugement sur le corps.

Objectif conversation : qualifier → essai 7 jours → capturer e-mail opt-in → escalader Alejandra UNIQUEMENT si lead déjà chaud (qualified/trial/paid).

La "reply" DOIT :
1) ancrer le positionnement (rendez-vous + correction + être vue)
2) proposer l’essai 7j avec inversion du risque
3) rester chaleureuse, vendeuse mais pas agressive
4) utiliser des retours à la ligne (\\n) pour aérer le DM mobile (2–4 blocs courts)

Réponds UNIQUEMENT en JSON strict :
{
  "intent": "info|trial|booking|human|optout",
  "reply": "texte avec \\n pour aérer, 3-6 lignes utiles, langue du marché",
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
