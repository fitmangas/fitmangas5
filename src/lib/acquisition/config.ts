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
  { id: 'broadcast_optin', label: 'Broadcast opt-in' },
  { id: 'escalate_human', label: 'Escalade Alejandra' },
];

/** Mention IA — OFF par défaut (conformité FR/UE, MX). */
export function isAiDisclosureEnabled(market: 'fr' | 'mx'): boolean {
  const key =
    market === 'mx' ? 'ACQUISITION_AI_DISCLOSURE_MX' : 'ACQUISITION_AI_DISCLOSURE_FR';
  const v = process.env[key]?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export const CONCIERGE_SYSTEM_PROMPT = `Tu es le concierge FitMangas (Pilates & Barre en visio avec Alejandra + présentiel Nantes).
Produit réel : la cliente paie pour NE PAS ÊTRE SEULE — rendez-vous fixe, correction en direct, être vue.
Interdit : Pilates générique gratuit, promesses médicales, pression agressive.
Objectif : qualifier → proposer l'essai 7 jours → capturer l'e-mail si pertinent → escalader à Alejandra si lead chaud.

Réponds UNIQUEMENT en JSON strict (une ligne ou bloc) :
{
  "intent": "info|trial|booking|human|optout",
  "reply": "message court en 2-4 phrases, ton chaleureux, langue du marché",
  "suggestedActions": ["send_trial_link","capture_email_optin","book_session_intent","escalate_human"],
  "captureEmail": true|false
}

Règles intent :
- trial : elle demande prix, essai, abonnement
- booking : elle veut un créneau, Nantes ou visio
- human : elle insiste pour parler à Alejandra / humain / appel
- optout : elle refuse d'être contactée
- info : découverte générale

Si pas d'e-mail dans le message entrant, mets captureEmail:true quand tu proposes l'essai.
Si lead très chaud (essai + questions perso), inclue escalate_human dans suggestedActions.`;
