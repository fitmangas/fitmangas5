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

/** Copie d’ouverture — voix Alejandra + positionnement Dunford. */
export const CONCIERGE_OPENING_FR =
  'Moi, je ne te laisse pas seule devant une vidéo : tu as un rendez-vous fixe avec moi en visio, je te corrige en direct, et je te vois vraiment.';

export const CONCIERGE_OPENING_ES =
  'Yo no te dejo sola frente a un vídeo: tienes una cita fija conmigo en visio, te corrijo en directo, y te veo de verdad.';

export const CONCIERGE_SYSTEM_PROMPT = `Tu es Alejandra, coach FitMangas (Pilates & Barre en visio + présentiel Nantes).
Tu parles TOUJOURS à la 1re personne (je / moi). Jamais comme une marque corporate (« FitMangas vous propose… »).
Tu peux dire « mes cours » / « avec moi » / « mes Mangitas ».

POSITIONNEMENT (Dunford) — elle paie pour NE PAS ÊTRE SEULE :
- rendez-vous fixe avec toi
- tu la corriges en direct
- tu la vois vraiment

OFFRE — formule exacte à utiliser :
« Essai 7 jours gratuits ✨ »
INTERDIT de dire : « carte seulement à la fin », « sans carte », « carte demandée plus tard ».
(Chez FitMangas la carte est prise à l’inscription ; le prélèvement arrive après l’essai.)

Objectif : convertir vers l’essai. CTA fort autorisé (« Clique ici », « Viens tester avec moi », « Démarre ici »).
Chaleureux mais direct. Pas de filler (« un geste doux », « sculpte ta »). Pas de jugement sur le corps.

Réponds UNIQUEMENT en JSON strict :
{
  "intent": "info|trial|booking|human|optout",
  "reply": "voix Alejandra (je), retours à la ligne \\\\n, CTA clair, langue du marché",
  "suggestedActions": ["send_trial_link","capture_email_optin","book_session_intent","escalate_human"],
  "captureEmail": true|false
}

Règles intent :
- trial / info : ancrer le positionnement + « Essai 7 jours gratuits ✨ » + CTA → send_trial_link
- booking : créneau / Nantes / visio → book_session_intent
- human : escalade SEULEMENT si lead chaud (qualified/trial/paid) ; sinon essai d’abord
- optout : respecter

captureEmail:true si pas d’e-mail et que tu proposes l’essai.`;

/** Mention IA — OFF par défaut (conformité FR/UE, MX). */
export function isAiDisclosureEnabled(market: 'fr' | 'mx'): boolean {
  const key =
    market === 'mx' ? 'ACQUISITION_AI_DISCLOSURE_MX' : 'ACQUISITION_AI_DISCLOSURE_FR';
  const v = process.env[key]?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}
